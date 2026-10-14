/** Esquemas Zod de la entrada de cada canal IPC (ADR-002). El proceso principal nunca confía en la interfaz. */
import { z } from 'zod'
import { AreaIdSchema } from '../core/contenido'
import type { Ajustes } from '../preload/api'

const Id = z.string().min(1).max(160).regex(/^[A-Za-z0-9._-]+$/, 'identificador inválido')
const IdSesion = z.string().min(1).max(80).regex(/^[A-Za-z0-9._-]+$/, 'identificador de sesión inválido')

export const EsquemaLeccionId = Id
export const EsquemaPreguntaIds = z.array(Id).max(400)

export const EsquemaFiltro = z.strictObject({
  areas: z.array(AreaIdSchema).max(9).optional(),
  subtemas: z.array(Id).max(200).optional(),
  tipo: z.enum(['teoria', 'calculo']).optional(),
  dificultadMin: z.number().int().min(1).max(5).optional(),
  dificultadMax: z.number().int().min(1).max(5).optional(),
  soloValidadas: z.boolean().optional()
})

export const EsquemaSeleccionar = z.strictObject({
  filtro: EsquemaFiltro.optional(),
  n: z.number().int().min(1).max(210),
  excluirIds: z.array(Id).max(400).optional()
})

export const EsquemaSimulacro = z
  .strictObject({
    tipo: z.enum(['integral', 'modulo', 'modular-extraordinario', 'rapido']),
    area: AreaIdSchema.optional()
  })
  .refine((e) => e.tipo !== 'modulo' || e.area !== undefined, { message: 'el simulacro por módulo requiere un área' })

export const EsquemaIntento = z.strictObject({
  preguntaId: Id,
  respuesta: z.number().int().min(0).max(3),
  tiempoMs: z.number().int().min(0).max(24 * 3600 * 1000),
  confianza: z.enum(['seguro', 'dude', 'adivine']).optional(),
  modo: z.enum(['practica', 'leccion', 'mini', 'reto', 'repaso', 'simulacro', 'diagnostico']),
  sesionId: IdSesion,
  subtemaId: Id.optional(),
  conPistas: z.boolean().optional()
})
export const EsquemaRegistrarIntentos = z.array(EsquemaIntento).min(1).max(300)

export const EsquemaNotaObtener = z.strictObject({ leccionId: Id, laminaId: Id })
export const EsquemaNotaGuardar = z.strictObject({ leccionId: Id, laminaId: Id, texto: z.string().max(20000) })

export const EsquemaSesion = z.strictObject({
  id: IdSesion,
  modo: z.string().min(1).max(40),
  inicio: z.iso.datetime(),
  fin: z.iso.datetime().optional(),
  configuracion: z.unknown().optional(),
  resultado: z.unknown().optional()
})

const Fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha AAAA-MM-DD').refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'fecha inexistente')
const Autoevaluacion = z.enum(['domino', 'mas-o-menos', 'nunca'])

/** Un esquema de valor por cada clave de ajuste permitida (lista blanca). */
export const ESQUEMAS_AJUSTE = {
  tema: z.enum(['claro', 'terminal', 'editorial', 'enfoque']),
  letra: z.enum(['arial', 'calibri', 'segoe']),
  fechaExamen: Fecha.nullable(),
  modo: z.enum(['intensivo', 'ligero', 'personalizado']),
  minutosDia: z.number().int().min(10).max(600),
  diasSemana: z.number().int().min(1).max(7),
  diasActivos: z.array(z.number().int().min(0).max(6)).max(7).nullable(),
  autoevaluacion: z.partialRecord(AreaIdSchema, Autoevaluacion),
  modoIA: z.boolean(),
  onboardingCompleto: z.boolean(),
  reportadas: z.array(Id).max(5000),
  leccionesVistas: z.array(Id).max(1000)
} as const satisfies { [K in keyof Ajustes]: z.ZodType<Ajustes[K]> }

export const CLAVES_AJUSTE = Object.keys(ESQUEMAS_AJUSTE) as (keyof Ajustes)[]

export const AJUSTES_POR_OMISION: Ajustes = {
  tema: 'claro',
  letra: 'arial',
  fechaExamen: null,
  modo: 'intensivo',
  minutosDia: 150,
  diasSemana: 6,
  diasActivos: null,
  autoevaluacion: {},
  modoIA: false,
  onboardingCompleto: false,
  reportadas: [],
  leccionesVistas: []
}

export const EsquemaGuardarAjuste = z.object({ clave: z.string(), valor: z.unknown() }).transform((e, ctx) => {
  if (!(CLAVES_AJUSTE as string[]).includes(e.clave)) {
    ctx.addIssue({ code: 'custom', message: `ajuste desconocido: ${e.clave}` })
    return z.NEVER
  }
  const clave = e.clave as keyof Ajustes
  const r = ESQUEMAS_AJUSTE[clave].safeParse(e.valor)
  if (!r.success) {
    ctx.addIssue({ code: 'custom', message: `valor inválido para ${clave}: ${r.error.issues[0]?.message ?? ''}` })
    return z.NEVER
  }
  return { clave, valor: r.data } as { clave: keyof Ajustes; valor: unknown }
})

export const EsquemaVacio = z.undefined().or(z.null())

/** Formato del archivo de respaldo del progreso. */
export const EsquemaRespaldo = z.object({
  formato: z.literal('amib-f3-respaldo'),
  version: z.literal(1),
  exportado: z.string(),
  ajustes: z.record(z.string(), z.string()),
  intentos: z
    .array(
      z.object({
        pregunta_id: z.string(),
        pregunta_version: z.number().int(),
        semilla: z.number().int().nullable(),
        respuesta: z.number().int(),
        correcta: z.number().int().min(0).max(1),
        tiempo_ms: z.number().int(),
        confianza: z.string().nullable(),
        modo: z.string(),
        sesion_id: z.string(),
        fecha: z.string(),
        area: z.string().nullable(),
        subtema_id: z.string().nullable(),
        objetivo_id: z.string().nullable(),
        tipo: z.string().nullable(),
        dificultad: z.number().int().nullable(),
        etiqueta_error: z.string().nullable(),
        con_pistas: z.number().int().min(0).max(1)
      })
    )
    .max(500000),
  notas: z.array(z.object({ leccion_id: z.string(), lamina_id: z.string(), texto: z.string(), actualizado: z.string() })),
  sesiones: z.array(z.object({ id: z.string(), modo: z.string(), inicio: z.string(), fin: z.string().nullable(), configuracion_json: z.string().nullable(), resultado_json: z.string().nullable() })),
  cajas: z.array(z.object({ item_id: z.string(), tipo: z.string(), caja: z.number().int().min(1).max(5), proxima: z.string() }))
})
export type Respaldo = z.infer<typeof EsquemaRespaldo>

/** Solo las páginas de la propia app pueden invocar canales IPC. */
export function remitenteConfiable(url: string, urlDev: string | undefined): boolean {
  if (urlDev && (url === urlDev || url.startsWith(urlDev.endsWith('/') ? urlDev : `${urlDev}/`))) return true
  return url.startsWith('file://')
}
