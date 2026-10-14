/** Armado y calificación de simulacros (integral, por módulo, modular extraordinario y rápido). */
import type { Pregunta } from './contenido'
import { AREAS, DURACION_MINUTOS, TOTAL_PREGUNTAS, aPuntajeEstimado, dictaminar, ESCALA_POR_OMISION, PUNTAJE_APROBATORIO, type AreaId, type ConfigEscala, type Dictamen, type ResultadoArea } from './examen'
import type { Azar } from './barajar'
import { DIA_MS, agruparPor, marca, type Intento } from './intentos'
import { binomial, muestrearPonderado } from './muestreo'
import { presentarPreguntas, type PreguntaPresentada } from './selector'

export type TipoSimulacro = 'integral' | 'modulo' | 'modular-extraordinario' | 'rapido'

export const PREGUNTAS_RAPIDO = 40
export const MINUTOS_RAPIDO = 49

export interface EntradaSimulacro {
  tipo: TipoSimulacro
  area?: AreaId
  banco: readonly Pregunta[]
  intentos: readonly Intento[]
  ahora: Date
  azar: Azar
}

export interface Simulacro {
  tipo: TipoSimulacro
  area?: AreaId
  preguntas: PreguntaPresentada[]
  /** Preguntas incluidas por área. */
  porArea: Partial<Record<AreaId, number>>
  /** Preguntas que faltaron por área por no haber suficientes validadas. */
  faltantes: Partial<Record<AreaId, number>>
  tiempoMin: number
}

const areaInfo = (id: AreaId) => AREAS.find((a) => a.id === id)!

/** Minutos proporcionales al número de preguntas: preguntas por 258/210, redondeado. */
export function minutosProporcionales(preguntas: number): number {
  return Math.round((preguntas * DURACION_MINUTOS) / TOTAL_PREGUNTAS)
}

/** Duración oficial o proporcional de cada tipo de simulacro (con sus preguntas completas). */
export function minutosSimulacro(tipo: TipoSimulacro, area?: AreaId): number {
  switch (tipo) {
    case 'integral':
      return DURACION_MINUTOS
    case 'rapido':
      return MINUTOS_RAPIDO
    case 'modulo':
      if (!area) throw new Error('El simulacro por módulo requiere un área')
      return minutosProporcionales(areaInfo(area).preguntas)
    case 'modular-extraordinario':
      return minutosProporcionales(AREAS.filter((a) => a.obligatoria).reduce((s, a) => s + a.preguntas, 0))
  }
}

/** Reparte `total` entre las áreas según sus pesos oficiales (método del mayor resto) con tope por disponibilidad. */
export function repartirPorPeso(total: number, disponibles: Record<AreaId, number>): Record<AreaId, number> {
  const cuota = {} as Record<AreaId, number>
  const crudo = AREAS.map((a) => ({ id: a.id, x: (total * a.preguntas) / TOTAL_PREGUNTAS }))
  let resto = total
  for (const c of crudo) {
    cuota[c.id] = Math.min(Math.floor(c.x), disponibles[c.id])
    resto -= cuota[c.id]
  }
  const orden = [...crudo].sort((a, b) => b.x - Math.floor(b.x) - (a.x - Math.floor(a.x)))
  for (let vuelta = 0; resto > 0 && vuelta < total; vuelta++) {
    let avanzo = false
    for (const c of orden) {
      if (resto <= 0) break
      if (cuota[c.id] < disponibles[c.id]) {
        cuota[c.id]++
        resto--
        avanzo = true
      }
    }
    if (!avanzo) break
  }
  return cuota
}

export function armarSimulacro(e: EntradaSimulacro): Simulacro {
  const { tipo, banco, intentos, ahora, azar } = e
  if (tipo === 'modulo' && !e.area) throw new Error('El simulacro por módulo requiere un área')
  const limite = ahora.getTime() - 3 * DIA_MS
  const ultima = new Map<string, number>()
  for (const i of intentos) ultima.set(i.preguntaId, Math.max(ultima.get(i.preguntaId) ?? 0, marca(i.fecha)))
  // Prioridad: nunca vistas, luego vistas hace más de 3 días, al final las recientes.
  const peso = (p: Pregunta) => {
    const u = ultima.get(p.id)
    return u === undefined ? 2 : u < limite ? 1 : 0.25
  }
  const validas = agruparPor(
    banco.filter((p) => p.estado === 'validada' && !p.extra && p.clave !== null),
    (p) => p.area
  )
  const disponibles = {} as Record<AreaId, number>
  for (const a of AREAS) disponibles[a.id] = validas.get(a.id)?.length ?? 0

  let areas: AreaId[]
  let objetivo = {} as Record<AreaId, number>
  let ideal = {} as Record<AreaId, number>
  switch (tipo) {
    case 'integral':
      areas = AREAS.map((a) => a.id)
      for (const a of AREAS) objetivo[a.id] = a.preguntas
      break
    case 'modulo':
      areas = [e.area!]
      objetivo[e.area!] = areaInfo(e.area!).preguntas
      break
    case 'modular-extraordinario':
      areas = AREAS.filter((a) => a.obligatoria).map((a) => a.id)
      for (const id of areas) objetivo[id] = areaInfo(id).preguntas
      break
    case 'rapido': {
      areas = AREAS.map((a) => a.id)
      const tope = {} as Record<AreaId, number>
      for (const a of AREAS) tope[a.id] = disponibles[a.id]
      objetivo = repartirPorPeso(PREGUNTAS_RAPIDO, tope)
      ideal = repartirPorPeso(PREGUNTAS_RAPIDO, Object.fromEntries(AREAS.map((a) => [a.id, TOTAL_PREGUNTAS])) as Record<AreaId, number>)
      break
    }
  }

  if (tipo !== 'rapido') ideal = objetivo
  const elegidas: Pregunta[] = []
  const porArea: Partial<Record<AreaId, number>> = {}
  const faltantes: Partial<Record<AreaId, number>> = {}
  for (const id of areas) {
    const tomadas = muestrearPonderado(validas.get(id) ?? [], peso, objetivo[id], azar)
    elegidas.push(...tomadas)
    porArea[id] = tomadas.length
    if (tomadas.length < ideal[id]) faltantes[id] = ideal[id] - tomadas.length
  }
  const tiempoMin = tipo === 'integral' || tipo === 'rapido' ? minutosSimulacro(tipo) : minutosProporcionales(Object.values(objetivo).reduce((a, b) => a + b, 0))
  return { tipo, area: e.area, preguntas: presentarPreguntas(elegidas, azar), porArea, faltantes, tiempoMin }
}

// ─── Calificación ────────────────────────────────────────────────────────────

export interface RespuestaSimulacro {
  preguntaId: string
  /** Posición elegida en el orden mostrado, o null si quedó sin responder. */
  posicion: number | null
  tiempoMs: number
}

export interface ResultadoPorArea {
  area: AreaId
  correctas: number
  total: number
  sinResponder: number
  tiempoMs: number
  tiempoPromedioS: number
  puntajeEstimado: number
  aprobada: boolean
}

export interface Calificacion {
  porArea: ResultadoPorArea[]
  correctas: number
  total: number
  tiempoMs: number
  /** true si el simulacro cubre las 9 áreas (solo entonces hay dictamen global). */
  completo: boolean
  dictamen?: Dictamen
  /** Promedio ponderado estimado en escala 200 a 1100 (solo si está completo). */
  puntajeEstimado?: number
  /** Probabilidad de aprobar por Monte Carlo (solo si está completo y se dio un azar). */
  probabilidadAprobar?: number
}

export function calificar(
  simulacro: Pick<Simulacro, 'preguntas'>,
  respuestas: readonly RespuestaSimulacro[],
  opciones: { azar?: Azar; n?: number; config?: ConfigEscala } = {}
): Calificacion {
  const config = opciones.config ?? ESCALA_POR_OMISION
  const resp = new Map(respuestas.map((r) => [r.preguntaId, r]))
  const acum = new Map<AreaId, { correctas: number; total: number; sin: number; ms: number }>()
  for (const p of simulacro.preguntas) {
    const a = acum.get(p.area) ?? { correctas: 0, total: 0, sin: 0, ms: 0 }
    const r = resp.get(p.id)
    a.total++
    if (!r || r.posicion === null) a.sin++
    else if (r.posicion === p.clave) a.correctas++
    a.ms += r?.tiempoMs ?? 0
    acum.set(p.area, a)
  }
  const porArea: ResultadoPorArea[] = AREAS.filter((a) => acum.has(a.id)).map((a) => {
    const x = acum.get(a.id)!
    const puntaje = aPuntajeEstimado(x.correctas / x.total, config)
    return {
      area: a.id,
      correctas: x.correctas,
      total: x.total,
      sinResponder: x.sin,
      tiempoMs: x.ms,
      tiempoPromedioS: x.ms / x.total / 1000,
      puntajeEstimado: puntaje,
      aprobada: puntaje >= PUNTAJE_APROBATORIO
    }
  })
  const completo = porArea.length === AREAS.length
  const out: Calificacion = {
    porArea,
    correctas: porArea.reduce((s, a) => s + a.correctas, 0),
    total: porArea.reduce((s, a) => s + a.total, 0),
    tiempoMs: porArea.reduce((s, a) => s + a.tiempoMs, 0),
    completo
  }
  if (completo) {
    const resultados: ResultadoArea[] = porArea.map((a) => ({ area: a.area, correctas: a.correctas, total: a.total }))
    out.dictamen = dictaminar(resultados, config)
    out.puntajeEstimado = out.dictamen.promedio
    if (opciones.azar) {
      const dominio = {} as Record<AreaId, number>
      for (const a of porArea) dominio[a.area] = a.correctas / a.total
      out.probabilidadAprobar = probabilidadAprobar(dominio, opciones.azar, opciones.n, config)
    }
  }
  return out
}

/**
 * Probabilidad de aprobar un examen de 210 preguntas por Monte Carlo: en cada ensayo se sortean los
 * aciertos de cada área con una binomial (preguntas oficiales, dominio del área) y se aplican las dos reglas
 * (promedio ponderado de 600 o más y 600 o más en cada área obligatoria). Un área sin dominio se toma como 0.5.
 */
export function probabilidadAprobar(dominioPorArea: Partial<Record<AreaId, number>>, azar: Azar, n = 2000, config: ConfigEscala = ESCALA_POR_OMISION): number {
  let aprobados = 0
  for (let t = 0; t < n; t++) {
    const resultados: ResultadoArea[] = AREAS.map((a) => ({
      area: a.id,
      total: a.preguntas,
      correctas: binomial(a.preguntas, Math.min(1, Math.max(0, dominioPorArea[a.id] ?? 0.5)), azar)
    }))
    if (dictaminar(resultados, config).aprobado) aprobados++
  }
  return aprobados / n
}
