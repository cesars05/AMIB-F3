/** Repetición espaciada tipo Leitner: cajas 1 a 5 con intervalos de 1, 2, 4, 8 y 16 días. */
import { DIA_MS, agruparPor, cuentaComoAcierto, marca, type Intento } from './intentos'

export const INTERVALOS_DIAS = [1, 2, 4, 8, 16] as const
export type Caja = 1 | 2 | 3 | 4 | 5

export interface ItemLeitner {
  id: string
  caja: Caja
  /** ISO 8601 de la última revisión. */
  ultimaRevision: string
}

/** Acierto sube una caja (máximo 5); error regresa a la caja 1. Un elemento nuevo parte de la caja 1. */
export function actualizarCaja(id: string, previo: ItemLeitner | undefined, acierto: boolean, ahora: Date): ItemLeitner {
  const actual = previo?.caja ?? 1
  const caja = (acierto ? (previo ? Math.min(5, actual + 1) : 2) : 1) as Caja
  return { id, caja, ultimaRevision: ahora.toISOString() }
}

export function proximaRevision(item: ItemLeitner): Date {
  return new Date(marca(item.ultimaRevision) + INTERVALOS_DIAS[item.caja - 1]! * DIA_MS)
}

export function estaVencida(item: ItemLeitner, ahora: Date): boolean {
  return proximaRevision(item).getTime() <= ahora.getTime()
}

/** Elementos cuya próxima revisión ya llegó, del más atrasado al menos atrasado. */
export function vencidas(items: readonly ItemLeitner[], ahora: Date): ItemLeitner[] {
  return items
    .filter((it) => estaVencida(it, ahora))
    .sort((a, b) => proximaRevision(a).getTime() - proximaRevision(b).getTime() || a.id.localeCompare(b.id))
}

/** Reconstruye las cajas de cada pregunta reproduciendo sus intentos en orden cronológico. */
export function cajasDesdeIntentos(intentos: readonly Intento[]): Map<string, ItemLeitner> {
  const m = new Map<string, ItemLeitner>()
  for (const [id, lista] of agruparPor(intentos, (i) => i.preguntaId)) {
    let item: ItemLeitner | undefined
    for (const i of [...lista].sort((a, b) => marca(a.fecha) - marca(b.fecha))) item = actualizarCaja(id, item, cuentaComoAcierto(i), new Date(marca(i.fecha)))
    m.set(id, item!)
  }
  return m
}
