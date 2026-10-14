import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { ArchivoPreguntasSchema, idsDuplicados } from '../app/src/core/contenido'
import { parsearManual, type ManualParseado } from './parse-manual'
import { aPreguntaEntrada, extraerPreguntasRepaso, NOTA_SIN_CLAVE, parsearRepasos } from './parse-repaso'
import { DOC_MANUAL_AMIB, RAIZ } from './rutas'

const lineas = (texto: string, pagina = 25) => texto.split('\n').filter((l) => l.trim() !== '').map((l) => ({ texto: l, pagina }))

describe('extraerPreguntasRepaso (fixtures del OCR real)', () => {
  it('pregunta limpia: enunciado partido en párrafos y cuatro opciones', () => {
    const r = extraerPreguntasRepaso(
      lineas(`El director de promeción de una casa de bolsa le
pide al gerente de operaciones que madifique la
asignación. ¿Cómo debe actuar el gerente?
a) No modificar la asignación y evadir el hecho
b) No modiftcar la asignación y comunicar el incidente
c) Seguir las instrucciones del director
d) Seguir las instrueciones pero comentarle`)
    )
    expect(r.omitidas).toEqual([])
    expect(r.preguntas).toHaveLength(1)
    expect(r.preguntas[0]!.enunciado).toBe('El director de promeción de una casa de bolsa le pide al gerente de operaciones que madifique la asignación. ¿Cómo debe actuar el gerente?')
    expect(r.preguntas[0]!.opciones[1]).toBe('No modiftcar la asignación y comunicar el incidente')
    expect(r.preguntas[0]!.avisos).toEqual([])
  })

  it('marcadores estropeados por el OCR: bl, dj, bj, C), cy, dy y a|', () => {
    const r = extraerPreguntasRepaso(
      lineas(`El Cádigo de Ética es:
a) El conjunto de normas de mayor jerarquia
bl Esun conjunto de normas que completa la regulación
c) Esun conjunto de reglas expedida por la BMV
dj Esun conjunto de normas que expide el mercado
Principio que supone conacer y seguir las normas del medio bursátil:
a) Actúa de acuerdo con las disposiciones aplicables
bj — Actúa con base en una conducta integra
C) Haz prevalecer el interés de los clientes
d) Nouses ni divulgues información privilegiada
Es la tasa de retorno de un bono y tiene una relación inversa con el precio:
a| Tasa cupón
b) Tasa de rendimiento
cy Plazo del cupón
dy Cupón`)
    )
    expect(r.omitidas).toEqual([])
    expect(r.preguntas.map((p) => p.opciones.map((o) => o.slice(0, 6)))).toEqual([
      ['El con', 'Esun c', 'Esun c', 'Esun c'],
      ['Actúa ', '— Actú', 'Haz pr', 'Nouses'],
      ['Tasa c', 'Tasa d', 'Plazo ', 'Cupón']
    ])
    expect(r.preguntas[0]!.avisos).toContain('OCR: 2 marcador(es) de opción irregulares')
    expect(r.preguntas[0]!.pagina).toBe(25)
  })

  it('opciones en una sola línea y la a) en la línea del enunciado', () => {
    const r = extraerPreguntasRepaso(
      lineas(`¿Cuál es el objeto general de estudio de la ética? a) Losactos humanos
b) Lavoluntad
c) Lascircunstancias
d) Losactos del hombre
Actos que carecen de inteligencia, voluntad y libertad: a) Actos del Hombre b) Actos Humanos c) Actos del Ser d) Actos Naturales`)
    )
    expect(r.omitidas).toEqual([])
    expect(r.preguntas.map((p) => p.opciones)).toEqual([
      ['Losactos humanos', 'Lavoluntad', 'Lascircunstancias', 'Losactos del hombre'],
      ['Actos del Hombre', 'Actos Humanos', 'Actos del Ser', 'Actos Naturales']
    ])
    expect(r.preguntas[0]!.enunciado).toBe('¿Cuál es el objeto general de estudio de la ética?')
  })

  it('el enunciado de la pregunta siguiente pegado a la opción d) se corta en el "¿"', () => {
    const r = extraerPreguntasRepaso(
      lineas(`Selecciona los beneficios de contar con la certificación de AMIB:
a) 1y2
b) 1y3
c) 2y3
d) 1y3 ¿Cuáles son los tres elementos del Acto Humano?
a) Objeto, Fin y Circunstancias
b) Ética, Moral y Ley
c) Transparencia, Secrecía y Equidad
d) Pensamiento, Obra y Omisión`)
    )
    expect(r.preguntas).toHaveLength(2)
    expect(r.preguntas[0]!.opciones[3]).toBe('1y3')
    expect(r.preguntas[1]!.enunciado).toBe('¿Cuáles son los tres elementos del Acto Humano?')
  })

  it('quita números sueltos, pies de página y el número que antecede al enunciado', () => {
    const r = extraerPreguntasRepaso(
      lineas(`12.
13.
Pág. 344
13. El valor Nominal de los UDIBONOS es:
a) 100 Udis
b) 100 Pesos
c) 10 Udis
d) 1,000 pesos`)
    )
    expect(r.preguntas).toHaveLength(1)
    expect(r.preguntas[0]!.enunciado).toBe('El valor Nominal de los UDIBONOS es:')
    expect(r.preguntas[0]!.avisos).toContain('OCR: contiene cifras; verifícalas contra la página del manual')
  })

  it('omite (y cuenta) una pregunta sin las cuatro opciones, sin que el resto se desplace', () => {
    const r = extraerPreguntasRepaso(
      lineas(`Es el mercado donde se negocian títulos de crédito a corto, mediano y largo plazo:
a) Mercado de Capitales
b) Mercado de Derivados
Cuando el inversionista mantiene el título de deuda hasta su vencimiento se considera una:
a) Operación de arbitraje
b) Operación de Préstamo
c) Operación de Reporto
d) Operación en Directo`)
    )
    expect(r.preguntas).toHaveLength(1)
    expect(r.preguntas[0]!.ordinal).toBe(2)
    expect(r.preguntas[0]!.enunciado).toContain('Cuando el inversionista mantiene')
    expect(r.omitidas).toEqual([{ ordinal: 1, pagina: 25, motivo: 'no se reconocen las cuatro opciones' }])
  })

  it('omite enunciados truncados, con columnas mezcladas o con restos de otra pregunta', () => {
    const r = extraerPreguntasRepaso(
      lineas(`Durante la fiesta de fin de año el promotor comenta con su jefe las operaciones de un cliente. ¿Qué principio fundamental es
a) Actúa de acuerdo con las disposiciones
b) Haz prevalecer el interés de tu cliente
c) Salvaguarda la confidencialidad
d) No uses información privilegiada
El Fondo tiene una cartera de acciones y su precio pasa de $17.22 a $17.19 5. Silacotización del peso contra el dólar subiera, ¿cuál sería el efecto?
a) Sube
b) Baja
c) Igual
d) Ninguno
Define el concepto de Soporte:
a) Precio base de compra
Ej Precio máximo en donde la demanda puede ser mayor a la oferta d) Es el inverso de la Resistencia 3. Se refiere a la cantidad total
a) Oferta Agregada
b) Gasto corriente
c) Demanda cruzada
d) Demanda agregada`)
    )
    expect(r.preguntas).toHaveLength(0)
    expect(r.omitidas.map((o) => o.motivo)).toEqual([
      'enunciado truncado ("¿" sin cerrar)',
      'columnas mezcladas (numeración de otra pregunta en el enunciado)',
      'no se reconocen las cuatro opciones',
      'marcador de opción dentro del enunciado (opciones perdidas de otra pregunta)'
    ])
  })

  it('una nueva a) con una pregunta a medias rescata el enunciado de la siguiente', () => {
    const r = extraerPreguntasRepaso(
      lineas(`Primera pregunta incompleta del repaso:
a) Opción uno
b) Opción dos
Los títulos del Gobierno Federal son colocados a través de:
a) Oferta Privada
b) Subasta
c) Oferta Pública
d) Oferta Mixta`)
    )
    expect(r.omitidas).toHaveLength(1)
    expect(r.preguntas).toHaveLength(1)
    expect(r.preguntas[0]!.enunciado).toBe('Los títulos del Gobierno Federal son colocados a través de:')
    expect(r.preguntas[0]!.opciones).toEqual(['Oferta Privada', 'Subasta', 'Oferta Pública', 'Oferta Mixta'])
  })

  it('la página de la pregunta es la de su primera línea de enunciado', () => {
    const r = extraerPreguntasRepaso([
      { texto: 'Cuando el inversionista puede mantener el título hasta su vencimiento se considera una:', pagina: 209 },
      { texto: 'a) Operación de arbitraje', pagina: 210 },
      { texto: 'b) Operación de Préstamo', pagina: 210 },
      { texto: 'c) Operación de Reporto', pagina: 210 },
      { texto: 'd) Operación en Directo', pagina: 210 }
    ])
    expect(r.preguntas[0]!.pagina).toBe(209)
  })
})

describe('aPreguntaEntrada', () => {
  const q = { ordinal: 7, enunciado: 'Calcular el precio limpio de un bono con 764 días por vencer.', opciones: ['$1', '$2', '$3', '$4'] as [string, string, string, string], pagina: 210, avisos: ['OCR: algo'] }

  it('arma la pregunta como borrador sin clave, con id estable, área del capítulo y cita', () => {
    const p = aPreguntaEntrada(q, 6)
    expect(p).toMatchObject({
      id: 'manual-repaso.c06.q07',
      area: 'deuda',
      clave: null,
      estado: 'borrador',
      fuente: 'manual-repaso',
      tipo: 'calculo',
      formato: 'calculo',
      cita: { documento: 'AMIB Data/AMIB_1_completo.md', pagina: 210 }
    })
    expect(p.notas).toEqual([NOTA_SIN_CLAVE, 'OCR: algo'])
  })
  it('detecta EXCEPTO y deja la teoría como directa', () => {
    expect(aPreguntaEntrada({ ...q, enunciado: 'Se considera gran público, EXCEPTO:' }, 3)).toMatchObject({ formato: 'excepto', tipo: 'teoria', area: 'normativo' })
    expect(aPreguntaEntrada({ ...q, enunciado: 'Es el mercado donde se negocian títulos de deuda:' }, 6).formato).toBe('directa')
  })
  it('el capítulo 10 no tiene área', () => {
    expect(() => aPreguntaEntrada(q, 10)).toThrow(/no tiene área/)
  })
})

describe('repasos del manual real', () => {
  let m: ManualParseado
  beforeAll(() => {
    m = parsearManual(readFileSync(join(RAIZ, DOC_MANUAL_AMIB), 'utf8'))
  }, 60_000)

  it('preguntas extraídas y omitidas por capítulo (cuadernillo de 25 preguntas por capítulo)', () => {
    const { resumen } = parsearRepasos(m.capitulos.flatMap((c) => (c.repaso ? [c.repaso] : [])), DOC_MANUAL_AMIB, '2026-10-14')
    expect(resumen.map((r) => [r.capitulo, r.parseadas, r.omitidas])).toEqual([
      [1, 25, 0],
      [2, 15, 6],
      [3, 9, 6],
      [4, 12, 3],
      [5, 18, 7],
      [6, 20, 5],
      [7, 4, 8],
      [8, 19, 6],
      [9, 8, 7]
    ])
    expect(resumen.reduce((n, r) => n + r.parseadas, 0)).toBe(130)
    expect(resumen.reduce((n, r) => n + r.omitidas, 0)).toBe(48)
  })

  it('todo cumple el esquema: 4 opciones no vacías, sin clave, borrador, ids únicos y área por capítulo', () => {
    const { archivo } = parsearRepasos(m.capitulos.flatMap((c) => (c.repaso ? [c.repaso] : [])), DOC_MANUAL_AMIB, '2026-10-14')
    expect(ArchivoPreguntasSchema.safeParse(archivo).success).toBe(true)
    expect(idsDuplicados(archivo.preguntas)).toEqual([])
    for (const p of archivo.preguntas) {
      expect(p.opciones).toHaveLength(4)
      expect(p.opciones.every((o) => o.texto.length > 0)).toBe(true)
      expect(p.clave).toBeNull()
      expect(p.estado).toBe('borrador')
      expect(p.fuente).toBe('manual-repaso')
      expect(p.notas).toContain(NOTA_SIN_CLAVE)
      expect(p.id).toMatch(/^manual-repaso\.c0[1-9]\.q\d{2}$/)
    }
    const area = (cap: number) => new Set(archivo.preguntas.filter((p) => p.id.startsWith(`manual-repaso.c0${cap}.`)).map((p) => p.area))
    expect([...area(1)]).toEqual(['etica'])
    expect([...area(6)]).toEqual(['deuda'])
    expect([...area(8)]).toEqual(['derivados'])
  })

  it('la página citada cae dentro del repaso de su capítulo', () => {
    const { archivo } = parsearRepasos(m.capitulos.flatMap((c) => (c.repaso ? [c.repaso] : [])), DOC_MANUAL_AMIB, '2026-10-14')
    for (const p of archivo.preguntas) {
      const cap = m.capitulos[Number(p.id.slice(15, 17)) - 1]!
      expect(p.cita?.pagina).toBeGreaterThanOrEqual(cap.repaso!.paginas.inicio)
      expect(p.cita?.pagina).toBeLessThanOrEqual(cap.repaso!.paginas.fin)
    }
  })

  it('una pregunta conocida del capítulo 6 (TIIE/CETES con cifras) conserva las cifras del OCR', () => {
    const { archivo } = parsearRepasos(m.capitulos.flatMap((c) => (c.repaso ? [c.repaso] : [])), DOC_MANUAL_AMIB, '2026-10-14')
    const q = archivo.preguntas.find((p) => p.enunciado.includes('$9.842179'))!
    expect(q.opciones.map((o) => o.texto)).toEqual(['7.284046%', '7.400347%', '6.673212%', '8.327698%'])
    expect(q.tipo).toBe('calculo')
    expect(q.notas.some((n) => n.startsWith('OCR: contiene cifras'))).toBe(true)
  })

  it('es determinista', () => {
    const bloques = m.capitulos.flatMap((c) => (c.repaso ? [c.repaso] : []))
    expect(JSON.stringify(parsearRepasos(bloques, DOC_MANUAL_AMIB, '2026-10-14'))).toBe(JSON.stringify(parsearRepasos(bloques, DOC_MANUAL_AMIB, '2026-10-14')))
  })
})
