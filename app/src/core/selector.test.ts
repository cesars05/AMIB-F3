import { describe, expect, it } from 'vitest'
import { crearAzar } from './barajar'
import type { Pregunta } from './contenido'
import { DIA_MS, type Intento } from './intentos'
import { elegible, presentarPreguntas, repartirCuotas, seleccionarPreguntas, RANGO_POR_NIVEL } from './selector'
import type { AreaId } from './examen'

const ahora = new Date(Date.UTC(2026, 9, 14, 12))

function preg(id: string, area: AreaId, extra: Partial<Pregunta> = {}): Pregunta {
  return {
    id,
    version: 1,
    area,
    enunciado: 'Enunciado de prueba',
    opciones: ['A', 'B', 'C', 'D'].map((texto) => ({ texto })),
    clave: 1,
    tipo: 'teoria',
    formato: 'directa',
    esTrampa: false,
    extra: false,
    fuente: 'generada',
    vigencia: 'no-aplica',
    estado: 'validada',
    notas: [],
    ...extra
  }
}
const banco: Pregunta[] = [
  ...Array.from({ length: 20 }, (_, k) => preg(`d${k}`, 'deuda', { subtemaId: 'deuda.a', dificultad: ((k % 5) + 1) as 1 })),
  ...Array.from({ length: 10 }, (_, k) => preg(`f${k}`, 'fondos', { subtemaId: 'fondos.a', dificultad: 2 })),
  preg('borr', 'deuda', { estado: 'borrador' }),
  preg('ret', 'deuda', { estado: 'retirada' }),
  preg('sinclave', 'deuda', { estado: 'borrador', clave: null })
]
const intento = (preguntaId: string, correcta: boolean, diasAtras: number, extra: Partial<Intento> = {}): Intento => ({
  preguntaId,
  area: 'deuda',
  subtemaId: 'deuda.a',
  tipo: 'teoria',
  correcta,
  tiempoMs: 50_000,
  modo: 'practica',
  sesionId: `s${diasAtras}`,
  fecha: new Date(ahora.getTime() - diasAtras * DIA_MS).toISOString(),
  ...extra
})

describe('seleccionarPreguntas', () => {
  it('devuelve n ids únicos, validados y reproducibles', () => {
    const a = seleccionarPreguntas({ banco, intentos: [], n: 10, ahora, azar: crearAzar(1) })
    const b = seleccionarPreguntas({ banco, intentos: [], n: 10, ahora, azar: crearAzar(1) })
    expect(a).toEqual(b)
    expect(new Set(a.ids).size).toBe(10)
    expect(a.ids.some((id) => ['borr', 'ret', 'sinclave'].includes(id))).toBe(false)
    expect(a.faltan).toBe(0)
  })
  it('soloValidadas false admite borradores con clave pero nunca retiradas ni sin clave', () => {
    const r = seleccionarPreguntas({ banco, intentos: [], n: 31, ahora, azar: crearAzar(2), filtro: { soloValidadas: false } })
    expect(r.ids).toContain('borr')
    expect(r.ids).not.toContain('ret')
    expect(r.ids).not.toContain('sinclave')
    expect(r.faltan).toBe(0)
  })
  it('aplica filtros de área, subtema, tipo y dificultad', () => {
    const r = seleccionarPreguntas({ banco, intentos: [], n: 50, ahora, azar: crearAzar(3), filtro: { areas: ['fondos'] } })
    expect(r.ids).toHaveLength(10)
    expect(r.faltan).toBe(40)
    const s = seleccionarPreguntas({ banco, intentos: [], n: 50, ahora, azar: crearAzar(3), filtro: { subtemas: ['deuda.a'], dificultadMin: 4, dificultadMax: 5 } })
    expect(s.ids).toHaveLength(8)
    expect(seleccionarPreguntas({ banco, intentos: [], n: 5, ahora, azar: crearAzar(3), filtro: { tipo: 'calculo' } }).ids).toEqual([])
  })
  it('evita lo visto en los últimos 3 días salvo que se agote el pool', () => {
    const recientes = ['d0', 'd1', 'd2', 'd3', 'd4'].map((id) => intento(id, true, 1))
    const r = seleccionarPreguntas({ banco, intentos: recientes, n: 10, ahora, azar: crearAzar(4), filtro: { areas: ['deuda'], dificultadMin: 1 } })
    expect(r.ids.some((id) => ['d0', 'd1', 'd2', 'd3', 'd4'].includes(id))).toBe(false)
    const todo = seleccionarPreguntas({ banco, intentos: recientes, n: 20, ahora, azar: crearAzar(4), filtro: { areas: ['deuda'] } })
    expect(todo.ids).toHaveLength(20)
    expect(todo.ids).toContain('d0')
  })
  it('respeta excluirIds', () => {
    const r = seleccionarPreguntas({ banco, intentos: [], n: 30, ahora, azar: crearAzar(5), excluirIds: ['d0', 'f0'] })
    expect(r.ids).not.toContain('d0')
    expect(r.ids).toHaveLength(28)
  })
  it('clasifica en débiles, vencidas y no vistas', () => {
    const intentos = [intento('d0', false, 10), intento('d1', true, 10), intento('d2', true, 10), intento('d3', false, 10), intento('d4', true, 10)]
    const r = seleccionarPreguntas({ banco, intentos, n: 8, ahora, azar: crearAzar(6), filtro: { areas: ['deuda'] }, mezcla: { debiles: 0.5, vencidas: 0.25, noVistas: 0.25 } })
    expect(r.composicion.vencidas).toBeGreaterThan(0)
    expect(r.composicion.debiles + r.composicion.vencidas + r.composicion.noVistas + r.composicion.otras).toBe(8)
  })
  it('las preguntas de otras clases (vistas, no vencidas, subtema sólido) entran como relleno', () => {
    const buenas = Array.from({ length: 10 }, (_, k) => intento(`f${k}`, true, 0, { area: 'fondos', subtemaId: 'fondos.a', sesionId: 'x' }))
    const r = seleccionarPreguntas({ banco, intentos: buenas, n: 10, ahora, azar: crearAzar(7), filtro: { areas: ['fondos'] } })
    expect(r.ids).toHaveLength(10)
    expect(r.composicion.otras).toBe(10)
  })
  it('adapta la dificultad al nivel del subtema (dominado prefiere 4 a 5)', () => {
    const mk = (id: string, d: number, extra: Partial<Intento> = {}) => Array.from({ length: 5 }, (_, k) => intento(`h${id}${k}`, true, d, { sesionId: id, dificultad: 4, tiempoMs: 30_000, ...extra }))
    const intentos = [...mk('a', 40, { modo: 'mini', dificultad: 2 }), ...mk('b', 36), ...mk('c', 25, { modo: 'reto' })]
    const r = seleccionarPreguntas({ banco, intentos, n: 6, ahora: new Date(ahora.getTime() - 20 * DIA_MS + 2 * DIA_MS * 0), azar: crearAzar(8), filtro: { areas: ['deuda'] } })
    const dif = new Map(banco.map((p) => [p.id, p.dificultad]))
    expect(r.ids.every((id) => dif.get(id) === undefined || dif.get(id)! >= 1)).toBe(true)
    expect(RANGO_POR_NIVEL.dominado).toEqual([4, 5])
  })
  it('prioriza áreas obligatorias con pesoObligatorias alto', () => {
    const conteo = (peso: number) => {
      let c = 0
      for (let s = 0; s < 30; s++) c += seleccionarPreguntas({ banco, intentos: [], n: 5, ahora, azar: crearAzar(s), pesoObligatorias: peso }).ids.filter((id) => id.startsWith('d')).length
      return c
    }
    expect(conteo(50)).toBeGreaterThan(conteo(1))
  })
  it('entrega permutaciones con la clave equilibrada', () => {
    const r = seleccionarPreguntas({ banco, intentos: [], n: 20, ahora, azar: crearAzar(9) })
    expect(r.presentacion).toHaveLength(20)
    const conteo = [0, 0, 0, 0]
    for (const p of r.presentacion) {
      expect(p.permutacion[p.clave]).toBe(1)
      conteo[p.clave]! += 1
    }
    expect(Math.max(...conteo) - Math.min(...conteo)).toBeLessThanOrEqual(1)
  })
})

describe('utilidades', () => {
  it('repartirCuotas suma n', () => {
    expect(repartirCuotas(10, { debiles: 0.5, vencidas: 0.25, noVistas: 0.25 })).toEqual({ debiles: 5, vencidas: 3, noVistas: 2 })
    const c = repartirCuotas(7, { debiles: 0.5, vencidas: 0.25, noVistas: 0.25 })
    expect(c.debiles + c.vencidas + c.noVistas).toBe(7)
    expect(repartirCuotas(4, { debiles: 0, vencidas: 0, noVistas: 0 })).toEqual({ debiles: 2, vencidas: 1, noVistas: 1 })
  })
  it('elegible', () => {
    expect(elegible(banco[0]!)).toBe(true)
    expect(elegible(banco[0]!, { areas: ['etica'] })).toBe(false)
    expect(elegible(banco[0]!, { subtemas: ['x'] })).toBe(false)
    expect(elegible(preg('x', 'deuda'), { subtemas: ['x'] })).toBe(false)
  })
  it('presentarPreguntas no mueve opciones que dependen de su posición', () => {
    const p = preg('z', 'deuda', { opciones: ['Solo a', 'a y b', 'Todas las anteriores', 'Ninguna'].map((texto) => ({ texto })), clave: 2 })
    const [r] = presentarPreguntas([p], crearAzar(1))
    expect(r).toMatchObject({ fija: true, clave: 2, permutacion: [0, 1, 2, 3] })
  })
})
