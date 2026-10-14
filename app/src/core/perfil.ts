/** Perfil agregado del estudiante para el Inicio: lo que el sistema recuerda (plan maestro, "Memoria del estudiante"). */
import type { Taxonomia } from './contenido'
import { AREAS, META_ACIERTOS_OBLIGATORIA, type AreaId } from './examen'
import { agruparPor, RITMO_S, semanaISO, type Intento } from './intentos'
import { dominioEstimado, estadoSubtema, erroresFrecuentes, NIVELES, type ErrorFrecuente, type EstadoSubtema, type Nivel } from './dominio'
import { cajasDesdeIntentos, vencidas } from './leitner'

export interface SubtemaTaxonomia {
  id: string
  nombre: string
  /** Cantidad de objetivos del temario en el subtema. */
  objetivos: number
}
export interface AreaTaxonomia {
  area: AreaId
  obligatoria: boolean
  subtemas: SubtemaTaxonomia[]
}
/** Resumen ligero de la taxonomía: solo lo que el perfil necesita. */
export interface ResumenTaxonomia {
  areas: AreaTaxonomia[]
}

export function resumenDeTaxonomia(t: Taxonomia): ResumenTaxonomia {
  return {
    areas: t.areas.map((a) => ({
      area: a.area,
      obligatoria: AREAS.find((x) => x.id === a.area)!.obligatoria,
      subtemas: a.temas.flatMap((tema) => tema.subtemas.map((s) => ({ id: s.id, nombre: s.nombre, objetivos: s.objetivos.length })))
    }))
  }
}

export const MIN_INTENTOS_DEBIL = 5
export const DOMINIO_DEBIL = 0.6

export interface PerfilArea {
  area: AreaId
  obligatoria: boolean
  dominio: number
  banda: [number, number]
  nivelPredominante: Nivel
  /** Tiempo promedio por pregunta en segundos, o null sin intentos. */
  tiempoPromedioS: number | null
  ritmoS: number
  intentos: number
}

export interface SubtemaPerfil extends EstadoSubtema {
  area: AreaId
  nombre: string
  objetivosVistos: number
  objetivosTotal: number
}

export type Pendiente =
  | { tipo: 'area-bajo-meta'; area: AreaId; dominio: number; meta: number }
  | { tipo: 'objetivos-sin-ver'; area: AreaId; subtemaId: string; nombre: string; faltan: number }

export interface SemanaEvolucion {
  semana: string
  intentos: number
  aciertos: number
  precision: number
}

export interface Perfil {
  areas: PerfilArea[]
  subtemas: Record<string, SubtemaPerfil>
  cobertura: { vistos: number; total: number; porcentaje: number }
  patronesError: ErrorFrecuente[]
  dominados: string[]
  debiles: string[]
  pendientes: Pendiente[]
  evolucionSemanal: SemanaEvolucion[]
  /** Ids de preguntas con revisión Leitner vencida. */
  preguntasVencidas: string[]
  vencidas: number
  intentosTotales: number
}

function nivelPredominante(niveles: Nivel[]): Nivel {
  if (niveles.length === 0) return 'sin-ver'
  const cuenta = new Map<Nivel, number>()
  for (const n of niveles) cuenta.set(n, (cuenta.get(n) ?? 0) + 1)
  // En empate gana el nivel más bajo: es la lectura conservadora.
  return [...NIVELES].filter((n) => cuenta.has(n)).sort((a, b) => cuenta.get(b)! - cuenta.get(a)!)[0]!
}

export function calcularPerfil(entrada: { intentos: readonly Intento[]; taxonomia: ResumenTaxonomia; ahora: Date }): Perfil {
  const { intentos, taxonomia, ahora } = entrada
  const porSubtema = agruparPor(
    intentos.filter((i) => i.subtemaId),
    (i) => i.subtemaId!
  )
  const porArea = agruparPor(intentos, (i) => i.area)

  const subtemas: Record<string, SubtemaPerfil> = {}
  const areas: PerfilArea[] = []
  const pendientes: Pendiente[] = []
  let vistosTotal = 0
  let objetivosTotal = 0

  for (const a of taxonomia.areas) {
    const niveles: Nivel[] = []
    const intentosArea = porArea.get(a.area) ?? []
    for (const s of a.subtemas) {
      const lista = porSubtema.get(s.id) ?? []
      const estado = estadoSubtema(lista, ahora)
      const vistos = Math.min(new Set(lista.filter((i) => i.objetivoId).map((i) => i.objetivoId)).size, s.objetivos)
      subtemas[s.id] = { ...estado, area: a.area, nombre: s.nombre, objetivosVistos: vistos, objetivosTotal: s.objetivos }
      niveles.push(estado.nivel)
      vistosTotal += vistos
      objetivosTotal += s.objetivos
      if (a.obligatoria && vistos < s.objetivos) pendientes.push({ tipo: 'objetivos-sin-ver', area: a.area, subtemaId: s.id, nombre: s.nombre, faltan: s.objetivos - vistos })
    }
    const d = dominioEstimado(intentosArea, ahora)
    areas.push({
      area: a.area,
      obligatoria: a.obligatoria,
      dominio: d.media,
      banda: d.banda,
      nivelPredominante: nivelPredominante(niveles),
      tiempoPromedioS: intentosArea.length ? intentosArea.reduce((x, i) => x + i.tiempoMs, 0) / intentosArea.length / 1000 : null,
      ritmoS: RITMO_S,
      intentos: intentosArea.length
    })
  }

  const bajoMeta: Pendiente[] = areas
    .filter((a) => a.obligatoria && a.dominio < META_ACIERTOS_OBLIGATORIA)
    .sort((x, y) => x.dominio - y.dominio)
    .map((a) => ({ tipo: 'area-bajo-meta', area: a.area, dominio: a.dominio, meta: META_ACIERTOS_OBLIGATORIA }))
  const sinVer = pendientes.sort((x, y) => (y as { faltan: number }).faltan - (x as { faltan: number }).faltan || (x as { subtemaId: string }).subtemaId.localeCompare((y as { subtemaId: string }).subtemaId))

  const ids = Object.keys(subtemas)
  const semanas = [...agruparPor(intentos, (i) => semanaISO(i.fecha))].sort(([x], [y]) => x.localeCompare(y))
  const cajas = vencidas([...cajasDesdeIntentos(intentos).values()], ahora).map((c) => c.id)

  return {
    areas,
    subtemas,
    cobertura: { vistos: vistosTotal, total: objetivosTotal, porcentaje: objetivosTotal ? vistosTotal / objetivosTotal : 0 },
    patronesError: erroresFrecuentes(intentos, 5),
    dominados: ids.filter((id) => subtemas[id]!.nivel === 'dominado'),
    debiles: ids
      .filter((id) => subtemas[id]!.intentos >= MIN_INTENTOS_DEBIL && subtemas[id]!.dominio < DOMINIO_DEBIL)
      .sort((x, y) => subtemas[x]!.dominio - subtemas[y]!.dominio || x.localeCompare(y)),
    pendientes: [...bajoMeta, ...sinVer],
    evolucionSemanal: semanas.map(([semana, lista]) => {
      const aciertos = lista.filter((i) => i.correcta).length
      return { semana, intentos: lista.length, aciertos, precision: aciertos / lista.length }
    }),
    preguntasVencidas: cajas,
    vencidas: cajas.length,
    intentosTotales: intentos.length
  }
}
