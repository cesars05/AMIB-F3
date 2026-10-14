import { describe, expect, it } from 'vitest'
import { construirContenido } from './construir'
import { RAIZ, SALIDA_ENSAYO_ETICA, SALIDA_PREGUNTAS_TIPO, SALIDA_TAXONOMIA } from './rutas'
import { validarContenido } from './validar'

describe('construirContenido (con los archivos reales)', () => {
  it('produce los tres archivos, sin errores de validación y con 75 preguntas', async () => {
    const r = await construirContenido(RAIZ, '2026-10-14')
    expect([...r.salidas.keys()]).toEqual([SALIDA_TAXONOMIA, SALIDA_PREGUNTAS_TIPO, SALIDA_ENSAYO_ETICA])
    const v = validarContenido([...r.salidas].map(([ruta, datos]) => ({ ruta, datos: JSON.parse(JSON.stringify(datos)) as unknown })))
    expect(v.errores).toEqual([])
    expect(v.resumen.preguntas).toBe(75)
    expect(v.resumen.porFuente).toEqual({ 'oficial-ejemplo': 44, 'manual-ensayo': 31 })
    expect(v.resumen.taxonomia).toMatchObject({ temas: 22, subtemas: 76, objetivos: 465 })
  })

  it('es determinista: dos construcciones con la misma fecha dan el mismo JSON', async () => {
    const a = await construirContenido(RAIZ, '2026-10-14')
    const b = await construirContenido(RAIZ, '2026-10-14')
    expect(JSON.stringify([...a.salidas])).toBe(JSON.stringify([...b.salidas]))
  })
})
