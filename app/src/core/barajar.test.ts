import { describe, expect, it } from 'vitest'
import { asignarPosiciones, barajarOpciones, crearAzar, dependeDePosicion } from './barajar'

const opciones = ['uno', 'dos', 'tres', 'cuatro']

describe('crearAzar', () => {
  it('es reproducible con la misma semilla y distinto con otra', () => {
    const a = crearAzar(42), b = crearAzar(42), c = crearAzar(7)
    const sa = [a(), a(), a()], sb = [b(), b(), b()], sc = [c(), c(), c()]
    expect(sa).toEqual(sb)
    expect(sa).not.toEqual(sc)
    sa.forEach((x) => expect(x).toBeGreaterThanOrEqual(0))
    sa.forEach((x) => expect(x).toBeLessThan(1))
  })
})

describe('barajarOpciones', () => {
  it('mueve la correcta a la posición pedida y conserva todas las opciones', () => {
    for (let destino = 0; destino < 4; destino++) {
      const r = barajarOpciones(opciones, 1, crearAzar(destino + 10), destino)
      expect(r.clave).toBe(destino)
      expect(r.opciones[destino]).toBe('dos')
      expect([...r.opciones].sort()).toEqual([...opciones].sort())
      expect(r.permutacion.map((i) => opciones[i])).toEqual(r.opciones)
    }
  })
  it('sin destino, sigue rastreando la correcta', () => {
    const r = barajarOpciones(opciones, 3, crearAzar(99))
    expect(r.opciones[r.clave]).toBe('cuatro')
  })
  it('no baraja si alguna opción depende de su posición', () => {
    const fijas = ['A', 'B', 'Todas las anteriores', 'Ninguna']
    const r = barajarOpciones(fijas, 2, crearAzar(1), 0)
    expect(r.opciones).toEqual(fijas)
    expect(r.clave).toBe(2)
    expect(r.fija).toBe(true)
  })
  it('rechaza claves fuera de rango', () => {
    expect(() => barajarOpciones(opciones, 4, crearAzar(1))).toThrow()
  })
})

describe('dependeDePosicion', () => {
  it('detecta opciones que hacen referencia a otras', () => {
    expect(dependeDePosicion(['x', 'Todas las anteriores'])).toBe(true)
    expect(dependeDePosicion(['x', 'Ninguna de las anteriores'])).toBe(true)
    expect(dependeDePosicion(['x', 'a y b son correctas'])).toBe(true)
    expect(dependeDePosicion(['x', 'Sólo I y III'])).toBe(true)
    expect(dependeDePosicion(['7.70%', 'CETES', 'Ambas tasas'])).toBe(false)
  })
})

describe('asignarPosiciones', () => {
  it('reparte la posición correcta casi por igual entre a, b, c y d', () => {
    const pos = asignarPosiciones(40, crearAzar(3))
    const conteo = [0, 0, 0, 0]
    pos.forEach((p) => conteo[p]!++)
    expect(conteo).toEqual([10, 10, 10, 10])
  })
  it('no repite la misma letra más de 2 veces seguidas', () => {
    for (let s = 0; s < 50; s++) {
      const pos = asignarPosiciones(60, crearAzar(s))
      for (let i = 2; i < pos.length; i++) expect(pos[i] === pos[i - 1] && pos[i] === pos[i - 2]).toBe(false)
    }
  })
  it('maneja tamaños no divisibles entre 4', () => {
    const pos = asignarPosiciones(7, crearAzar(5))
    expect(pos).toHaveLength(7)
    const conteo = [0, 0, 0, 0]
    pos.forEach((p) => conteo[p]!++)
    expect(Math.max(...conteo) - Math.min(...conteo)).toBeLessThanOrEqual(1)
  })
})
