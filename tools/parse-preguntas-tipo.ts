/**
 * Parser de `Preguntas Tipo.docx` → `content/preguntas/oficial/preguntas-tipo.json`.
 *
 * El documento mezcla tablas (filas `N.- | enunciado`, `a) | texto`) y párrafos sueltos (preguntas 37–44).
 * Por eso todo se aplana a una lista de líneas y se recorre con una pequeña máquina de estados.
 *
 * La clave NO está marcada con un campo: es la opción cuyo TEXTO va en negritas. La letra en negritas a veces
 * no coincide con ese texto (ver `decidirClave`).
 */
import { ArchivoPreguntasSchema, type PreguntaEntrada } from '../app/src/core/contenido'
import type { AreaId } from '../app/src/core/examen'
import type { BloqueDocx, ParrafoDocx } from './docx'
import { clave as claveTexto, colapsar } from './texto'

export interface OpcionCruda {
  letra: string
  texto: string
  negritaLetra: boolean
  negritaTexto: boolean
}

export interface PreguntaCruda {
  numero: number
  /** Encabezado de sección tal como aparece en el documento. */
  seccion: string
  enunciado: string
  opciones: OpcionCruda[]
}

const LETRAS = ['a', 'b', 'c', 'd'] as const

/** Secciones del documento → área del examen. `extra` = fuera del temario Serie 210. */
const SECCIONES: { clave: string; area: AreaId; extra: boolean }[] = [
  { clave: 'analisis economico y financiero', area: 'analisis', extra: false },
  { clave: 'marco normativo', area: 'normativo', extra: false },
  { clave: 'matematicas financieras y portafolios', area: 'matematicas', extra: false },
  { clave: 'mercado de capitales', area: 'capitales', extra: false },
  { clave: 'derivados financieros y riesgos', area: 'derivados', extra: false },
  { clave: 'titulos de deuda', area: 'deuda', extra: false },
  { clave: 'etica', area: 'etica', extra: false },
  { clave: 'fondos de inversion', area: 'fondos', extra: false },
  { clave: 'servicios de inversion', area: 'servicios', extra: false },
  { clave: 'concertacion de operacion en mexder', area: 'derivados', extra: true },
  { clave: 'concertacion de operaciones en el mercado de capitales', area: 'capitales', extra: true }
]

export function seccionAArea(seccion: string): { area: AreaId; extra: boolean } | null {
  const s = SECCIONES.find((x) => x.clave === claveTexto(seccion))
  return s ? { area: s.area, extra: s.extra } : null
}

interface Linea {
  texto: string
  /** Una bandera de negrita por carácter de `texto`. */
  negrita: boolean[]
}

function aLinea(p: ParrafoDocx): Linea | null {
  if (!p.texto.trim()) return null
  const negrita: boolean[] = []
  for (const r of p.runs) for (let i = 0; i < r.texto.length; i++) negrita.push(r.negrita)
  return { texto: p.texto, negrita }
}

/** Aplana párrafos y celdas de tabla a líneas en orden de lectura. */
function aplanar(bloques: readonly BloqueDocx[]): Linea[] {
  const lineas: Linea[] = []
  const agregar = (p: ParrafoDocx) => {
    const l = aLinea(p)
    if (l) lineas.push(l)
  }
  for (const b of bloques) {
    if (b.tipo === 'parrafo') agregar(b)
    else for (const fila of b.filas) for (const celda of fila) celda.forEach(agregar)
  }
  return lineas
}

interface Conteo {
  negrita: number
  total: number
}

/** Cuenta los caracteres visibles (no espacios) de [desde, hasta) y cuántos van en negritas. */
function contar(l: Linea, desde: number, hasta: number): Conteo {
  const c: Conteo = { negrita: 0, total: 0 }
  for (let i = desde; i < hasta; i++) {
    if (/\s/.test(l.texto[i] ?? '')) continue
    c.total++
    if (l.negrita[i]) c.negrita++
  }
  return c
}

/** Se considera "en negritas" cuando más de la mitad de los caracteres visibles lo están. */
const mayoria = (c: Conteo): boolean => c.total > 0 && c.negrita / c.total > 0.5

const RE_NUMERO = /^(\s*)(\d+)\s*\.\s*-\s*/
const RE_LETRA = /^(\s*)([a-d])\)\s*/

export function extraerPreguntasCrudas(bloques: readonly BloqueDocx[]): PreguntaCruda[] {
  const preguntas: PreguntaCruda[] = []
  let seccion = ''
  type Actual = { numero: number; seccion: string; enunciado: string; opciones: OpcionCruda[]; conteos: Conteo[] }
  let actual: Actual | undefined
  /** Campo que recibe el texto de las siguientes líneas. */
  let campo: 'ninguno' | 'enunciado' | 'opcion' = 'ninguno'

  const cerrar = () => {
    if (!actual) return
    if (actual.opciones.length !== 4) throw new Error(`Pregunta ${actual.numero}: se esperaban 4 opciones y hay ${actual.opciones.length}`)
    const { conteos, ...resto } = actual
    preguntas.push({
      ...resto,
      enunciado: colapsar(actual.enunciado),
      opciones: actual.opciones.map((o, i) => ({ ...o, texto: colapsar(o.texto), negritaTexto: mayoria(conteos[i]!) }))
    })
    actual = undefined
    campo = 'ninguno'
  }
  const textoActual = (): string => (campo === 'enunciado' ? actual!.enunciado : (actual!.opciones.at(-1)?.texto ?? ''))

  for (const l of aplanar(bloques)) {
    const num = RE_NUMERO.exec(l.texto)
    const let_ = actual ? RE_LETRA.exec(l.texto) : null
    if (num) {
      cerrar()
      actual = { numero: Number(num[2]), seccion, enunciado: '', opciones: [], conteos: [] }
      campo = 'enunciado'
      actual.enunciado = l.texto.slice(num[0].length)
    } else if (actual && let_) {
      const esperada = LETRAS[actual.opciones.length]
      if (let_[2] !== esperada) throw new Error(`Pregunta ${actual.numero}: se esperaba la opción ${esperada}) y llegó ${let_[2]})`)
      const finMarca = let_[0].length
      actual.opciones.push({
        letra: let_[2]!,
        texto: l.texto.slice(finMarca),
        negritaLetra: mayoria(contar(l, let_[1]!.length, let_[1]!.length + 2)),
        negritaTexto: false // se calcula al cerrar, con todas las líneas de la opción
      })
      actual.conteos.push(contar(l, finMarca, l.texto.length))
      campo = 'opcion'
    } else if (campo !== 'ninguno' && textoActual().trim() === '') {
      // Primera línea del campo (aunque coincida con un encabezado, p. ej. una opción "Fondos de Inversión").
      anexar(l.texto, l)
    } else if (seccionAArea(colapsar(l.texto))) {
      // Encabezado de sección: cierra la pregunta en curso.
      cerrar()
      seccion = colapsar(l.texto)
    } else if (campo !== 'ninguno') {
      anexar(l.texto, l)
    }
  }
  cerrar()
  return preguntas

  function anexar(texto: string, l: Linea): void {
    if (!actual) return
    if (campo === 'enunciado') actual.enunciado += (actual.enunciado ? ' ' : '') + texto
    else {
      const o = actual.opciones.at(-1)!
      o.texto = o.texto ? `${o.texto} ${texto}` : texto
      const c = actual.conteos.at(-1)!
      const nuevo = contar(l, 0, l.texto.length)
      c.negrita += nuevo.negrita
      c.total += nuevo.total
    }
  }
}

/**
 * Regla de la clave:
 * 1. Manda la opción cuyo TEXTO va en negritas.
 * 2. Si ningún texto está en negritas, se usa la letra en negritas.
 * 3. Si letra y texto en negritas son opciones distintas, se usa el texto y se deja una nota de conflicto.
 * 4. Si hay varias opciones con texto en negritas, o ninguna señal, la clave queda en null.
 */
export function decidirClave(p: PreguntaCruda): { clave: number | null; notas: string[] } {
  const porTexto = p.opciones.flatMap((o, i) => (o.negritaTexto ? [i] : []))
  const porLetra = p.opciones.flatMap((o, i) => (o.negritaLetra ? [i] : []))
  const nombre = (i: number) => LETRAS[i]
  if (porTexto.length > 1) return { clave: null, notas: [`clave ambigua: texto en negritas en varias opciones (${porTexto.map(nombre).join(', ')})`] }
  if (porTexto.length === 1) {
    const t = porTexto[0]!
    if (porLetra.length === 1 && porLetra[0] !== t) {
      return { clave: t, notas: [`conflicto de clave: letra ${nombre(porLetra[0]!)} en negritas, texto ${nombre(t)} en negritas`] }
    }
    return { clave: t, notas: [] }
  }
  if (porLetra.length === 1) return { clave: porLetra[0]!, notas: [`clave tomada de la letra ${nombre(porLetra[0]!)} en negritas (ningún texto en negritas)`] }
  if (porLetra.length > 1) return { clave: null, notas: ['clave ambigua: letra en negritas en varias opciones'] }
  return { clave: null, notas: ['sin clave: ninguna opción en negritas'] }
}

/** Cálculo = el enunciado trae al menos dos cifras (datos para operar). Una sola cifra suele ser contexto. */
export function esCalculo(enunciado: string): boolean {
  return (enunciado.match(/\d+(?:[.,]\d+)*/g) ?? []).length >= 2
}

export function parsearPreguntasTipo(bloques: readonly BloqueDocx[], fuente: string, generado: string) {
  const preguntas: PreguntaEntrada[] = extraerPreguntasCrudas(bloques).map((c) => {
    const destino = seccionAArea(c.seccion)
    if (!destino) throw new Error(`Pregunta ${c.numero}: sección desconocida "${c.seccion}"`)
    const { clave, notas } = decidirClave(c)
    const calculo = esCalculo(c.enunciado)
    return {
      id: `tipo.${String(c.numero).padStart(2, '0')}`,
      area: destino.area,
      ...(destino.extra ? { seccionOriginal: c.seccion } : {}),
      enunciado: c.enunciado,
      opciones: c.opciones.map((o) => ({ texto: o.texto })),
      clave,
      tipo: calculo ? 'calculo' : 'teoria',
      formato: /\bEXCEPTO\b/.test(c.enunciado) ? 'excepto' : calculo ? 'calculo' : 'directa',
      extra: destino.extra,
      fuente: 'oficial-ejemplo',
      cita: { documento: 'AMIB Data/Preguntas Tipo.docx' },
      estado: clave === null ? 'borrador' : 'validada',
      notas
    }
  })
  return ArchivoPreguntasSchema.parse({ fuente, generado, preguntas })
}
