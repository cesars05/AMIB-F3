/**
 * Similitud de texto tolerante a OCR, para vincular los encabezados del manual con los objetivos del temario.
 *
 * Los dos textos se normalizan igual (sin acentos, minúsculas, sin palabras vacías y sin el verbo inicial) y se
 * comparan por tokens con coincidencia difusa (una letra mal reconocida no impide el empate: "Entídades" ≈ "entidades").
 */
import { sinAcentos } from './texto'

const PALABRAS_VACIAS = new Set(
  (
    'a al algo ante con contra cual cuales cuando de del desde donde e el ella ellas ellos en entre es esa esas ese esos esta estas este estos ' +
    'ha hacia han hasta la las le les lo los mas mediante muy o otra otras otro otros para pero por que se segun si sin sobre son su sus ' +
    'tal tambien tiene tienen un una unas uno unos y ya como cada debe deben pueden puede ser sea sean asi'
  ).split(' ')
)

/** Primer token con forma de verbo en infinitivo (con o sin pronombre pegado: "reconocerlos"). OCR incluido ("dentificar"). */
const RE_VERBO_INICIAL = /^[a-z]{4,}(?:ar|er|ir)(?:l[oa]s?|se|me|nos)?$/

/** Verbo inicial normalizado (sin acentos, minúsculas), o `''` si el texto no empieza con uno. Tolera el pronombre pegado por el OCR. */
export function verboInicial(texto: string): string {
  const primero = sinAcentos(texto).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim().split(' ')[0] ?? ''
  return RE_VERBO_INICIAL.test(primero) ? primero : ''
}

/** Distancia de edición (Levenshtein) entre dos cadenas. */
export function distanciaEdicion(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let previa = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const actual = [i]
    for (let j = 1; j <= b.length; j++) {
      actual[j] = Math.min(previa[j]! + 1, actual[j - 1]! + 1, previa[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    previa = actual
  }
  return previa[b.length]!
}

/** Tokens significativos: sin acentos, en minúsculas, sin palabras vacías ni el verbo inicial del objetivo. */
export function tokens(texto: string): string[] {
  const todos = sinAcentos(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  if (todos[0] && RE_VERBO_INICIAL.test(todos[0])) todos.shift()
  return todos.filter((t) => !PALABRAS_VACIAS.has(t) && (t.length > 1 || /\d/.test(t)))
}

/** Dos tokens coinciden si son iguales o, siendo largos, difieren en pocas letras (error de OCR). */
function coinciden(a: string, b: string): boolean {
  if (a === b) return true
  const largo = Math.max(a.length, b.length)
  if (largo < 5 || Math.abs(a.length - b.length) > 2) return false
  return distanciaEdicion(a, b) <= (largo >= 9 ? 2 : 1)
}

export interface Similitud {
  /** 0–1. Mezcla ponderada por rareza: qué tanto del encabezado está en el objetivo (domina) y viceversa. */
  puntaje: number
  /** Fracción (ponderada) de los tokens del encabezado que aparecen en el objetivo. */
  contieneEncabezado: number
  /** Fracción (ponderada) de los tokens del objetivo que aparecen en el encabezado. */
  contieneObjetivo: number
  /** Peso total del encabezado: un encabezado genérico ("Identificar los siguientes conceptos:") pesa poco. */
  informacion: number
}

export type Pesos = ReadonlyMap<string, number>

/** Peso tipo IDF de cada token: las palabras que aparecen en muchos objetivos ("conceptos", "mercado") pesan poco. */
export function construirPesos(textos: readonly string[]): Pesos {
  const df = new Map<string, number>()
  for (const t of textos) for (const k of new Set(tokens(t))) df.set(k, (df.get(k) ?? 0) + 1)
  const pesos = new Map<string, number>()
  for (const [k, n] of df) pesos.set(k, Math.log(1 + textos.length / n))
  return pesos
}

/** Peso de un token fuera del corpus (puede ser basura de OCR): intermedio, para que no domine ni se ignore. */
const PESO_DESCONOCIDO = 2
/** Información (suma de pesos) a partir de la cual un encabezado se considera específico. */
const INFORMACION_SUFICIENTE = 7
/** Atenuación por cantidad de tokens del encabezado (índice = tokens; 4 o más no se atenúan). */
const FACTOR_LARGO = [0, 0.5, 0.65, 0.85, 1] as const

/**
 * Compara los tokens de un encabezado con los de un objetivo, con coincidencia difusa y uso único de cada token.
 * Los encabezados del manual suelen ser el objetivo truncado o con ruido, por eso pesa más "el encabezado cabe en
 * el objetivo" que la simetría de Dice.
 */
export function similitudTokens(encabezado: readonly string[], objetivo: readonly string[], pesos: Pesos = new Map()): Similitud {
  const peso = (t: string) => pesos.get(t) ?? PESO_DESCONOCIDO
  const suma = (xs: readonly string[]) => xs.reduce((n, t) => n + peso(t), 0)
  const total = suma(encabezado)
  const totalObjetivo = suma(objetivo)
  if (!encabezado.length || !objetivo.length) return { puntaje: 0, contieneEncabezado: 0, contieneObjetivo: 0, informacion: total }
  const libres = [...objetivo]
  let comun = 0
  for (const t of encabezado) {
    const k = libres.findIndex((u) => coinciden(t, u))
    if (k >= 0) {
      comun += Math.min(peso(t), peso(libres[k]!))
      libres.splice(k, 1)
    }
  }
  const contieneEncabezado = comun / total
  const contieneObjetivo = comun / totalObjetivo
  // Un encabezado genérico o de uno o dos tokens encaja por casualidad en muchos objetivos ("Ética y Moral" cabe en 20):
  // su puntaje se atenúa, salvo que el empate sea casi exacto en ambos sentidos.
  const especifico = Math.min(1, 0.45 + 0.55 * (total / INFORMACION_SUFICIENTE))
  const largo = FACTOR_LARGO[Math.min(encabezado.length, FACTOR_LARGO.length - 1)]!
  const simetria = Math.min(contieneEncabezado, contieneObjetivo)
  const atenuacion = especifico * largo + (1 - especifico * largo) * simetria ** 3
  const puntaje = (0.65 * contieneEncabezado + 0.35 * contieneObjetivo) * atenuacion
  return { puntaje, contieneEncabezado, contieneObjetivo, informacion: total }
}

export function similitud(a: string, b: string, pesos: Pesos = new Map()): Similitud {
  return similitudTokens(tokens(a), tokens(b), pesos)
}
