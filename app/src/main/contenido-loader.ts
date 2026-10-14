/**
 * Carga y validación del contenido versionado (`content/`), según el ADR-002.
 * Un archivo o una pregunta que no cumple el esquema se omite y se registra el error: la app no se cae.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { PreguntaSchema, TaxonomiaSchema, type Pregunta, type Taxonomia } from '../core/contenido'
import { LeccionSchema, violacionesDeEstilo, type Leccion } from '../core/leccion'

export interface Contenido {
  taxonomia: Taxonomia | null
  /** Todas las preguntas válidas, en el orden de carga. */
  banco: Pregunta[]
  preguntas: Map<string, Pregunta>
  lecciones: Leccion[]
  /** Errores que impidieron cargar un archivo o un elemento. */
  errores: string[]
  /** Observaciones que no impiden cargar (estilo, referencias a preguntas inexistentes). */
  avisos: string[]
}

export interface OpcionesRaiz {
  empaquetado: boolean
  /** `process.resourcesPath` (producción). */
  recursos: string
  /** `app.getAppPath()` (desarrollo: raíz del repositorio). */
  raizApp: string
  /** Valor de `AMIB_CONTENT_DIR`: solo para pruebas y desarrollo. */
  entorno?: string
}

/** Producción: `resources/content`. Desarrollo: `content/` en la raíz del repositorio. */
export function resolverRaizContenido(o: OpcionesRaiz): string {
  if (!o.empaquetado && o.entorno) return o.entorno
  return o.empaquetado ? join(o.recursos, 'content') : join(o.raizApp, 'content')
}

function jsonEnDirectorio(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .sort()
    .flatMap((n) => {
      const ruta = join(dir, n)
      const s = statSync(ruta)
      return s.isDirectory() ? jsonEnDirectorio(ruta) : n.endsWith('.json') ? [ruta] : []
    })
}

function leerJson(ruta: string): { ok: true; valor: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, valor: JSON.parse(readFileSync(ruta, 'utf8')) as unknown }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function resumenZod(e: { issues: readonly { path: PropertyKey[]; message: string }[] }): string {
  return e.issues
    .slice(0, 3)
    .map((i) => `${i.path.map(String).join('.') || '(raíz)'}: ${i.message}`)
    .join('; ')
}

/** Valida un archivo de preguntas: el sobre debe traer `preguntas`; cada pregunta se valida por separado. */
export function validarArchivoPreguntas(json: unknown, origen: string): { preguntas: Pregunta[]; errores: string[] } {
  const errores: string[] = []
  if (typeof json !== 'object' || json === null || !Array.isArray((json as { preguntas?: unknown }).preguntas)) {
    return { preguntas: [], errores: [`${origen}: el archivo no tiene la lista "preguntas"`] }
  }
  const preguntas: Pregunta[] = []
  ;(json as { preguntas: unknown[] }).preguntas.forEach((crudo, i) => {
    const r = PreguntaSchema.safeParse(crudo)
    if (r.success) preguntas.push(r.data)
    else {
      const id = typeof crudo === 'object' && crudo && 'id' in crudo ? String((crudo as { id: unknown }).id) : `#${i}`
      errores.push(`${origen}: pregunta ${id} omitida (${resumenZod(r.error)})`)
    }
  })
  return { preguntas, errores }
}

export function validarLeccion(json: unknown, origen: string): { leccion?: Leccion; error?: string } {
  const r = LeccionSchema.safeParse(json)
  return r.success ? { leccion: r.data } : { error: `${origen}: lección omitida (${resumenZod(r.error)})` }
}

export function cargarContenido(raiz: string, log: (mensaje: string) => void = () => {}): Contenido {
  const errores: string[] = []
  const avisos: string[] = []
  const falla = (m: string) => {
    errores.push(m)
    log(m)
  }
  const aviso = (m: string) => {
    avisos.push(m)
    log(m)
  }

  let taxonomia: Taxonomia | null = null
  const rutaTax = join(raiz, 'taxonomia.json')
  if (existsSync(rutaTax)) {
    const j = leerJson(rutaTax)
    if (!j.ok) falla(`taxonomia.json: JSON ilegible (${j.error})`)
    else {
      const r = TaxonomiaSchema.safeParse(j.valor)
      if (r.success) taxonomia = r.data
      else falla(`taxonomia.json: ${resumenZod(r.error)}`)
    }
  } else falla(`No existe taxonomia.json en ${raiz}`)

  const preguntas = new Map<string, Pregunta>()
  const banco: Pregunta[] = []
  for (const ruta of jsonEnDirectorio(join(raiz, 'preguntas'))) {
    const nombre = ruta.slice(raiz.length + 1)
    const j = leerJson(ruta)
    if (!j.ok) {
      falla(`${nombre}: JSON ilegible (${j.error})`)
      continue
    }
    const r = validarArchivoPreguntas(j.valor, nombre)
    r.errores.forEach(falla)
    for (const p of r.preguntas) {
      if (preguntas.has(p.id)) falla(`${nombre}: id de pregunta repetido ${p.id}`)
      else {
        preguntas.set(p.id, p)
        banco.push(p)
      }
    }
  }

  const lecciones: Leccion[] = []
  const idsLeccion = new Set<string>()
  for (const ruta of jsonEnDirectorio(join(raiz, 'lecciones'))) {
    const nombre = ruta.slice(raiz.length + 1)
    const j = leerJson(ruta)
    if (!j.ok) {
      falla(`${nombre}: JSON ilegible (${j.error})`)
      continue
    }
    const r = validarLeccion(j.valor, nombre)
    if (r.error) {
      falla(r.error)
      continue
    }
    const l = r.leccion!
    if (idsLeccion.has(l.id)) {
      falla(`${nombre}: id de lección repetido ${l.id}`)
      continue
    }
    idsLeccion.add(l.id)
    for (const id of [...l.practica, ...l.miniExamen, ...l.reto]) if (!preguntas.has(id)) aviso(`${nombre}: la lección ${l.id} cita la pregunta inexistente ${id}`)
    for (const v of violacionesDeEstilo(l)) aviso(`${nombre}: estilo prohibido en "${v.slice(0, 50)}"`)
    lecciones.push(l)
  }
  lecciones.sort((a, b) => a.area.localeCompare(b.area) || a.orden - b.orden || a.id.localeCompare(b.id))

  return { taxonomia, banco, preguntas, lecciones, errores, avisos }
}
