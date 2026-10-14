import { describe, expect, it } from 'vitest'
import { interpretarMarcado, textoPlano } from './marcado'

describe('interpretarMarcado', () => {
  it('reconoce texto plano', () => {
    expect(interpretarMarcado('hola')).toEqual([{ t: 'texto', v: 'hola' }])
    expect(interpretarMarcado('')).toEqual([])
  })
  it('reconoce negritas, términos y fórmulas en línea', () => {
    expect(interpretarMarcado('Se compra **a descuento** y paga [[$10]] con \\( P = VN \\)')).toEqual([
      { t: 'texto', v: 'Se compra ' },
      { t: 'negrita', hijos: [{ t: 'texto', v: 'a descuento' }] },
      { t: 'texto', v: ' y paga ' },
      { t: 'termino', hijos: [{ t: 'texto', v: '$10' }] },
      { t: 'texto', v: ' con ' },
      { t: 'tex', v: 'P = VN' }
    ])
  })
  it('permite anidar términos dentro de negritas', () => {
    expect(interpretarMarcado('**un [[CETE]] hoy**')).toEqual([
      { t: 'negrita', hijos: [{ t: 'texto', v: 'un ' }, { t: 'termino', hijos: [{ t: 'texto', v: 'CETE' }] }, { t: 'texto', v: ' hoy' }] }
    ])
  })
  it('deja como texto las marcas sin cierre o vacías', () => {
    expect(interpretarMarcado('a ** b')).toEqual([{ t: 'texto', v: 'a ** b' }])
    expect(interpretarMarcado('x [[ y')).toEqual([{ t: 'texto', v: 'x [[ y' }])
    expect(interpretarMarcado('\\( sin cierre')).toEqual([{ t: 'texto', v: '\\( sin cierre' }])
    expect(interpretarMarcado('****')).toEqual([{ t: 'texto', v: '****' }])
  })
  it('no interpreta HTML: las etiquetas quedan como texto', () => {
    expect(interpretarMarcado('<img src=x onerror=alert(1)> **b**')).toEqual([
      { t: 'texto', v: '<img src=x onerror=alert(1)> ' },
      { t: 'negrita', hijos: [{ t: 'texto', v: 'b' }] }
    ])
  })
  it('no interpreta marcas dentro de una fórmula', () => {
    expect(interpretarMarcado('\\( a **b** c \\)')).toEqual([{ t: 'tex', v: 'a **b** c' }])
  })
  it('textoPlano quita las marcas', () => {
    expect(textoPlano('**a** y [[b]] y \\( c \\)')).toBe('a y b y c')
  })
})
