import { describe, expect, it } from 'vitest'
import { colapsar, slug } from './texto'

describe('slug', () => {
  it('quita acentos y signos', () => {
    expect(slug('Títulos de Deuda I')).toBe('titulos-de-deuda-i')
    expect(slug('Bolsa de Derivados (MexDer)')).toBe('bolsa-de-derivados-mexder')
    expect(slug('Ética')).toBe('etica')
  })
  it('conserva la eñe como n y no deja guiones en los bordes', () => {
    expect(slug('  ¿Señalar? ')).toBe('senalar')
  })
})

describe('colapsar', () => {
  it('une espacios, saltos y NBSP', () => {
    expect(colapsar('  Marco   Normativo\n II ')).toBe('Marco Normativo II')
  })
})
