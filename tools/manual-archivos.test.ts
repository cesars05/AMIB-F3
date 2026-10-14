import { describe, expect, it } from 'vitest'
import { construirArchivosManual, frontmatter, rutaSeccion } from './manual-archivos'
import type { CapituloManual } from './parse-manual'
import type { Vinculo } from './vincular-manual'

describe('rutaSeccion', () => {
  it('capNN/NN-slug.md con el ordinal en el capítulo, sin acentos y sin guion final', () => {
    expect(rutaSeccion(6, 1, 'Identificar el concepto de mercado de deuda.')).toBe('content/manual/cap06/01-identificar-el-concepto-de-mercado-de-deuda.md')
    expect(rutaSeccion(10, 1, 'Formulario')).toBe('content/manual/cap10/01-formulario.md')
  })
  it('recorta títulos largos a 60 caracteres sin dejar un guion colgando', () => {
    const r = rutaSeccion(3, 12, 'Identificar las siguientes funciones de las instituciones para el depósito de valores: depósito, administración')
    expect(r.length).toBeLessThanOrEqual('content/manual/cap03/12-'.length + 60 + 3)
    expect(r.endsWith('-.md')).toBe(false)
    expect(r.startsWith('content/manual/cap03/12-identificar-las-siguientes-funciones')).toBe(true)
  })
  it('un título sin letras usa "seccion"', () => {
    expect(rutaSeccion(1, 3, '¿?')).toBe('content/manual/cap01/03-seccion.md')
  })
})

describe('frontmatter', () => {
  it('serializa escalares como JSON (YAML válido) y objetos anidados con sangría', () => {
    expect(frontmatter({ capitulo: 6, titulo: 'Dice "hola": sí', ok: false, nulo: null, paginas: { inicio: 1, fin: 2 } })).toBe(
      ['---', 'capitulo: 6', 'titulo: "Dice \\"hola\\": sí"', 'ok: false', 'nulo: null', 'paginas:', '  inicio: 1', '  fin: 2', '---'].join('\n')
    )
  })
})

describe('construirArchivosManual', () => {
  const sec = (numero: string, titulo: string, texto: string) => ({
    capitulo: 6,
    numero,
    numeroOriginal: numero,
    correccion: 'ninguna' as const,
    titulo,
    origen: 'encabezado' as const,
    paginas: { inicio: 183, fin: 184 },
    texto,
    exclusivoFig3: false,
    fig3Parcial: false
  })
  const caps: CapituloManual[] = [
    { numero: 6, titulo: 'Títulos de Deuda', paginas: { inicio: 183, fin: 184 }, secciones: [sec('6.1.1', 'Identificar el concepto de mercado de deuda.', 'Cuerpo uno.\n\nOtra línea.'), sec('6.1.2', 'Identificar las características del mercado de deuda.', 'Cuerpo dos.')], repaso: null }
  ]
  const vinculos: Vinculo[] = [
    { objetivoId: 'deuda.t.s.o01', confianza: 0.67, candidatoId: 'deuda.t.s.o01', segundo: 0.5 },
    { objetivoId: null, confianza: 0.3, candidatoId: 'deuda.t.s.o02', segundo: 0.1 }
  ]

  it('escribe un archivo por sección con frontmatter y el OCR crudo, y un índice que coincide', () => {
    const { indice, archivos } = construirArchivosManual(caps, vinculos, '2026-10-14')
    expect([...archivos.keys()]).toEqual(indice.secciones.map((s) => s.archivo))
    const md = archivos.get(indice.secciones[0]!.archivo)!
    expect(md.startsWith('---\ncapitulo: 6\nnumero: "6.1.1"\n')).toBe(true)
    expect(md).toContain('objetivoId: "deuda.t.s.o01"\nobjetivoCandidato: "deuda.t.s.o01"\nconfianza: 0.67\nexclusivoFig3: false')
    expect(md.endsWith('---\n\nCuerpo uno.\n\nOtra línea.\n')).toBe(true)
    expect(indice.secciones[0]).toMatchObject({ numero: '6.1.1', caracteres: 'Cuerpo uno.\n\nOtra línea.'.length, correccionNumero: 'ninguna' })
  })

  it('sin vínculo: objetivoId null pero se conserva el candidato', () => {
    const { indice, archivos } = construirArchivosManual(caps, vinculos, '2026-10-14')
    expect(indice.secciones[1]).toMatchObject({ objetivoId: null, objetivoCandidato: 'deuda.t.s.o02', confianza: 0.3 })
    expect(archivos.get(indice.secciones[1]!.archivo)).toContain('objetivoId: null\nobjetivoCandidato: "deuda.t.s.o02"')
  })

  it('el índice cumple el esquema y no lleva la fecha dentro de los Markdown (salida estable)', () => {
    const a = construirArchivosManual(caps, vinculos, '2026-10-14')
    const b = construirArchivosManual(caps, vinculos, '2030-01-01')
    expect(a.indice.generado).toBe('2026-10-14')
    expect([...a.archivos]).toEqual([...b.archivos])
  })
})
