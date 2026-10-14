import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { construirContenido, type ResultadoConstruccion } from './construir'
import { RAIZ, RUTA_CLAVES_LIBRO, SALIDA_ENSAYO_ETICA, SALIDA_INDICE_MANUAL, SALIDA_PREGUNTAS_TIPO, SALIDA_REPASOS_MANUAL, SALIDA_TAXONOMIA } from './rutas'
import { validarContenido } from './validar'

/** Construir todo el contenido tarda ~2 s (más con cobertura): el límite por omisión de 5 s queda justo. */
const TIEMPO_LIMITE = 60_000

describe('construirContenido (con los archivos reales)', () => {
  let r: ResultadoConstruccion
  beforeAll(async () => {
    r = await construirContenido(RAIZ, '2026-10-14')
  }, TIEMPO_LIMITE)

  it('produce todos los archivos, sin errores de validación y con 75 preguntas oficiales + 146 de repaso (con su clave del libro)', () => {
    const rutas = [...r.salidas.keys()]
    expect(rutas.slice(0, 5)).toEqual([SALIDA_TAXONOMIA, SALIDA_PREGUNTAS_TIPO, SALIDA_ENSAYO_ETICA, SALIDA_REPASOS_MANUAL, SALIDA_INDICE_MANUAL])
    // 413 secciones del manual (351 con #### + 61 recuperadas + el formulario) → 413 Markdown.
    expect(rutas.slice(5)).toHaveLength(413)
    expect(rutas.slice(5).every((x) => /^content\/manual\/cap\d{2}\/\d{2}-[a-z0-9-]+\.md$/.test(x))).toBe(true)
    expect(new Set(rutas).size).toBe(rutas.length)

    const json = [...r.salidas].filter(([ruta]) => ruta.endsWith('.json')).map(([ruta, datos]) => ({ ruta, datos: JSON.parse(JSON.stringify(datos)) as unknown }))
    json.push({ ruta: RUTA_CLAVES_LIBRO, datos: JSON.parse(readFileSync(join(RAIZ, RUTA_CLAVES_LIBRO), 'utf8')) as unknown })
    const v = validarContenido(json)
    expect(v.errores).toEqual([])
    expect(v.resumen.preguntas).toBe(221)
    expect(v.resumen.porFuente).toEqual({ 'oficial-ejemplo': 44, 'manual-ensayo': 31, 'manual-repaso': 146 })
    expect(v.resumen.porEstado).toEqual({ validada: 89, borrador: 127, retirada: 5 })
    expect(v.resumen.taxonomia).toMatchObject({ temas: 22, subtemas: 76, objetivos: 465 })
    expect(v.resumen.manual).toMatchObject({ secciones: 413, vinculadas: 380, exclusivasFig3: 27 })
  })

  it('los Markdown son strings y los demás se escriben como JSON', () => {
    for (const [ruta, datos] of r.salidas) expect(typeof datos === 'string', ruta).toBe(ruta.endsWith('.md'))
  })

  it('la taxonomía lleva exclusivoFig3 en 25 objetivos (los vinculados a secciones de la Figura 3)', () => {
    const objetivos = r.taxonomia.areas.flatMap((a) => a.temas.flatMap((t) => t.subtemas.flatMap((s) => s.objetivos)))
    expect(objetivos.filter((o) => o.exclusivoFig3)).toHaveLength(25)
    expect(objetivos).toHaveLength(465)
  })

  it('es determinista: dos construcciones con la misma fecha dan el mismo contenido', async () => {
    const otra = await construirContenido(RAIZ, '2026-10-14')
    expect(JSON.stringify([...otra.salidas])).toBe(JSON.stringify([...r.salidas]))
  }, TIEMPO_LIMITE)

  it('content/manual/ y los repasos en disco están al día con los parsers (si falla: npm run content:build)', async () => {
    const enDisco = JSON.parse(readFileSync(join(RAIZ, SALIDA_INDICE_MANUAL), 'utf8')) as { generado: string }
    const reconstruido = await construirContenido(RAIZ, enDisco.generado)
    for (const [ruta, datos] of reconstruido.salidas) {
      if (!ruta.startsWith('content/manual/') && ruta !== SALIDA_REPASOS_MANUAL) continue
      const esperado = typeof datos === 'string' ? datos : JSON.stringify(datos, null, 2) + '\n'
      expect(readFileSync(join(RAIZ, ruta), 'utf8') === esperado, ruta).toBe(true)
    }
  }, TIEMPO_LIMITE)
})
