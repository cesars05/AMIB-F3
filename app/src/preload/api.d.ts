import type { AreaId } from '../core/examen'
import type { Pregunta } from '../core/contenido'
import type { Leccion } from '../core/leccion'
import type { Perfil } from '../core/perfil'
import type { Autoevaluacion, ModoPlan, PlanDia } from '../core/plan'
import type { FiltroSeleccion, Seleccion } from '../core/selector'
import type { Simulacro, TipoSimulacro } from '../core/simulacro'
import type { Confianza, ModoIntento } from '../core/intentos'

/** Contrato entre el proceso principal y la interfaz (ADR-002). Todo canal valida su entrada con Zod en el main. */

export interface InfoApp {
  version: string
  electron: string
  node: string
  esquemaDb: number
}

// ─── Contenido ───────────────────────────────────────────────────────────────

export interface SubtemaResumen {
  id: string
  nombre: string
  objetivos: number
}
export interface MateriaResumen {
  id: string
  nombre: string
  subtemas: SubtemaResumen[]
}
export interface AreaResumen {
  area: AreaId
  materias: MateriaResumen[]
  objetivos: number
  lecciones: number
  preguntasValidadas: number
}
export interface LeccionMeta {
  id: string
  area: AreaId
  materia: string
  subtemaId?: string
  orden: number
  titulo: string
  resumen: string
  duracionMin: number
  laminas: number
  preguntas: number
}
export interface ResumenContenido {
  areas: AreaResumen[]
  totalObjetivos: number
  lecciones: LeccionMeta[]
  preguntas: {
    porEstado: Record<string, number>
    validadasPorTipo: { teoria: number; calculo: number }
    total: number
  }
  /** Archivos o preguntas omitidos por no cumplir el esquema (se registran en el log del proceso principal). */
  errores: number
  erroresMuestra: string[]
}

// ─── Estudio ─────────────────────────────────────────────────────────────────

export interface EntradaSeleccionar {
  filtro?: FiltroSeleccion
  n: number
  excluirIds?: string[]
}
export interface EntradaSimulacro {
  tipo: TipoSimulacro
  area?: AreaId
}

// ─── Intentos ────────────────────────────────────────────────────────────────

export interface IntentoEntrada {
  preguntaId: string
  /** Índice ORIGINAL (en `Pregunta.opciones`) de la opción elegida, no la posición mostrada. */
  respuesta: number
  tiempoMs: number
  confianza?: Confianza
  modo: ModoIntento
  sesionId: string
  /** Para las lecciones: subtema de la lección si la pregunta no trae el suyo. */
  subtemaId?: string
  conPistas?: boolean
}
export interface ResultadoRegistro {
  ok: true
  resultados: { preguntaId: string; correcta: boolean }[]
}

// ─── Perfil y plan ───────────────────────────────────────────────────────────

export interface PerfilApp extends Perfil {
  /** Probabilidad de aprobar (Monte Carlo) o null si no hay base para estimarla. */
  probabilidadAprobar: number | null
  /** De dónde sale el dominio usado: los intentos reales o la autoevaluación del arranque. */
  fuenteProbabilidad: 'intentos' | 'autoevaluacion'
  /** Preguntas reportadas por el estudiante (ids). */
  reportadas: string[]
  /** Intentos y aciertos por área separados en teoría y cálculo (para el Diagnóstico). */
  tipoPorArea: Record<AreaId, { teoria: ConteoTipo; calculo: ConteoTipo }>
}
export interface ConteoTipo {
  intentos: number
  aciertos: number
}

// ─── Ajustes ─────────────────────────────────────────────────────────────────

export type TemaId = 'claro' | 'terminal' | 'editorial' | 'enfoque'
export type LetraId = 'arial' | 'calibri' | 'segoe'

export interface Ajustes {
  tema: TemaId
  letra: LetraId
  /** `AAAA-MM-DD` o null si aún no se configura. */
  fechaExamen: string | null
  modo: ModoPlan
  minutosDia: number
  diasSemana: number
  diasActivos: number[] | null
  autoevaluacion: Partial<Record<AreaId, Autoevaluacion>>
  /** Marcador de posición: el modo con IA requiere OmniRoute y no está disponible en la v1. */
  modoIA: boolean
  onboardingCompleto: boolean
  /** Ids de preguntas que el estudiante reportó (se excluyen de la práctica y de los simulacros). */
  reportadas: string[]
  leccionesVistas: string[]
}
export type ClaveAjuste = keyof Ajustes
export type AjusteGuardar = { [K in ClaveAjuste]: { clave: K; valor: Ajustes[K] } }[ClaveAjuste]

// ─── Notas, sesiones y respaldo ──────────────────────────────────────────────

export interface EntradaNotaObtener {
  leccionId: string
  laminaId: string
}
export interface EntradaNotaGuardar extends EntradaNotaObtener {
  texto: string
}
export interface EntradaSesion {
  id: string
  modo: string
  inicio: string
  fin?: string
  configuracion?: unknown
  resultado?: unknown
}
export interface ResultadoRespaldo {
  ok: boolean
  cancelado?: boolean
  ruta?: string
  error?: string
  /** Cantidad de intentos exportados o importados. */
  intentos?: number
}

export interface ApiAmib {
  info(): Promise<InfoApp>
  contenido: {
    resumen(): Promise<ResumenContenido>
    leccion(id: string): Promise<Leccion>
    preguntas(ids: string[]): Promise<Pregunta[]>
  }
  estudio: {
    seleccionar(e: EntradaSeleccionar): Promise<Seleccion>
    simulacro(e: EntradaSimulacro): Promise<Simulacro>
  }
  intentos: {
    registrar(intentos: IntentoEntrada[]): Promise<ResultadoRegistro>
  }
  perfil: {
    obtener(): Promise<PerfilApp>
  }
  plan: {
    hoy(): Promise<PlanDia | null>
  }
  ajustes: {
    obtener(): Promise<Ajustes>
    guardar(a: AjusteGuardar): Promise<Ajustes>
  }
  notas: {
    obtener(e: EntradaNotaObtener): Promise<string>
    guardar(e: EntradaNotaGuardar): Promise<{ ok: true }>
  }
  sesiones: {
    registrar(e: EntradaSesion): Promise<{ ok: true }>
  }
  respaldo: {
    exportar(): Promise<ResultadoRespaldo>
    importar(): Promise<ResultadoRespaldo>
  }
}

declare global {
  interface Window {
    amib: ApiAmib
  }
}
