import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { ArchivoPreguntasSchema, idsDuplicados } from '../app/src/core/contenido'
import { parsearManual, type ManualParseado } from './parse-manual'
import { aPreguntaEntrada, copiasRepetidas, extraerPreguntasRepaso, NOTA_NUMERO_INCIERTO, NOTA_SIN_CLAVE, numerarGrupos, parsearRepasos, unirOpcionesSeparadas } from './parse-repaso'
import { DOC_MANUAL_AMIB, RAIZ } from './rutas'

/** Preguntas por capítulo del cuadernillo (las da la clave oficial de la p. 359). */
const TOTALES = { 1: 25, 2: 15, 3: 15, 4: 15, 5: 25, 6: 25, 7: 15, 8: 25, 9: 15 }

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
      ['Actúa ', 'Actúa ', 'Haz pr', 'Nouses'],
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
    expect(r.omitidas).toEqual([{ ordinal: 1, pagina: 25, motivo: 'no se reconocen las cuatro opciones', numeroLibro: null }])
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

describe('marcadores de opción muy estropeados', () => {
  it('d) sin paréntesis ("d Los montos", "di _ Aumentos") y c) leído como ej, e) o £)', () => {
    const r = extraerPreguntasRepaso(
      lineas(`Tratándose de clientes sofisticados, solo estarán obligados a conocer:
a) Sus objetivos de inversión
b) Sus ingresos anuales
c) Su nivel de tolerancia al riesgo
d Los montos a invertir
El Análisis Horizontal es conocido también como:
a) Compras y ventas
b) Porcentual
c) Sumas y Restas por variable
di _ Aumentos y Disminuciones
Define el concepto de Soporte:
a) Precio base de compra
b) Precio mínimo en donde la demanda puede ser mayor
Ej Precio máximo en donde la demanda puede ser mayor
d) Es el inverso de la Resistencia`)
    )
    expect(r.omitidas).toEqual([])
    expect(r.preguntas.map((p) => p.opciones[3])).toEqual(['Los montos a invertir', 'Aumentos y Disminuciones', 'Es el inverso de la Resistencia'])
    expect(r.preguntas[2]!.opciones[2]).toBe('Precio máximo en donde la demanda puede ser mayor')
    expect(r.preguntas[0]!.avisos).toContain('OCR: 1 marcador(es) de opción irregulares')
  })

  it('"El" y "Es" al inicio de una línea no son marcadores', () => {
    const r = extraerPreguntasRepaso(lineas(`¿Qué es el reporto en el mercado de valores?\na) Un préstamo\nb) Una venta\nEl contrato de intermediación en el cual se pacta un premio\nc) Otro contrato distinto\nd) Ninguno de los anteriores`))
    expect(r.preguntas[0]!.opciones[1]).toBe('Una venta El contrato de intermediación en el cual se pacta un premio')
  })

  it('la d) pegada a la c) ("de Cupón") se rescata como cuarta opción cuando empieza la pregunta siguiente', () => {
    const r = extraerPreguntasRepaso(
      lineas(`Es la tasa de retorno de un bono y tiene una relación inversa con el precio:
a) Tasa cupón
b) Tasa de rendimiento
c) Plazo del cupón
de Cupón
Es el pago periódico de interés que efectúan los emisores durante la vida del bono:
a) Tasa cupón
b) Tasa de rendimiento
c) Plazo del cupón
d) Cupón`)
    )
    expect(r.omitidas).toEqual([])
    expect(r.preguntas.map((p) => p.opciones[3])).toEqual(['Cupón', 'Cupón'])
    expect(r.preguntas[1]!.enunciado).toBe('Es el pago periódico de interés que efectúan los emisores durante la vida del bono:')
  })

  it('quita la viñeta que el OCR deja antes de una opción, sin tocar cifras', () => {
    const r = extraerPreguntasRepaso(lineas(`Pregunta de prueba con cifras en las opciones:\na) — Texto con viñeta\nb) -3.5% de rendimiento\nc) .Texto con punto\nd) 100 Udis`))
    expect(r.preguntas[0]!.opciones).toEqual(['Texto con viñeta', '-3.5% de rendimiento', 'Texto con punto', '100 Udis'])
  })
})

describe('unirOpcionesSeparadas', () => {
  const l = (texto: string) => ({ texto, pagina: 239 })
  const textos = ['Para proveer los precios que conforman la cartera', 'Para contribuir a la adecuada toma de decisiones', 'Para que se depositen en el INDEVAL', 'Para determinar el precio diario de la valuación']

  it('reúne marcadores sueltos con los cuatro textos que los siguen, aunque haya menos marcadores', () => {
    const r = unirOpcionesSeparadas([l('13. ¿Para qué sirven los prospectos?'), l('a)'), l('b)'), l('c)'), l('a)'), ...textos.map(l)])
    expect(r.map((x) => x.texto).slice(1)).toEqual(textos.map((t, i) => `${'abcd'[i]}) ${t}`))
    expect(r.slice(1).every((x) => x.reconstruida)).toBe(true)
    expect(unirOpcionesSeparadas([l('15. Es una característica:'), l('a) b)'), ...textos.map(l)]).slice(1)).toHaveLength(4)
  })

  it('no toca nada si después de los marcadores no hay exactamente cuatro textos de opción', () => {
    const entrada = [l('13. Pregunta'), l('a)'), l('b)'), l('c)'), l('d)'), l(textos[0]!), l(textos[1]!), l(textos[2]!), l('- 116')]
    expect(unirOpcionesSeparadas(entrada)).toEqual(entrada)
  })
})

describe('numerarGrupos', () => {
  it('con tantas preguntas como el cuadernillo y sin contradicciones, el número es la posición', () => {
    expect(numerarGrupos([null, null, null], 3).numeros).toEqual([1, 2, 3])
    expect(numerarGrupos([1, null, 3], 3).numeros).toEqual([1, 2, 3])
  })
  it('si faltan preguntas, solo se numera lo que las anclas impresas permiten asegurar', () => {
    // 4 detectadas de 6: anclas 3 y 4 consecutivas, la primera y la última quedan con huecos sin cubrir.
    expect(numerarGrupos([null, 3, 4, null], 6).numeros).toEqual([null, 3, 4, null])
    // Hueco que se llena exacto entre dos anclas.
    expect(numerarGrupos([9, null, null, 12], 15).numeros).toEqual([9, 10, 11, 12])
    // Bordes que se llenan exacto: desde el 1 hasta la primera ancla y desde la última hasta el final.
    expect(numerarGrupos([null, null, 3, null], 4).numeros).toEqual([1, 2, 3, 4])
  })
  it('descarta anclas fuera de rango o incoherentes con el orden (un "22," que es un 12)', () => {
    expect(numerarGrupos([11, 22, 13], 15).numeros).toEqual([11, 12, 13])
    expect(numerarGrupos([5, 3, null], 15).numeros).toEqual([5, null, null])
  })
  it('sin total solo hay anclas, y se rellenan los huecos que encajan exacto', () => {
    expect(numerarGrupos([null, 2, null]).numeros).toEqual([1, 2, null])
    expect(numerarGrupos([null, null, null]).numeros).toEqual([null, null, null])
  })
})

describe('copiasRepetidas', () => {
  const base = [
    'Conductas prohibidas del líder colocador en las emisiones de valores',
    'Aprobación de políticas contra los conflictos de interés en servicios',
    'Divulgación de las comisiones cobradas por la prestación de servicios',
    'Reportes de análisis que reflejan el punto de vista de los analistas',
    'Obligaciones de la guía de servicios y los mecanismos de difusión'
  ]
  it('una racha de tres o más preguntas que reaparece en el mismo orden son copias', () => {
    const textos = [...base, ...base.slice(0, 4)]
    expect(copiasRepetidas(textos, textos.map(() => false))).toEqual([0, 1, 2, 3, 4, 0, 1, 2, 3])
  })
  it('un parecido aislado (dos subastas con enunciados casi iguales) no es copia', () => {
    const textos = [base[0]!, base[1]!, base[2]!, base[0]!, base[4]!]
    expect(copiasRepetidas(textos, textos.map(() => false))).toEqual([0, 1, 2, 3, 4])
  })
})

describe('aPreguntaEntrada', () => {
  const q = {
    ordinal: 7,
    enunciado: 'Calcular el precio limpio de un bono con 764 días por vencer.',
    opciones: ['$1', '$2', '$3', '$4'] as [string, string, string, string],
    pagina: 210,
    avisos: ['OCR: algo'],
    numeroLibro: 7 as number | null,
    duplicadoDe: null as number | null,
    ruido: 0
  }

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
      cita: { documento: 'AMIB Data/AMIB_1_completo.md', pagina: 210 },
      numeroLibro: 7
    })
    expect(p.notas).toEqual([NOTA_SIN_CLAVE, 'OCR: algo'])
  })
  it('sin número del libro no lleva numeroLibro y lo avisa en las notas', () => {
    const p = aPreguntaEntrada({ ...q, numeroLibro: null }, 6)
    expect('numeroLibro' in p).toBe(false)
    expect(p.notas).toContain(NOTA_NUMERO_INCIERTO)
  })
  it('una copia repetida del libro se retira y apunta a la copia que se conserva', () => {
    const p = aPreguntaEntrada({ ...q, ordinal: 10, numeroLibro: 10, duplicadoDe: 16 }, 2)
    expect(p.estado).toBe('retirada')
    expect((p.notas ?? []).join(' ')).toContain('duplicado de manual-repaso.c02.q16')
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

  const bloques = () => m.capitulos.flatMap((c) => (c.repaso ? [c.repaso] : []))

  it('preguntas extraídas, omitidas y con número del libro por capítulo (cuadernillos de 15 o 25 preguntas)', () => {
    const { resumen } = parsearRepasos(bloques(), DOC_MANUAL_AMIB, '2026-10-14', TOTALES)
    expect(resumen.map((r) => [r.capitulo, r.parseadas, r.omitidas, r.conNumeroLibro, r.distintas, r.copias])).toEqual([
      [1, 25, 0, 25, 25, 0],
      [2, 19, 2, 19, 15, 5],
      [3, 9, 6, 9, 15, 0],
      [4, 12, 3, 12, 15, 0],
      [5, 23, 2, 23, 25, 0],
      [6, 21, 4, 21, 25, 0],
      [7, 4, 7, 4, 11, 0],
      [8, 22, 3, 22, 25, 0],
      [9, 11, 4, 11, 15, 0]
    ])
    expect(resumen.reduce((n, r) => n + r.parseadas, 0)).toBe(146)
  })

  it('capítulo 2: el libro repite las preguntas 10 a 15 (la página 69 reescanea la 67) y las 21 detectadas son 15 distintas', () => {
    const c2 = m.capitulos[1]!.repaso!
    const r = extraerPreguntasRepaso(c2.lineas, { total: 15 })
    expect(r.distintas).toBe(15)
    expect(r.preguntas.length + r.omitidas.length).toBe(21)
    // Ordinales 10 a 15 (página 67) = ordinales 16 a 21 (página 69): mismo número del libro.
    const numero = (o: number) => [...r.preguntas, ...r.omitidas].find((x) => x.ordinal === o)!.numeroLibro
    expect([10, 11, 12, 13, 14, 15].map(numero)).toEqual([10, 11, 12, 13, 14, 15])
    expect([16, 17, 18, 19, 20, 21].map(numero)).toEqual([10, 11, 12, 13, 14, 15])
    // De cada pareja se conserva una sola copia como borrador; la otra se retira.
    const retiradas = r.preguntas.filter((p) => p.duplicadoDe !== null).map((p) => p.ordinal)
    expect(retiradas).toEqual([10, 11, 13, 14, 18])
    const vivas = r.preguntas.filter((p) => p.duplicadoDe === null && p.numeroLibro! >= 10)
    expect(new Set(vivas.map((p) => p.numeroLibro)).size).toBe(vivas.length)
  })

  it('capítulo 7: las preguntas 1 a 8 vienen con las dos columnas mezcladas en cada renglón; solo se numeran las de la página 239', () => {
    const r = extraerPreguntasRepaso(m.capitulos[6]!.repaso!.lineas, { total: 15 })
    expect(r.preguntas.map((p) => [p.ordinal, p.numeroLibro])).toEqual([
      [6, 10],
      [7, 11],
      [8, 12],
      [9, 13]
    ])
    // Los restos de la página 238 no reciben número: una pregunta mal numerada recibiría la clave de otra.
    expect(r.omitidas.filter((o) => o.ordinal <= 5).map((o) => o.numeroLibro)).toEqual([1, null, null, null, null])
    // La 13 trae los marcadores a), b), c), d) en líneas sueltas; se reúnen con sus cuatro textos, en orden.
    const q13 = r.preguntas.find((p) => p.numeroLibro === 13)!
    expect(q13.opciones[1]).toBe('Para contribuir a la adecuada toma de decisiones por parte del público inversionista')
    expect(q13.avisos).toContain('OCR: opciones reunidas desde líneas separadas (se supone el orden a, b, c, d)')
  })

  it('capítulos con el mismo número de preguntas detectadas que el cuadernillo: el número del libro es el ordinal', () => {
    for (const cap of [1, 5, 6, 8]) {
      const r = extraerPreguntasRepaso(m.capitulos[cap - 1]!.repaso!.lineas, { total: 25 })
      expect(r.distintas).toBe(25)
      for (const p of [...r.preguntas, ...r.omitidas]) expect(p.numeroLibro).toBe(p.ordinal)
    }
  })

  it('sin el total del cuadernillo solo se numera con los números impresos junto al enunciado', () => {
    const r = extraerPreguntasRepaso(m.capitulos[0]!.repaso!.lineas)
    expect(r.preguntas.every((p) => p.numeroLibro === null)).toBe(true)
  })

  it('todo cumple el esquema: 4 opciones no vacías, ids únicos y área por capítulo; sin clave ni estado de validación', () => {
    const { archivo } = parsearRepasos(bloques(), DOC_MANUAL_AMIB, '2026-10-14', TOTALES)
    expect(ArchivoPreguntasSchema.safeParse(archivo).success).toBe(true)
    expect(idsDuplicados(archivo.preguntas)).toEqual([])
    for (const p of archivo.preguntas) {
      expect(p.opciones).toHaveLength(4)
      expect(p.opciones.every((o) => o.texto.length > 0)).toBe(true)
      expect(p.clave).toBeNull()
      expect(['borrador', 'retirada']).toContain(p.estado)
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
    const { archivo } = parsearRepasos(bloques(), DOC_MANUAL_AMIB, '2026-10-14', TOTALES)
    for (const p of archivo.preguntas) {
      const cap = m.capitulos[Number(p.id.slice(15, 17)) - 1]!
      expect(p.cita?.pagina).toBeGreaterThanOrEqual(cap.repaso!.paginas.inicio)
      expect(p.cita?.pagina).toBeLessThanOrEqual(cap.repaso!.paginas.fin)
    }
  })

  it('una pregunta conocida del capítulo 6 (TIIE/CETES con cifras) conserva las cifras del OCR', () => {
    const { archivo } = parsearRepasos(bloques(), DOC_MANUAL_AMIB, '2026-10-14', TOTALES)
    const q = archivo.preguntas.find((p) => p.enunciado.includes('$9.842179'))!
    expect(q.opciones.map((o) => o.texto)).toEqual(['7.284046%', '7.400347%', '6.673212%', '8.327698%'])
    expect(q.tipo).toBe('calculo')
    expect(q.notas.some((n) => n.startsWith('OCR: contiene cifras'))).toBe(true)
  })

  it('es determinista', () => {
    expect(JSON.stringify(parsearRepasos(bloques(), DOC_MANUAL_AMIB, '2026-10-14', TOTALES))).toBe(JSON.stringify(parsearRepasos(bloques(), DOC_MANUAL_AMIB, '2026-10-14', TOTALES)))
  })
})
