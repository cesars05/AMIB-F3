import { describe, expect, it } from 'vitest'
import { PreguntaSchema, idsDuplicados, type PreguntaEntrada } from './contenido'

const base: PreguntaEntrada = {
  id: 'tipo.21',
  area: 'deuda',
  enunciado: '¿Cuál es la tasa de descuento de un CETE?',
  opciones: [{ texto: 'a' }, { texto: 'b' }, { texto: 'c' }, { texto: 'd' }],
  clave: 1,
  tipo: 'calculo',
  formato: 'calculo',
  fuente: 'oficial-ejemplo',
  estado: 'validada'
}

describe('PreguntaSchema', () => {
  it('acepta una pregunta válida y completa valores por omisión', () => {
    const p = PreguntaSchema.parse(base)
    expect(p.version).toBe(1)
    expect(p.extra).toBe(false)
    expect(p.notas).toEqual([])
  })
  it('exige exactamente 4 opciones', () => {
    expect(() => PreguntaSchema.parse({ ...base, opciones: base.opciones.slice(0, 3) })).toThrow()
  })
  it('no permite validar sin clave', () => {
    expect(() => PreguntaSchema.parse({ ...base, clave: null })).toThrow()
    expect(PreguntaSchema.parse({ ...base, clave: null, estado: 'borrador' }).clave).toBeNull()
  })
  it('rechaza ids con formato inválido y áreas desconocidas', () => {
    expect(() => PreguntaSchema.parse({ ...base, id: 'Tipo 21' })).toThrow()
    expect(() => PreguntaSchema.parse({ ...base, area: 'mexder' })).toThrow()
  })
})

describe('idsDuplicados', () => {
  it('detecta ids repetidos', () => {
    expect(idsDuplicados([{ id: 'a' }, { id: 'b' }, { id: 'a' }])).toEqual(['a'])
    expect(idsDuplicados([{ id: 'a' }])).toEqual([])
  })
})
