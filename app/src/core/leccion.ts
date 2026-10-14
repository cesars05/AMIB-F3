/**
 * Esquema de las lecciones guiadas (`content/lecciones/<area>/<id>.json`).
 * Las láminas se componen de bloques estructurados, nunca de HTML crudo: así se renderizan de forma segura
 * en la app y se exportan igual a Word y PowerPoint.
 *
 * Marcado en línea permitido dentro de los textos (lo interpreta el renderer):
 *   **texto**  negritas
 *   [[texto]]  término clave (rojo de las notas de Cesar)
 *   \( ... \)  fórmula en línea (TeX)
 */
import { z } from 'zod'
import { AreaIdSchema } from './contenido'

const Slug = z.string().regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/)
const Texto = z.string().min(1)

export const BloqueSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('parrafo'), texto: Texto }),
  /** Ficha de instrumento: pares concepto / explicación (Valor nominal, Plazo, Pago de intereses...). */
  z.object({ tipo: z.literal('ficha'), titulo: Texto.optional(), filas: z.array(z.tuple([Texto, Texto])).min(1) }),
  /** El "Resumen X:" verde de las notas de Cesar. */
  z.object({ tipo: z.literal('resumen'), etiqueta: Texto, texto: Texto }),
  /** Fórmula en dos pasos: lógica con símbolos y leyenda, luego valores sustituidos y resultado. */
  z.object({
    tipo: z.literal('formula'),
    logica: Texto,
    leyenda: z.array(z.tuple([Texto, Texto])).default([]),
    valores: Texto.optional(),
    resultado: Texto.optional()
  }),
  /** Proceso secuencial (p. ej. subasta de CETES). */
  z.object({
    tipo: z.literal('pasos'),
    pasos: z.array(z.object({ titulo: Texto, cuando: z.string().optional(), texto: Texto })).min(2)
  }),
  z.object({
    tipo: z.literal('tabla'),
    encabezados: z.array(Texto).min(2),
    filas: z.array(z.array(z.string())).min(1),
    /** Celdas que son trampa típica de examen: [fila, columna]. */
    trampas: z.array(z.tuple([z.number().int().min(0), z.number().int().min(0)])).default([])
  }),
  /** Lista numerada (el estilo del proyecto no usa viñetas). */
  z.object({ tipo: z.literal('lista'), items: z.array(Texto).min(1) }),
  /** Teclas de la calculadora financiera (HP 17bII+). */
  z.object({ tipo: z.literal('calculadora'), funcion: Texto, entradas: z.array(z.tuple([Texto, Texto])), salida: z.tuple([Texto, Texto]) }),
  /** Advertencia de examen: confusión típica. */
  z.object({ tipo: z.literal('trampa'), texto: Texto })
])

export const LaminaSchema = z.object({
  id: Slug,
  titulo: Texto,
  bloques: z.array(BloqueSchema).min(1),
  /** Explicación ampliada que aparece debajo de la lámina. */
  ampliada: z.string().default(''),
  /** Página(s) del manual AMIB 1 que respaldan la lámina. */
  paginas: z.array(z.number().int().positive()).default([])
})

export const LeccionSchema = z.object({
  id: Slug,
  area: AreaIdSchema,
  /** Materia del temario, p. ej. "Títulos de Deuda I". */
  materia: Texto,
  subtemaId: Slug.optional(),
  objetivoIds: z.array(Slug).default([]),
  /** Orden dentro del área, siguiendo el manual. */
  orden: z.number().int().nonnegative(),
  titulo: Texto,
  resumen: Texto,
  duracionMin: z.number().int().positive(),
  fuentes: z.array(z.object({ documento: Texto, paginas: z.array(z.number().int().positive()).default([]) })).min(1),
  laminas: z.array(LaminaSchema).min(1),
  puntosClave: z.array(Texto).min(3),
  /** Ids de preguntas para la práctica guiada (con explicación inmediata). */
  practica: z.array(Slug).min(3),
  /** Ids de preguntas del mini examen (sin ayuda hasta el final). */
  miniExamen: z.array(Slug).min(3),
  /** Ids de preguntas difíciles para el reto de "Dominado". */
  reto: z.array(Slug).default([])
})

export type Bloque = z.infer<typeof BloqueSchema>
export type Lamina = z.infer<typeof LaminaSchema>
export type Leccion = z.infer<typeof LeccionSchema>

/** Caracteres prohibidos por la regla de estilo académico (CLAUDE.md). */
export const CARACTERES_PROHIBIDOS = /[—–·•°*]|^\s*-\s/m

/** Devuelve los textos de una lección que violan la regla de estilo (para el validador). */
export function violacionesDeEstilo(leccion: Leccion): string[] {
  const textos: string[] = [leccion.titulo, leccion.resumen, ...leccion.puntosClave]
  for (const l of leccion.laminas) {
    textos.push(l.titulo, l.ampliada)
    for (const b of l.bloques) {
      if (b.tipo === 'parrafo' || b.tipo === 'trampa') textos.push(b.texto)
      else if (b.tipo === 'resumen') textos.push(b.etiqueta, b.texto)
      else if (b.tipo === 'ficha') b.filas.forEach(([a, c]) => textos.push(a, c))
      else if (b.tipo === 'pasos') b.pasos.forEach((p) => textos.push(p.titulo, p.cuando ?? '', p.texto))
      else if (b.tipo === 'tabla') textos.push(...b.encabezados, ...b.filas.flat())
      else if (b.tipo === 'lista') textos.push(...b.items)
      else if (b.tipo === 'formula') b.leyenda.forEach(([, v]) => textos.push(v))
    }
  }
  // Se quita el marcado permitido (**negritas**) antes de buscar asteriscos sueltos.
  return textos.filter((t) => CARACTERES_PROHIBIDOS.test(t.replace(/\*\*/g, '')))
}
