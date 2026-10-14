import { describe, expect, it } from 'vitest'
import { problemasDeEstilo, validarContenido, type ArchivoContenido } from './validar'

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

describe('validarContenido: estilo de redacción', () => {
  const generada = (extra: Record<string, unknown> = {}) => pregunta('gen.01', { fuente: 'generada', ...extra })
  const errores = (...ps: unknown[]) => validarContenido([archivoPreguntas('content/preguntas/generadas/a.json', ps)]).errores

  it('problemasDeEstilo detecta cada caracter prohibido y el guion como viñeta', () => {
    expect(problemasDeEstilo('Texto normal: con comas, punto y coma; (paréntesis) 1. lista y rangos "de 20 a 25"')).toEqual([])
    for (const c of ['—', '–', '·', '•', '°', '*']) expect(problemasDeEstilo(`antes ${c} después`), c).toEqual([`caracter prohibido "${c}"`])
    expect(problemasDeEstilo('- primer elemento\n- segundo')).toEqual(['guion usado como viñeta'])
    expect(problemasDeEstilo('Introducción:\n  - elemento con sangría')).toEqual(['guion usado como viñeta'])
  })
  it('el guion dentro de una palabra, un número negativo y las flechas de proceso se permiten', () => {
    expect(problemasDeEstilo('Bono cupón-cero, tasa de -3.5% y secuencia A → B → C, CNBV-AMIB')).toEqual([])
  })

  it('rechaza caracteres prohibidos en enunciado, opciones, explicación y porQueNo de preguntas generadas', () => {
    const e = errores(
      generada({
        enunciado: '¿Cuál es el rendimiento — anual?',
        opciones: [{ texto: 'a * b' }, { texto: 'b', porQueNo: 'Mal – por 5°' }, { texto: 'c' }, { texto: 'd' }],
        explicacion: '- Primero\n- Segundo'
      })
    )
    expect(e).toHaveLength(5)
    expect(e.some((x) => x.includes('gen.01 enunciado') && x.includes('—'))).toBe(true)
    expect(e.some((x) => x.includes('opciones[0].texto') && x.includes('*'))).toBe(true)
    expect(e.some((x) => x.includes('opciones[1].porQueNo') && x.includes('–'))).toBe(true)
    expect(e.some((x) => x.includes('opciones[1].porQueNo') && x.includes('°'))).toBe(true)
    expect(e.some((x) => x.includes('explicacion') && x.includes('viñeta'))).toBe(true)
    expect(e.every((x) => x.endsWith('(estilo de redacción)'))).toBe(true)
  })
  it('también aplica a las generadas en vivo', () => {
    expect(errores(generada({ fuente: 'generada-en-vivo', enunciado: 'Texto · con punto medio' }))).toHaveLength(1)
  })
  it('las preguntas oficiales y las del OCR están exentas', () => {
    for (const fuente of ['oficial-ejemplo', 'manual-ensayo', 'manual-repaso', 'externa']) {
      expect(errores(pregunta(`x.${fuente}`, { fuente, enunciado: 'Texto — con * y ° del OCR', estado: 'borrador', clave: null })), fuente).toEqual([])
    }
  })

  it('revisa todo el texto de las guías y lecciones en JSON, incluso anidado', () => {
    const r = validarContenido([
      { ruta: 'content/guias/deuda.json', datos: { titulo: 'Deuda', secciones: [{ texto: 'Cupón — tasa' }, { texto: 'Limpio' }] } },
      { ruta: 'content/lecciones/uno.json', datos: { texto: 'Con asterisco *' } }
    ])
    expect(r.errores).toEqual(['content/guias/deuda.json secciones[0].texto: caracter prohibido "—" (estilo de redacción)', 'content/lecciones/uno.json texto: caracter prohibido "*" (estilo de redacción)'])
  })
  it('revisa el Markdown de guías y lecciones, salvo el encabezado YAML', () => {
    const md = (texto: string): ArchivoContenido => ({ ruta: 'content/guias/a.md', datos: texto })
    expect(validarContenido([md('---\ntitulo: Guía\netiquetas:\n  - deuda\n---\n# Guía\n\nTexto limpio, con comas.')]).errores).toEqual([])
    // `**negritas**` es marcado permitido; un asterisco suelto no.
    expect(validarContenido([md('---\ntitulo: Guía\n---\n# Guía\n\n- viñeta\n**negritas** y nota*')]).errores).toEqual([
      'content/guias/a.md: caracter prohibido "*" (estilo de redacción)',
      'content/guias/a.md: guion usado como viñeta (estilo de redacción)'
    ])
  })
  it('el manual en OCR y la taxonomía no se revisan', () => {
    const manual = validarContenido([{ ruta: 'content/manual/cap01/01-a.md', datos: 'texto — con * y •' }])
    expect(manual.errores).toEqual(['content/manual/cap01/01-a.md: archivo de contenido no reconocido'])
  })
})

describe('validarContenido: claves del libro', () => {
  const clavesLibro = { fuente: 'f', pagina: 359, titulo: 't', nota: 'n', capitulos: [{ capitulo: 6, nombre: 'Deuda', claves: ['a', 'c', 'd'] }] }
  const repaso = (extra: Record<string, unknown>) => pregunta('manual-repaso.c06.q09', { fuente: 'manual-repaso', area: 'deuda', estado: 'borrador', ...extra })
  const validar = (p: unknown) => validarContenido([{ ruta: 'content/claves/respuestas-libro-amib1.json', datos: clavesLibro }, archivoPreguntas('content/preguntas/repasos/a.json', [p])]).errores

  it('acepta una clave que coincide con la oficial de su número del libro', () => {
    expect(validar(repaso({ numeroLibro: 2, clave: 2 }))).toEqual([])
  })
  it('rechaza una clave sin numeroLibro', () => {
    expect(validar(repaso({ clave: 2 }))).toEqual(['content/preguntas/repasos/a.json: manual-repaso.c06.q09 tiene clave sin numeroLibro'])
  })
  it('rechaza una clave distinta de la oficial o de un número que no existe', () => {
    expect(validar(repaso({ numeroLibro: 2, clave: 0 }))).toEqual(['content/preguntas/repasos/a.json: manual-repaso.c06.q09 (libro 2) tiene clave a pero la oficial es c'])
    expect(validar(repaso({ numeroLibro: 9, clave: 0 }))[0]).toContain('no existe en la clave oficial')
  })
  it('sin clave no se exige nada, y un archivo de claves inválido se reporta', () => {
    expect(validar(repaso({ clave: null }))).toEqual([])
    const r = validarContenido([{ ruta: 'content/claves/x.json', datos: { capitulos: [] } }])
    expect(r.errores[0]).toContain('content/claves/x.json')
  })
})
