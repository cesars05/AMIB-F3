import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { ArchivoPreguntasSchema, idsDuplicados } from '../app/src/core/contenido'
import { leerDocx, type BloqueDocx } from './docx'
import { DOC_PREGUNTAS_TIPO, RAIZ } from './rutas'
import {
  decidirClave,
  esCalculo,
  extraerPreguntasCrudas,
  parsearPreguntasTipo,
  seccionAArea,
  type PreguntaCruda
} from './parse-preguntas-tipo'

/** Clave esperada (1-based q → letra), tomada del texto en negritas. */
const CLAVES_ESPERADAS: Record<number, string> = Object.fromEntries(
  ('1a 2b 3d 4d 5a 6b 7d 8a 9c 10a 11b 12a 13b 14c 15b 16a 17d 18a 19a 20a 21a 22c 23b 24b 25c 26a 27c 28c 29a 30a 31a 32a 33b 34a 35d 36a 37a 38a 39d 40b 41d 42a 43a 44b')
    .split(' ')
    .map((s) => [Number(s.slice(0, -1)), s.slice(-1)])
)

describe('decidirClave', () => {
  const cruda = (negTexto: number[], negLetra: number[]): PreguntaCruda => ({
    numero: 1,
    seccion: 'Ética',
    enunciado: 'Pregunta de prueba cualquiera',
    opciones: ['a', 'b', 'c', 'd'].map((letra, i) => ({ letra, texto: `opcion ${letra}`, negritaLetra: negLetra.includes(i), negritaTexto: negTexto.includes(i) }))
  })

  it('el texto en negritas manda', () => {
    expect(decidirClave(cruda([2], [2]))).toEqual({ clave: 2, notas: [] })
  })
  it('sin texto en negritas cae a la letra en negritas', () => {
    const r = decidirClave(cruda([], [1]))
    expect(r.clave).toBe(1)
    expect(r.notas[0]).toMatch(/letra b en negritas/)
  })
  it('si letra y texto discrepan manda el texto y deja nota de conflicto', () => {
    expect(decidirClave(cruda([0], [3]))).toEqual({ clave: 0, notas: ['conflicto de clave: letra d en negritas, texto a en negritas'] })
  })
  it('sin negritas la clave queda desconocida', () => {
    const r = decidirClave(cruda([], []))
    expect(r.clave).toBeNull()
    expect(r.notas[0]).toMatch(/sin clave/)
  })
  it('varias opciones en negritas es ambiguo y no se adivina', () => {
    const r = decidirClave(cruda([0, 1], []))
    expect(r.clave).toBeNull()
    expect(r.notas[0]).toMatch(/ambigua/)
  })
})

describe('esCalculo', () => {
  it('requiere al menos dos cifras en el enunciado', () => {
    expect(esCalculo('¿Cuál es la tasa de descuento de un CETE de 100 días y que tiene un precio de mercado de $9.786?')).toBe(true)
    expect(esCalculo('Son principios de la Teoría Dow, EXCEPTO:')).toBe(false)
    expect(esCalculo('Si se desea calcular los intereses de una inversión a un plazo muy corto, lo mejor es utilizar el rendimiento:')).toBe(false)
    expect(esCalculo('un fondo invertido al 95% en acciones, ¿qué efectos tendrá una baja?')).toBe(false)
  })
})

describe('seccionAArea', () => {
  it('mapea secciones y marca las extras', () => {
    expect(seccionAArea('Análisis Económico y Financiero')).toEqual({ area: 'analisis', extra: false })
    expect(seccionAArea('Marco Normativo')).toEqual({ area: 'normativo', extra: false })
    expect(seccionAArea('Concertación de Operación en MexDer')).toEqual({ area: 'derivados', extra: true })
    expect(seccionAArea('Concertación de Operaciones en el Mercado de Capitales')).toEqual({ area: 'capitales', extra: true })
    expect(seccionAArea('Otra cosa')).toBeNull()
  })
})

describe('extraerPreguntasCrudas (sintético)', () => {
  const p = (texto: string, negrita = false) => ({ tipo: 'parrafo' as const, texto, runs: [{ texto, negrita }] })
  it('lee preguntas sueltas en párrafos y un encabezado intermedio', () => {
    const bloques: BloqueDocx[] = [
      p('Ética'),
      p('1.-'),
      p('¿Qué es la ética?'),
      p('a)'), p('uno'), p('b)', true), p('dos', true), p('c)'), p('tres'), p('d)'), p('Fondos de Inversión'),
      p('Servicios de Inversión'),
      p('2.- Segunda pregunta aquí'),
      p('a) uno'), p('b) dos'), p('c) tres'), p('d) cuatro')
    ]
    const r = extraerPreguntasCrudas(bloques)
    expect(r).toHaveLength(2)
    expect(r[0]).toMatchObject({ numero: 1, seccion: 'Ética', enunciado: '¿Qué es la ética?' })
    // "Fondos de Inversión" como PRIMER texto de una opción no es encabezado
    expect(r[0]?.opciones.map((o) => o.texto)).toEqual(['uno', 'dos', 'tres', 'Fondos de Inversión'])
    expect(r[0]?.opciones[1]).toMatchObject({ negritaLetra: true, negritaTexto: true })
    expect(r[1]).toMatchObject({ numero: 2, seccion: 'Servicios de Inversión', enunciado: 'Segunda pregunta aquí' })
  })
  it('falla si una pregunta no tiene cuatro opciones', () => {
    expect(() => extraerPreguntasCrudas([p('Ética'), p('1.-'), p('Enunciado completo'), p('a)'), p('uno')])).toThrow(/opciones/)
  })
})

describe('Preguntas Tipo.docx real', () => {
  let crudas: PreguntaCruda[]
  let archivo: ReturnType<typeof parsearPreguntasTipo>
  beforeAll(async () => {
    const bloques = await leerDocx(readFileSync(join(RAIZ, DOC_PREGUNTAS_TIPO)))
    crudas = extraerPreguntasCrudas(bloques)
    archivo = parsearPreguntasTipo(bloques, DOC_PREGUNTAS_TIPO, '2026-10-14')
  })

  it('trae 44 preguntas numeradas 1..44 con cuatro opciones', () => {
    expect(crudas).toHaveLength(44)
    expect(crudas.map((c) => c.numero)).toEqual(Array.from({ length: 44 }, (_, i) => i + 1))
    expect(crudas.every((c) => c.opciones.length === 4)).toBe(true)
  })

  it('son 11 secciones de 4 preguntas', () => {
    const porSeccion = new Map<string, number>()
    for (const c of crudas) porSeccion.set(c.seccion, (porSeccion.get(c.seccion) ?? 0) + 1)
    expect([...porSeccion.keys()]).toEqual([
      'Análisis Económico y Financiero',
      'Marco Normativo',
      'Matemáticas Financieras y Portafolios',
      'Mercado de Capitales',
      'Derivados Financieros y Riesgos',
      'Títulos de Deuda',
      'Ética',
      'Fondos de Inversión',
      'Servicios de Inversión',
      'Concertación de Operación en MexDer',
      'Concertación de Operaciones en el Mercado de Capitales'
    ])
    expect([...porSeccion.values()].every((n) => n === 4)).toBe(true)
  })

  it('valida contra el esquema y no repite ids', () => {
    expect(ArchivoPreguntasSchema.safeParse(archivo).success).toBe(true)
    expect(idsDuplicados(archivo.preguntas)).toEqual([])
    expect(archivo.preguntas[0]?.id).toBe('tipo.01')
    expect(archivo.preguntas[43]?.id).toBe('tipo.44')
  })

  it('las claves coinciden con el texto en negritas (fixture de las 44)', () => {
    const letras = 'abcd'
    for (const p of archivo.preguntas) {
      const n = Number(p.id.slice(5))
      expect(letras[p.clave ?? -1], `q${n}`).toBe(CLAVES_ESPERADAS[n])
      expect(p.estado).toBe('validada')
    }
  })

  it('detecta los conflictos entre letra y texto en negritas (lista real verificada)', () => {
    const conflictos = archivo.preguntas.filter((p) => p.notas.some((n) => n.startsWith('conflicto de clave'))).map((p) => Number(p.id.slice(5)))
    expect(conflictos).toEqual(CONFLICTOS_ESPERADOS)
    expect(archivo.preguntas.find((p) => p.id === 'tipo.34')?.notas).toEqual([])
    const p1 = archivo.preguntas[0]!
    expect(p1.notas[0]).toBe('conflicto de clave: letra d en negritas, texto a en negritas')
    expect(p1.notas[1]).toMatch(/confirmada con el manual/)
    const p32 = archivo.preguntas.find((p) => p.id === 'tipo.32')!
    expect(p32.vigencia).toBe('por-verificar')
    expect(p32.notas.some((n) => n.startsWith('pendiente de verificar'))).toBe(true)
  })

  it('marca cálculo (tipo y formato) al menos en 10, 11, 16, 23, 24, 29 y 30', () => {
    const calculo = archivo.preguntas.filter((p) => p.tipo === 'calculo').map((p) => Number(p.id.slice(5)))
    for (const n of [10, 11, 16, 23, 24, 29, 30]) expect(calculo).toContain(n)
    expect(calculo).toEqual(CALCULO_ESPERADO)
    for (const p of archivo.preguntas.filter((x) => x.tipo === 'calculo' && !/EXCEPTO/.test(x.enunciado))) expect(p.formato).toBe('calculo')
  })

  it('formato excepto cuando el enunciado dice EXCEPTO', () => {
    const excepto = archivo.preguntas.filter((p) => p.formato === 'excepto').map((p) => Number(p.id.slice(5)))
    expect(excepto).toEqual([1, 34, 35, 36])
  })

  it('MexDer y Mercado de Capitales (concertación) son extra con sección original', () => {
    const q37 = archivo.preguntas.find((p) => p.id === 'tipo.37')!
    expect(q37).toMatchObject({ area: 'derivados', extra: true, seccionOriginal: 'Concertación de Operación en MexDer' })
    const q41 = archivo.preguntas.find((p) => p.id === 'tipo.41')!
    expect(q41).toMatchObject({ area: 'capitales', extra: true, seccionOriginal: 'Concertación de Operaciones en el Mercado de Capitales' })
    expect(archivo.preguntas.filter((p) => p.extra)).toHaveLength(8)
    expect(archivo.preguntas.filter((p) => !p.extra && p.seccionOriginal)).toHaveLength(0)
  })

  it('metadatos comunes', () => {
    for (const p of archivo.preguntas) {
      expect(p.fuente).toBe('oficial-ejemplo')
      expect(p.cita).toEqual({ documento: 'AMIB Data/Preguntas Tipo.docx' })
      expect(p.opciones).toHaveLength(4)
    }
    const q25 = archivo.preguntas.find((p) => p.id === 'tipo.25')!
    expect(q25).toMatchObject({ area: 'etica', enunciado: 'Se define como la capacidad de elegir:', clave: 2, formato: 'directa', tipo: 'teoria' })
    expect(q25.opciones.map((o) => o.texto)).toEqual(['verdad.', 'hábito.', 'libertad.', 'voluntad.'])
  })
})

// Son 6, no 7: la q34 que una revisión previa listaba NO tiene conflicto (letra a y texto a en negritas;
// solo el punto final del texto va sin negritas). Las q5, q9 y q31 traen negritas solo en el texto (sin conflicto).
const CONFLICTOS_ESPERADOS: number[] = [1, 4, 10, 17, 22, 32]
const CALCULO_ESPERADO: number[] = [10, 11, 16, 19, 23, 24, 29, 30]
