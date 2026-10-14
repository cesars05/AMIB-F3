import { describe, expect, it } from 'vitest'
import { calcularPerfil, resumenDeTaxonomia, type ResumenTaxonomia } from './perfil'
import { DIA_MS, type Intento } from './intentos'
import type { Taxonomia } from './contenido'

const T0 = Date.UTC(2026, 8, 1, 12)
const ahora = new Date(T0 + 3 * DIA_MS)
const tax: ResumenTaxonomia = {
  areas: [
    { area: 'deuda', obligatoria: true, subtemas: [{ id: 'deuda.a', nombre: 'A', objetivos: 3 }, { id: 'deuda.b', nombre: 'B', objetivos: 2 }] },
    { area: 'fondos', obligatoria: false, subtemas: [{ id: 'fondos.a', nombre: 'FA', objetivos: 4 }] }
  ]
}
function ses(id: string, sub: string, area: Intento['area'], d: number, aciertos: number, total: number, extra: Partial<Intento> = {}): Intento[] {
  return Array.from({ length: total }, (_, k) => ({
    preguntaId: `${id}-${k}`,
    area,
    subtemaId: sub,
    objetivoId: `${sub}.o${k % 2}`,
    tipo: 'teoria' as const,
    dificultad: 3 as const,
    correcta: k < aciertos,
    tiempoMs: 80_000,
    modo: 'practica' as const,
    sesionId: id,
    fecha: new Date(T0 + d * DIA_MS).toISOString(),
    ...extra
  }))
}

describe('calcularPerfil', () => {
  const intentos = [
    ...ses('s1', 'deuda.a', 'deuda', 0, 5, 5),
    ...ses('s2', 'deuda.b', 'deuda', 1, 1, 6, { etiquetaError: 'usa-365' }),
    ...ses('s3', 'fondos.a', 'fondos', 8, 8, 8)
  ]
  const p = calcularPerfil({ intentos, taxonomia: tax, ahora })

  it('agrega por área con tiempo contra 74 s', () => {
    const deuda = p.areas.find((a) => a.area === 'deuda')!
    expect(deuda).toMatchObject({ obligatoria: true, intentos: 11, ritmoS: 74, tiempoPromedioS: 80 })
    expect(deuda.banda[0]).toBeLessThan(deuda.dominio)
    expect(p.areas[1]!.nivelPredominante).toBe('familiar')
    expect(deuda.nivelPredominante).toBe('visto')
  })
  it('calcula cobertura de objetivos', () => {
    expect(p.cobertura).toEqual({ vistos: 6, total: 9, porcentaje: 6 / 9 })
    expect(p.subtemas['deuda.a']).toMatchObject({ objetivosVistos: 2, objetivosTotal: 3, area: 'deuda' })
  })
  it('detecta patrones, débiles, dominados y pendientes', () => {
    expect(p.patronesError).toEqual([{ etiqueta: 'usa-365', n: 5 }])
    expect(p.debiles).toEqual(['deuda.b'])
    expect(p.dominados).toEqual([])
    const tipos = p.pendientes.map((x) => x.tipo)
    expect(tipos[0]).toBe('area-bajo-meta')
    expect(p.pendientes.filter((x) => x.tipo === 'objetivos-sin-ver')).toHaveLength(1)
    expect(p.pendientes.some((x) => x.tipo === 'objetivos-sin-ver' && x.area !== 'deuda')).toBe(false)
  })
  it('evolución semanal y vencidas', () => {
    expect(p.evolucionSemanal.map((s) => s.semana)).toEqual(['2026-W36', '2026-W37'])
    expect(p.evolucionSemanal[0]!.precision).toBeCloseTo(6 / 11)
    expect(p.vencidas).toBe(p.preguntasVencidas.length)
    expect(p.vencidas).toBeGreaterThan(0)
    expect(p.intentosTotales).toBe(intentos.length)
  })
  it('sin intentos todo está sin ver y el área obligatoria queda pendiente', () => {
    const v = calcularPerfil({ intentos: [], taxonomia: tax, ahora })
    expect(v.cobertura.porcentaje).toBe(0)
    expect(v.areas.every((a) => a.nivelPredominante === 'sin-ver' && a.tiempoPromedioS === null)).toBe(true)
    expect(v.pendientes[0]).toMatchObject({ tipo: 'area-bajo-meta', area: 'deuda' })
    expect(calcularPerfil({ intentos: [], taxonomia: { areas: [] }, ahora }).cobertura.porcentaje).toBe(0)
  })
  it('un subtema dominado aparece en dominados', () => {
    const dom = [
      ...ses('a', 'deuda.a', 'deuda', 0, 5, 5, { modo: 'mini' }),
      ...ses('b', 'deuda.a', 'deuda', 2, 5, 5),
      ...ses('c', 'deuda.a', 'deuda', 10, 5, 5, { dificultad: 4, tiempoMs: 40_000, modo: 'reto' })
    ]
    expect(calcularPerfil({ intentos: dom, taxonomia: tax, ahora: new Date(T0 + 11 * DIA_MS) }).dominados).toEqual(['deuda.a'])
  })
  it('nivel predominante en empate toma el más bajo', () => {
    const t: ResumenTaxonomia = { areas: [{ area: 'deuda', obligatoria: true, subtemas: [{ id: 'x', nombre: 'x', objetivos: 1 }, { id: 'y', nombre: 'y', objetivos: 1 }] }] }
    const i = ses('a', 'x', 'deuda', 0, 5, 5, { modo: 'mini' })
    expect(calcularPerfil({ intentos: i, taxonomia: t, ahora }).areas[0]!.nivelPredominante).toBe('sin-ver')
  })
})

describe('resumenDeTaxonomia', () => {
  it('cuenta objetivos por subtema y marca obligatorias', () => {
    const t = {
      fuente: 'x',
      generado: 'x',
      areas: [{ area: 'etica', temas: [{ id: 't', nombre: 'T', subtemas: [{ id: 'etica.s', nombre: 'S', objetivos: [{}, {}] }] }] }]
    } as unknown as Taxonomia
    expect(resumenDeTaxonomia(t).areas[0]).toEqual({ area: 'etica', obligatoria: true, subtemas: [{ id: 'etica.s', nombre: 'S', objetivos: 2 }] })
  })
})
