/**
 * Registro de intentos: la unidad mínima de la memoria del estudiante.
 * Todo el motor (dominio, perfil, selector, Leitner) se calcula a partir de una lista de intentos.
 */
import type { AreaId } from './examen'

export type TipoPregunta = 'teoria' | 'calculo'
export type Confianza = 'seguro' | 'dude' | 'adivine'
export type ModoIntento = 'practica' | 'leccion' | 'mini' | 'reto' | 'repaso' | 'simulacro' | 'diagnostico'

export interface Intento {
  preguntaId: string
  area: AreaId
  subtemaId?: string
  objetivoId?: string
  tipo: TipoPregunta
  /** Dificultad 1 a 5. Si falta, el motor la trata como 3 (intermedia). */
  dificultad?: 1 | 2 | 3 | 4 | 5
  correcta: boolean
  tiempoMs: number
  confianza?: Confianza
  modo: ModoIntento
  sesionId: string
  /** Fecha y hora en formato ISO 8601. */
  fecha: string
  etiquetaError?: string
  /** true si el estudiante usó pistas o ayudas en esta pregunta (impide el nivel Dominado). */
  conPistas?: boolean
}

export const DIA_MS = 24 * 60 * 60 * 1000
/** Ritmo del examen: 258 min para 210 preguntas, 74 s por pregunta. */
export const RITMO_S = 74
export const RITMO_MS = RITMO_S * 1000
export const DIFICULTAD_POR_OMISION = 3

export function marca(fecha: string): number {
  const t = Date.parse(fecha)
  if (Number.isNaN(t)) throw new RangeError(`fecha inválida: ${fecha}`)
  return t
}

export function dificultadDe(i: Pick<Intento, 'dificultad'>): number {
  return i.dificultad ?? DIFICULTAD_POR_OMISION
}

/** Un acierto marcado como "adivine" no cuenta como acierto para subir de nivel ni para Leitner. */
export function cuentaComoAcierto(i: Pick<Intento, 'correcta' | 'confianza'>): boolean {
  return i.correcta && i.confianza !== 'adivine'
}

/** Semana ISO 8601 en UTC, con formato `2026-W41`. */
export function semanaISO(fecha: string): string {
  const d = new Date(marca(fecha))
  const dia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const n = dia.getUTCDay() || 7
  dia.setUTCDate(dia.getUTCDate() + 4 - n)
  const inicioAnio = Date.UTC(dia.getUTCFullYear(), 0, 1)
  const semana = Math.ceil(((dia.getTime() - inicioAnio) / DIA_MS + 1) / 7)
  return `${dia.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`
}

export function agruparPor<T, K>(items: readonly T[], clave: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>()
  for (const it of items) {
    const k = clave(it)
    const arr = m.get(k)
    if (arr) arr.push(it)
    else m.set(k, [it])
  }
  return m
}
