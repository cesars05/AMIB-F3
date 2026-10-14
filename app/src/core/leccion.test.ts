import { describe, expect, it } from 'vitest'
import { LeccionSchema, violacionesDeEstilo, type Leccion } from './leccion'

const base = {
  id: 'deuda.cetes',
  area: 'deuda',
  materia: 'Títulos de Deuda I',
  orden: 1,
  titulo: 'CETES',
  resumen: 'Bono cupón cero del Gobierno Federal.',
  duracionMin: 20,
  fuentes: [{ documento: 'AMIB Data/AMIB_1_completo.md', paginas: [190] }],
  laminas: [
    {
      id: 'que-es',
      titulo: '¿Qué es un CETE?',
      bloques: [
        { tipo: 'parrafo', texto: 'Se compra a **descuento** y paga [[$10]] al vencimiento.' },
        { tipo: 'formula', logica: 'P = VN\\left(1 - TD\\cdot\\frac{t}{360}\\right)', leyenda: [['P', 'precio']] }
      ]
    }
  ],
  puntosClave: ['uno', 'dos', 'tres'],
  practica: ['g.deuda.1', 'g.deuda.2', 'g.deuda.3'],
  miniExamen: ['g.deuda.4', 'g.deuda.5', 'g.deuda.6']
}

describe('LeccionSchema', () => {
  it('acepta una lección válida y completa valores por omisión', () => {
    const l = LeccionSchema.parse(base)
    expect(l.laminas[0]!.ampliada).toBe('')
    expect(l.reto).toEqual([])
  })
  it('rechaza bloques desconocidos y listas cortas', () => {
    expect(() => LeccionSchema.parse({ ...base, laminas: [{ id: 'x', titulo: 'x', bloques: [{ tipo: 'html', texto: '<b>' }] }] })).toThrow()
    expect(() => LeccionSchema.parse({ ...base, puntosClave: ['uno'] })).toThrow()
  })
})

describe('violacionesDeEstilo', () => {
  it('acepta negritas con ** y detecta caracteres prohibidos', () => {
    const l = LeccionSchema.parse(base) as Leccion
    expect(violacionesDeEstilo(l)).toEqual([])
    const mala = LeccionSchema.parse({ ...base, puntosClave: ['uno — dos', 'tres · cuatro', '- viñeta', '5 °C', 'ok'] })
    expect(violacionesDeEstilo(mala)).toHaveLength(4)
  })
})
