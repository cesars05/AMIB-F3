/** Utilidades de azar reproducible (siempre con el `Azar` inyectado). */
import type { Azar } from './barajar'

export function mezclarCon<T>(arr: readonly T[], azar: Azar): T[] {
  const r = [...arr]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}

/** Muestreo ponderado sin reemplazo (Efraimidis y Spirakis): clave u^(1/w), de mayor a menor. */
export function muestrearPonderado<T>(items: readonly T[], peso: (t: T) => number, k: number, azar: Azar): T[] {
  const claves = items.map((it, idx) => {
    const w = Math.max(peso(it), 1e-9)
    return { it, idx, clave: Math.pow(Math.max(azar(), 1e-12), 1 / w) }
  })
  claves.sort((a, b) => b.clave - a.clave || a.idx - b.idx)
  return claves.slice(0, Math.max(0, k)).map((c) => c.it)
}

/** Binomial(n, p) por suma de ensayos Bernoulli. */
export function binomial(n: number, p: number, azar: Azar): number {
  let k = 0
  for (let i = 0; i < n; i++) if (azar() < p) k++
  return k
}
