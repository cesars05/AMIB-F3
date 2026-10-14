import { describe, expect, it } from 'vitest'
import { crearAzar } from './barajar'
import type { Pregunta } from './contenido'
import { AREAS, type AreaId } from './examen'
import { armarSimulacro, calificar, minutosProporcionales, minutosSimulacro, probabilidadAprobar, repartirPorPeso, type RespuestaSimulacro } from './simulacro'
import { DIA_MS, type Intento } from './intentos'

const ahora = new Date(Date.UTC(2026, 9, 14, 12))
function preg(id: string, area: AreaId, extra: Partial<Pregunta> = {}): Pregunta {
  return {
    id, version: 1, area, enunciado: 'Enunciado de prueba', opciones: ['A', 'B', 'C', 'D'].map((texto) => ({ texto })), clave: 0,
    tipo: 'teoria', formato: 'directa', esTrampa: false, extra: false, fuente: 'generada', vigencia: 'no-aplica', estado: 'validada', notas: [], ...extra
  }
}
const completo: Pregunta[] = AREAS.flatMap((a) => Array.from({ length: a.preguntas + 5 }, (_, k) => preg(`${a.id}-${k}`, a.id)))
const base = { banco: completo, intentos: [] as Intento[], ahora }

describe('armarSimulacro', () => {
  it('integral usa la distribución oficial y 258 minutos', () => {
    const s = armarSimulacro({ ...base, tipo: 'integral', azar: crearAzar(1) })
    expect(s.preguntas).toHaveLength(210)
    expect(s.tiempoMin).toBe(258)
    expect(s.faltantes).toEqual({})
    for (const a of AREAS) expect(s.porArea[a.id]).toBe(a.preguntas)
    expect(new Set(s.preguntas.map((p) => p.id)).size).toBe(210)
  })
  it('solo usa validadas y no extra, e informa faltantes sin fallar', () => {
    const banco = completo
      .filter((p) => p.area !== 'etica' || Number(p.id.split('-')[1]) < 12)
      .map((p) => (p.area === 'fondos' && Number(p.id.split('-')[1]) % 2 ? { ...p, extra: true } : p))
      .concat([preg('bor', 'deuda', { estado: 'borrador' }), preg('sc', 'deuda', { clave: null, estado: 'borrador' })])
    const s = armarSimulacro({ ...base, banco, tipo: 'integral', azar: crearAzar(2) })
    expect(s.faltantes.etica).toBe(8)
    expect(s.faltantes.fondos).toBe(7)
    expect(s.preguntas.some((p) => p.id === 'bor' || p.id === 'sc')).toBe(false)
    expect(s.preguntas).toHaveLength(195)
    const ex = completo.map((p) => (p.area === 'fondos' ? { ...p, extra: true } : p))
    expect(armarSimulacro({ ...base, banco: ex, tipo: 'integral', azar: crearAzar(2) }).faltantes.fondos).toBe(20)
  })
  it('prefiere preguntas nunca vistas', () => {
    const vistas: Intento[] = Array.from({ length: 20 }, (_, k) => ({
      preguntaId: `etica-${k}`, area: 'etica', tipo: 'teoria', correcta: true, tiempoMs: 1, modo: 'practica', sesionId: 's', fecha: new Date(ahora.getTime() - 1 * DIA_MS).toISOString()
    }))
    const s = armarSimulacro({ ...base, intentos: vistas, tipo: 'modulo', area: 'etica', azar: crearAzar(3) })
    const nuevas = s.preguntas.filter((p) => Number(p.id.split('-')[1]) >= 20).length
    expect(nuevas).toBe(5)
  })
  it('módulo: un área, tiempo proporcional', () => {
    const s = armarSimulacro({ ...base, tipo: 'modulo', area: 'deuda', azar: crearAzar(4) })
    expect(s.preguntas).toHaveLength(25)
    expect(s.tiempoMin).toBe(31)
    expect(armarSimulacro({ ...base, tipo: 'modulo', area: 'etica', azar: crearAzar(4) }).tiempoMin).toBe(25)
    expect(() => armarSimulacro({ ...base, tipo: 'modulo', azar: crearAzar(4) })).toThrow()
    expect(() => minutosSimulacro('modulo')).toThrow()
  })
  it('modular extraordinario: las 4 obligatorias', () => {
    const s = armarSimulacro({ ...base, tipo: 'modular-extraordinario', azar: crearAzar(5) })
    expect(Object.keys(s.porArea).sort()).toEqual(['capitales', 'derivados', 'deuda', 'etica'])
    expect(s.preguntas).toHaveLength(95)
    expect(s.tiempoMin).toBe(117)
  })
  it('rápido: 40 preguntas ponderadas y 49 minutos', () => {
    const s = armarSimulacro({ ...base, tipo: 'rapido', azar: crearAzar(6) })
    expect(s.preguntas).toHaveLength(40)
    expect(s.tiempoMin).toBe(49)
    expect(s.porArea.deuda).toBeGreaterThanOrEqual(4)
    expect(s.faltantes).toEqual({})
  })
  it('rápido redistribuye si un área no alcanza y reporta el faltante', () => {
    const banco = completo.filter((p) => p.area !== 'etica' || p.id.endsWith('-0'))
    const s = armarSimulacro({ ...base, banco, tipo: 'rapido', azar: crearAzar(7) })
    expect(s.preguntas).toHaveLength(40)
    expect(s.porArea.etica).toBe(1)
    expect(s.faltantes.etica).toBeGreaterThan(0)
    const pocas = armarSimulacro({ ...base, banco: banco.slice(0, 5), tipo: 'rapido', azar: crearAzar(7) })
    expect(pocas.preguntas.length).toBeLessThan(40)
  })
  it('repartirPorPeso suma el total y respeta topes', () => {
    const disp = Object.fromEntries(AREAS.map((a) => [a.id, 100])) as Record<AreaId, number>
    const r = repartirPorPeso(40, disp)
    expect(Object.values(r).reduce((a, b) => a + b, 0)).toBe(40)
    expect(minutosProporcionales(210)).toBe(258)
  })
})

describe('calificar', () => {
  const sim = armarSimulacro({ ...base, tipo: 'integral', azar: crearAzar(10) })
  const responder = (fraccion: number): RespuestaSimulacro[] =>
    sim.preguntas.map((p, k) => ({ preguntaId: p.id, posicion: (k * 7) % 10 < fraccion * 10 ? p.clave : (p.clave + 1) % 4, tiempoMs: 60_000 }))

  it('califica por área y emite dictamen con las 9 áreas', () => {
    const c = calificar(sim, responder(0.9), { azar: crearAzar(1), n: 300 })
    expect(c.completo).toBe(true)
    expect(c.porArea).toHaveLength(9)
    expect(c.dictamen!.aprobado).toBe(true)
    expect(c.puntajeEstimado).toBeGreaterThan(600)
    expect(c.probabilidadAprobar).toBeGreaterThan(0.9)
    expect(c.porArea[0]!.tiempoPromedioS).toBe(60)
    expect(c.total).toBe(210)
  })
  it('reprobado y sin probabilidad cuando no se da azar', () => {
    const c = calificar(sim, responder(0.2))
    expect(c.dictamen!.aprobado).toBe(false)
    expect(c.probabilidadAprobar).toBeUndefined()
  })
  it('sin responder cuenta como incorrecta', () => {
    const c = calificar(sim, [{ preguntaId: sim.preguntas[0]!.id, posicion: null, tiempoMs: 1000 }, { preguntaId: 'otra', posicion: 0, tiempoMs: 5 }])
    expect(c.correctas).toBe(0)
    expect(c.porArea[0]!.sinResponder).toBe(20)
  })
  it('un simulacro parcial solo da resultados por área', () => {
    const mod = armarSimulacro({ ...base, tipo: 'modulo', area: 'deuda', azar: crearAzar(11) })
    const c = calificar(mod, mod.preguntas.map((p) => ({ preguntaId: p.id, posicion: p.clave, tiempoMs: 1000 })), { azar: crearAzar(1) })
    expect(c.completo).toBe(false)
    expect(c.dictamen).toBeUndefined()
    expect(c.porArea[0]).toMatchObject({ area: 'deuda', correctas: 25, aprobada: true })
    expect(c.probabilidadAprobar).toBeUndefined()
  })
})

describe('probabilidadAprobar', () => {
  const todas = (p: number) => Object.fromEntries(AREAS.map((a) => [a.id, p])) as Record<AreaId, number>
  it('es monótona con el dominio y reproducible', () => {
    const a = probabilidadAprobar(todas(0.5), crearAzar(1))
    const b = probabilidadAprobar(todas(0.75), crearAzar(1))
    const c = probabilidadAprobar(todas(0.95), crearAzar(1))
    expect(a).toBeLessThan(0.05)
    expect(b).toBeGreaterThan(a)
    expect(c).toBeGreaterThan(0.99)
    expect(probabilidadAprobar(todas(0.75), crearAzar(1))).toBe(b)
  })
  it('coincide con el orden de magnitud del plan (0.75 de aciertos en obligatorias da probabilidad alta)', () => {
    const p = probabilidadAprobar({ ...todas(0.6), etica: 0.75, capitales: 0.75, deuda: 0.75, derivados: 0.75 }, crearAzar(2))
    expect(p).toBeGreaterThan(0.6)
    expect(p).toBeLessThan(0.99)
  })
  it('el área obligatoria débil hunde la probabilidad aunque el promedio sea alto', () => {
    const p = probabilidadAprobar({ ...todas(0.95), etica: 0.3 }, crearAzar(3))
    expect(p).toBeLessThan(0.01)
  })
  it('área sin dominio se toma como 0.5 y los valores se recortan', () => {
    expect(probabilidadAprobar({}, crearAzar(1), 100)).toBeLessThan(0.1)
    expect(probabilidadAprobar({ etica: 5, servicios: -1 }, crearAzar(1), 50)).toBeGreaterThanOrEqual(0)
  })
})
