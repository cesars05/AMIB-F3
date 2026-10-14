import { AREAS, type AreaId } from '@core/examen'
import type { Nivel } from '@core/dominio'

export const NOMBRE_AREA: Record<AreaId, string> = Object.fromEntries(AREAS.map((a) => [a.id, a.nombre])) as Record<AreaId, string>

/** Nombres cortos para gráficas y tarjetas. */
export const NOMBRE_CORTO: Record<AreaId, string> = {
  etica: 'Ética',
  servicios: 'Servicios de Inversión',
  normativo: 'Marco Normativo',
  matematicas: 'Matemáticas y Portafolios',
  capitales: 'Mercado de Capitales',
  deuda: 'Títulos de Deuda',
  fondos: 'Fondos de Inversión',
  derivados: 'Derivados y Riesgos',
  analisis: 'Análisis Econ., Fin. y Técnico'
}

export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  'sin-ver': 'Sin ver',
  visto: 'Visto',
  familiar: 'Familiar',
  competente: 'Competente',
  dominado: 'Dominado'
}

export const LETRAS = ['a', 'b', 'c', 'd'] as const

export function porcentaje(x: number, decimales = 0): string {
  return `${(x * 100).toFixed(decimales)} %`
}

/** `mm:ss` a partir de segundos. */
export function reloj(segundos: number): string {
  const s = Math.max(0, Math.round(segundos))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function fechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a!, m! - 1, d!).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** `confunde-descuento-rendimiento` pasa a "confunde descuento rendimiento". */
export function etiquetaLegible(etiqueta: string): string {
  return etiqueta.replace(/[-.]/g, ' ')
}

export function mensajeError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e)
  // Electron antepone "Error invoking remote method ..." a los rechazos de ipcMain.handle.
  return m.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
}

export function pluralizar(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`
}

/** Identificador de sesión corto y seguro para el canal IPC. */
export function nuevaSesionId(prefijo: string): string {
  return `${prefijo}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`
}
