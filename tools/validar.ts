/**
 * Validación del contenido de `content/` (pura: recibe los JSON ya leídos).
 * La lectura de disco y el código de salida viven en `validate-content.ts`.
 */
import { ArchivoPreguntasSchema, IndiceManualSchema, TaxonomiaSchema, idsDuplicados, type IndiceManual, type Pregunta, type Taxonomia } from '../app/src/core/contenido'
import { ClavesLibroSchema, type ClavesLibro } from './claves-libro'

export interface ArchivoContenido {
  /** Ruta relativa a la raíz del repo, con `/`. */
  ruta: string
  datos: unknown
}

export interface ResumenContenido {
  archivos: number
  preguntas: number
  porArea: Record<string, number>
  porEstado: Record<string, number>
  porFuente: Record<string, number>
  taxonomia?: { temas: number; subtemas: number; objetivos: number }
  manual?: { secciones: number; porCapitulo: Record<string, number>; vinculadas: number; exclusivasFig3: number; archivos: string[] }
}

// ─── Estilo de redacción (regla de Cesar, ver CLAUDE.md) ─────────────────────

/** Caracteres prohibidos en el contenido que se redacta: guion largo, guion medio, punto medio, viñeta, grado y asterisco. */
const RE_CARACTER_PROHIBIDO = /[—–·•°*]/g
/** Guion usado como viñeta: al inicio de línea, seguido de espacio. */
const RE_VINETA_GUION = /^[ \t]*-[ \t]/m
/** Contenido redactado por nosotros (lo extraído del OCR oficial queda exento). */
const RE_RUTA_REDACTADA = /^content\/(?:guias|lecciones)\//
const FUENTES_REDACTADAS: ReadonlySet<string> = new Set(['generada', 'generada-en-vivo'])

/** Problemas de estilo de un texto: cada caracter prohibido distinto y el guion como viñeta. Vacío = cumple. */
export function problemasDeEstilo(texto: string): string[] {
  // `**texto**` es marcado interno de negritas (core/leccion.ts): nunca se muestra, así que no cuenta como asterisco.
  const visible = texto.replace(/\*\*/g, '')
  const problemas = [...new Set(visible.match(RE_CARACTER_PROHIBIDO) ?? [])].map((c) => `caracter prohibido "${c}"`)
  if (RE_VINETA_GUION.test(visible)) problemas.push('guion usado como viñeta')
  return problemas
}

/** Todas las cadenas de un valor JSON (valores, no claves). */
function cadenas(valor: unknown, ruta = ''): { ruta: string; texto: string }[] {
  if (typeof valor === 'string') return [{ ruta, texto: valor }]
  if (Array.isArray(valor)) return valor.flatMap((v, i) => cadenas(v, `${ruta}[${i}]`))
  if (valor && typeof valor === 'object') return Object.entries(valor).flatMap(([k, v]) => cadenas(v, ruta ? `${ruta}.${k}` : k))
  return []
}

/** Markdown de guías y lecciones: se ignora el encabezado YAML (`---`), donde las listas con guion son sintaxis. */
function cuerpoMarkdown(texto: string): string {
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(texto)
  return m ? texto.slice(m[0].length) : texto
}

const contar = <T extends string>(items: readonly T[]): Record<string, number> => {
  const r: Record<string, number> = {}
  for (const i of items) r[i] = (r[i] ?? 0) + 1
  return r
}

function idsTaxonomia(t: Taxonomia): { todos: string[]; subtemas: Set<string>; objetivos: Set<string> } {
  const todos: string[] = []
  const subtemas = new Set<string>()
  const objetivos = new Set<string>()
  for (const a of t.areas)
    for (const tema of a.temas) {
      todos.push(tema.id)
      for (const s of tema.subtemas) {
        todos.push(s.id)
        subtemas.add(s.id)
        for (const o of s.objetivos) {
          todos.push(o.id)
          objetivos.add(o.id)
        }
      }
    }
  return { todos, subtemas, objetivos }
}

export function validarContenido(archivos: readonly ArchivoContenido[]): { errores: string[]; resumen: ResumenContenido } {
  const errores: string[] = []
  const preguntas: { ruta: string; p: Pregunta }[] = []
  let taxonomia: { ruta: string; t: Taxonomia } | undefined
  let manual: { ruta: string; m: IndiceManual } | undefined
  let claves: ClavesLibro | undefined

  for (const { ruta, datos } of archivos) {
    if (ruta.endsWith('taxonomia.json')) {
      const r = TaxonomiaSchema.safeParse(datos)
      if (!r.success) errores.push(`${ruta}: ${r.error.issues.slice(0, 5).map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`)
      else {
        taxonomia = { ruta, t: r.data }
        const dup = idsDuplicados(idsTaxonomia(r.data).todos.map((id) => ({ id })))
        if (dup.length) errores.push(`${ruta}: ids de taxonomía repetidos: ${dup.slice(0, 5).join(', ')}`)
      }
    } else if (ruta.endsWith('manual/indice.json')) {
      const r = IndiceManualSchema.safeParse(datos)
      if (!r.success) errores.push(`${ruta}: ${r.error.issues.slice(0, 5).map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`)
      else manual = { ruta, m: r.data }
    } else if (ruta.includes('/preguntas/')) {
      const r = ArchivoPreguntasSchema.safeParse(datos)
      if (!r.success) errores.push(`${ruta}: ${r.error.issues.slice(0, 5).map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`)
      else for (const p of r.data.preguntas) preguntas.push({ ruta, p })
    } else if (ruta.startsWith('content/claves/')) {
      const r = ClavesLibroSchema.safeParse(datos)
      if (!r.success) errores.push(`${ruta}: ${r.error.issues.slice(0, 5).map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`)
      else claves = r.data
    } else if (RE_RUTA_REDACTADA.test(ruta)) {
      // Guías y lecciones (JSON o Markdown): todo el texto es redactado, así que se revisa completo.
      const textos = typeof datos === 'string' ? [{ ruta: '', texto: cuerpoMarkdown(datos) }] : cadenas(datos)
      for (const t of textos) for (const pr of problemasDeEstilo(t.texto)) errores.push(`${ruta}${t.ruta ? ` ${t.ruta}` : ''}: ${pr} (estilo de redacción)`)
    } else {
      errores.push(`${ruta}: archivo de contenido no reconocido`)
    }
  }

  for (const id of idsDuplicados(preguntas.map((x) => x.p))) {
    const donde = preguntas.filter((x) => x.p.id === id).map((x) => x.ruta)
    errores.push(`id de pregunta repetido: ${id} (${donde.join(', ')})`)
  }

  // Estilo: las preguntas generadas (por nosotros o en vivo) se redactan; las oficiales y las del OCR están exentas.
  for (const { ruta, p } of preguntas) {
    if (!FUENTES_REDACTADAS.has(p.fuente)) continue
    const campos: { campo: string; texto: string | undefined }[] = [
      { campo: 'enunciado', texto: p.enunciado },
      { campo: 'explicacion', texto: p.explicacion },
      ...p.opciones.flatMap((o, i) => [
        { campo: `opciones[${i}].texto`, texto: o.texto },
        { campo: `opciones[${i}].porQueNo`, texto: o.porQueNo }
      ])
    ]
    for (const { campo, texto } of campos) for (const pr of problemasDeEstilo(texto ?? '')) errores.push(`${ruta}: ${p.id} ${campo}: ${pr} (estilo de redacción)`)
  }

  // Claves del libro: ninguna pregunta del repaso lleva clave sin su número del libro, y la clave coincide con la oficial.
  for (const { ruta, p } of preguntas) {
    const m = /^manual-repaso\.c(\d{2})\.q\d{2}$/.exec(p.id)
    if (!m || p.clave === null) continue
    if (p.numeroLibro === undefined) {
      errores.push(`${ruta}: ${p.id} tiene clave sin numeroLibro`)
      continue
    }
    const oficial = claves?.capitulos.find((c) => c.capitulo === Number(m[1]))?.claves[p.numeroLibro - 1]
    if (claves && oficial === undefined) errores.push(`${ruta}: ${p.id} apunta a la pregunta ${p.numeroLibro} del libro, que no existe en la clave oficial`)
    else if (oficial !== undefined && 'abcd'.indexOf(oficial) !== p.clave) errores.push(`${ruta}: ${p.id} (libro ${p.numeroLibro}) tiene clave ${'abcd'[p.clave]} pero la oficial es ${oficial}`)
  }

  if (taxonomia) {
    const { subtemas, objetivos } = idsTaxonomia(taxonomia.t)
    for (const { ruta, p } of preguntas) {
      if (p.subtemaId && !subtemas.has(p.subtemaId)) errores.push(`${ruta}: ${p.id} apunta a un subtemaId inexistente (${p.subtemaId})`)
      if (p.objetivoId && !objetivos.has(p.objetivoId)) errores.push(`${ruta}: ${p.id} apunta a un objetivoId inexistente (${p.objetivoId})`)
    }
  }

  if (manual) {
    const { ruta, m } = manual
    const archivosVistos = new Set<string>()
    const numerosVistos = new Map<string, number>()
    let ultimaPagina = 0
    for (const sec of m.secciones) {
      if (archivosVistos.has(sec.archivo)) errores.push(`${ruta}: archivo de sección repetido (${sec.archivo})`)
      archivosVistos.add(sec.archivo)
      // El número normalizado es único por capítulo, salvo en las lecturas dudosas (el OCR repite números).
      const clave = `${sec.capitulo}|${sec.numero}`
      numerosVistos.set(clave, (numerosVistos.get(clave) ?? 0) + 1)
      if (numerosVistos.get(clave)! > 1 && sec.correccionNumero !== 'dudosa') errores.push(`${ruta}: número de sección repetido sin marcar como dudoso (${sec.numero})`)
      if (!sec.archivo.startsWith(`content/manual/cap${String(sec.capitulo).padStart(2, '0')}/`)) errores.push(`${ruta}: ${sec.numero} apunta a una carpeta de otro capítulo (${sec.archivo})`)
      if (sec.paginas.inicio < ultimaPagina) errores.push(`${ruta}: las páginas de ${sec.numero} retroceden (${sec.paginas.inicio} < ${ultimaPagina})`)
      ultimaPagina = Math.max(ultimaPagina, sec.paginas.inicio)
    }
    if (taxonomia) {
      const { objetivos } = idsTaxonomia(taxonomia.t)
      for (const sec of m.secciones) {
        if (sec.objetivoId && !objetivos.has(sec.objetivoId)) errores.push(`${ruta}: ${sec.numero} apunta a un objetivoId inexistente (${sec.objetivoId})`)
      }
    }
  }

  const resumen: ResumenContenido = {
    archivos: archivos.length,
    preguntas: preguntas.length,
    porArea: contar(preguntas.map((x) => x.p.area)),
    porEstado: contar(preguntas.map((x) => x.p.estado)),
    porFuente: contar(preguntas.map((x) => x.p.fuente))
  }
  if (taxonomia) {
    const ids = idsTaxonomia(taxonomia.t)
    resumen.taxonomia = {
      temas: taxonomia.t.areas.reduce((n, a) => n + a.temas.length, 0),
      subtemas: ids.subtemas.size,
      objetivos: ids.objetivos.size
    }
  }
  if (manual) {
    const porCapitulo: Record<string, number> = {}
    for (const sec of manual.m.secciones) porCapitulo[sec.capitulo] = (porCapitulo[sec.capitulo] ?? 0) + 1
    resumen.manual = {
      secciones: manual.m.secciones.length,
      porCapitulo,
      vinculadas: manual.m.secciones.filter((s) => s.objetivoId !== null).length,
      exclusivasFig3: manual.m.secciones.filter((s) => s.exclusivoFig3).length,
      archivos: manual.m.secciones.map((s) => s.archivo)
    }
  }
  return { errores, resumen }
}
