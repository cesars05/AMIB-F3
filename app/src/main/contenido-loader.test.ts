import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cargarContenido, resolverRaizContenido, validarArchivoPreguntas, validarLeccion } from './contenido-loader'

const pregunta = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  area: 'deuda',
  enunciado: 'Enunciado de prueba suficientemente largo',
  opciones: [{ texto: 'a' }, { texto: 'b' }, { texto: 'c' }, { texto: 'd' }],
  clave: 1,
  tipo: 'teoria',
  formato: 'directa',
  fuente: 'generada',
  estado: 'validada',
  ...extra
})
const leccion = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  area: 'deuda',
  materia: 'Títulos de Deuda I',
  orden: 1,
  titulo: 'CETES',
  resumen: 'Resumen',
  duracionMin: 20,
  fuentes: [{ documento: 'AMIB Data/AMIB_1_completo.md' }],
  laminas: [{ id: 'uno', titulo: 'Uno', bloques: [{ tipo: 'parrafo', texto: 'Texto' }] }],
  puntosClave: ['a', 'b', 'c'],
  practica: ['g.1', 'g.2', 'g.3'],
  miniExamen: ['g.4', 'g.5', 'g.6'],
  ...extra
})

describe('resolverRaizContenido', () => {
  it('usa resources/content empaquetado y content/ en desarrollo', () => {
    expect(resolverRaizContenido({ empaquetado: true, recursos: '/r', raizApp: '/app' })).toBe(join('/r', 'content'))
    expect(resolverRaizContenido({ empaquetado: false, recursos: '/r', raizApp: '/app' })).toBe(join('/app', 'content'))
  })
  it('la variable de entorno solo cuenta fuera de producción', () => {
    expect(resolverRaizContenido({ empaquetado: false, recursos: '/r', raizApp: '/app', entorno: '/x' })).toBe('/x')
    expect(resolverRaizContenido({ empaquetado: true, recursos: '/r', raizApp: '/app', entorno: '/x' })).toBe(join('/r', 'content'))
  })
})

describe('validación de archivos', () => {
  it('omite solo las preguntas inválidas y conserva las demás', () => {
    const r = validarArchivoPreguntas({ preguntas: [pregunta('a.1'), pregunta('a.2', { clave: 9 }), { id: 'a.3' }] }, 'x.json')
    expect(r.preguntas.map((p) => p.id)).toEqual(['a.1'])
    expect(r.errores).toHaveLength(2)
    expect(r.errores[0]).toContain('a.2')
  })
  it('rechaza un archivo sin lista de preguntas', () => {
    expect(validarArchivoPreguntas({ foo: 1 }, 'y.json').errores[0]).toContain('"preguntas"')
    expect(validarArchivoPreguntas(null, 'y.json').preguntas).toEqual([])
  })
  it('valida lecciones', () => {
    expect(validarLeccion(leccion('d.1'), 'l.json').leccion?.id).toBe('d.1')
    expect(validarLeccion(leccion('d.1', { puntosClave: ['solo'] }), 'l.json').error).toContain('lección omitida')
  })
})

describe('cargarContenido', () => {
  let raiz: string
  beforeEach(() => {
    raiz = mkdtempSync(join(tmpdir(), 'amib-contenido-'))
    mkdirSync(join(raiz, 'preguntas', 'generadas'), { recursive: true })
    mkdirSync(join(raiz, 'lecciones', 'deuda'), { recursive: true })
  })
  afterEach(() => rmSync(raiz, { recursive: true, force: true }))

  it('carga preguntas y lecciones, omite lo inválido y registra los errores', () => {
    writeFileSync(join(raiz, 'preguntas', 'a.json'), JSON.stringify({ preguntas: [pregunta('g.1'), pregunta('g.2')] }))
    writeFileSync(join(raiz, 'preguntas', 'generadas', 'b.json'), JSON.stringify({ preguntas: [pregunta('g.2'), pregunta('g.3')] }))
    writeFileSync(join(raiz, 'preguntas', 'roto.json'), '{ no es json')
    writeFileSync(join(raiz, 'lecciones', 'deuda', 'ok.json'), JSON.stringify(leccion('d.cetes')))
    writeFileSync(join(raiz, 'lecciones', 'deuda', 'mala.json'), JSON.stringify(leccion('d.mala', { laminas: [] })))
    const log: string[] = []
    const c = cargarContenido(raiz, (m) => log.push(m))
    expect(c.banco.map((p) => p.id)).toEqual(['g.1', 'g.2', 'g.3'])
    expect(c.lecciones.map((l) => l.id)).toEqual(['d.cetes'])
    expect(c.taxonomia).toBeNull()
    expect(c.errores.some((e) => e.includes('JSON ilegible'))).toBe(true)
    expect(c.errores.some((e) => e.includes('id de pregunta repetido g.2'))).toBe(true)
    expect(c.errores.some((e) => e.includes('lección omitida'))).toBe(true)
    expect(c.avisos.some((a) => a.includes('pregunta inexistente g.4'))).toBe(true)
    expect(log.length).toBe(c.errores.length + c.avisos.length)
  })

  it('no falla si faltan las carpetas', () => {
    const c = cargarContenido(join(raiz, 'no-existe'))
    expect(c.banco).toEqual([])
    expect(c.lecciones).toEqual([])
    expect(c.errores[0]).toContain('taxonomia.json')
  })
})

describe('contenido real del repositorio', () => {
  it('carga sin lanzar y con taxonomía', () => {
    const c = cargarContenido(join(import.meta.dirname, '..', '..', '..', 'content'))
    expect(c.taxonomia?.areas).toHaveLength(9)
    expect(c.banco.length).toBeGreaterThan(50)
  })
})
