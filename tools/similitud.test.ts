import { describe, expect, it } from 'vitest'
import { construirPesos, distanciaEdicion, similitud, tokens, verboInicial } from './similitud'

describe('distanciaEdicion', () => {
  it('cuenta inserciones, borrados y sustituciones', () => {
    expect(distanciaEdicion('', '')).toBe(0)
    expect(distanciaEdicion('abc', 'abc')).toBe(0)
    expect(distanciaEdicion('14.4', '1.4')).toBe(1)
    expect(distanciaEdicion('kitten', 'sitting')).toBe(3)
    expect(distanciaEdicion('', 'ab')).toBe(2)
  })
})

describe('tokens', () => {
  it('quita acentos, palabras vacías y el verbo inicial', () => {
    expect(tokens('Identificar los requisitos de la Inversión Extranjera')).toEqual(['requisitos', 'inversion', 'extranjera'])
  })
  it('también quita el verbo con el pronombre pegado por el OCR', () => {
    expect(tokens('Reconocerlos beneficios de una cultura')).toEqual(['beneficios', 'cultura'])
  })
  it('conserva las cifras de un solo dígito (UDI 1, 3 agentes) y descarta letras sueltas', () => {
    expect(tokens('Identificar 3 los agentes x')).toEqual(['3', 'agentes'])
  })
})

describe('verboInicial', () => {
  it('detecta el verbo y devuelve vacío si el texto no empieza con uno', () => {
    expect(verboInicial('Identificar el concepto')).toBe('identificar')
    expect(verboInicial('Ética y Moral')).toBe('')
    expect(verboInicial('Wentificar los componentes')).toBe('wentificar')
  })
})

describe('similitud', () => {
  const objetivos = [
    'Identificar las características del mercado de deuda.',
    'Reconocer el procedimiento para determinar la tasa de interés interbancaria de equilibrio (TIIE).',
    'Identificar los siguientes conceptos: aportaciones iniciales mínimas, individuales, opuestas y por entrega.',
    'Identificar los siguientes conceptos: oferta, demanda y precio.'
  ]
  const pesos = construirPesos(objetivos)

  it('un texto idéntico puntúa 1 y uno con errores de OCR sigue alto', () => {
    expect(similitud(objetivos[0]!, objetivos[0]!, pesos).puntaje).toBeCloseTo(1, 5)
    expect(similitud('Identificar las caracteristicas del mercdo de deuda.', objetivos[0]!, pesos).puntaje).toBeGreaterThan(0.75)
  })
  it('un encabezado truncado (prefijo del objetivo) puntúa más que uno de otro tema', () => {
    const truncado = similitud('Reconocer el procedimiento para determinar la tasa de interés', objetivos[1]!, pesos).puntaje
    const ajeno = similitud('Reconocer el procedimiento para determinar la tasa de interés', objetivos[0]!, pesos).puntaje
    expect(truncado).toBeGreaterThan(0.6)
    expect(truncado).toBeGreaterThan(ajeno + 0.3)
  })
  it('un encabezado genérico se atenúa: no llega a "alta" aunque quepa entero en el objetivo', () => {
    expect(similitud('Identificar los siguientes conceptos:', objetivos[2]!, pesos).puntaje).toBeLessThan(0.55)
  })
  it('un encabezado de una o dos palabras no se confunde con un objetivo largo que lo contiene', () => {
    expect(similitud('Ética y Moral', 'Identificar los elementos de la exigencia ética de un líder moral.', pesos).puntaje).toBeLessThan(0.55)
  })
  it('sin tokens en común puntúa 0', () => {
    expect(similitud('Calcular la beta', objetivos[0]!, pesos).puntaje).toBe(0)
  })
})
