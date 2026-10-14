import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { AREAS } from '../app/src/core/examen'
import { TaxonomiaSchema, type Taxonomia } from '../app/src/core/contenido'
import { leerDocx, type BloqueDocx } from './docx'
import { areaDeMateria, clasificarTipo, esObjetivo, parsearTemario, resumenTaxonomia, verboDe } from './parse-temario'
import { RAIZ, DOC_TEMARIO } from './rutas'

describe('esObjetivo / verboDe', () => {
  it('detecta objetivos por verbo en infinitivo', () => {
    expect(esObjetivo('Identificar los elementos del acto humano.')).toBe(true)
    expect(esObjetivo('calcular el rendimiento')).toBe(true)
    expect(esObjetivo('Resolver problemas de tasas de interés')).toBe(true)
    expect(esObjetivo('Comprender la mecánica')).toBe(true)
  })
  it('no confunde encabezados de subtema', () => {
    for (const h of ['Ética General', 'Reporto y Préstamo de Valores', 'Valor', 'Emisoras', 'Teoría Básica', 'Subastas']) {
      expect(esObjetivo(h)).toBe(false)
    }
  })
  it('extrae el verbo normalizado', () => {
    expect(verboDe('Señalar los requisitos')).toBe('señalar')
    expect(verboDe('Ética General')).toBeNull()
  })
})

describe('clasificarTipo', () => {
  it('calcular y resolver son cálculo', () => {
    expect(clasificarTipo('Calcular el precio limpio de un bono.')).toBe('calculo')
    expect(clasificarTipo('Resolver problemas de tasas de interés simple e interés compuesto.')).toBe('calculo')
  })
  it('menciones a cálculo o fórmula en el texto también cuentan', () => {
    expect(clasificarTipo('Identificar la fórmula del rendimiento al vencimiento.')).toBe('calculo')
    expect(clasificarTipo('Identificar el cálculo de la duración.')).toBe('calculo')
  })
  it('interpretar y determinar NO son cálculo por sí solos (son teoría en el temario)', () => {
    expect(clasificarTipo('Interpretar las fases de un ciclo económico.')).toBe('teoria')
    expect(clasificarTipo('Determinar en situaciones concretas el cumplimiento del principio ético.')).toBe('teoria')
    expect(clasificarTipo('Identificar los elementos del acto humano.')).toBe('teoria')
  })
})

describe('areaDeMateria', () => {
  it.each([
    ['Ética', 'etica'],
    ['Servicios de Inversión', 'servicios'],
    ['Marco Normativo I', 'normativo'],
    ['Marco Normativo III', 'normativo'],
    ['Matemáticas Financieras', 'matematicas'],
    ['Portafolios de Inversión', 'matematicas'],
    ['Mercado de Capitales II', 'capitales'],
    ['Títulos de Deuda I', 'deuda'],
    ['Fondos de Inversión', 'fondos'],
    ['Derivados Financieros II', 'derivados'],
    ['Riesgos I', 'derivados'],
    ['Análisis Económico III', 'analisis'],
    ['Análisis Financiero II', 'analisis'],
    ['Análisis Técnico', 'analisis']
  ])('%s -> %s', (materia, area) => {
    expect(areaDeMateria(materia)).toBe(area)
  })
  it('falla con materias desconocidas', () => {
    expect(() => areaDeMateria('Cocina')).toThrow(/materia/i)
  })
})

describe('parsearTemario (sintético)', () => {
  const fila = (a: string, b: string) => [[{ tipo: 'parrafo' as const, runs: [], texto: a }], [{ tipo: 'parrafo' as const, runs: [], texto: b }]]
  const tabla = (filas: string[][]): BloqueDocx => ({ tipo: 'tabla', filas: filas.map(([a, b]) => fila(a ?? '', b ?? '')) })

  const relleno = ['Servicios de Inversión', 'Marco Normativo I', 'Matemáticas Financieras', 'Mercado de Capitales I', 'Títulos de Deuda I', 'Fondos de Inversión', 'Derivados Financieros I', 'Análisis Técnico'].flatMap((m) => [[m, 'Tema'], [' ', 'Identificar un objetivo cualquiera.']])

  it('arma materia → subtema → objetivos y respeta objetivos sin encabezado', () => {
    const t = parsearTemario([tabla([['Área de Evaluación', 'Resultados de Aprendizaje'], ['Ética', 'Identificar la ética sin encabezado.'], [' ', ' '], [' ', 'Ética General'], [' ', 'Calcular algo importante.'], ...relleno])], 'x', '2026-01-01')
    const etica = t.areas.find((a) => a.area === 'etica')
    expect(etica?.temas[0]?.id).toBe('etica.etica')
    expect(etica?.temas[0]?.subtemas.map((s) => s.nombre)).toEqual(['General', 'Ética General'])
    expect(etica?.temas[0]?.subtemas[1]?.objetivos[0]).toMatchObject({ id: 'etica.etica.etica-general.o01', verbo: 'calcular', tipo: 'calculo', exclusivoFig3: false })
  })

  it('falla si falta la tabla del temario', () => {
    expect(() => parsearTemario([], 'x', 'y')).toThrow(/tabla/)
  })
})

describe('parsearTemario (documento real)', () => {
  let tax: Taxonomia
  beforeAll(async () => {
    const bloques = await leerDocx(readFileSync(join(RAIZ, DOC_TEMARIO)))
    tax = parsearTemario(bloques, DOC_TEMARIO, '2026-10-14')
  })

  it('valida contra el esquema y trae las 9 áreas en orden', () => {
    expect(TaxonomiaSchema.safeParse(tax).success).toBe(true)
    expect(tax.areas.map((a) => a.area)).toEqual(AREAS.map((a) => a.id))
  })

  it('cuenta exactamente 22 materias, 76 subtemas y 465 objetivos (541 filas con texto)', () => {
    const r = resumenTaxonomia(tax)
    expect(r.total.temas).toBe(22)
    expect(r.total.subtemas).toBe(76)
    expect(r.total.objetivos).toBe(465)
    expect(r.total.subtemas + r.total.objetivos).toBe(541)
  })

  it('reparte objetivos por área (verificado contra el conteo directo de filas)', () => {
    const r = resumenTaxonomia(tax)
    expect(Object.fromEntries(r.porArea.map((a) => [a.area, a.objetivos]))).toEqual(OBJETIVOS_POR_AREA)
    expect(Object.fromEntries(r.porArea.map((a) => [a.area, a.temas]))).toEqual(TEMAS_POR_AREA)
  })

  it('todos los ids son únicos', () => {
    const ids: string[] = []
    for (const a of tax.areas) for (const t of a.temas) { ids.push(t.id); for (const s of t.subtemas) { ids.push(s.id); for (const o of s.objetivos) ids.push(o.id) } }
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('conoce entradas puntuales', () => {
    const deuda = tax.areas.find((a) => a.area === 'deuda')!
    const tdI = deuda.temas.find((t) => t.nombre === 'Títulos de Deuda I')!
    expect(tdI.id).toBe('deuda.titulos-de-deuda-i')
    const reporto = tdI.subtemas.find((s) => s.nombre === 'Reporto y Préstamo de Valores')!
    expect(reporto.id).toBe('deuda.titulos-de-deuda-i.reporto-y-prestamo-de-valores')
    expect(reporto.objetivos[2]?.id).toBe('deuda.titulos-de-deuda-i.reporto-y-prestamo-de-valores.o03')
    const etica = tax.areas.find((a) => a.area === 'etica')!.temas[0]!
    expect(etica.nombre).toBe('Ética')
    expect(etica.subtemas.map((s) => s.nombre)).toEqual(['Ética General', 'Ética de la Empresa', 'Ética Bursátil', 'Código de Ética Profesional de la Comunidad Bursátil Mexicana'])
    expect(etica.subtemas[0]?.objetivos[0]?.texto).toBe('Identificar los siguientes conceptos: ética, moral, principios, valores, acto humano, acto del hombre, libertad, responsabilidad, justicia, equidad, norma, bien y virtud.')
    expect(etica.subtemas[0]?.objetivos[0]?.verbo).toBe('identificar')
  })

  it('normaliza espacios dobles en nombres de materia', () => {
    const nombres = tax.areas.flatMap((a) => a.temas.map((t) => t.nombre))
    expect(nombres).toContain('Marco Normativo II')
    expect(nombres).toContain('Marco Normativo III')
    expect(nombres).toContain('Derivados Financieros II')
    expect(nombres.every((n) => !/\s{2,}/.test(n))).toBe(true)
  })

  it('marca cálculo en objetivos de matemáticas y no en ética', () => {
    const mat = tax.areas.find((a) => a.area === 'matematicas')!
    const calc = mat.temas.flatMap((t) => t.subtemas.flatMap((s) => s.objetivos)).filter((o) => o.tipo === 'calculo')
    expect(calc.length).toBe(16)
    const etica = tax.areas.find((a) => a.area === 'etica')!
    expect(etica.temas.flatMap((t) => t.subtemas.flatMap((s) => s.objetivos)).every((o) => o.tipo === 'teoria')).toBe(true)
  })

  it('todos los objetivos reales inician con verbo', () => {
    for (const a of tax.areas) for (const t of a.temas) for (const s of t.subtemas) for (const o of s.objetivos) expect(o.verbo).not.toBeNull()
  })
})

// Conteo independiente (Python sobre el XML crudo): etica 42, servicios 32, normativo 75, matematicas 49,
// capitales 42, deuda 31, fondos 52, derivados 75, analisis 67 = 465.
const OBJETIVOS_POR_AREA: Record<string, number> = {
  etica: 42,
  servicios: 32,
  normativo: 75,
  matematicas: 49,
  capitales: 42,
  deuda: 31,
  fondos: 52,
  derivados: 75,
  analisis: 67
}
const TEMAS_POR_AREA: Record<string, number> = { etica: 1, servicios: 1, normativo: 3, matematicas: 2, capitales: 2, deuda: 2, fondos: 1, derivados: 4, analisis: 6 }
