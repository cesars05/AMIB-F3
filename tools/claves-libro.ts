/**
 * Clave oficial de los cuestionarios de repaso del libro ("Respuestas Cuestionarios - Libro", AMIB 1.pdf p. 359),
 * transcrita a mano en `content/claves/respuestas-libro-amib1.json` (no se edita: es el dato fuente).
 *
 * Las claves vienen por NÚMERO DE PREGUNTA DEL LIBRO. Solo se aplican a las preguntas del repaso cuyo `numeroLibro`
 * se determinó con fiabilidad (ver `parse-repaso.ts`). Una pregunta pasa a `validada` únicamente si su texto está
 * limpio de ruido de OCR y nadie ha puesto reparos a su clave; si no, queda `borrador` con la clave puesta y una nota.
 */
import { z } from 'zod'
import { PreguntaSchema, type Pregunta } from '../app/src/core/contenido'
import { NOTA_SIN_CLAVE } from './parse-repaso'

export const NOTA_CLAVE = 'clave: Respuestas Cuestionarios - Libro, p. 359'

export const ClavesLibroSchema = z.object({
  fuente: z.string(),
  pagina: z.number().int().positive(),
  titulo: z.string(),
  nota: z.string(),
  capitulos: z.array(
    z.object({
      capitulo: z.number().int().min(1).max(9),
      nombre: z.string(),
      claves: z.array(z.enum(['a', 'b', 'c', 'd'])).min(1)
    })
  )
})
export type ClavesLibro = z.infer<typeof ClavesLibroSchema>

/** Cantidad de preguntas del cuestionario de cada capítulo, según la clave. */
export function totalesPorCapitulo(c: ClavesLibro): Record<number, number> {
  return Object.fromEntries(c.capitulos.map((x) => [x.capitulo, x.claves.length]))
}

/**
 * Pares (capítulo.pregunta del libro) cuya clave oficial NO coincide con lo que dice el manual o el cálculo, o cuyo
 * enunciado trae una cifra de OCR que no cuadra. Se lee cada enunciado contra el manual (ver bitácora). La clave oficial
 * se conserva, pero la pregunta no se valida: Cesar decide.
 */
export const REVISION_CLAVE: Readonly<Record<string, string>> = {
  '1.19': 'el manual (1.3.5) dice que ese enunciado define el objeto de la Autorregulación (d), no del Código de Ética (a)',
  '2.7': 'el manual (2.2) asigna la aprobación de la Guía de Servicios de Inversión a la persona responsable de supervisar el cumplimiento (a), no al Comité (c)',
  '2.8': 'el manual (2.1.3) exige el perfilamiento actualizado "en todo momento" (a), no cada 2 años (d)',
  '2.14': 'el manual (2.3.1) cita como obligaciones la Guía y los mecanismos de difusión (1 y 2, opción d); la opción a incluye el punto 4, que es de otro servicio',
  '4.1': 'cifra de OCR: con 12% anual el monto es $119,509.25 (opción c, la clave); el enunciado dice 22%',
  '4.5': 'cifra de OCR: la interpolación da 5.244444%; la opción b (clave) se lee 5.204444',
  '4.10': 'ninguna opción coincide con la TIR de los flujos del enunciado (10.21%); revisar cifras en la página del libro',
  '4.12': 'cifra de OCR: con inversión de $100,000 el VPN es $51,867.46 (opción a, la clave); el enunciado dice $200,000'
}

/** Preguntas ("capítulo.número") cuyas cifras se verificaron con cálculo o contra el manual (ver bitácora). */
export const CIFRAS_VERIFICADAS: ReadonlySet<string> = new Set<string>([
  // Capítulo 4: recalculadas (interés compuesto, tasa real, interés simple, anualidad, descuento, CAPM, portafolio, puntos base).
  '4.3', '4.4', '4.7', '4.8', '4.9', '4.11', '4.13',
  // Capítulo 5: 10 sectores (manual 5.3), horarios de la BMV (manual 5.3.6), precio teórico del ADR, arbitraje ADR y rendimiento efectivo.
  '5.3', '5.17', '5.19', '5.20', '5.23', '5.25',
  // Capítulo 6: valor nominal y cupón del UDIBONO (manual 6.4), tasa de descuento del CETE y precio limpio del bono M.
  '6.13', '6.16', '6.22', '6.23',
  // Capítulo 8: delta de la opción y prima ajustada por theta.
  '8.3', '8.24'
])

/**
 * Palabras correctas del español financiero que el vocabulario del manual casi no trae (aparecen menos de tres veces).
 * Se agregaron al leer cada enunciado; no incluye ninguna palabra con falta de acento u otro defecto de OCR.
 */
export const PALABRAS_LEGITIMAS: ReadonlySet<string> = new Set([
  'doctrina', 'metafísica', 'psicología', 'prudente', 'hipotecarias', 'quirografarias', 'prendarias', 'canjean', 'enfrentar', 'solvencia',
  'esperar', 'considerable', 'mixta', 'opuesta', 'compromete', 'intercambiar', 'warrant', 'negocia', 'aporta', 'líquidos', 'incumplimientos',
  'dirimir', 'estructurar', 'abaratamiento', 'incumple', 'mencione', 'girado', 'girador', 'sindical', 'correduría', 'contactar',
  'concertados', 'centralizada', 'profesionalmente', 'cuántos', 'conscientes', 'desprenden', 'creatividad', 'innovación', 'reverse',
  'regresan', 'interviene', 'hablamos', 'referimos', 'sacrificar', 'boot', 'valen', 'escucha', 'tuyo', 'sustrayendo', 'dices', 'nada',
  'incumples', 'obra', 'asignados', 'ejecutivo', 'portador', 'certificadas', 'valuaciones', 'depositar', 'significan', 'números',
  'recomienda', 'adaptan', 'correcta', 'operador', 'observas', 'compañero', 'covered', 'neutral', 'ninguno', 'realizó', 'pérez', 'juan',
  'gerente', 'compraventa', 'beneficiar', 'perjudica', 'honestidad', 'coherencia', 'inteligencia', 'comenta', 'jefe', 'rumores',
  'canalices', 'promoviendo', 'intensamente', 'avisarles', 'importar', 'adhesión', 'político', 'racionalidad', 'bondad', 'maldad'
])

const normalizar = (s: string) => s.toLowerCase()
const RE_PALABRA = /\p{L}{3,}/gu
/** Símbolos que el OCR mete por letras o viñetas y que no aparecen en un texto limpio. */
const RE_SIMBOLO_BASURA = /[|_£€¡=~^`{}<>\\]|\s[-—–]\s|(?:^|\s)[b-df-hj-np-tv-xz](?=\s)/i

/** "De38:00a8:25": letras y cifras sin separar (el OCR perdió los espacios o confundió un carácter). */
const RE_LETRA_Y_CIFRA = /\S*(?:\p{L}\d|\d\p{L})\S*/u
/** Siglas que el OCR repite mal en todo el manual (V leída como Y), por eso el vocabulario no las detecta. */
const RE_SIGLA_CONFUNDIDA = /\b(?:BMYV?|CNBY|SEP)\b/g

/**
 * Cuenta las palabras (3 o más letras) de los textos: sirve de vocabulario para detectar errores de OCR.
 * `peso` multiplica cada aparición (las fuentes limpias, sin OCR, pesan lo suficiente para dar por buena una palabra con una sola aparición).
 */
export function contarPalabras(textos: Iterable<string>, peso = 1, acumulado: Map<string, number> = new Map()): Map<string, number> {
  for (const t of textos) for (const w of normalizar(t).match(RE_PALABRA) ?? []) acumulado.set(w, (acumulado.get(w) ?? 0) + peso)
  return acumulado
}

/** Cuántas veces debe aparecer una palabra en el manual para darla por bien escrita. */
export const MIN_APARICIONES = 3
/** Peso de una aparición en una fuente limpia (docx o Markdown revisado): una sola basta. */
export const PESO_FUENTE_LIMPIA = MIN_APARICIONES

/**
 * Motivos por los que el texto de la pregunta no se considera limpio: palabras que casi no aparecen en el manual
 * (errores de OCR como "promeción"), símbolos sueltos o avisos del extractor. Vacío = texto limpio.
 */
export function motivosDeRuido(p: Pick<Pregunta, 'enunciado' | 'opciones' | 'notas'>, vocabulario: ReadonlyMap<string, number>): string[] {
  const motivos: string[] = []
  const avisos = p.notas.filter((n) => n.startsWith('OCR:') && !n.includes('contiene cifras'))
  motivos.push(...avisos.map((a) => a.replace(/^OCR:\s*/, '')))
  const textos = [p.enunciado, ...p.opciones.map((o) => o.texto)]
  const raras = new Set<string>()
  for (const t of textos) for (const w of normalizar(t).match(RE_PALABRA) ?? []) if ((vocabulario.get(w) ?? 0) < MIN_APARICIONES && !PALABRAS_LEGITIMAS.has(w)) raras.add(w)
  if (raras.size) motivos.push(`palabras dudosas: ${[...raras].slice(0, 6).join(', ')}${raras.size > 6 ? '…' : ''}`)
  if (textos.some((t) => RE_SIMBOLO_BASURA.test(t))) motivos.push('símbolos o letras sueltas')
  if (textos.some((t) => RE_LETRA_Y_CIFRA.test(t))) motivos.push('letras y cifras pegadas')
  const confundidas = textos.flatMap((t) => t.match(RE_SIGLA_CONFUNDIDA) ?? [])
  if (confundidas.length) motivos.push(`sigla mal leída por el OCR: ${[...new Set(confundidas)].join(', ')}`)
  return motivos
}

export interface ResumenClaves {
  porCapitulo: Record<number, { preguntas: number; conNumeroLibro: number; conClave: number; validadas: number; borradores: number; retiradas: number }>
}

const RE_ID = /^manual-repaso\.c(\d{2})\.q\d{2}$/

/**
 * Aplica la clave del libro a las preguntas del repaso con `numeroLibro` confiable. Ninguna pregunta recibe clave sin
 * `numeroLibro`. `cifrasVerificadas`: preguntas ("cap.num") cuyas cifras se comprobaron con cálculo o contra el manual.
 */
export function aplicarClaves(
  preguntas: readonly Pregunta[],
  claves: ClavesLibro,
  vocabulario: ReadonlyMap<string, number>,
  cifrasVerificadas: ReadonlySet<string> = new Set()
): { preguntas: Pregunta[]; resumen: ResumenClaves } {
  const porCap = new Map(claves.capitulos.map((c) => [c.capitulo, c.claves]))
  const resumen: ResumenClaves = { porCapitulo: {} }
  const salida = preguntas.map((p) => {
    const m = RE_ID.exec(p.id)
    if (!m) return p
    const cap = Number(m[1])
    const r = (resumen.porCapitulo[cap] ??= { preguntas: 0, conNumeroLibro: 0, conClave: 0, validadas: 0, borradores: 0, retiradas: 0 })
    r.preguntas++
    if (p.estado === 'retirada') {
      r.retiradas++
      return p
    }
    if (p.numeroLibro !== undefined) r.conNumeroLibro++
    const lista = porCap.get(cap)
    const letra = p.numeroLibro !== undefined ? lista?.[p.numeroLibro - 1] : undefined
    if (p.numeroLibro === undefined || letra === undefined) {
      r.borradores++
      return p
    }
    r.conClave++
    const id = `${cap}.${p.numeroLibro}`
    const notas = p.notas.filter((n) => n !== NOTA_SIN_CLAVE)
    notas.unshift(NOTA_CLAVE)
    const motivos = motivosDeRuido(p, vocabulario)
    const revision = REVISION_CLAVE[id]
    if (revision) motivos.push(`clave por revisar: ${revision}`)
    else if (/\d/.test(p.enunciado + p.opciones.map((o) => o.texto).join(' ')) && !cifrasVerificadas.has(id)) motivos.push('cifras sin verificar contra el cálculo o el manual')
    const limpia = motivos.length === 0
    if (limpia) r.validadas++
    else {
      r.borradores++
      notas.push(`borrador: ${motivos.join('; ')}`)
    }
    return PreguntaSchema.parse({ ...p, clave: 'abcd'.indexOf(letra), estado: limpia ? 'validada' : 'borrador', notas })
  })
  return { preguntas: salida, resumen }
}
