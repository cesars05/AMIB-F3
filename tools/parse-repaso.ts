/**
 * Extractor de las preguntas de "REPASO DEL CAPÍTULO" del manual en OCR → `content/preguntas/repasos/manual-amib1.json`.
 *
 * El OCR deja el repaso así de sucio (ver `AMIB_1_completo.md`):
 * - los números de pregunta se pierden o quedan sueltos en líneas aparte ("12." "13." "14.");
 * - el enunciado viene partido en párrafos de ~50 caracteres;
 * - los marcadores de opción se estropean: `bl`, `dj`, `bj`, `C)`, `cy`, `0)`, `3)`;
 * - a veces las cuatro opciones van en una sola línea, o la opción a) comparte línea con el enunciado;
 * - el enunciado de una pregunta puede pegarse a la opción d) de la anterior ("d) 1y3 ¿Cuáles son…");
 * - se pierden opciones completas (las preguntas con columnas mezcladas).
 *
 * Una pregunta se acepta solo si se reconocen EXACTAMENTE las cuatro opciones a–d en orden. El resto se cuenta como
 * omitida. Los ids usan el ordinal de la pregunta dentro del capítulo (contando las omitidas), así que no cambian
 * si luego se rescata una pregunta omitida.
 */
import { ArchivoPreguntasSchema, type PreguntaEntrada } from '../app/src/core/contenido'
import type { AreaId } from '../app/src/core/examen'
import { colapsar } from './texto'
import type { BloqueRepaso } from './parse-manual'
import { similitud } from './similitud'
import { AREA_DE_CAPITULO } from './vincular-manual'

export const DOCUMENTO_MANUAL = 'AMIB Data/AMIB_1_completo.md'
export const NOTA_SIN_CLAVE = 'sin clave: requiere resolución y validación'

export interface PreguntaRepaso {
  /** Ordinal de la pregunta en el capítulo (1…), contando las omitidas. */
  ordinal: number
  enunciado: string
  opciones: [string, string, string, string]
  pagina: number
  /** Observaciones de calidad del OCR detectadas al extraer. */
  avisos: string[]
  /** Número de la pregunta en el libro, o null si no se pudo determinar con fiabilidad. */
  numeroLibro: number | null
  /** Ordinal de la copia que se conserva cuando el libro repite la pregunta (la página escaneada dos veces). */
  duplicadoDe: number | null
  /** Cantidad de palabras que aparecen una sola vez en el repaso del capítulo (indicio de errores de OCR). */
  ruido: number
}

export interface PreguntaOmitida {
  ordinal: number
  pagina: number
  motivo: string
  numeroLibro: number | null
}

export interface ResultadoRepaso {
  preguntas: PreguntaRepaso[]
  /** Preguntas detectadas (había un a)) pero sin las cuatro opciones reconocibles. */
  omitidas: PreguntaOmitida[]
  /** Cuántas preguntas distintas tiene el capítulo según el recuento de detección (sin copias repetidas). */
  distintas: number
  /** Parejas [copia retirada, copia conservada] por ordinal cuando el libro repite preguntas. */
  duplicadas: [number, number][]
}

export interface OpcionesExtraccion {
  /** Cantidad de preguntas del cuadernillo del capítulo (la da la clave oficial). Sin ella solo se numera con anclas impresas. */
  total?: number
}

const LETRAS = ['a', 'b', 'c', 'd'] as const

/** Marcador de opción para cada letra, tolerante al OCR. Siempre precedido de inicio de línea o espacio y seguido de espacio o fin. */
function marcador(letra: (typeof LETRAS)[number]): RegExp {
  const L = letra.toUpperCase()
  const mayMin = `[${letra}${L}]`
  // a) A) a] a} aj ; b) bl bj ; c) C) cy cj ej ; d) dj dy 0) — "al" se excluye: es una palabra.
  const colas = letra === 'a' ? '(?:\\)|\\]|\\}|j|\\|)' : letra === 'b' ? '(?:\\)|\\]|\\}|j|l|\\|)' : letra === 'c' ? '(?:\\)|\\]|\\}|j|l|y|\\|)' : '(?:\\)|\\]|\\}|j|l|y|\\|)'
  // Dígitos y símbolos que el OCR pone por la letra: 3) por a), 5) por b), e) ej £) por c), 0) por d). "El" y "Es" son palabras: no se admiten.
  const extra = letra === 'd' ? '|0\\)' : letra === 'a' ? '|3\\)' : letra === 'b' ? '|5\\)' : '|[eE£](?:\\)|j)'
  return new RegExp(`(?:^|(?<=\\s))(?:${mayMin}${colas}${extra})(?=\\s|$)`)
}
const MARCADORES = LETRAS.map(marcador)
/** Marcador "limpio": letra seguida de `)` exacto. */
const RE_LIMPIO = /^[a-dA-D]\)$/

/** Pie de página impreso ("Pág. 344", "Pag. 345"): ruido que cae en medio del repaso. */
const RE_PIE_PAGINA = /^P[aá]g\.?:?\s*\d+\.?$/i

/** Número suelto de pregunta (línea de solo "12." o "12,"). */
const RE_NUMERO_SUELTO = /^\d{1,2}\s*[.,]?$/
/** Numeración ≥ 5 en mitad del enunciado: las listas del propio enunciado ("1. … 4. …") no llegan a tanto. */
const RE_NUMERACION_AJENA = /\s(?:[5-9]|\d{2})\s*[.,]\s+[A-ZÁÉÍÓÚ¿]/

/** Quita ruido de OCR al inicio ("E . S S E Actos que…"): una racha de dos o más símbolos o letras sueltas. */
function quitarBasuraInicial(s: string): string {
  const t = s.split(' ')
  let k = 0
  while (k < t.length && (t[k]!.length <= 1 || ESCOMBRO_CORTO.test(t[k]!)) && !/^[¿¡]$/.test(t[k]!)) k++
  return k >= 2 ? t.slice(k).join(' ') : s
}
/** Restos de opción de la pregunta anterior ("di", "d", "2,") que no son palabras del español. */
const ESCOMBRO_CORTO = /^(?:d|di|dj|dy|\d{1,2}[.,]?)$/

/** Número de pregunta al inicio de un enunciado: "13. El valor…". */
const RE_NUMERO_INICIAL = /^\d{1,2}\s*[.,]\s+(?=\S)/
/** Número impreso pegado al inicio del enunciado: ancla para numerar con el libro. */
const RE_ANCLA = /^(\d{1,2})\s*[.,]\s+(?=\S)/
/** Marcador d) sin paréntesis ("d Los montos", "di _ Aumentos"): solo al inicio de línea y antes de una palabra con mayúscula. */
const RE_D_SUELTA = /^(?:d|di)\s+(?:[_—–-]\s+)?(?=[A-ZÁÉÍÓÚÑ¿])/
/** Opción d) estropeada que quedó pegada a la c): "de Cupón", "dj Líder" (una o dos palabras, la primera con mayúscula). */
const RE_D_CORTA = /^(?:d|di|de|dj|dy)\s+([A-ZÁÉÍÓÚÑ]\S*(?:\s+\S+)?)$/
/** Línea formada solo por marcadores de opción ("a)", "b) c)"). */
const RE_SOLO_MARCADORES = /^(?:[a-dA-D]\)\s*)+$/

interface Parcial {
  ordinal: number
  pagina: number
  /** Líneas del enunciado antes del a). */
  enunciado: string[]
  /** Texto de cada opción, por líneas. */
  opciones: string[][]
  /** Marcadores no limpios encontrados (para avisos). */
  marcadoresSucios: number
  /** Número impreso al inicio del enunciado, si el OCR lo conservó. */
  anclaje: number | null
  /** Las opciones estaban en líneas separadas de sus marcadores y se reunieron por posición. */
  reconstruida: boolean
}

interface LineaRepaso {
  texto: string
  pagina: number
  /** Línea de opción reunida desde marcadores sueltos (ver `unirOpcionesSeparadas`). */
  reconstruida?: boolean
}

/** Quita la viñeta o el punto que el OCR deja antes del texto de la opción ("— Actúa…", ".Bonos…"). Nunca toca cifras. */
function limpiarOpcion(s: string): string {
  return s.replace(/^[-—–]\s*(?=\p{L})/u, '').replace(/^\.(?=\p{L})/u, '')
}

/** Enunciado pegado a la opción d) anterior: se corta en el "¿" (ahí empieza la pregunta siguiente). */
function separarEnunciadoPegado(textoD: string): { d: string; resto: string } {
  const k = textoD.indexOf('¿')
  if (k > 0) return { d: textoD.slice(0, k).trim(), resto: textoD.slice(k).trim() }
  return { d: textoD, resto: '' }
}

const esTextoDeOpcion = (t: string) => t.length >= 12 && (t.match(/\p{L}{2,}/gu) ?? []).length >= 2 && !RE_SOLO_MARCADORES.test(t) && !RE_PIE_PAGINA.test(t) && !/^[-–—\s]*\d+$/.test(t)

/**
 * El OCR a veces separa los marcadores ("a)", "b)", "c)", "d)" en líneas sueltas) de los cuatro textos de opción,
 * que vienen después en el mismo orden. Se reúnen solo si tras la racha de marcadores hay exactamente cuatro líneas
 * que parecen opciones completas; si faltan o sobran (texto de varias opciones en una línea) no se toca nada.
 */
export function unirOpcionesSeparadas(lineas: readonly LineaRepaso[]): LineaRepaso[] {
  const salida: LineaRepaso[] = []
  for (let n = 0; n < lineas.length; n++) {
    const l = lineas[n]!
    if (RE_SOLO_MARCADORES.test(l.texto.trim())) {
      let fin = n
      let marcadores = 0
      while (fin < lineas.length && RE_SOLO_MARCADORES.test(lineas[fin]!.texto.trim())) {
        marcadores += lineas[fin]!.texto.match(/[a-dA-D]\)/g)!.length
        fin++
      }
      const textos = lineas.slice(fin, fin + 4)
      if (marcadores >= 2 && marcadores <= 4 && textos.length === 4 && textos.every((t) => esTextoDeOpcion(t.texto.trim()))) {
        textos.forEach((t, k) => salida.push({ texto: `${LETRAS[k]}) ${t.texto.trim()}`, pagina: t.pagina, reconstruida: true }))
        n = fin + 3
        continue
      }
    }
    salida.push(l)
  }
  return salida
}

type PreguntaExtraida = Omit<PreguntaRepaso, 'numeroLibro' | 'duplicadoDe' | 'ruido'>

interface Detectada {
  ordinal: number
  pagina: number
  anclaje: number | null
  enunciado: string
  opciones: string
  pregunta: PreguntaExtraida | null
  motivo: string
}

/** Busca el marcador de la opción `siguiente` (0 = a) en `resto`. */
function buscarMarcador(siguiente: number, resto: string): { index: number; texto: string } | null {
  const m = MARCADORES[siguiente]!.exec(resto)
  if (siguiente === 3) {
    const d = RE_D_SUELTA.exec(resto)
    if (d && (!m || m.index > 0)) return { index: 0, texto: d[0] }
  }
  return m ? { index: m.index, texto: m[0] } : null
}

export function extraerPreguntasRepaso(entrada: readonly { texto: string; pagina: number }[], opciones: OpcionesExtraccion = {}): ResultadoRepaso {
  const lineas = unirOpcionesSeparadas(entrada)
  const detectadas: Detectada[] = []
  let ordinal = 0
  let actual: Parcial | null = null
  /** Enunciado en construcción de la siguiente pregunta (antes de que aparezca su a)). */
  let enunciado: { texto: string; pagina: number }[] = []

  const cerrar = (p: Parcial) => {
    const opcs = p.opciones.map((l) => limpiarOpcion(colapsar(l.join(' '))))
    const q = construir(p, opcs)
    detectadas.push({
      ordinal: p.ordinal,
      pagina: p.pagina,
      anclaje: p.anclaje,
      enunciado: colapsar(p.enunciado.join(' ')),
      opciones: opcs.join(' '),
      pregunta: 'motivo' in q ? null : q,
      motivo: 'motivo' in q ? q.motivo : ''
    })
  }

  for (let n = 0; n < lineas.length; n++) {
    const { texto: original, pagina, reconstruida } = lineas[n]!
    let resto = original.trim()
    if (!resto || RE_NUMERO_SUELTO.test(resto) || RE_PIE_PAGINA.test(resto)) continue

    // Recorre la línea buscando, en orden, los marcadores que faltan.
    for (;;) {
      const siguiente: number = actual ? actual.opciones.length : 0 // 0 = buscamos a)
      if (siguiente >= 4) break
      // Si ya hay opciones abiertas y aparece un nuevo a), la pregunta en curso quedó incompleta: empieza otra.
      if (actual && siguiente >= 1) {
        const ma = MARCADORES[0]!.exec(resto)
        const me = buscarMarcador(siguiente, resto)
        if (ma && (!me || ma.index < me.index)) {
          const abierta = actual.opciones[actual.opciones.length - 1]!
          // Lo que sobra tras la primera línea de la última opción es, casi siempre, el enunciado de la pregunta nueva.
          let rescatado = abierta.slice(1)
          actual.opciones[actual.opciones.length - 1] = abierta.slice(0, 1)
          // Si falta la d) y el primer renglón sobrante es "de Cupón" (marcador d estropeado + palabra corta), es esa opción.
          const dSuelta = actual.opciones.length === 3 ? RE_D_CORTA.exec(rescatado[0] ?? '') : null
          if (dSuelta) {
            actual.opciones.push([dSuelta[1]!])
            actual.marcadoresSucios++
            rescatado = rescatado.slice(1)
          }
          cerrar(actual)
          actual = null
          enunciado = [...rescatado.map((t) => ({ texto: t, pagina })), ...(ma.index > 0 ? [{ texto: resto.slice(0, ma.index), pagina }] : [])]
          resto = resto.slice(ma.index)
          continue
        }
      }
      const m = buscarMarcador(siguiente, resto)
      if (!m) break
      const antes: string = resto.slice(0, m.index).trim()
      const marca = m.texto
      resto = resto.slice(m.index + marca.length).trim()
      if (siguiente === 0) {
        ordinal++
        const lineasEnunciado: { texto: string; pagina: number }[] = [...enunciado, ...(antes ? [{ texto: antes, pagina }] : [])]
        actual = {
          ordinal,
          pagina: lineasEnunciado[0]?.pagina ?? pagina,
          enunciado: lineasEnunciado.map((l) => l.texto),
          opciones: [[]],
          marcadoresSucios: 0,
          anclaje: anclaDe(lineasEnunciado.map((l) => l.texto)),
          reconstruida: false
        }
        enunciado = []
      } else if (actual) {
        if (antes) actual.opciones[actual.opciones.length - 1]!.push(antes)
        actual.opciones.push([])
      }
      if (actual && !RE_LIMPIO.test(marca)) actual.marcadoresSucios++
      if (actual && reconstruida) actual.reconstruida = true
    }

    if (!actual) {
      enunciado.push({ texto: resto, pagina })
      continue
    }
    if (actual.opciones.length < 4) {
      // Continuación de la opción en curso (o texto suelto tras el a) si la opción a) todavía está vacía).
      actual.opciones[actual.opciones.length - 1]!.push(resto)
      continue
    }
    // Ya está la d): lo que queda de la línea es su texto. Se cierra la pregunta al terminar la línea.
    const { d, resto: pegado } = separarEnunciadoPegado(resto)
    if (d) actual.opciones[3]!.push(d)
    // Si la d) quedó vacía, su texto viene en la línea siguiente.
    if (actual.opciones[3]!.length === 0 && n + 1 < lineas.length) continue
    // Una línea siguiente que empieza en minúscula continúa la opción d) (renglón partido).
    const proxima = lineas[n + 1]?.texto.trim() ?? ''
    if (!pegado && /^\p{Ll}/u.test(proxima) && !MARCADORES[0]!.test(proxima)) continue
    cerrar(actual)
    actual = null
    enunciado = pegado ? [{ texto: pegado, pagina }] : []
  }
  if (actual) {
    if (actual.opciones.length === 4 && actual.opciones[3]!.length) cerrar(actual)
    else
      detectadas.push({
        ordinal: actual.ordinal,
        pagina: actual.pagina,
        anclaje: actual.anclaje,
        enunciado: colapsar(actual.enunciado.join(' ')),
        opciones: '',
        pregunta: null,
        motivo: 'opciones incompletas al final del bloque'
      })
  }
  return resolverNumeracion(detectadas, lineas, opciones.total)
}

/** El número impreso va en la primera línea con texto del enunciado (las líneas de basura de OCR anteriores no cuentan). */
function anclaDe(lineas: readonly string[]): number | null {
  const primera = lineas.find((t) => /\p{L}{3,}/u.test(t))
  const m = primera ? RE_ANCLA.exec(primera.trim()) : null
  const n = m ? Number(m[1]) : 0
  return n > 0 ? n : null
}

// ─── Copias repetidas y número del libro ─────────────────────────────────────

/** Qué tanto se parecen dos enunciados (0–1), tolerante al OCR; 0 si alguno es demasiado corto para comparar. */
function parecido(a: string, b: string, minimo = 25): number {
  if (a.length < minimo || b.length < minimo) return 0
  const s = similitud(a, b)
  return Math.min(s.contieneEncabezado, s.contieneObjetivo)
}

const UMBRAL_COPIA = 0.6
const UMBRAL_COPIA_VECINA = 0.25
/** Una repetición se acepta solo como racha: al menos tres preguntas seguidas que reaparecen en el mismo orden. */
const RACHA_MINIMA = 3

/**
 * Detecta las páginas que el libro (o el escaneo) repite: una racha de preguntas consecutivas que reaparece más
 * adelante en el mismo orden. Devuelve, para cada índice, el índice de su primera aparición (o él mismo).
 * Una coincidencia aislada (dos subastas con enunciado casi igual) no cuenta: son preguntas distintas.
 */
export function copiasRepetidas(textos: readonly string[], omitida: readonly boolean[]): number[] {
  const m = textos.length
  const primera = textos.map((_, i) => i)
  for (let k = 1; k < m; k++) {
    const par = (j: number) => (j >= 0 && j + k < m ? parecido(textos[j]!, textos[j + k]!) : 0)
    // Vecina de una racha: parecido flojo, o falta el enunciado de alguna de las dos (partido o pegado a una lista).
    const vecina = (j: number) => {
      if (j < 0 || j + k >= m) return false
      if (par(j) >= UMBRAL_COPIA) return true
      return (omitida[j]! || omitida[j + k]!) && parecido(textos[j]!, textos[j + k]!, 10) >= UMBRAL_COPIA_VECINA
    }
    let i = 0
    while (i + k < m) {
      if (par(i) < UMBRAL_COPIA) {
        i++
        continue
      }
      let fin = i
      while (par(fin + 1) >= UMBRAL_COPIA) fin++
      if (fin - i + 1 >= RACHA_MINIMA) {
        let a = i
        let b = fin
        while (vecina(a - 1)) a--
        while (vecina(b + 1)) b++
        for (let j = a; j <= b; j++) if (primera[j + k] === j + k && primera[j] === j) primera[j + k] = j
        i = b + 1
      } else i = fin + 1
    }
  }
  return primera
}

/**
 * Número del libro de cada grupo de preguntas (en orden de aparición), o null si no se puede asegurar.
 * - Si hay tantas preguntas distintas como `total` y las anclas impresas no se contradicen, el número es la posición.
 * - Si no, solo se numera con anclas impresas ("14. Seleccione…"): las preguntas sin ancla reciben número únicamente
 *   cuando el hueco entre dos anclas (o hasta el borde del cuadernillo) se llena exactamente.
 * Las anclas incoherentes con el orden o fuera de rango (un "22," que es un 12) se descartan.
 */
export function numerarGrupos(anclas: readonly (number | null)[], total?: number): { numeros: (number | null)[]; conflictos: number } {
  const m = anclas.length
  const numeros: (number | null)[] = Array<number | null>(m).fill(null)
  const aceptadas: { i: number; a: number }[] = []
  let ultimaI = -1
  let ultimaA = 0
  anclas.forEach((a, i) => {
    if (a === null || a <= ultimaA || a - ultimaA < i - ultimaI) return
    if (total !== undefined && (a > total || total - a < m - 1 - i)) return
    aceptadas.push({ i, a })
    ultimaI = i
    ultimaA = a
  })
  const conflictos = aceptadas.filter((x) => x.a !== x.i + 1).length
  if (total !== undefined && m === total && conflictos === 0) return { numeros: numeros.map((_, i) => i + 1), conflictos }

  const rellenar = (desde: number, hasta: number, primero: number) => {
    // Posiciones desde..hasta (incluidas) reciben primero, primero+1, …
    for (let i = desde; i <= hasta; i++) numeros[i] = primero + (i - desde)
  }
  for (const { i, a } of aceptadas) numeros[i] = a
  for (let k = 0; k < aceptadas.length; k++) {
    const { i, a } = aceptadas[k]!
    const sig = aceptadas[k + 1]
    if (sig && sig.i - i - 1 === sig.a - a - 1 && sig.i - i > 1) rellenar(i + 1, sig.i - 1, a + 1)
  }
  const primeraAncla = aceptadas[0]
  if (primeraAncla && primeraAncla.i === primeraAncla.a - 1 && primeraAncla.i > 0) rellenar(0, primeraAncla.i - 1, 1)
  const ultimaAncla = aceptadas[aceptadas.length - 1]
  if (total !== undefined && ultimaAncla && m - 1 - ultimaAncla.i === total - ultimaAncla.a && ultimaAncla.i < m - 1) rellenar(ultimaAncla.i + 1, m - 1, ultimaAncla.a + 1)
  return { numeros, conflictos }
}

const palabras = (s: string) => (s.toLowerCase().match(/\p{L}{4,}/gu) ?? []) as string[]

function resolverNumeracion(det: readonly Detectada[], lineas: readonly LineaRepaso[], total: number | undefined): ResultadoRepaso {
  const primera = copiasRepetidas(
    det.map((d) => d.enunciado),
    det.map((d) => d.pregunta === null)
  )
  const grupos: number[][] = []
  const grupoDePrimera = new Map<number, number>()
  const grupoDe = det.map((_, i) => {
    const p = primera[i]!
    if (!grupoDePrimera.has(p)) {
      grupoDePrimera.set(p, grupos.length)
      grupos.push([])
    }
    const g = grupoDePrimera.get(p)!
    grupos[g]!.push(i)
    return g
  })
  const { numeros } = numerarGrupos(
    grupos.map((g) => g.map((i) => det[i]!.anclaje).find((a) => a !== null) ?? null),
    total
  )

  // Una palabra que aparece una sola vez en todo el repaso casi siempre es un error de OCR (la copia buena la repite).
  const frecuencia = new Map<string, number>()
  for (const l of lineas) for (const w of palabras(l.texto)) frecuencia.set(w, (frecuencia.get(w) ?? 0) + 1)
  const ruidoDe = (d: Detectada) => palabras(`${d.pregunta!.enunciado} ${d.pregunta!.opciones.join(' ')}`).filter((w) => frecuencia.get(w) === 1).length

  // De cada grupo se conserva la mejor copia: la que se pudo extraer, con menos ruido y, si empatan, la última.
  const conservada = grupos.map((g) => {
    const extraidas = g.filter((i) => det[i]!.pregunta !== null)
    if (!extraidas.length) return -1
    return extraidas.reduce((mejor, i) => (ruidoDe(det[i]!) <= ruidoDe(det[mejor]!) ? i : mejor))
  })

  const preguntas: PreguntaRepaso[] = []
  const omitidas: PreguntaOmitida[] = []
  const duplicadas: [number, number][] = []
  det.forEach((d, i) => {
    const g = grupoDe[i]!
    const numeroLibro = numeros[g] ?? null
    const quedaCon = conservada[g]!
    if (quedaCon >= 0 && quedaCon !== i) duplicadas.push([d.ordinal, det[quedaCon]!.ordinal])
    if (d.pregunta === null) omitidas.push({ ordinal: d.ordinal, pagina: d.pagina, motivo: d.motivo, numeroLibro })
    else preguntas.push({ ...d.pregunta, numeroLibro, duplicadoDe: quedaCon !== i ? det[quedaCon]!.ordinal : null, ruido: ruidoDe(d) })
  })
  return { preguntas, omitidas, distintas: grupos.length, duplicadas }
}


function construir(p: Parcial, opciones: string[]): PreguntaExtraida | { motivo: string } {
  if (opciones.length !== 4 || opciones.some((o) => o.length === 0)) return { motivo: 'no se reconocen las cuatro opciones' }
  if (opciones.some((o) => o.length > 250)) return { motivo: 'opción demasiado larga (texto de otra pregunta pegado)' }
  let enunciado = quitarBasuraInicial(colapsar(p.enunciado.join(' '))).replace(RE_NUMERO_INICIAL, '')
  if (enunciado.length < 10 || (enunciado.match(/\p{L}{3,}/gu) ?? []).length < 2) return { motivo: 'enunciado ausente o demasiado corto (probable columna mezclada)' }
  if (enunciado.length > 700) return { motivo: 'enunciado demasiado largo (varias preguntas mezcladas)' }
  const abiertos = (enunciado.match(/¿/g) ?? []).length
  const cerrados = (enunciado.match(/\?/g) ?? []).length
  if (abiertos > cerrados) return { motivo: 'enunciado truncado ("¿" sin cerrar)' }
  // Un marcador de opción dentro del enunciado: es el resto de otra pregunta a la que se le perdió una opción.
  if (/(?:^|\s)[a-dA-D]\)\s/.test(enunciado)) return { motivo: 'marcador de opción dentro del enunciado (opciones perdidas de otra pregunta)' }
  // Numeración de otra pregunta en medio del enunciado ("… Fondos de 5. Silacotización…"): dos columnas mezcladas.
  if (RE_NUMERACION_AJENA.test(enunciado)) return { motivo: 'columnas mezcladas (numeración de otra pregunta en el enunciado)' }
  enunciado = enunciado.trim()
  // Un enunciado corto que empieza en minúscula y no tiene número es la cola de otro (su comienzo quedó en la otra columna).
  if (p.anclaje === null && enunciado.length < 60 && /^\p{Ll}/u.test(enunciado)) return { motivo: 'enunciado sin comienzo (empieza en minúscula; su inicio quedó en otra columna)' }

  const avisos: string[] = []
  if (/^\p{Ll}/u.test(enunciado)) avisos.push('OCR: el enunciado empieza con ruido o con minúscula; revísalo contra la página')
  if (p.marcadoresSucios > 0) avisos.push(`OCR: ${p.marcadoresSucios} marcador(es) de opción irregulares`)
  if (p.reconstruida) avisos.push('OCR: opciones reunidas desde líneas separadas (se supone el orden a, b, c, d)')
  if (/\d/.test(enunciado + opciones.join(' '))) avisos.push('OCR: contiene cifras; verifícalas contra la página del manual')
  return { ordinal: p.ordinal, enunciado, opciones: opciones as PreguntaRepaso['opciones'], pagina: p.pagina, avisos }
}

// ─── Conversión al esquema de preguntas ──────────────────────────────────────

const esCalculo = (enunciado: string) => /\b(calcul\w*|determine|obt[eé]n\w*)\b/i.test(enunciado) && (enunciado.match(/\d/g) ?? []).length >= 2

const idRepaso = (capitulo: number, ordinal: number) => `manual-repaso.c${String(capitulo).padStart(2, '0')}.q${String(ordinal).padStart(2, '0')}`

export const NOTA_NUMERO_INCIERTO = 'número de pregunta del libro incierto: no se asigna clave'

export function aPreguntaEntrada(q: PreguntaRepaso, capitulo: number): PreguntaEntrada {
  const area: AreaId | undefined = AREA_DE_CAPITULO[capitulo]
  if (!area) throw new Error(`El capítulo ${capitulo} no tiene área`)
  const tipo = esCalculo(q.enunciado) ? 'calculo' : 'teoria'
  const notas = [NOTA_SIN_CLAVE, ...q.avisos]
  if (q.numeroLibro === null) notas.push(NOTA_NUMERO_INCIERTO)
  if (q.duplicadoDe !== null) notas.push(`duplicado de ${idRepaso(capitulo, q.duplicadoDe)}: el libro repite la página; se conserva la copia con menos ruido de OCR`)
  return {
    id: idRepaso(capitulo, q.ordinal),
    area,
    enunciado: q.enunciado,
    ...(q.numeroLibro !== null ? { numeroLibro: q.numeroLibro } : {}),
    opciones: q.opciones.map((texto) => ({ texto })),
    clave: null,
    tipo,
    formato: /\bEXCEPTO\b/i.test(q.enunciado) ? 'excepto' : tipo === 'calculo' ? 'calculo' : 'directa',
    fuente: 'manual-repaso',
    cita: { documento: DOCUMENTO_MANUAL, pagina: q.pagina },
    estado: q.duplicadoDe !== null ? 'retirada' : 'borrador',
    notas
  }
}

export interface ResumenRepasoCapitulo {
  capitulo: number
  parseadas: number
  omitidas: number
  /** Parseadas con número del libro determinado. */
  conNumeroLibro: number
  /** Preguntas distintas detectadas (sin las copias que el libro repite). */
  distintas: number
  /** Copias repetidas retiradas. */
  copias: number
}

/** Extrae y convierte todos los repasos. `fuente` y `generado` van al encabezado del archivo. `totales`: preguntas por capítulo según la clave oficial. */
export function parsearRepasos(bloques: readonly BloqueRepaso[], fuente: string, generado: string, totales: Readonly<Record<number, number>> = {}) {
  const resumen: ResumenRepasoCapitulo[] = []
  const preguntas: PreguntaEntrada[] = []
  for (const b of bloques) {
    const r = extraerPreguntasRepaso(b.lineas, { total: totales[b.capitulo] })
    resumen.push({
      capitulo: b.capitulo,
      parseadas: r.preguntas.length,
      omitidas: r.omitidas.length,
      conNumeroLibro: r.preguntas.filter((q) => q.numeroLibro !== null).length,
      distintas: r.distintas,
      copias: r.duplicadas.length
    })
    for (const q of r.preguntas) preguntas.push(aPreguntaEntrada(q, b.capitulo))
  }
  return { archivo: ArchivoPreguntasSchema.parse({ fuente, generado, preguntas }), resumen }
}
