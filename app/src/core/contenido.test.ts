import { describe, expect, it } from 'vitest'
import { IndiceManualSchema, PreguntaSchema, SeccionManualSchema, idsDuplicados, type PreguntaEntrada } from './contenido'

const base: PreguntaEntrada = {
  id: 'tipo.21',
  area: 'deuda',
  enunciado: '¿Cuál es la tasa de descuento de un CETE?',
  opciones: [{ texto: 'a' }, { texto: 'b' }, { texto: 'c' }, { texto: 'd' }],
  clave: 1,
  tipo: 'calculo',
  formato: 'calculo',
  fuente: 'oficial-ejemplo',
  estado: 'validada'
}

describe('PreguntaSchema', () => {
  it('acepta una pregunta válida y completa valores por omisión', () => {
    const p = PreguntaSchema.parse(base)
    expect(p.version).toBe(1)
    expect(p.extra).toBe(false)
    expect(p.notas).toEqual([])
  })
  it('exige exactamente 4 opciones', () => {
    expect(() => PreguntaSchema.parse({ ...base, opciones: base.opciones.slice(0, 3) })).toThrow()
  })
  it('no permite validar sin clave', () => {
    expect(() => PreguntaSchema.parse({ ...base, clave: null })).toThrow()
    expect(PreguntaSchema.parse({ ...base, clave: null, estado: 'borrador' }).clave).toBeNull()
  })
  it('rechaza ids con formato inválido y áreas desconocidas', () => {
    expect(() => PreguntaSchema.parse({ ...base, id: 'Tipo 21' })).toThrow()
    expect(() => PreguntaSchema.parse({ ...base, area: 'mexder' })).toThrow()
  })
})

describe('idsDuplicados', () => {
  it('detecta ids repetidos', () => {
    expect(idsDuplicados([{ id: 'a' }, { id: 'b' }, { id: 'a' }])).toEqual(['a'])
    expect(idsDuplicados([{ id: 'a' }])).toEqual([])
  })
})

describe('SeccionManualSchema', () => {
  const seccion = {
    capitulo: 6,
    numero: '6.1.1',
    numeroOriginal: '6.1.1',
    correccionNumero: 'ninguna',
    titulo: 'Identificar el concepto de mercado de deuda.',
    origen: 'encabezado',
    paginas: { inicio: 183, fin: 183 },
    objetivoId: 'deuda.titulos-de-deuda-i.elementos-basicos.o01',
    objetivoCandidato: 'deuda.titulos-de-deuda-i.elementos-basicos.o01',
    confianza: 0.67,
    exclusivoFig3: false,
    archivo: 'content/manual/cap06/01-identificar-el-concepto-de-mercado-de-deuda.md',
    caracteres: 420
  }

  it('acepta una sección válida y completa fig3Parcial en falso', () => {
    const s = SeccionManualSchema.parse(seccion)
    expect(s.fig3Parcial).toBe(false)
  })
  it('acepta el formulario como sección única del capítulo 10 y un objetivo nulo con candidato', () => {
    const f = { ...seccion, capitulo: 10, numero: '10', numeroOriginal: '10', origen: 'capitulo', objetivoId: null, objetivoCandidato: null, confianza: 0, archivo: 'content/manual/cap10/01-formulario.md' }
    expect(SeccionManualSchema.parse(f).numero).toBe('10')
    expect(SeccionManualSchema.parse({ ...seccion, objetivoId: null, confianza: 0.4 }).objetivoId).toBeNull()
  })
  it('rechaza capítulos fuera de 1–10, números mal formados y páginas invertidas', () => {
    expect(() => SeccionManualSchema.parse({ ...seccion, capitulo: 11 })).toThrow()
    expect(() => SeccionManualSchema.parse({ ...seccion, numero: '6.1' })).toThrow()
    expect(() => SeccionManualSchema.parse({ ...seccion, paginas: { inicio: 190, fin: 183 } })).toThrow()
    expect(() => SeccionManualSchema.parse({ ...seccion, confianza: 1.2 })).toThrow()
    expect(() => SeccionManualSchema.parse({ ...seccion, archivo: 'manual/cap06/01.md' })).toThrow()
  })
  it('exige que objetivoId sea el candidato o null', () => {
    expect(() => SeccionManualSchema.parse({ ...seccion, objetivoCandidato: 'deuda.otro.o01' })).toThrow()
  })
  it('IndiceManualSchema valida la lista completa', () => {
    expect(IndiceManualSchema.parse({ fuente: 'x', generado: '2026-10-14', secciones: [seccion] }).secciones).toHaveLength(1)
    expect(() => IndiceManualSchema.parse({ fuente: 'x', generado: '2026-10-14', secciones: [{ ...seccion, capitulo: 0 }] })).toThrow()
  })
})
