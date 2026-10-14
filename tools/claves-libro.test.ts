import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { PreguntaSchema, type Pregunta } from '../app/src/core/contenido'
import { aplicarClaves, ClavesLibroSchema, CIFRAS_VERIFICADAS, contarPalabras, motivosDeRuido, NOTA_CLAVE, REVISION_CLAVE, totalesPorCapitulo, type ClavesLibro } from './claves-libro'
import { construirContenido, type ResultadoConstruccion } from './construir'
import { NOTA_NUMERO_INCIERTO, NOTA_SIN_CLAVE } from './parse-repaso'
import { RAIZ, RUTA_CLAVES_LIBRO } from './rutas'

const TIEMPO_LIMITE = 60_000
const claves = ClavesLibroSchema.parse(JSON.parse(readFileSync(join(RAIZ, RUTA_CLAVES_LIBRO), 'utf8')))

describe('clave oficial del libro (p. 359)', () => {
  it('trae 9 capítulos: 25 preguntas en los capítulos 1, 5, 6 y 8 y 15 en los demás', () => {
    expect(totalesPorCapitulo(claves)).toEqual({ 1: 25, 2: 15, 3: 15, 4: 15, 5: 25, 6: 25, 7: 15, 8: 25, 9: 15 })
    expect(claves.capitulos.reduce((n, c) => n + c.claves.length, 0)).toBe(175)
  })
  it('el esquema rechaza letras fuera de a-d y capítulos fuera de 1 a 9', () => {
    expect(() => ClavesLibroSchema.parse({ ...claves, capitulos: [{ capitulo: 1, nombre: 'x', claves: ['e'] }] })).toThrow()
    expect(() => ClavesLibroSchema.parse({ ...claves, capitulos: [{ capitulo: 10, nombre: 'x', claves: ['a'] }] })).toThrow()
  })
})

describe('motivosDeRuido', () => {
  const vocab = contarPalabras(['el reporto es una operación de mercado de valores con premio'], 3)
  const p = (enunciado: string, opciones: string[], notas: string[] = []) => ({ enunciado, opciones: opciones.map((texto) => ({ texto })), notas })

  it('un texto con palabras del vocabulario está limpio', () => {
    expect(motivosDeRuido(p('El reporto es una operación', ['premio', 'valores', 'mercado', 'operación']), vocab)).toEqual([])
  })
  it('palabras ausentes del vocabulario, siglas mal leídas, símbolos y letras pegadas a cifras son ruido', () => {
    const m = motivosDeRuido(p('El reporto es una operaciom', ['premio', 'BMYV valores', 'De38:00a8:25 horas', '| mercado']), vocab)
    expect(m.join(' | ')).toContain('palabras dudosas: operaciom')
    expect(m.join(' | ')).toContain('sigla mal leída por el OCR: BMYV')
    expect(m.join(' | ')).toContain('letras y cifras pegadas')
    expect(m.join(' | ')).toContain('símbolos o letras sueltas')
  })
  it('los avisos de marcadores del extractor cuentan, pero el aviso de cifras no', () => {
    expect(motivosDeRuido(p('El reporto', ['premio', 'valores', 'mercado', 'operación'], ['OCR: 2 marcador(es) de opción irregulares']), vocab)).toEqual(['2 marcador(es) de opción irregulares'])
    expect(motivosDeRuido(p('El reporto', ['premio', 'valores', 'mercado', 'operación'], ['OCR: contiene cifras; verifícalas contra la página del manual']), vocab)).toEqual([])
  })
})

describe('aplicarClaves', () => {
  const vocab = contarPalabras(['el reporto es una operación de mercado de valores con premio y subasta oferta'], 3)
  const mini: ClavesLibro = { ...claves, capitulos: [{ capitulo: 6, nombre: 'Deuda', claves: ['a', 'c', 'd'] }] }
  const q = (ordinal: number, extra: Partial<Pregunta> = {}): Pregunta =>
    PreguntaSchema.parse({
      id: `manual-repaso.c06.q${String(ordinal).padStart(2, '0')}`,
      area: 'deuda',
      enunciado: 'El reporto es una operación de mercado',
      opciones: ['premio', 'valores', 'subasta', 'oferta'].map((texto) => ({ texto })),
      clave: null,
      tipo: 'teoria',
      formato: 'directa',
      fuente: 'manual-repaso',
      estado: 'borrador',
      notas: [NOTA_SIN_CLAVE],
      ...extra
    })

  it('pone la clave por número del libro (no por ordinal), cambia la nota y valida solo si el texto está limpio', () => {
    const { preguntas, resumen } = aplicarClaves([q(9, { numeroLibro: 2 })], mini, vocab)
    expect(preguntas[0]).toMatchObject({ clave: 2, estado: 'validada' })
    expect(preguntas[0]!.notas).toEqual([NOTA_CLAVE])
    expect(resumen.porCapitulo[6]).toMatchObject({ conClave: 1, validadas: 1 })
  })
  it('con ruido de OCR la clave se pone pero la pregunta queda en borrador con el motivo', () => {
    const { preguntas } = aplicarClaves([q(1, { numeroLibro: 1, enunciado: 'El reporto es una operaciom de mercado' })], mini, vocab)
    expect(preguntas[0]).toMatchObject({ clave: 0, estado: 'borrador' })
    expect(preguntas[0]!.notas.join(' ')).toContain('palabras dudosas: operaciom')
  })
  it('sin numeroLibro no hay clave, aunque el ordinal exista en la clave oficial', () => {
    const { preguntas } = aplicarClaves([q(1, { notas: [NOTA_SIN_CLAVE, NOTA_NUMERO_INCIERTO] })], mini, vocab)
    expect(preguntas[0]).toMatchObject({ clave: null, estado: 'borrador' })
    expect(preguntas[0]!.notas).toContain(NOTA_NUMERO_INCIERTO)
  })
  it('las retiradas no reciben clave', () => {
    const { preguntas, resumen } = aplicarClaves([q(1, { numeroLibro: 1, estado: 'retirada' })], mini, vocab)
    expect(preguntas[0]).toMatchObject({ clave: null, estado: 'retirada' })
    expect(resumen.porCapitulo[6]!.retiradas).toBe(1)
  })
  it('las cifras sin verificar mantienen el borrador; verificadas y limpias se validan', () => {
    const conCifras = q(1, { numeroLibro: 1, enunciado: 'El reporto es una operación de 28 premio', notas: [NOTA_SIN_CLAVE, 'OCR: contiene cifras; verifícalas contra la página del manual'] })
    expect(aplicarClaves([conCifras], mini, vocab).preguntas[0]!.estado).toBe('borrador')
    expect(aplicarClaves([conCifras], mini, vocab, new Set(['6.1'])).preguntas[0]!.estado).toBe('validada')
  })
  it('una clave oficial en revisión se conserva pero nunca se valida', () => {
    expect(REVISION_CLAVE['2.8']).toBeDefined()
    const dos: ClavesLibro = { ...claves, capitulos: [{ capitulo: 2, nombre: 'Servicios', claves: ['c', 'a', 'a', 'a', 'a', 'a', 'c', 'd'] }] }
    const rev = q(8, { id: 'manual-repaso.c02.q08', numeroLibro: 8 })
    const { preguntas } = aplicarClaves([rev], dos, vocab)
    expect(preguntas[0]).toMatchObject({ clave: 3, estado: 'borrador' })
    expect(preguntas[0]!.notas.join(' ')).toContain('clave por revisar')
  })
})

describe('claves aplicadas al repaso real', () => {
  let r: ResultadoConstruccion
  beforeAll(async () => {
    r = await construirContenido(RAIZ, '2026-10-14')
  }, TIEMPO_LIMITE)
  const por = (id: string) => r.repasosManual.preguntas.find((p) => p.id === id)!
  const letra = (id: string) => 'abcd'[por(id).clave!]

  it('ninguna pregunta recibe clave sin numeroLibro, y la clave es la oficial de ese número', () => {
    for (const p of r.repasosManual.preguntas) {
      if (p.clave === null) continue
      expect(p.numeroLibro, p.id).toBeDefined()
      const cap = Number(p.id.slice(15, 17))
      expect('abcd'[p.clave], p.id).toBe(claves.capitulos.find((c) => c.capitulo === cap)!.claves[p.numeroLibro! - 1])
      expect(p.notas, p.id).toContain(NOTA_CLAVE)
      expect(p.notas, p.id).not.toContain(NOTA_SIN_CLAVE)
    }
  })

  it('las validadas tienen clave; las retiradas no; las demás conservan la nota si no hay clave', () => {
    for (const p of r.repasosManual.preguntas) {
      if (p.estado === 'validada') expect(p.clave, p.id).not.toBeNull()
      if (p.estado === 'retirada') expect(p.clave, p.id).toBeNull()
      if (p.clave === null && p.estado !== 'retirada') expect(p.notas, p.id).toContain(NOTA_SIN_CLAVE)
    }
  })

  it('recuento por capítulo: con número del libro, con clave, validadas y borradores', () => {
    const t = Object.fromEntries(Object.entries(r.resumenClaves.porCapitulo).map(([c, x]) => [c, [x.preguntas, x.conNumeroLibro, x.conClave, x.validadas, x.borradores, x.retiradas]]))
    expect(t).toEqual({
      1: [25, 25, 25, 5, 20, 0],
      2: [19, 14, 14, 0, 14, 5],
      3: [9, 9, 9, 0, 9, 0],
      4: [12, 12, 12, 2, 10, 0],
      5: [23, 23, 23, 1, 22, 0],
      6: [21, 21, 21, 3, 18, 0],
      7: [4, 4, 4, 0, 4, 0],
      8: [22, 22, 22, 2, 20, 0],
      9: [11, 11, 11, 1, 10, 0]
    })
  })

  // Tres preguntas por capítulo, leídas contra el manual o recalculadas: [id, número del libro, letra de la clave, inicio del texto de la opción correcta].
  const ALINEACION: [string, number, string, string][] = [
    ['manual-repaso.c01.q03', 3, 'a', 'El conjunto de normas de mayor jerarquia'],
    ['manual-repaso.c01.q10', 10, 'b', 'Actúa con base en una conducta profesional integra'],
    ['manual-repaso.c01.q24', 24, 'd', 'Ética'],
    ['manual-repaso.c02.q16', 10, 'c', 'Nopodrán cobrar comisión alguna al cliente'],
    ['manual-repaso.c02.q19', 13, 'a', 'Los Analistas responsables de su elaboración'],
    ['manual-repaso.c02.q06', 6, 'a', 'El perfil del Producto Financiero'],
    ['manual-repaso.c03.q04', 4, 'c', 'Contrapartes centrales de valores'],
    ['manual-repaso.c03.q07', 7, 'a', 'Operación prencupante'],
    ['manual-repaso.c03.q15', 15, 'c', 'Nominativos'],
    ['manual-repaso.c04.q08', 8, 'b', '17.88%'],
    ['manual-repaso.c04.q09', 9, 'a', '8.09%'],
    ['manual-repaso.c04.q15', 15, 'a', 'Frontera Eficiente'],
    ['manual-repaso.c05.q19', 19, 'b', 'El precio teórico del ADR es de $15.89'],
    ['manual-repaso.c05.q21', 21, 'c', 'El capital no carabia, aumenta el precio'],
    ['manual-repaso.c05.q25', 25, 'd', '7.71%'],
    ['manual-repaso.c06.q16', 16, 'a', '7.284046%'],
    ['manual-repaso.c06.q23', 23, 'd', '$1033945'],
    ['manual-repaso.c06.q10', 10, 'c', 'El premio'],
    // Capítulo 7: el ordinal (6, 7, 9) NO es el número del libro (10, 11, 13).
    ['manual-repaso.c07.q06', 10, 'b', 'Operadoras de Fondos de Inversión'],
    ['manual-repaso.c07.q07', 11, 'd', 'Esuna SA de CV autorizada por la CNBY'],
    ['manual-repaso.c07.q09', 13, 'b', 'Para contribuir a la adecuada toma de decisiones'],
    ['manual-repaso.c08.q03', 3, 'd', '0.155'],
    ['manual-repaso.c08.q24', 24, 'd', '$29.68'],
    ['manual-repaso.c08.q25', 25, 'a', 'Stradole'],
    ['manual-repaso.c09.q01', 1, 'd', 'Estado de Situación Financiera'],
    ['manual-repaso.c09.q10', 10, 'c', 'Fijo'],
    ['manual-repaso.c09.q13', 13, 'd', '1,uvy6']
  ]
  it.each(ALINEACION)('%s es la pregunta %i del libro y su clave %s es la opción "%s"', (id, numero, clave, inicio) => {
    const p = por(id)
    expect(p.numeroLibro).toBe(numero)
    expect(letra(id)).toBe(clave)
    expect(p.opciones[p.clave!]!.texto.startsWith(inicio)).toBe(true)
  })

  it('capítulo 2: las copias retiradas no tienen clave y la copia conservada de cada número sí', () => {
    const ch2 = r.repasosManual.preguntas.filter((p) => p.id.startsWith('manual-repaso.c02.'))
    expect(ch2.filter((p) => p.estado === 'retirada').map((p) => p.id)).toEqual(['q10', 'q11', 'q13', 'q14', 'q18'].map((x) => `manual-repaso.c02.${x}`))
    const conservadas = ch2.filter((p) => p.estado !== 'retirada').map((p) => p.numeroLibro)
    expect(new Set(conservadas).size).toBe(conservadas.length)
  })

  it('las claves que contradicen el manual se conservan pero la pregunta queda en borrador con la nota de revisión', () => {
    for (const [id, nota] of Object.entries(REVISION_CLAVE)) {
      const [cap, num] = id.split('.').map(Number)
      const p = r.repasosManual.preguntas.find((x) => x.id.startsWith(`manual-repaso.c0${cap}.`) && x.numeroLibro === num && x.estado !== 'retirada')
      if (!p) continue
      expect(p.clave, id).not.toBeNull()
      expect(p.estado, id).toBe('borrador')
      expect(p.notas.join(' '), id).toContain(nota)
    }
    // Las tres del capítulo 2 y la del capítulo 1 están entre las parseadas.
    for (const [cap, num] of [[1, 19], [2, 7], [2, 8], [2, 14]] as const) {
      expect(r.repasosManual.preguntas.some((x) => x.id.startsWith(`manual-repaso.c0${cap}.`) && x.numeroLibro === num && x.estado === 'borrador' && x.notas.join(' ').includes('clave por revisar'))).toBe(true)
    }
  })

  it('las cifras verificadas son preguntas que existen', () => {
    for (const id of CIFRAS_VERIFICADAS) {
      const [cap, num] = id.split('.').map(Number)
      expect(r.repasosManual.preguntas.some((p) => p.id.startsWith(`manual-repaso.c0${cap}.`) && p.numeroLibro === num), id).toBe(true)
    }
  })
})
