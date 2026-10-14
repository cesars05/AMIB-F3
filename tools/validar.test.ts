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

describe('validarContenido: índice del manual', () => {
  const seccion = (numero: string, extra: Record<string, unknown> = {}) => ({
    capitulo: 6,
    numero,
    numeroOriginal: numero,
    correccionNumero: 'ninguna',
    titulo: 'Identificar el concepto de mercado de deuda.',
    origen: 'encabezado',
    paginas: { inicio: 183, fin: 183 },
    objetivoId: null,
    objetivoCandidato: null,
    confianza: 0.2,
    exclusivoFig3: false,
    fig3Parcial: false,
    archivo: `content/manual/cap06/${numero.split('.').pop()!.padStart(2, '0')}-x.md`,
    caracteres: 100,
    ...extra
  })
  const indice = (secciones: unknown[]): ArchivoContenido => ({ ruta: 'content/manual/indice.json', datos: { fuente: 'x', generado: '2026-01-01', secciones } })

  it('acepta un índice válido y lo resume', () => {
    const r = validarContenido([indice([seccion('6.1.1'), seccion('6.1.2', { exclusivoFig3: true })])])
    expect(r.errores).toEqual([])
    expect(r.resumen.manual).toMatchObject({ secciones: 2, porCapitulo: { 6: 2 }, vinculadas: 0, exclusivasFig3: 1 })
    expect(r.resumen.manual?.archivos).toHaveLength(2)
  })

  it('reporta errores de esquema con la ruta', () => {
    const r = validarContenido([indice([seccion('6.1.1', { capitulo: 12 })])])
    expect(r.errores[0]).toContain('content/manual/indice.json')
  })

  it('detecta archivos repetidos, números repetidos sin marcar como dudosos y carpetas de otro capítulo', () => {
    expect(validarContenido([indice([seccion('6.1.1'), seccion('6.1.2', { archivo: seccion('6.1.1').archivo })])]).errores.some((e) => /archivo de sección repetido/.test(e))).toBe(true)
    expect(validarContenido([indice([seccion('6.1.1'), seccion('6.1.1', { archivo: 'content/manual/cap06/09-y.md' })])]).errores.some((e) => /número de sección repetido/.test(e))).toBe(true)
    expect(validarContenido([indice([seccion('6.1.1'), seccion('6.1.1', { archivo: 'content/manual/cap06/09-y.md', correccionNumero: 'dudosa' })])]).errores).toEqual([])
    expect(validarContenido([indice([seccion('6.1.1', { archivo: 'content/manual/cap07/01-x.md' })])]).errores.some((e) => /otro capítulo/.test(e))).toBe(true)
  })

  it('las páginas no pueden retroceder entre secciones', () => {
    const r = validarContenido([indice([seccion('6.1.1', { paginas: { inicio: 190, fin: 190 } }), seccion('6.1.2', { paginas: { inicio: 183, fin: 183 } })])])
    expect(r.errores.some((e) => /retroceden/.test(e))).toBe(true)
  })

  it('el objetivoId debe existir en la taxonomía', () => {
    const areas = ['etica', 'servicios', 'normativo', 'matematicas', 'capitales', 'deuda', 'fondos', 'derivados', 'analisis'].map((a) => ({
      area: a,
      temas: [{ id: `${a}.t`, nombre: 'Tema', subtemas: [{ id: `${a}.t.s`, nombre: 'Subtema', objetivos: [{ id: `${a}.t.s.o01`, texto: 'Identificar algo', verbo: 'identificar', tipo: 'teoria' }] }] }]
    }))
    const tax: ArchivoContenido = { ruta: 'content/taxonomia.json', datos: { fuente: 'x', generado: 'y', areas } }
    const bien = seccion('6.1.1', { objetivoId: 'deuda.t.s.o01', objetivoCandidato: 'deuda.t.s.o01', confianza: 0.9 })
    expect(validarContenido([tax, indice([bien])]).errores).toEqual([])
    const mal = seccion('6.1.1', { objetivoId: 'deuda.t.s.o99', objetivoCandidato: 'deuda.t.s.o99', confianza: 0.9 })
    expect(validarContenido([tax, indice([mal])]).errores.some((e) => /objetivoId inexistente/.test(e))).toBe(true)
  })
})
