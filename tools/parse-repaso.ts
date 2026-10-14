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
}

export interface ResultadoRepaso {
  preguntas: PreguntaRepaso[]
  /** Preguntas detectadas (había un a)) pero sin las cuatro opciones reconocibles. */
  omitidas: { ordinal: number; pagina: number; motivo: string }[]
}

const LETRAS = ['a', 'b', 'c', 'd'] as const

/** Marcador de opción para cada letra, tolerante al OCR. Siempre precedido de inicio de línea o espacio y seguido de espacio o fin. */
function marcador(letra: (typeof LETRAS)[number]): RegExp {
  const L = letra.toUpperCase()
  const mayMin = `[${letra}${L}]`
  // a) A) a] a} aj ; b) bl bj ; c) C) cy cj ; d) dj dy 0) — "al" se excluye: es una palabra.
  const colas = letra === 'a' ? '(?:\\)|\\]|\\}|j|\\|)' : letra === 'b' ? '(?:\\)|\\]|\\}|j|l|\\|)' : '(?:\\)|\\]|\\}|j|l|y|\\|)'
  const extra = letra === 'd' ? '|0\\)' : letra === 'a' ? '|3\\)' : ''
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
  while (k < t.length && (t[k]!.length <= 1 && !/^[¿¡]$/.test(t[k]!))) k++
  return k >= 2 ? t.slice(k).join(' ') : s
}

/** Número de pregunta al inicio de un enunciado: "13. El valor…". */
const RE_NUMERO_INICIAL = /^\d{1,2}\s*[.,]\s+(?=\S)/

interface Parcial {
  ordinal: number
  pagina: number
  /** Líneas del enunciado antes del a). */
  enunciado: string[]
  /** Texto de cada opción, por líneas. */
  opciones: string[][]
  /** Marcadores no limpios encontrados (para avisos). */
  marcadoresSucios: number
}

/** Enunciado pegado a la opción d) anterior: se corta en el "¿" (ahí empieza la pregunta siguiente). */
function separarEnunciadoPegado(textoD: string): { d: string; resto: string } {
  const k = textoD.indexOf('¿')
  if (k > 0) return { d: textoD.slice(0, k).trim(), resto: textoD.slice(k).trim() }
  return { d: textoD, resto: '' }
}

export function extraerPreguntasRepaso(lineas: readonly { texto: string; pagina: number }[]): ResultadoRepaso {
  const preguntas: PreguntaRepaso[] = []
  const omitidas: ResultadoRepaso['omitidas'] = []
  let ordinal = 0
  let actual: Parcial | null = null
  /** Enunciado en construcción de la siguiente pregunta (antes de que aparezca su a)). */
  let enunciado: { texto: string; pagina: number }[] = []

  const cerrar = (p: Parcial) => {
    const opciones = p.opciones.map((l) => colapsar(l.join(' ')))
    const q = construir(p, opciones)
    if ('motivo' in q) omitidas.push({ ordinal: p.ordinal, pagina: p.pagina, motivo: q.motivo })
    else preguntas.push(q)
  }

  for (let n = 0; n < lineas.length; n++) {
    const { texto: original, pagina } = lineas[n]!
    let resto = original.trim()
    if (!resto || RE_NUMERO_SUELTO.test(resto) || RE_PIE_PAGINA.test(resto)) continue

    // Recorre la línea buscando, en orden, los marcadores que faltan.
    for (;;) {
      const siguiente: number = actual ? actual.opciones.length : 0 // 0 = buscamos a)
      if (siguiente >= 4) break
      // Si ya hay opciones abiertas y aparece un nuevo a), la pregunta en curso quedó incompleta: empieza otra.
      if (actual && siguiente >= 1) {
        const ma = MARCADORES[0]!.exec(resto)
        const me = MARCADORES[siguiente]!.exec(resto)
        if (ma && (!me || ma.index < me.index)) {
          const abierta = actual.opciones[actual.opciones.length - 1]!
          // Lo que sobra tras la primera línea de la última opción es, casi siempre, el enunciado de la pregunta nueva.
          const rescatado = abierta.slice(1)
          actual.opciones[actual.opciones.length - 1] = abierta.slice(0, 1)
          cerrar(actual)
          actual = null
          enunciado = [...rescatado.map((t) => ({ texto: t, pagina })), ...(ma.index > 0 ? [{ texto: resto.slice(0, ma.index), pagina }] : [])]
          resto = resto.slice(ma.index)
          continue
        }
      }
      const m: RegExpExecArray | null = MARCADORES[siguiente]!.exec(resto)
      if (!m) break
      const antes: string = resto.slice(0, m.index).trim()
      const marca = m[0]
      resto = resto.slice(m.index + marca.length).trim()
      if (siguiente === 0) {
        ordinal++
        const lineasEnunciado: { texto: string; pagina: number }[] = [...enunciado, ...(antes ? [{ texto: antes, pagina }] : [])]
        actual = {
          ordinal,
          pagina: lineasEnunciado[0]?.pagina ?? pagina,
          enunciado: lineasEnunciado.map((l) => l.texto),
          opciones: [[]],
          marcadoresSucios: 0
        }
        enunciado = []
      } else if (actual) {
        if (antes) actual.opciones[actual.opciones.length - 1]!.push(antes)
        actual.opciones.push([])
      }
      if (actual && !RE_LIMPIO.test(marca)) actual.marcadoresSucios++
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
    else omitidas.push({ ordinal: actual.ordinal, pagina: actual.pagina, motivo: 'opciones incompletas al final del bloque' })
  }
  return { preguntas, omitidas }
}

function construir(p: Parcial, opciones: string[]): PreguntaRepaso | { motivo: string } {
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

  const avisos: string[] = []
  if (p.marcadoresSucios > 0) avisos.push(`OCR: ${p.marcadoresSucios} marcador(es) de opción irregulares`)
  if (/\d/.test(enunciado + opciones.join(' '))) avisos.push('OCR: contiene cifras; verifícalas contra la página del manual')
  return { ordinal: p.ordinal, enunciado, opciones: opciones as PreguntaRepaso['opciones'], pagina: p.pagina, avisos }
}

// ─── Conversión al esquema de preguntas ──────────────────────────────────────

const esCalculo = (enunciado: string) => /\b(calcul\w*|determine|obt[eé]n\w*)\b/i.test(enunciado) && (enunciado.match(/\d/g) ?? []).length >= 2

export function aPreguntaEntrada(q: PreguntaRepaso, capitulo: number): PreguntaEntrada {
  const area: AreaId | undefined = AREA_DE_CAPITULO[capitulo]
  if (!area) throw new Error(`El capítulo ${capitulo} no tiene área`)
  const tipo = esCalculo(q.enunciado) ? 'calculo' : 'teoria'
  return {
    id: `manual-repaso.c${String(capitulo).padStart(2, '0')}.q${String(q.ordinal).padStart(2, '0')}`,
    area,
    enunciado: q.enunciado,
    opciones: q.opciones.map((texto) => ({ texto })),
    clave: null,
    tipo,
    formato: /\bEXCEPTO\b/i.test(q.enunciado) ? 'excepto' : tipo === 'calculo' ? 'calculo' : 'directa',
    fuente: 'manual-repaso',
    cita: { documento: DOCUMENTO_MANUAL, pagina: q.pagina },
    estado: 'borrador',
    notas: [NOTA_SIN_CLAVE, ...q.avisos]
  }
}

export interface ResumenRepasoCapitulo {
  capitulo: number
  parseadas: number
  omitidas: number
}

/** Extrae y convierte todos los repasos. `fuente` y `generado` van al encabezado del archivo. */
export function parsearRepasos(bloques: readonly BloqueRepaso[], fuente: string, generado: string) {
  const resumen: ResumenRepasoCapitulo[] = []
  const preguntas: PreguntaEntrada[] = []
  for (const b of bloques) {
    const r = extraerPreguntasRepaso(b.lineas)
    resumen.push({ capitulo: b.capitulo, parseadas: r.preguntas.length, omitidas: r.omitidas.length })
    for (const q of r.preguntas) preguntas.push(aPreguntaEntrada(q, b.capitulo))
  }
  return { archivo: ArchivoPreguntasSchema.parse({ fuente, generado, preguntas }), resumen }
}
