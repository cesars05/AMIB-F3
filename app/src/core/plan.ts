/** Onboarding y plan diario: qué estudiar hoy dentro del presupuesto de minutos. */
import { AREAS, type AreaId } from './examen'
import { DIA_MS } from './intentos'
import { indiceNivel } from './dominio'
import type { Perfil } from './perfil'
import { minutosSimulacro, type TipoSimulacro } from './simulacro'

export type ModoPlan = 'intensivo' | 'ligero' | 'personalizado'
export type Autoevaluacion = 'domino' | 'mas-o-menos' | 'nunca'

export interface ConfigPlan {
  /** Fecha del examen, `AAAA-MM-DD`. */
  fechaExamen: string
  modo: ModoPlan
  minutosDia: number
  /** Cantidad de días de estudio por semana (1 a 7). */
  diasSemana: number
  /** Días concretos (0 domingo a 6 sábado). Si falta, se derivan de `diasSemana`. */
  diasActivos?: number[]
  autoevaluacion: Partial<Record<AreaId, Autoevaluacion>>
  /** Desfase de la zona horaria en minutos respecto a UTC. Por omisión -360 (centro de México, sin horario de verano). */
  zonaMin?: number
}

export const ZONA_MX_MIN = -360
export const DEFAULTS_MODO = {
  intensivo: { minutosDia: 150, diasSemana: 6 },
  ligero: { minutosDia: 50, diasSemana: 5 }
} as const

export function crearConfig(parcial: Partial<ConfigPlan> & { fechaExamen: string }): ConfigPlan {
  const modo = parcial.modo ?? 'intensivo'
  const base = modo === 'personalizado' ? DEFAULTS_MODO.ligero : DEFAULTS_MODO[modo]
  return {
    modo,
    minutosDia: parcial.minutosDia ?? base.minutosDia,
    diasSemana: parcial.diasSemana ?? base.diasSemana,
    autoevaluacion: {},
    ...parcial
  }
}

const PATRONES_DIAS: Record<number, number[]> = {
  1: [1],
  2: [2, 5],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0]
}
/** Orden de la semana de lunes a domingo, para ubicar "el último día de estudio de la semana". */
const SEMANA = [1, 2, 3, 4, 5, 6, 0]

export function diasDeEstudio(config: Pick<ConfigPlan, 'diasSemana' | 'diasActivos'>): number[] {
  if (config.diasActivos && config.diasActivos.length) return [...config.diasActivos].sort((a, b) => SEMANA.indexOf(a) - SEMANA.indexOf(b))
  return PATRONES_DIAS[Math.min(7, Math.max(1, Math.round(config.diasSemana)))]!
}

export interface LeccionDisponible {
  id: string
  area: AreaId
  orden: number
  duracionMin: number
  subtemaId?: string
}

export type TipoActividad = 'leccion' | 'repaso-rapido' | 'practica' | 'simulacro'
export interface Actividad {
  tipo: TipoActividad
  titulo: string
  minutos: number
  area?: AreaId
  leccionId?: string
  preguntas?: number
  simulacro?: TipoSimulacro
  /** Si el simulacro previsto no cabía en el presupuesto, el tipo al que sustituye. */
  sustituyeA?: TipoSimulacro
}

export interface PlanDia {
  diasParaExamen: number
  presupuestoMin: number
  /** false si hoy es día de descanso, el examen ya pasó o es el día del examen. */
  esDiaDeEstudio: boolean
  actividades: Actividad[]
  totalMin: number
  nota?: string
}

const PRIOR_AUTOEVALUACION: Record<Autoevaluacion, number> = { domino: 0.7, 'mas-o-menos': 0.5, nunca: 0.3 }
export const MIN_INTENTOS_AREA = 5
export const SEGUNDOS_PRACTICA = 90

export function ordenArea(a: AreaId): number {
  return AREAS.findIndex((x) => x.id === a)
}

function localAjustada(ahora: Date, zonaMin: number): Date {
  return new Date(ahora.getTime() + zonaMin * 60000)
}

export function diasParaExamen(fechaExamen: string, ahora: Date, zonaMin = ZONA_MX_MIN): number {
  const hoy = localAjustada(ahora, zonaMin)
  const inicioHoy = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate())
  const examen = Date.parse(`${fechaExamen}T00:00:00Z`)
  if (Number.isNaN(examen)) throw new RangeError(`fecha de examen inválida: ${fechaExamen}`)
  return Math.round((examen - inicioHoy) / DIA_MS)
}

/** Dominio usado para priorizar un área: el observado si hay evidencia, si no el supuesto de la autoevaluación. */
export function dominioParaPlan(perfil: Perfil, area: AreaId, auto: ConfigPlan['autoevaluacion']): number {
  const p = perfil.areas.find((a) => a.area === area)
  if (p && p.intentos >= MIN_INTENTOS_AREA) return p.dominio
  return PRIOR_AUTOEVALUACION[auto[area] ?? 'mas-o-menos']
}

function areasObligatoriasPorDebilidad(perfil: Perfil, auto: ConfigPlan['autoevaluacion']): AreaId[] {
  return AREAS.filter((a) => a.obligatoria)
    .map((a) => ({ id: a.id, d: dominioParaPlan(perfil, a.id, auto) }))
    .sort((x, y) => x.d - y.d || ordenArea(x.id) - ordenArea(y.id))
    .map((x) => x.id)
}

function leccionFamiliar(l: LeccionDisponible, perfil: Perfil, vistas: ReadonlySet<string>): boolean {
  if (vistas.has(l.id)) return true
  const s = l.subtemaId ? perfil.subtemas[l.subtemaId] : undefined
  return !!s && indiceNivel(s.nivel) >= indiceNivel('familiar')
}

export interface EntradaPlanDia {
  config: ConfigPlan
  perfil: Perfil
  lecciones: readonly LeccionDisponible[]
  ahora: Date
  /** Ids de lecciones ya completadas (suman a lo que el perfil sabe por nivel de subtema). */
  leccionesVistas?: readonly string[]
  /** Elementos vencidos de Leitner (preguntas y tarjetas). Por omisión, los del perfil. */
  vencidas?: number
}

function vacio(dias: number, presupuesto: number, nota: string): PlanDia {
  return { diasParaExamen: dias, presupuestoMin: presupuesto, esDiaDeEstudio: false, actividades: [], totalMin: 0, nota }
}

/** Elige el simulacro del día, o undefined. Sustituye por uno más corto si el previsto no cabe en el presupuesto. */
function simulacroDelDia(
  config: ConfigPlan,
  dias: number,
  diaSemana: number,
  perfil: Perfil
): { tipo: TipoSimulacro; area?: AreaId; sustituyeA?: TipoSimulacro } | undefined {
  const presupuesto = config.minutosDia
  const escalera = (previsto: TipoSimulacro, area?: AreaId) => {
    const orden: TipoSimulacro[] = previsto === 'integral' ? ['integral', 'modular-extraordinario', 'rapido'] : previsto === 'modulo' ? ['modulo', 'rapido'] : [previsto]
    const t = orden.find((x) => minutosSimulacro(x, x === 'modulo' ? area : undefined) <= presupuesto)
    if (!t) return undefined
    return { tipo: t, area: t === 'modulo' ? area : undefined, sustituyeA: t === previsto ? undefined : previsto }
  }
  if (dias >= 2 && dias <= 10 && (10 - dias) % 3 === 0) return escalera('integral')
  const dias_ = diasDeEstudio(config)
  if (dias > 10 && diaSemana === dias_[dias_.length - 1]) {
    const area = areasObligatoriasPorDebilidad(perfil, config.autoevaluacion)[0]!
    return escalera('modulo', area)
  }
  return undefined
}

export function planDeHoy(e: EntradaPlanDia): PlanDia {
  const { config, perfil, lecciones, ahora } = e
  const zona = config.zonaMin ?? ZONA_MX_MIN
  const dias = diasParaExamen(config.fechaExamen, ahora, zona)
  const presupuesto = config.minutosDia
  if (dias < 0) return vacio(dias, presupuesto, 'La fecha del examen ya pasó.')
  if (dias === 0) return vacio(dias, presupuesto, 'Hoy es el examen: descansa y repasa solo lo esencial.')
  const diaSemana = localAjustada(ahora, zona).getUTCDay()
  if (!diasDeEstudio(config).includes(diaSemana) && dias > 1) return vacio(dias, presupuesto, 'Día de descanso según tu plan.')

  const vencidas = e.vencidas ?? perfil.vencidas
  const vistas = new Set(e.leccionesVistas ?? [])
  const actividades: Actividad[] = []
  let restante = presupuesto
  const agregar = (a: Actividad) => {
    actividades.push(a)
    restante -= a.minutos
  }
  const repasoMin = (tope: number) => Math.min(restante, tope, Math.max(5, Math.ceil(vencidas * 1.5)))

  // Víspera: solo un repaso ligero.
  if (dias === 1) {
    agregar({ tipo: 'repaso-rapido', titulo: 'Repaso rápido de la víspera', minutos: Math.min(presupuesto, 20) })
    return { diasParaExamen: dias, presupuestoMin: presupuesto, esDiaDeEstudio: true, actividades, totalMin: presupuesto - restante, nota: 'Víspera del examen: repaso ligero y descanso.' }
  }

  const sim = simulacroDelDia(config, dias, diaSemana, perfil)
  let simActividad: Actividad | undefined
  if (sim) {
    const minutos = minutosSimulacro(sim.tipo, sim.area)
    simActividad = {
      tipo: 'simulacro',
      titulo: `Simulacro ${sim.tipo}${sim.area ? ` de ${AREAS.find((a) => a.id === sim.area)!.nombre}` : ''}`,
      minutos,
      area: sim.area,
      simulacro: sim.tipo,
      sustituyeA: sim.sustituyeA
    }
    restante -= minutos
  }

  const prioridad = areasObligatoriasPorDebilidad(perfil, config.autoevaluacion)
  const otras = AREAS.filter((a) => !a.obligatoria).map((a) => a.id)
  const ordenAreas = [...prioridad, ...otras]
  const pendientes = (area: AreaId) =>
    lecciones.filter((l) => l.area === area && !leccionFamiliar(l, perfil, vistas)).sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id))

  // 1. Lección guiada del área obligatoria más débil que aún no esté familiar.
  let areaFoco: AreaId = prioridad[0]!
  if (!simActividad) {
    const tope = Math.round(presupuesto * 0.6)
    let usado = 0
    for (const area of ordenAreas) {
      const lista = pendientes(area)
      if (!lista.length) continue
      areaFoco = area
      for (const l of lista) {
        const cabe = usado === 0 ? l.duracionMin <= restante : usado + l.duracionMin <= tope && l.duracionMin <= restante
        if (!cabe) break
        usado += l.duracionMin
        agregar({ tipo: 'leccion', titulo: `Lección guiada: ${l.id}`, minutos: l.duracionMin, area, leccionId: l.id })
      }
      if (usado > 0) break
    }
  }

  // 2. Repaso rápido de lo vencido.
  if (vencidas > 0 && restante >= 5) {
    const m = repasoMin(Math.max(10, Math.min(20, Math.round(presupuesto * 0.15))))
    agregar({ tipo: 'repaso-rapido', titulo: 'Repaso rápido de lo vencido', minutos: m })
  }

  // 3. Práctica dirigida con lo que reste (si el día no es de simulacro).
  if (!simActividad && restante >= 10) {
    const preguntas = Math.floor((restante * 60) / SEGUNDOS_PRACTICA)
    agregar({ tipo: 'practica', titulo: 'Práctica dirigida', minutos: restante, area: areaFoco, preguntas })
  }

  if (simActividad) actividades.push(simActividad)
  const totalMin = actividades.reduce((s, a) => s + a.minutos, 0)
  return { diasParaExamen: dias, presupuestoMin: presupuesto, esDiaDeEstudio: true, actividades, totalMin, nota: dias <= 10 ? 'Fase final: simulacros integrales cada tres días.' : undefined }
}

// ─── Repasos ─────────────────────────────────────────────────────────────────

export interface Tarjeta {
  id: string
  area: AreaId
  subtemaId?: string
  /** Importancia relativa 0 a 1 (peso en el examen); por omisión 0.5. */
  peso?: number
}

export interface RepasoRapido {
  tarjetas: Tarjeta[]
  minutos: number
  /** Preguntas de control al final (3 a 5). */
  preguntasControl: number
}

/** Prioriza por vencimiento, debilidad, área obligatoria y peso. 10 a 20 minutos, con 3 a 5 preguntas de control. */
export function repasoRapido(e: { perfil: Perfil; tarjetas: readonly Tarjeta[]; vencidas: readonly string[]; n: number }): RepasoRapido {
  const vencidas = new Set(e.vencidas)
  const obligatoria = new Map(AREAS.map((a) => [a.id, a.obligatoria]))
  const puntaje = (t: Tarjeta) => {
    const sub = t.subtemaId ? e.perfil.subtemas[t.subtemaId] : undefined
    const area = e.perfil.areas.find((a) => a.area === t.area)
    const dominio = sub && sub.intentos > 0 ? sub.dominio : area && area.intentos > 0 ? area.dominio : 0.5
    return (vencidas.has(t.id) ? 3 : 0) + (1 - dominio) * 2 + (obligatoria.get(t.area) ? 1 : 0) + (t.peso ?? 0.5)
  }
  const tarjetas = [...e.tarjetas]
    .map((t) => ({ t, p: puntaje(t) }))
    .sort((a, b) => b.p - a.p || a.t.id.localeCompare(b.t.id))
    .slice(0, Math.max(0, e.n))
    .map((x) => x.t)
  return { tarjetas, minutos: Math.min(20, Math.max(10, Math.ceil(tarjetas.length * 0.75))), preguntasControl: tarjetas.length >= 15 ? 5 : tarjetas.length >= 8 ? 4 : 3 }
}

/** Todas las lecciones en el orden del manual (ética, servicios, normativo, matemáticas, capitales, deuda, fondos, derivados, análisis) y luego `orden`. */
export function repasoCompleto<T extends { area: AreaId; orden: number; id?: string }>(lecciones: readonly T[], opciones: { obligatoriasPrimero?: boolean } = {}): T[] {
  const obl = new Map(AREAS.map((a) => [a.id, a.obligatoria]))
  return [...lecciones].sort((a, b) => {
    if (opciones.obligatoriasPrimero) {
      const d = Number(!!obl.get(b.area)) - Number(!!obl.get(a.area))
      if (d) return d
    }
    return ordenArea(a.area) - ordenArea(b.area) || a.orden - b.orden || (a.id ?? '').localeCompare(b.id ?? '')
  })
}
