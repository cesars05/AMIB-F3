/**
 * Estructura oficial del Examen Integral Asesor en Estrategias de Inversión (Serie 210, Figura 3)
 * y reglas de aprobación. Fuente: "AMIB Data/Examen Integral Asesor en Estrategias de Inversión.docx".
 */

export type AreaId =
  | 'etica'
  | 'servicios'
  | 'normativo'
  | 'matematicas'
  | 'capitales'
  | 'deuda'
  | 'fondos'
  | 'derivados'
  | 'analisis'

export interface AreaExamen {
  id: AreaId
  nombre: string
  preguntas: number
  obligatoria: boolean
}

export const AREAS: readonly AreaExamen[] = [
  { id: 'etica', nombre: 'Ética', preguntas: 20, obligatoria: true },
  { id: 'servicios', nombre: 'Servicios de Inversión', preguntas: 20, obligatoria: false },
  { id: 'normativo', nombre: 'Marco Normativo I, II y III', preguntas: 25, obligatoria: false },
  { id: 'matematicas', nombre: 'Matemáticas Financieras y Portafolios de Inversión', preguntas: 25, obligatoria: false },
  { id: 'capitales', nombre: 'Mercado de Capitales I y II', preguntas: 25, obligatoria: true },
  { id: 'deuda', nombre: 'Títulos de Deuda I y II', preguntas: 25, obligatoria: true },
  { id: 'fondos', nombre: 'Fondos de Inversión', preguntas: 20, obligatoria: false },
  { id: 'derivados', nombre: 'Derivados Financieros I y II y Riesgos I y II', preguntas: 25, obligatoria: true },
  { id: 'analisis', nombre: 'Análisis Económico, Financiero y Técnico', preguntas: 25, obligatoria: false }
] as const

export const TOTAL_PREGUNTAS = 210
export const DURACION_MINUTOS = 4 * 60 + 18
export const PUNTAJE_MIN = 200
export const PUNTAJE_MAX = 1100
export const PUNTAJE_APROBATORIO = 600

/** Meta conservadora de aciertos por área obligatoria (ver plan, sección 4). */
export const META_ACIERTOS_OBLIGATORIA = 0.75

export interface ConfigEscala {
  /**
   * Fracción de aciertos que se supone equivale a 600 puntos. AMIB no publica la conversión oficial;
   * este valor es un supuesto configurable y todo puntaje derivado se muestra como "estimado".
   */
  aciertosEn600: number
}

export const ESCALA_POR_OMISION: ConfigEscala = { aciertosEn600: 0.6 }

/** Convierte una fracción de aciertos [0,1] a la escala 200–1100 con una función lineal por tramos. */
export function aPuntajeEstimado(fraccion: number, config: ConfigEscala = ESCALA_POR_OMISION): number {
  if (!Number.isFinite(fraccion)) throw new RangeError('fracción inválida')
  const f = Math.min(1, Math.max(0, fraccion))
  const p = config.aciertosEn600
  if (p <= 0 || p >= 1) throw new RangeError('aciertosEn600 debe estar entre 0 y 1')
  const puntos =
    f <= p
      ? PUNTAJE_MIN + (f / p) * (PUNTAJE_APROBATORIO - PUNTAJE_MIN)
      : PUNTAJE_APROBATORIO + ((f - p) / (1 - p)) * (PUNTAJE_MAX - PUNTAJE_APROBATORIO)
  return Math.round(puntos)
}

export interface ResultadoArea {
  area: AreaId
  correctas: number
  total: number
}

export interface Dictamen {
  aprobado: boolean
  promedio: number
  porArea: Record<AreaId, { puntaje: number; aprobada: boolean; obligatoria: boolean }>
  /** Áreas obligatorias por debajo de 600 (candidatas a extraordinario modular). */
  obligatoriasReprobadas: AreaId[]
}

/**
 * Aplica las dos reglas del examen: promedio general ≥600 y ≥600 en cada área obligatoria.
 * El promedio se pondera por número de preguntas de cada área.
 */
export function dictaminar(resultados: ResultadoArea[], config: ConfigEscala = ESCALA_POR_OMISION): Dictamen {
  const porArea = {} as Dictamen['porArea']
  let sumaPonderada = 0
  let sumaPesos = 0
  for (const area of AREAS) {
    const r = resultados.find((x) => x.area === area.id)
    if (!r) throw new Error(`Falta el resultado del área ${area.id}`)
    if (r.total <= 0 || r.correctas < 0 || r.correctas > r.total) throw new RangeError(`Resultado inválido en ${area.id}`)
    const puntaje = aPuntajeEstimado(r.correctas / r.total, config)
    porArea[area.id] = { puntaje, aprobada: puntaje >= PUNTAJE_APROBATORIO, obligatoria: area.obligatoria }
    sumaPonderada += puntaje * area.preguntas
    sumaPesos += area.preguntas
  }
  const promedio = Math.round(sumaPonderada / sumaPesos)
  const obligatoriasReprobadas = AREAS.filter((a) => a.obligatoria && !porArea[a.id].aprobada).map((a) => a.id)
  return {
    aprobado: promedio >= PUNTAJE_APROBATORIO && obligatoriasReprobadas.length === 0,
    promedio,
    porArea,
    obligatoriasReprobadas
  }
}
