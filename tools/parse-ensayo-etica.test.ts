import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { ArchivoPreguntasSchema, idsDuplicados } from '../app/src/core/contenido'
import { leerDocx } from './docx'
import { extraerEnsayo, extraerRespuestas, parsearEnsayoEtica } from './parse-ensayo-etica'
import { parsearPreguntasTipo } from './parse-preguntas-tipo'
import { DOC_MANUAL_ETICA, DOC_PREGUNTAS_TIPO, RAIZ } from './rutas'

const MD_MINI = `
<!-- pag. 9 del PDF -->

## Ensayo de examen

Instrucciones:

#### Sub área: Ética General

- 1.- Se define como la capacidad de elegir:

a) verdad b) hábito c) libertad

d) voluntad

5.- ¿Cuál es el objeto general de estudio de la ética?

a) Los actos humanos.

b) La voluntad.

- c) Las circunstancias.

d) Los actos del hombre.

<!-- pag. 10 del PDF -->

- 7.- Los elementos del acto humano son EXCEPTO:

   - a) Objeto, circunstancia y valor.

   - b) Objeto, fin e intención.

   - c) Objeto, fin y circunstancia.

   - d) Objeto, fin y valor.

Sub Área: Ética de la Empresa

## Sección de respuestas

|1.|**c)**|5.|**a)**|
|---|---|---|---|
|7.|**b)**|||
`

describe('extraerEnsayo (sintético)', () => {
  const qs = extraerEnsayo(MD_MINI)
  it('lee opciones en línea, con viñetas y sangría, y quita las líneas de "Sub área"', () => {
    expect(qs.map((q) => q.numero)).toEqual([1, 5, 7])
    expect(qs[0]?.enunciado).toBe('Se define como la capacidad de elegir:')
    expect(qs[0]?.opciones).toEqual(['verdad', 'hábito', 'libertad', 'voluntad'])
    expect(qs[1]?.opciones).toEqual(['Los actos humanos.', 'La voluntad.', 'Las circunstancias.', 'Los actos del hombre.'])
    expect(qs[2]?.opciones[3]).toBe('Objeto, fin y valor.')
  })
  it('la página es la del PDF: el marcador N cierra la página N, así que el contenido siguiente es N+1', () => {
    expect(qs.map((q) => q.pagina)).toEqual([10, 10, 11])
  })
  it('lee la tabla de respuestas de dos columnas', () => {
    expect(extraerRespuestas(MD_MINI)).toEqual(new Map([[1, 'c'], [5, 'a'], [7, 'b']]))
  })
  it('falla si falta una sección', () => {
    expect(() => extraerEnsayo('# nada')).toThrow(/Ensayo de examen/)
    expect(() => extraerRespuestas('# nada')).toThrow(/respuestas/)
  })
})

describe('parsearEnsayoEtica (sintético)', () => {
  it('arma preguntas validadas con clave, cita y formato', () => {
    const a = parsearEnsayoEtica(MD_MINI, 'x', '2026-01-01')
    expect(a.preguntas).toHaveLength(3)
    expect(a.preguntas[2]).toMatchObject({ id: 'etica-ensayo.07', area: 'etica', clave: 1, formato: 'excepto', tipo: 'teoria', fuente: 'manual-ensayo', estado: 'validada' })
    expect(a.preguntas[2]?.cita).toEqual({ documento: 'AMIB Data/Manual_EBSPMV_completo.md', pagina: 11 })
  })
  it('exige clave para cada pregunta', () => {
    expect(() => parsearEnsayoEtica(MD_MINI.replace('|7.|**b)**|||', ''), 'x', 'y')).toThrow(/clave/)
  })
})

describe('Manual_EBSPMV_completo.md real', () => {
  let md: string
  let archivo: ReturnType<typeof parsearEnsayoEtica>
  beforeAll(async () => {
    md = readFileSync(join(RAIZ, DOC_MANUAL_ETICA), 'utf8')
    const tipo = parsearPreguntasTipo(await leerDocx(readFileSync(join(RAIZ, DOC_PREGUNTAS_TIPO))), DOC_PREGUNTAS_TIPO, '2026-10-14')
    archivo = parsearEnsayoEtica(md, DOC_MANUAL_ETICA, '2026-10-14', tipo.preguntas)
  })

  it('trae 31 preguntas numeradas 1..31 con cuatro opciones y 31 claves', () => {
    expect(archivo.preguntas).toHaveLength(31)
    expect(archivo.preguntas.map((p) => p.id)).toEqual(Array.from({ length: 31 }, (_, i) => `etica-ensayo.${String(i + 1).padStart(2, '0')}`))
    expect(archivo.preguntas.every((p) => p.opciones.length === 4 && p.clave !== null && p.estado === 'validada')).toBe(true)
    expect(extraerRespuestas(md).size).toBe(31)
  })

  it('valida contra el esquema, ids únicos, todo en el área ética', () => {
    expect(ArchivoPreguntasSchema.safeParse(archivo).success).toBe(true)
    expect(idsDuplicados(archivo.preguntas)).toEqual([])
    expect(archivo.preguntas.every((p) => p.area === 'etica' && p.fuente === 'manual-ensayo' && !p.extra)).toBe(true)
  })

  it('las claves coinciden con la tabla de respuestas del manual', () => {
    // Tabla "Sección de respuestas" del manual, de la 1 a la 31.
    const letras = archivo.preguntas.map((p) => 'abcd'[p.clave!]).join('')
    expect(letras).toBe('ccdbaacdbbaacbcabacaaacbddbcbdd')
  })

  it('cada pregunta trae número de página del PDF (74..80)', () => {
    const paginas = archivo.preguntas.map((p) => p.cita?.pagina)
    expect(paginas.every((n) => typeof n === 'number')).toBe(true)
    expect(Math.min(...(paginas as number[]))).toBe(74)
    expect(Math.max(...(paginas as number[]))).toBe(80)
    expect(archivo.preguntas[0]?.cita).toEqual({ documento: 'AMIB Data/Manual_EBSPMV_completo.md', pagina: 74 })
    expect(archivo.preguntas[12]?.cita?.pagina).toBe(76) // q13 abre la página 76
    expect(archivo.preguntas[28]?.cita?.pagina).toBe(80) // q29 abre la página 80
  })

  it('conoce preguntas puntuales', () => {
    const q1 = archivo.preguntas[0]!
    expect(q1.enunciado).toBe('Se define como la capacidad de elegir:')
    expect(q1.opciones.map((o) => o.texto)).toEqual(['verdad', 'hábito', 'libertad', 'voluntad'])
    expect(q1.clave).toBe(2)
    const q16 = archivo.preguntas[15]!
    expect(q16.enunciado).toContain('Generar confianza en el público inversionista.')
    expect(q16.opciones.map((o) => o.texto)).toEqual(['1, 2, 6', '1, 4, 5', '3, 4, 5', '2, 3, 6'])
    const q31 = archivo.preguntas[30]!
    expect(q31.clave).toBe(3)
    expect(q31.opciones[3]?.texto).toBe('Salvaguarda la confidencialidad de la información de los clientes.')
  })

  it('marca el duplicado de tipo.25 (y deja ambas preguntas)', () => {
    expect(archivo.preguntas[0]?.notas).toContain('duplicado de tipo.25')
  })

  it('detecta también los otros duplicados con Preguntas Tipo, sin dejar de conservarlos', () => {
    const dup = archivo.preguntas.filter((p) => p.notas.some((n) => n.startsWith('duplicado de'))).map((p) => [p.id, p.notas.filter((n) => n.startsWith('duplicado de'))])
    expect(dup).toEqual(DUPLICADOS_ESPERADOS)
  })
})

// Las 4 preguntas de Ética de Preguntas Tipo (q25–q28) están copiadas tal cual en el ensayo, con la misma clave.
const DUPLICADOS_ESPERADOS: unknown[] = [
  ['etica-ensayo.01', ['duplicado de tipo.25']],
  ['etica-ensayo.12', ['duplicado de tipo.26']],
  ['etica-ensayo.15', ['duplicado de tipo.27']],
  ['etica-ensayo.19', ['duplicado de tipo.28']]
]
