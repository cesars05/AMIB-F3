import { describe, expect, it } from 'vitest'
import { AREAS, DURACION_MINUTOS, TOTAL_PREGUNTAS, aPuntajeEstimado, dictaminar, type ResultadoArea } from './examen'

const todas = (fraccion: number): ResultadoArea[] =>
  AREAS.map((a) => ({ area: a.id, correctas: Math.round(a.preguntas * fraccion), total: a.preguntas }))

describe('estructura oficial', () => {
  it('suma 210 preguntas en 9 áreas y dura 4 h 18 min', () => {
    expect(AREAS).toHaveLength(9)
    expect(AREAS.reduce((s, a) => s + a.preguntas, 0)).toBe(TOTAL_PREGUNTAS)
    expect(DURACION_MINUTOS).toBe(258)
  })
  it('tiene exactamente 4 áreas obligatorias', () => {
    expect(AREAS.filter((a) => a.obligatoria).map((a) => a.id)).toEqual(['etica', 'capitales', 'deuda', 'derivados'])
  })
})

describe('aPuntajeEstimado', () => {
  it('mapea extremos y el punto de 600', () => {
    expect(aPuntajeEstimado(0)).toBe(200)
    expect(aPuntajeEstimado(0.6)).toBe(600)
    expect(aPuntajeEstimado(1)).toBe(1100)
  })
  it('es monótono y respeta la configuración', () => {
    expect(aPuntajeEstimado(0.5)).toBeLessThan(aPuntajeEstimado(0.55))
    expect(aPuntajeEstimado(0.7, { aciertosEn600: 0.7 })).toBe(600)
  })
  it('acota fuera de rango y rechaza entradas inválidas', () => {
    expect(aPuntajeEstimado(-1)).toBe(200)
    expect(aPuntajeEstimado(2)).toBe(1100)
    expect(() => aPuntajeEstimado(Number.NaN)).toThrow()
    expect(() => aPuntajeEstimado(0.5, { aciertosEn600: 1 })).toThrow()
  })
})

describe('dictaminar', () => {
  it('aprueba con buen desempeño en todo', () => {
    const d = dictaminar(todas(0.8))
    expect(d.aprobado).toBe(true)
    expect(d.obligatoriasReprobadas).toEqual([])
  })
  it('reprueba si una obligatoria queda bajo 600 aunque el promedio pase', () => {
    const r = todas(0.9).map((x) => (x.area === 'deuda' ? { ...x, correctas: 10 } : x))
    const d = dictaminar(r)
    expect(d.promedio).toBeGreaterThanOrEqual(600)
    expect(d.aprobado).toBe(false)
    expect(d.obligatoriasReprobadas).toEqual(['deuda'])
  })
  it('reprueba por promedio aunque las obligatorias pasen', () => {
    const r = todas(0.1).map((x) => (AREAS.find((a) => a.id === x.area)!.obligatoria ? { ...x, correctas: Math.ceil(x.total * 0.62) } : x))
    const d = dictaminar(r)
    expect(d.obligatoriasReprobadas).toEqual([])
    expect(d.aprobado).toBe(false)
  })
  it('exige resultados completos y válidos', () => {
    expect(() => dictaminar(todas(0.8).slice(1))).toThrow()
    expect(() => dictaminar(todas(0.8).map((x) => ({ ...x, correctas: x.total + 1 })))).toThrow()
  })
})
