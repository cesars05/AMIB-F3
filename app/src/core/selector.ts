/**
 * Selector de preguntas: mezcla de débiles, vencidas (Leitner) y no vistas, con más peso en las áreas
 * obligatorias y dificultad adaptada al nivel de dominio del subtema.
 */
import { AREAS, type AreaId } from './examen'
import type { Pregunta } from './contenido'
import { asignarPosiciones, barajarOpciones, type Azar } from './barajar'
import { DIA_MS, agruparPor, marca, type Intento, type TipoPregunta } from './intentos'
import { dominioEstimado, nivelDe, type Nivel } from './dominio'
import { cajasDesdeIntentos, estaVencida } from './leitner'
import { mezclarCon, muestrearPonderado } from './muestreo'

export interface FiltroSeleccion {
  areas?: AreaId[]
  subtemas?: string[]
  tipo?: TipoPregunta
  dificultadMin?: number
  dificultadMax?: number
  /** Por omisión true: solo preguntas validadas. En cualquier caso se excluyen retiradas y sin clave. */
  soloValidadas?: boolean
}

export interface MezclaSeleccion {
  debiles: number
  vencidas: number
  noVistas: number
}
export const MEZCLA_POR_OMISION: MezclaSeleccion = { debiles: 0.5, vencidas: 0.25, noVistas: 0.25 }
export const DIAS_RECIENTE = 3
export const DOMINIO_SUBTEMA_DEBIL = 0.7

export const RANGO_POR_NIVEL: Record<Nivel, [number, number]> = {
  'sin-ver': [1, 3],
  visto: [1, 3],
  familiar: [2, 4],
  competente: [3, 5],
  dominado: [4, 5]
}

export interface EntradaSelector {
  banco: readonly Pregunta[]
  intentos: readonly Intento[]
  n: number
  ahora: Date
  azar: Azar
  filtro?: FiltroSeleccion
  mezcla?: MezclaSeleccion
  pesoObligatorias?: number
  /** Ids que no deben aparecer (p. ej. ya usadas en la sesión en curso). */
  excluirIds?: readonly string[]
}

export interface PreguntaPresentada {
  id: string
  area: AreaId
  /** permutacion[i] = índice original de la opción que se muestra en la posición i. */
  permutacion: number[]
  /** Posición de la clave en el orden mostrado. */
  clave: number
  fija: boolean
  posicionObjetivo: number
}

export type Categoria = 'debiles' | 'vencidas' | 'noVistas' | 'otras'

export interface Seleccion {
  ids: string[]
  presentacion: PreguntaPresentada[]
  /** Cuántas preguntas faltaron para completar n (el banco filtrado no alcanzó). */
  faltan: number
  composicion: Record<Categoria, number>
}

const obligatoria = new Map(AREAS.map((a) => [a.id, a.obligatoria]))

export function elegible(p: Pregunta, filtro: FiltroSeleccion = {}): boolean {
  if (p.estado === 'retirada' || p.clave === null) return false
  if ((filtro.soloValidadas ?? true) && p.estado !== 'validada') return false
  if (filtro.areas && !filtro.areas.includes(p.area)) return false
  if (filtro.subtemas && !(p.subtemaId && filtro.subtemas.includes(p.subtemaId))) return false
  if (filtro.tipo && p.tipo !== filtro.tipo) return false
  if (p.dificultad !== undefined) {
    if (filtro.dificultadMin !== undefined && p.dificultad < filtro.dificultadMin) return false
    if (filtro.dificultadMax !== undefined && p.dificultad > filtro.dificultadMax) return false
  }
  return true
}

/** Reparto de n entre las tres categorías por el método del mayor resto. */
export function repartirCuotas(n: number, mezcla: MezclaSeleccion): Record<'debiles' | 'vencidas' | 'noVistas', number> {
  const claves = ['debiles', 'vencidas', 'noVistas'] as const
  const sinPesos = claves.every((k) => mezcla[k] <= 0)
  const peso = (k: (typeof claves)[number]) => (sinPesos ? 1 : Math.max(0, mezcla[k]))
  const suma = claves.reduce((a, k) => a + peso(k), 0)
  const crudo = claves.map((k) => (n * peso(k)) / suma)
  const base = crudo.map(Math.floor)
  let resto = n - base.reduce((a, b) => a + b, 0)
  const orden = crudo.map((c, i) => ({ i, r: c - Math.floor(c) })).sort((x, y) => y.r - x.r || x.i - y.i)
  for (const { i } of orden) {
    if (resto <= 0) break
    base[i]!++
    resto--
  }
  return { debiles: base[0]!, vencidas: base[1]!, noVistas: base[2]! }
}

/** Baraja las opciones de las preguntas dadas, equilibrando la posición de la clave. */
export function presentarPreguntas(preguntas: readonly Pregunta[], azar: Azar): PreguntaPresentada[] {
  const posiciones = asignarPosiciones(preguntas.length, azar)
  return preguntas.map((p, k) => {
    const b = barajarOpciones(
      p.opciones.map((o) => o.texto),
      p.clave!,
      azar,
      posiciones[k]
    )
    return { id: p.id, area: p.area, permutacion: b.permutacion, clave: b.clave, fija: b.fija, posicionObjetivo: posiciones[k]! }
  })
}

export function seleccionarPreguntas(e: EntradaSelector): Seleccion {
  const { banco, intentos, n, ahora, azar } = e
  const mezcla = e.mezcla ?? MEZCLA_POR_OMISION
  const peso = e.pesoObligatorias ?? 1.5
  const excluir = new Set(e.excluirIds ?? [])
  const pool = banco.filter((p) => elegible(p, e.filtro) && !excluir.has(p.id))

  const claveGrupo = (x: { subtemaId?: string; area: AreaId }) => x.subtemaId ?? `~${x.area}`
  const gruposIntentos = agruparPor(intentos, claveGrupo)
  const cajas = cajasDesdeIntentos(intentos)
  const porPregunta = agruparPor(intentos, (i) => i.preguntaId)
  const limiteReciente = ahora.getTime() - DIAS_RECIENTE * DIA_MS

  const infoGrupo = new Map<string, { debil: boolean; rango: [number, number] }>()
  const info = (p: Pregunta) => {
    const k = claveGrupo(p)
    let g = infoGrupo.get(k)
    if (!g) {
      const lista = gruposIntentos.get(k) ?? []
      g = { debil: lista.length > 0 && dominioEstimado(lista, ahora).media < DOMINIO_SUBTEMA_DEBIL, rango: RANGO_POR_NIVEL[nivelDe(lista, ahora)] }
      infoGrupo.set(k, g)
    }
    return g
  }

  const categoria = (p: Pregunta): Categoria => {
    const hist = porPregunta.get(p.id)
    const caja = cajas.get(p.id)
    if (caja && estaVencida(caja, ahora)) return 'vencidas'
    const ultimaMala = hist ? ![...hist].sort((a, b) => marca(a.fecha) - marca(b.fecha)).at(-1)!.correcta : false
    if (ultimaMala || info(p).debil) return 'debiles'
    if (!hist) return 'noVistas'
    return 'otras'
  }
  const esReciente = (p: Pregunta) => (porPregunta.get(p.id) ?? []).some((i) => marca(i.fecha) >= limiteReciente)
  const enRango = (p: Pregunta) => p.dificultad === undefined || (p.dificultad >= info(p).rango[0] && p.dificultad <= info(p).rango[1])
  const w = (p: Pregunta) => (obligatoria.get(p.area) ? peso : 1)

  const cat = new Map<string, Categoria>()
  const elegidas: Pregunta[] = []
  const usadas = new Set<string>()

  const completar = (cands: Pregunta[], k: number) => {
    const libres = cands.filter((p) => !usadas.has(p.id))
    const grupos: Record<Categoria, Pregunta[]> = { debiles: [], vencidas: [], noVistas: [], otras: [] }
    for (const p of libres) {
      const c = categoria(p)
      cat.set(p.id, c)
      grupos[c].push(p)
    }
    const tomar = (lista: Pregunta[], cuanto: number) => {
      const t = muestrearPonderado(
        lista.filter((p) => !usadas.has(p.id)),
        w,
        cuanto,
        azar
      )
      for (const p of t) {
        usadas.add(p.id)
        elegidas.push(p)
      }
    }
    const cuotas = repartirCuotas(k, mezcla)
    tomar(grupos.debiles, cuotas.debiles)
    tomar(grupos.vencidas, cuotas.vencidas)
    tomar(grupos.noVistas, cuotas.noVistas)
  }

  const tiers: Pregunta[][] = [
    pool.filter((p) => !esReciente(p) && enRango(p)),
    pool.filter((p) => !esReciente(p) && !enRango(p)),
    pool.filter((p) => esReciente(p) && enRango(p)),
    pool.filter((p) => esReciente(p) && !enRango(p))
  ]
  for (const t of tiers) {
    const falta = n - elegidas.length
    if (falta <= 0) break
    completar(t, falta)
    // Relleno dentro del mismo escalón cuando alguna categoría no alcanzó su cuota.
    let restante = n - elegidas.length
    for (const c of ['debiles', 'vencidas', 'noVistas', 'otras'] as const) {
      if (restante <= 0) break
      const lista = t.filter((p) => !usadas.has(p.id) && cat.get(p.id) === c)
      for (const p of muestrearPonderado(lista, w, restante, azar)) {
        usadas.add(p.id)
        elegidas.push(p)
      }
      restante = n - elegidas.length
    }
  }

  const orden = mezclarCon(elegidas, azar)
  const composicion: Record<Categoria, number> = { debiles: 0, vencidas: 0, noVistas: 0, otras: 0 }
  for (const p of orden) composicion[cat.get(p.id)!]++
  return { ids: orden.map((p) => p.id), presentacion: presentarPreguntas(orden, azar), faltan: n - orden.length, composicion }
}
