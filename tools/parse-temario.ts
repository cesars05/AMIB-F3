/**
 * Parser del temario oficial (`Examen Integral Asesor en Estrategias de Inversión.docx`) → `content/taxonomia.json`.
 *
 * Fuente: la última tabla del documento, de dos columnas: "Área de Evaluación" (materia, solo en la primera
 * fila de cada bloque) y "Resultados de Aprendizaje" (encabezado de subtema u objetivo). Las filas vacías separan.
 */
import { AREAS, type AreaId } from '../app/src/core/examen'
import { TaxonomiaSchema, type Taxonomia } from '../app/src/core/contenido'
import { textoCelda, type BloqueDocx } from './docx'
import { colapsar, slug } from './texto'

/** Un objetivo inicia con un verbo en infinitivo (-ar/-er/-ir): Identificar, Distinguir, Calcular, Resolver… */
const RE_VERBO = /^([a-záéíóúüñ]+(?:ar|er|ir))(?![a-záéíóúüñ])/i

export function esObjetivo(texto: string): boolean {
  return RE_VERBO.test(colapsar(texto))
}

/** Verbo inicial en minúsculas, o null si el texto no inicia con verbo (encabezado de subtema). */
export function verboDe(texto: string): string | null {
  return RE_VERBO.exec(colapsar(texto))?.[1]?.toLowerCase() ?? null
}

/**
 * Regla de `tipo` (simple a propósito):
 * - 'calculo' si el verbo es `calcular` o `resolver`, o si el texto menciona cálculo/calcular/fórmula.
 * - 'teoria' en cualquier otro caso.
 * `interpretar` y `determinar` NO bastan: en el temario son casi siempre conceptuales
 * ("Determinar en situaciones concretas el cumplimiento del principio ético…").
 */
export function clasificarTipo(texto: string): 'teoria' | 'calculo' {
  const verbo = verboDe(texto)
  if (verbo === 'calcular' || verbo === 'resolver') return 'calculo'
  if (/\b(c[aá]lcul\w*|f[óo]rmulas?)\b/i.test(texto)) return 'calculo'
  return 'teoria'
}

/** Materia del temario → área del examen. */
export function areaDeMateria(materia: string): AreaId {
  const s = slug(materia)
  if (s === 'etica') return 'etica'
  if (s === 'servicios-de-inversion') return 'servicios'
  if (s.startsWith('marco-normativo')) return 'normativo'
  if (s === 'matematicas-financieras' || s === 'portafolios-de-inversion') return 'matematicas'
  if (s.startsWith('mercado-de-capitales')) return 'capitales'
  if (s.startsWith('titulos-de-deuda')) return 'deuda'
  if (s === 'fondos-de-inversion') return 'fondos'
  if (s.startsWith('derivados-financieros') || s.startsWith('riesgos')) return 'derivados'
  if (s.startsWith('analisis-')) return 'analisis'
  throw new Error(`materia sin área conocida: "${materia}"`)
}

interface SubtemaEnConstruccion {
  nombre: string
  id: string
  objetivos: Taxonomia['areas'][number]['temas'][number]['subtemas'][number]['objetivos']
}
interface TemaEnConstruccion {
  nombre: string
  id: string
  area: AreaId
  subtemas: SubtemaEnConstruccion[]
}

/** Última tabla de dos columnas con el encabezado "Área de Evaluación". */
function tablaTemario(bloques: readonly BloqueDocx[]) {
  for (let i = bloques.length - 1; i >= 0; i--) {
    const b = bloques[i]
    if (b?.tipo === 'tabla' && b.filas[0] && /[áa]rea de evaluaci[óo]n/i.test(textoCelda(b.filas[0][0] ?? []))) return b
  }
  throw new Error('No se encontró la tabla "Área de Evaluación | Resultados de Aprendizaje"')
}

export function parsearTemario(bloques: readonly BloqueDocx[], fuente: string, generado: string): Taxonomia {
  const tabla = tablaTemario(bloques)
  const temas: TemaEnConstruccion[] = []
  let tema: TemaEnConstruccion | undefined
  let subtema: SubtemaEnConstruccion | undefined

  const nuevoSubtema = (nombre: string): SubtemaEnConstruccion => {
    const t = tema!
    const base = `${t.id}.${slug(nombre)}`
    let id = base
    for (let n = 2; t.subtemas.some((s) => s.id === id); n++) id = `${base}-${n}`
    const s: SubtemaEnConstruccion = { nombre, id, objetivos: [] }
    t.subtemas.push(s)
    return s
  }

  for (const fila of tabla.filas.slice(1)) {
    const materia = colapsar(textoCelda(fila[0] ?? []))
    const texto = colapsar(textoCelda(fila[1] ?? []))
    if (materia) {
      const area = areaDeMateria(materia)
      tema = { nombre: materia, id: `${area}.${slug(materia)}`, area, subtemas: [] }
      temas.push(tema)
      subtema = undefined
    }
    if (!texto) continue
    if (!tema) throw new Error(`Fila con texto antes de la primera materia: "${texto}"`)
    if (esObjetivo(texto)) {
      subtema ??= nuevoSubtema('General')
      const n = String(subtema.objetivos.length + 1).padStart(2, '0')
      subtema.objetivos.push({
        id: `${subtema.id}.o${n}`,
        texto,
        verbo: verboDe(texto),
        tipo: clasificarTipo(texto),
        // `exclusivoFig3` se completa después, en `construir.ts`, con las secciones del manual marcadas "INFORMACIÓN FIGURA 3".
        exclusivoFig3: false
      })
    } else {
      subtema = nuevoSubtema(texto)
    }
  }

  const areas = AREAS.map((a) => ({
    area: a.id,
    temas: temas
      .filter((t) => t.area === a.id)
      .map((t) => ({ id: t.id, nombre: t.nombre, subtemas: t.subtemas.map((s) => ({ id: s.id, nombre: s.nombre, objetivos: s.objetivos })) }))
  }))
  return TaxonomiaSchema.parse({ fuente, generado, areas })
}

export interface ConteoTaxonomia {
  temas: number
  subtemas: number
  objetivos: number
  calculo: number
}

export function resumenTaxonomia(tax: Taxonomia): { porArea: (ConteoTaxonomia & { area: AreaId })[]; total: ConteoTaxonomia } {
  const total: ConteoTaxonomia = { temas: 0, subtemas: 0, objetivos: 0, calculo: 0 }
  const porArea = tax.areas.map((a) => {
    const c: ConteoTaxonomia = { temas: a.temas.length, subtemas: 0, objetivos: 0, calculo: 0 }
    for (const t of a.temas) {
      c.subtemas += t.subtemas.length
      for (const s of t.subtemas) {
        c.objetivos += s.objetivos.length
        c.calculo += s.objetivos.filter((o) => o.tipo === 'calculo').length
      }
    }
    for (const k of Object.keys(total) as (keyof ConteoTaxonomia)[]) total[k] += c[k]
    return { area: a.area, ...c }
  })
  return { porArea, total }
}
