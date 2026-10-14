/**
 * Barajado reproducible de opciones. En cada sesión la respuesta correcta se reparte de forma
 * equilibrada entre a, b, c y d (sin rachas de la misma letra), y siempre se sabe cuál es la clave.
 */

export type Azar = () => number

/** Generador pseudoaleatorio con semilla (mulberry32): mismo resultado con la misma semilla. */
export function crearAzar(semilla: number): Azar {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mezclar<T>(arr: T[], azar: Azar): T[] {
  const r = [...arr]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}

/** Opciones que mencionan a otras ("todas las anteriores", "a y b", "sólo I y III") no se pueden mover. */
export function dependeDePosicion(opciones: readonly string[]): boolean {
  const patron = /\banteriores\b|\bambas\s+(son|opciones|respuestas)\b|\b[a-d]\)?\s+y\s+[a-d]\)?(?=\s|$|,|\.)|\b(i{1,3}|iv)\s+y\s+(i{1,3}|iv)\b/i
  return opciones.some((o) => patron.test(o))
}

export interface OpcionesBarajadas<T> {
  opciones: T[]
  /** Índice de la correcta en el nuevo orden. */
  clave: number
  /** permutacion[i] = índice original de la opción que quedó en la posición i. */
  permutacion: number[]
  /** true si no se barajó porque las opciones dependen de su posición. */
  fija: boolean
}

/**
 * Baraja las opciones. Si se da `destino`, la correcta queda exactamente ahí y las demás se mezclan.
 * Recibe textos para detectar dependencias; para otros tipos, pase `fija` explícita.
 */
export function barajarOpciones<T>(
  opciones: readonly T[],
  clave: number,
  azar: Azar,
  destino?: number,
  fija: boolean = typeof opciones[0] === 'string' && dependeDePosicion(opciones as unknown as string[])
): OpcionesBarajadas<T> {
  if (!Number.isInteger(clave) || clave < 0 || clave >= opciones.length) throw new RangeError('clave fuera de rango')
  const indices = opciones.map((_, i) => i)
  if (fija) return { opciones: [...opciones], clave, permutacion: indices, fija: true }
  const resto = mezclar(indices.filter((i) => i !== clave), azar)
  const pos = destino ?? Math.floor(azar() * opciones.length)
  const permutacion = [...resto.slice(0, pos), clave, ...resto.slice(pos)]
  return { opciones: permutacion.map((i) => opciones[i]!), clave: pos, permutacion, fija: false }
}

/**
 * Posiciones objetivo de la respuesta correcta para una sesión de `n` preguntas:
 * reparto equilibrado entre las 4 letras y sin más de 2 iguales seguidas.
 */
export function asignarPosiciones(n: number, azar: Azar, numOpciones = 4): number[] {
  const bolsa: number[] = []
  for (let i = 0; i < n; i++) bolsa.push(i % numOpciones)
  for (let intento = 0; intento < 200; intento++) {
    const r = mezclar(bolsa, azar)
    if (!tieneRacha(r)) return r
  }
  // Respaldo determinista: reordena para romper rachas intercambiando con el siguiente distinto.
  const r = mezclar(bolsa, azar)
  for (let i = 2; i < r.length; i++) {
    if (r[i] === r[i - 1] && r[i] === r[i - 2]) {
      const j = r.findIndex((x, k) => k > i && x !== r[i])
      if (j > 0) [r[i], r[j]] = [r[j]!, r[i]!]
    }
  }
  return r
}

function tieneRacha(r: number[]): boolean {
  for (let i = 2; i < r.length; i++) if (r[i] === r[i - 1] && r[i] === r[i - 2]) return true
  return false
}
