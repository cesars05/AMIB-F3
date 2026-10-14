/**
 * Dominio exigente por subtema: cinco niveles con reglas estrictas, decaimiento por olvido y
 * estimación Beta con ponderación por recencia (ver plan maestro, "Niveles de dominio exigentes").
 */
import { DIA_MS, RITMO_MS, agruparPor, cuentaComoAcierto, dificultadDe, marca, type Intento } from './intentos'

export type Nivel = 'sin-ver' | 'visto' | 'familiar' | 'competente' | 'dominado'
export const NIVELES: readonly Nivel[] = ['sin-ver', 'visto', 'familiar', 'competente', 'dominado']

export const UMBRAL_ACIERTO = 0.8
export const MIN_PREGUNTAS_SESION = 4
export const DIAS_ENTRE_FAMILIAR_Y_COMPETENTE = 2
export const DIAS_ENTRE_COMPETENTE_Y_DOMINADO = 7
export const DIAS_PARA_OLVIDO = 21
export const UMBRAL_SESION_MALA = 0.5
export const MIN_PREGUNTAS_SESION_MALA = 3
export const MEDIA_VIDA_DIAS = 14

export function indiceNivel(n: Nivel): number {
  return NIVELES.indexOf(n)
}

interface Sesion {
  id: string
  inicio: number
  intentos: Intento[]
}

function sesionesDe(intentos: readonly Intento[]): Sesion[] {
  const out: Sesion[] = []
  for (const [id, lista] of agruparPor(intentos, (i) => i.sesionId)) {
    out.push({ id, inicio: Math.min(...lista.map((i) => marca(i.fecha))), intentos: lista })
  }
  return out.sort((a, b) => a.inicio - b.inicio || a.id.localeCompare(b.id))
}

function porcentaje(lista: readonly Intento[]): number {
  return lista.filter(cuentaComoAcierto).length / lista.length
}

function cumple(lista: readonly Intento[]): boolean {
  return lista.length >= MIN_PREGUNTAS_SESION && porcentaje(lista) >= UMBRAL_ACIERTO
}

export interface DetalleNivel {
  nivel: Nivel
  /** Nivel ganado por las reglas de promoción, antes de aplicar el decaimiento. */
  nivelBruto: Nivel
  decaidoPorOlvido: boolean
  decaidoPorSesionMala: boolean
}

/**
 * Evalúa el nivel de un subtema a partir de sus intentos.
 * Reglas (estrictas, un acierto "adivine" no cuenta):
 * 1. Visto: cualquier intento.
 * 2. Familiar: sesión de lección, mini examen o práctica con al menos 4 preguntas de dificultad 3 o menos y 80% de aciertos.
 * 3. Competente: otra sesión, 2 días o más después, con dificultad 3 o más, 80% de aciertos y, si el subtema tiene cálculo, con cálculo.
 * 4. Dominado: otra sesión 7 días o más después, con dificultad 4 o más, 80% de aciertos, promedio de 74 s o menos y sin pistas.
 * Decaimiento: más de 21 días sin intentos baja un nivel; la última sesión con menos de 50% baja un nivel.
 */
export function evaluarNivel(intentos: readonly Intento[], ahora: Date): DetalleNivel {
  if (intentos.length === 0) return { nivel: 'sin-ver', nivelBruto: 'sin-ver', decaidoPorOlvido: false, decaidoPorSesionMala: false }
  const sesiones = sesionesDe(intentos)
  const hayCalculo = intentos.some((i) => i.tipo === 'calculo')
  let bruto: Nivel = 'visto'

  const familiar = sesiones.find(
    (s) =>
      s.intentos.some((i) => i.modo === 'mini' || i.modo === 'leccion' || i.modo === 'practica') &&
      cumple(s.intentos.filter((i) => (i.modo === 'mini' || i.modo === 'leccion' || i.modo === 'practica') && dificultadDe(i) <= 3))
  )
  const competente = familiar
    ? sesiones.find((s) => {
        if (s.id === familiar.id || s.inicio < familiar.inicio + DIAS_ENTRE_FAMILIAR_Y_COMPETENTE * DIA_MS) return false
        const lista = s.intentos.filter((i) => dificultadDe(i) >= 3)
        return cumple(lista) && (!hayCalculo || lista.some((i) => i.tipo === 'calculo'))
      })
    : undefined
  const dominado = competente
    ? sesiones.find((s) => {
        if (s.id === competente.id || s.inicio < competente.inicio + DIAS_ENTRE_COMPETENTE_Y_DOMINADO * DIA_MS) return false
        const lista = s.intentos.filter((i) => dificultadDe(i) >= 4)
        if (!cumple(lista)) return false
        const promedio = lista.reduce((a, i) => a + i.tiempoMs, 0) / lista.length
        return promedio <= RITMO_MS && !lista.some((i) => i.conPistas)
      })
    : undefined
  if (familiar) bruto = 'familiar'
  if (competente) bruto = 'competente'
  if (dominado) bruto = 'dominado'

  let idx = indiceNivel(bruto)
  const ultima = Math.max(...intentos.map((i) => marca(i.fecha)))
  const olvido = ahora.getTime() - ultima > DIAS_PARA_OLVIDO * DIA_MS
  const reciente = sesiones[sesiones.length - 1]!
  const mala = reciente.intentos.length >= MIN_PREGUNTAS_SESION_MALA && porcentaje(reciente.intentos) < UMBRAL_SESION_MALA
  if (olvido) idx = Math.max(1, idx - 1)
  if (mala) idx = Math.max(1, idx - 1)
  return { nivel: NIVELES[idx]!, nivelBruto: bruto, decaidoPorOlvido: olvido && idx < indiceNivel(bruto), decaidoPorSesionMala: mala && idx < indiceNivel(bruto) }
}

export function nivelDe(intentos: readonly Intento[], ahora: Date): Nivel {
  return evaluarNivel(intentos, ahora).nivel
}

// ─── Estimación Beta ─────────────────────────────────────────────────────────

export interface DominioEstimado {
  /** Media posterior de la Beta, en [0, 1]. */
  media: number
  /** Banda de credibilidad de 80% (aproximación normal de la Beta, recortada a [0, 1]). */
  banda: [number, number]
  /** Número efectivo de observaciones tras la ponderación por recencia. */
  nEfectivo: number
}

const Z80 = 1.2815515655446004

/** Valor de un intento para la estimación: 1 acierto, 0.5 acierto adivinado, 0 error. */
function valorIntento(i: Intento): number {
  if (!i.correcta) return 0
  return i.confianza === 'adivine' ? 0.5 : 1
}

export function dominioEstimado(intentos: readonly Intento[], ahora: Date, mediaVidaDias = MEDIA_VIDA_DIAS): DominioEstimado {
  let a = 1
  let b = 1
  let nEfectivo = 0
  for (const i of intentos) {
    const edad = Math.max(0, (ahora.getTime() - marca(i.fecha)) / DIA_MS)
    const w = Math.pow(0.5, edad / mediaVidaDias)
    const v = valorIntento(i)
    a += w * v
    b += w * (1 - v)
    nEfectivo += w
  }
  const s = a + b
  const media = a / s
  const sd = Math.sqrt((a * b) / (s * s * (s + 1)))
  return { media, banda: [Math.max(0, media - Z80 * sd), Math.min(1, media + Z80 * sd)], nEfectivo }
}

export function dominioPorArea(intentos: readonly Intento[], ahora: Date): Map<string, DominioEstimado> {
  const m = new Map<string, DominioEstimado>()
  for (const [area, lista] of agruparPor(intentos, (i) => i.area)) m.set(area, dominioEstimado(lista, ahora))
  return m
}

export function dominioPorSubtema(intentos: readonly Intento[], ahora: Date): Map<string, DominioEstimado> {
  const m = new Map<string, DominioEstimado>()
  for (const [id, lista] of agruparPor(
    intentos.filter((i) => i.subtemaId),
    (i) => i.subtemaId!
  ))
    m.set(id, dominioEstimado(lista, ahora))
  return m
}

// ─── Estado de un subtema ────────────────────────────────────────────────────

export interface ErrorFrecuente {
  etiqueta: string
  n: number
}

export interface EstadoSubtema {
  nivel: Nivel
  aciertos: number
  intentos: number
  dominio: number
  banda: [number, number]
  tiempoPromedioMs: number | null
  ultimaVez: string | null
  erroresFrecuentes: ErrorFrecuente[]
  adivinadas: number
}

export function erroresFrecuentes(intentos: readonly Intento[], top = 3): ErrorFrecuente[] {
  const cuenta = new Map<string, number>()
  for (const i of intentos) if (!i.correcta && i.etiquetaError) cuenta.set(i.etiquetaError, (cuenta.get(i.etiquetaError) ?? 0) + 1)
  return [...cuenta.entries()]
    .map(([etiqueta, n]) => ({ etiqueta, n }))
    .sort((x, y) => y.n - x.n || x.etiqueta.localeCompare(y.etiqueta))
    .slice(0, top)
}

export function estadoSubtema(intentos: readonly Intento[], ahora: Date): EstadoSubtema {
  const d = dominioEstimado(intentos, ahora)
  const ultima = intentos.length ? Math.max(...intentos.map((i) => marca(i.fecha))) : null
  return {
    nivel: nivelDe(intentos, ahora),
    aciertos: intentos.filter(cuentaComoAcierto).length,
    intentos: intentos.length,
    dominio: d.media,
    banda: d.banda,
    tiempoPromedioMs: intentos.length ? intentos.reduce((a, i) => a + i.tiempoMs, 0) / intentos.length : null,
    ultimaVez: ultima === null ? null : new Date(ultima).toISOString(),
    erroresFrecuentes: erroresFrecuentes(intentos),
    adivinadas: intentos.filter((i) => i.correcta && i.confianza === 'adivine').length
  }
}
