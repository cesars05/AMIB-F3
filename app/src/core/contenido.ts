/**
 * Esquemas del contenido versionado en `content/` (fuente de verdad).
 * Todo archivo de contenido se valida contra estos esquemas antes de cargarse en la app.
 */
import { z } from 'zod'
import { AREAS, type AreaId } from './examen'

const AREA_IDS = AREAS.map((a) => a.id) as [AreaId, ...AreaId[]]
export const AreaIdSchema = z.enum(AREA_IDS)

/** Identificador estable en kebab-case, p. ej. `deuda.reporto.premio`. */
const Slug = z.string().regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/, 'id en minúsculas, con guiones o puntos')

// ─── Taxonomía (temario oficial) ─────────────────────────────────────────────

export const ObjetivoSchema = z.object({
  id: Slug,
  /** Texto literal del temario oficial. */
  texto: z.string().min(5),
  /** Verbo inicial normalizado (identificar, distinguir, calcular…), o null si no inicia con verbo. */
  verbo: z.string().nullable(),
  tipo: z.enum(['teoria', 'calculo']),
  exclusivoFig3: z.boolean().default(false)
})

export const SubtemaSchema = z.object({
  id: Slug,
  nombre: z.string().min(2),
  objetivos: z.array(ObjetivoSchema)
})

export const TemaSchema = z.object({
  id: Slug,
  /** Nombre de la materia como aparece en el temario, p. ej. "Títulos de Deuda I". */
  nombre: z.string().min(2),
  subtemas: z.array(SubtemaSchema).min(1)
})

export const TaxonomiaAreaSchema = z.object({
  area: AreaIdSchema,
  temas: z.array(TemaSchema).min(1)
})

export const TaxonomiaSchema = z.object({
  fuente: z.string(),
  generado: z.string(),
  areas: z.array(TaxonomiaAreaSchema).length(AREAS.length)
})

// ─── Preguntas ───────────────────────────────────────────────────────────────

export const FuenteSchema = z.enum(['oficial-ejemplo', 'manual-ensayo', 'manual-repaso', 'externa', 'generada', 'generada-en-vivo'])
export const EstadoSchema = z.enum(['borrador', 'validada', 'reportada', 'retirada'])

export const CitaSchema = z.object({
  /** Ruta relativa a la raíz del repo del documento fuente. */
  documento: z.string(),
  pagina: z.number().int().positive().optional(),
  /** Fragmento literal que respalda la clave (verificado por script contra el texto fuente). */
  textual: z.string().min(10).optional()
})

export const OpcionSchema = z.object({
  texto: z.string().min(1),
  /** Por qué esta opción es incorrecta (vacío en la correcta). */
  porQueNo: z.string().optional(),
  /** Error conceptual que representa este distractor, p. ej. "confunde-limpio-sucio". */
  etiquetaError: Slug.optional()
})

export const PreguntaSchema = z
  .object({
    id: Slug,
    version: z.number().int().positive().default(1),
    area: AreaIdSchema,
    /** Sección original cuando no corresponde a un área de la Serie 210 (p. ej. MexDer). */
    seccionOriginal: z.string().optional(),
    subtemaId: Slug.optional(),
    objetivoId: Slug.optional(),
    enunciado: z.string().min(5),
    /** Número de la pregunta en el libro de origen (p. ej. el repaso del capítulo), cuando se pudo determinar con fiabilidad. */
    numeroLibro: z.number().int().positive().optional(),
    opciones: z.array(OpcionSchema).length(4),
    /** Índice 0–3 de la opción correcta, o null si aún no se conoce (repasos sin clave). */
    clave: z.number().int().min(0).max(3).nullable(),
    explicacion: z.string().optional(),
    tipo: z.enum(['teoria', 'calculo']),
    formato: z.enum(['directa', 'excepto', 'caso', 'calculo']),
    esTrampa: z.boolean().default(false),
    dificultad: z.number().int().min(1).max(5).optional(),
    /** Fuera del temario Serie 210: se practica pero no entra al simulacro. */
    extra: z.boolean().default(false),
    fuente: FuenteSchema,
    cita: CitaSchema.optional(),
    vigencia: z.enum(['verificada', 'por-verificar', 'no-aplica']).default('no-aplica'),
    estado: EstadoSchema,
    /** Observaciones de ingestión o revisión (p. ej. conflicto de clave detectado). */
    notas: z.array(z.string()).default([])
  })
  .refine((p) => p.estado !== 'validada' || p.clave !== null, { message: 'una pregunta validada necesita clave' })

export type Taxonomia = z.infer<typeof TaxonomiaSchema>
export type Pregunta = z.infer<typeof PreguntaSchema>
export type PreguntaEntrada = z.input<typeof PreguntaSchema>

export const ArchivoPreguntasSchema = z.object({
  fuente: z.string(),
  generado: z.string(),
  preguntas: z.array(PreguntaSchema)
})

/** Valida que no haya ids repetidos en un conjunto de preguntas. Devuelve los duplicados. */
export function idsDuplicados(preguntas: readonly { id: string }[]): string[] {
  const vistos = new Set<string>()
  const dup = new Set<string>()
  for (const p of preguntas) (vistos.has(p.id) ? dup : vistos).add(p.id)
  return [...dup]
}

// ─── Manual oficial (AMIB_1_completo.md): índice de secciones ────────────────

export const SeccionManualSchema = z
  .object({
    /** Capítulo del manual, 1–10 (el 10 es el formulario). */
    capitulo: z.number().int().min(1).max(10),
    /** Número normalizado ("6.1.3"). El formulario (capítulo 10) es una sola sección: "10". */
    numero: z.string().regex(/^\d{1,2}(?:\.\d{1,2}\.\d{1,3})?$/, 'número de sección tipo 6.1.3'),
    /** Número tal como lo imprimió el OCR ("1.14.4", "3,5.1", "B.3.8"). */
    numeroOriginal: z.string().min(1),
    /** ninguna: igual; formato: separador/letra/dígito de capítulo; secuencia: dígito corregido sin ambigüedad; dudosa: lectura incierta. */
    correccionNumero: z.enum(['ninguna', 'formato', 'secuencia', 'dudosa']),
    titulo: z.string().min(2),
    /** encabezado (`####`), recuperado (la línea de numeración sin `####`) o capitulo (sección única del capítulo). */
    origen: z.enum(['encabezado', 'recuperado', 'capitulo']),
    /** Páginas del PDF (marcadores `<!-- page N -->`). */
    paginas: z.object({ inicio: z.number().int().positive(), fin: z.number().int().positive() }).refine((p) => p.inicio <= p.fin, 'paginas.inicio debe ser ≤ paginas.fin'),
    /** Objetivo del temario vinculado por similitud de texto, o null si la confianza no llega al umbral. */
    objetivoId: Slug.nullable(),
    /** Mejor candidato aunque no llegue al umbral (para revisión). */
    objetivoCandidato: Slug.nullable(),
    /** Similitud 0–1 con `objetivoCandidato`. */
    confianza: z.number().min(0).max(1),
    /** Toda la sección es exclusiva de la Figura 3 (marcador en el tema o en el propio encabezado). */
    exclusivoFig3: z.boolean(),
    /** El cuerpo trae un subtema marcado Figura 3, pero la sección no lo es entera. */
    fig3Parcial: z.boolean().default(false),
    /** Ruta relativa a la raíz del repo del Markdown con el OCR crudo de la sección. */
    archivo: z.string().regex(/^content\/manual\/cap\d{2}\/\d{2}-[a-z0-9-]+\.md$/, 'content/manual/capNN/NN-slug.md'),
    /** Longitud del cuerpo en caracteres (para detectar secciones vacías). */
    caracteres: z.number().int().nonnegative()
  })
  .refine((s) => s.objetivoId === null || s.objetivoId === s.objetivoCandidato, { message: 'objetivoId debe ser el candidato o null' })

export const IndiceManualSchema = z.object({
  fuente: z.string(),
  generado: z.string(),
  secciones: z.array(SeccionManualSchema)
})

export type SeccionManualIndice = z.infer<typeof SeccionManualSchema>
export type IndiceManual = z.infer<typeof IndiceManualSchema>
