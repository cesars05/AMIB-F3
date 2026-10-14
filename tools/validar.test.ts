import { describe, expect, it } from 'vitest'
import { validarContenido, type ArchivoContenido } from './validar'

const pregunta = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  area: 'etica',
  enunciado: 'Pregunta de prueba',
  opciones: [{ texto: 'a' }, { texto: 'b' }, { texto: 'c' }, { texto: 'd' }],
  clave: 0,
  tipo: 'teoria',
  formato: 'directa',
  fuente: 'oficial-ejemplo',
  estado: 'validada',
  ...extra
})
const archivoPreguntas = (ruta: string, preguntas: unknown[]): ArchivoContenido => ({ ruta, datos: { fuente: 'x', generado: '2026-01-01', preguntas } })

describe('validarContenido', () => {
  it('acepta preguntas válidas y resume por área, estado y fuente', () => {
    const r = validarContenido([archivoPreguntas('content/preguntas/oficial/a.json', [pregunta('a.01'), pregunta('a.02', { area: 'deuda', estado: 'borrador', clave: null, fuente: 'externa' })])])
    expect(r.errores).toEqual([])
    expect(r.resumen.preguntas).toBe(2)
    expect(r.resumen.porArea).toEqual({ etica: 1, deuda: 1 })
    expect(r.resumen.porEstado).toEqual({ validada: 1, borrador: 1 })
    expect(r.resumen.porFuente).toEqual({ 'oficial-ejemplo': 1, externa: 1 })
  })

  it('reporta errores de esquema con la ruta del archivo', () => {
    const r = validarContenido([archivoPreguntas('content/preguntas/x.json', [pregunta('x.01', { clave: 7 })])])
    expect(r.errores.length).toBeGreaterThan(0)
    expect(r.errores[0]).toContain('content/preguntas/x.json')
  })

  it('detecta ids repetidos entre archivos distintos', () => {
    const r = validarContenido([archivoPreguntas('content/preguntas/a.json', [pregunta('dup.01')]), archivoPreguntas('content/preguntas/b.json', [pregunta('dup.01')])])
    expect(r.errores.some((e) => e.includes('dup.01') && /repetido|duplicado/i.test(e))).toBe(true)
  })

  it('rechaza archivos JSON que no reconoce', () => {
    const r = validarContenido([{ ruta: 'content/otro.json', datos: {} }])
    expect(r.errores[0]).toMatch(/no reconocido/)
  })

  it('exige que subtemaId y objetivoId existan en la taxonomía', () => {
    const areas = ['etica', 'servicios', 'normativo', 'matematicas', 'capitales', 'deuda', 'fondos', 'derivados', 'analisis'].map((a) => ({
      area: a,
      temas: [{ id: `${a}.t`, nombre: 'Tema', subtemas: [{ id: `${a}.t.s`, nombre: 'Subtema', objetivos: [{ id: `${a}.t.s.o01`, texto: 'Identificar algo', verbo: 'identificar', tipo: 'teoria' }] }] }]
    }))
    const tax: ArchivoContenido = { ruta: 'content/taxonomia.json', datos: { fuente: 'x', generado: 'y', areas } }
    const bien = validarContenido([tax, archivoPreguntas('content/preguntas/a.json', [pregunta('a.01', { subtemaId: 'etica.t.s', objetivoId: 'etica.t.s.o01' })])])
    expect(bien.errores).toEqual([])
    expect(bien.resumen.taxonomia).toEqual({ temas: 9, subtemas: 9, objetivos: 9 })
    const mal = validarContenido([tax, archivoPreguntas('content/preguntas/a.json', [pregunta('a.01', { subtemaId: 'no.existe' }), pregunta('a.02', { objetivoId: 'tampoco' })])])
    expect(mal.errores).toHaveLength(2)
    expect(mal.errores[0]).toMatch(/subtemaId inexistente/)
    expect(mal.errores[1]).toMatch(/objetivoId inexistente/)
  })

  it('detecta ids repetidos dentro de la taxonomía', () => {
    const area = (a: string) => ({ area: a, temas: [{ id: 'igual', nombre: 'Tema', subtemas: [{ id: 'igual.s', nombre: 'Sub', objetivos: [] }] }] })
    const areas = ['etica', 'servicios', 'normativo', 'matematicas', 'capitales', 'deuda', 'fondos', 'derivados', 'analisis'].map(area)
    const r = validarContenido([{ ruta: 'content/taxonomia.json', datos: { fuente: 'x', generado: 'y', areas } }])
    expect(r.errores[0]).toMatch(/ids de taxonomía repetidos/)
  })
})
