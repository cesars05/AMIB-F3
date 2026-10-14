/**
 * Lector mínimo de .docx: descomprime `word/document.xml` y lo convierte en bloques
 * (párrafos y tablas) con sus *runs* y negritas. Sin dependencias de Electron ni de React.
 *
 * Supuestos verificados con los documentos de `AMIB Data/`: las tablas no están anidadas
 * y el formato (negritas) viene en `w:rPr` de cada *run*, no en estilos.
 */
import JSZip from 'jszip'

export interface RunDocx {
  texto: string
  negrita: boolean
}

export interface ParrafoDocx {
  tipo: 'parrafo'
  runs: RunDocx[]
  /** Texto completo del párrafo (runs concatenados). */
  texto: string
}

export interface TablaDocx {
  tipo: 'tabla'
  /** filas → celdas → párrafos */
  filas: ParrafoDocx[][][]
}

export type BloqueDocx = ParrafoDocx | TablaDocx

/** Texto de una celda: sus párrafos unidos con salto de línea. */
export function textoCelda(celda: readonly ParrafoDocx[]): string {
  return celda.map((p) => p.texto).join('\n')
}

/** Todos los runs de una celda, en orden. */
export function runsCelda(celda: readonly ParrafoDocx[]): RunDocx[] {
  return celda.flatMap((p) => p.runs)
}

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

export function decodificarXml(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-z]+);/g, (m, g: string) => {
    if (g.startsWith('#x')) return String.fromCodePoint(parseInt(g.slice(2), 16))
    if (g.startsWith('#')) return String.fromCodePoint(parseInt(g.slice(1), 10))
    return ENTIDADES[g] ?? m
  })
}

/** `<w:b/>` activa la negrita; `w:val` en 0/false/off la desactiva. */
function esNegrita(propiedades: string): boolean {
  const m = /<w:b(?:\s+[^>]*?)?\/?>/.exec(propiedades.replace(/<w:bCs[^>]*>/g, ''))
  if (!m) return false
  const val = /w:val="([^"]*)"/.exec(m[0])
  return !val || !['0', 'false', 'off'].includes(val[1] ?? '')
}

function leerRuns(xmlParrafo: string): RunDocx[] {
  const runs: RunDocx[] = []
  for (const m of xmlParrafo.matchAll(/<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g)) {
    const cuerpo = m[1] ?? ''
    const rPr = /<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(cuerpo)?.[1] ?? ''
    let texto = ''
    for (const t of cuerpo.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>/g)) {
      if (t[0].startsWith('<w:tab')) texto += '\t'
      else if (t[0].startsWith('<w:br')) texto += '\n'
      else texto += decodificarXml(t[1] ?? '')
    }
    if (texto !== '') runs.push({ texto, negrita: esNegrita(rPr) })
  }
  return runs
}

function leerParrafo(xml: string): ParrafoDocx {
  const runs = leerRuns(xml)
  return { tipo: 'parrafo', runs, texto: runs.map((r) => r.texto).join('') }
}

function leerTabla(xml: string): TablaDocx {
  const filas: ParrafoDocx[][][] = []
  for (const tr of xml.matchAll(/<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g)) {
    const celdas: ParrafoDocx[][] = []
    for (const tc of (tr[1] ?? '').matchAll(/<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/g)) {
      const parrafos = [...(tc[1] ?? '').matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)].map((p) => leerParrafo(p[0]))
      celdas.push(parrafos)
    }
    filas.push(celdas)
  }
  return { tipo: 'tabla', filas }
}

/** Convierte el XML de `document.xml` en bloques de nivel superior (párrafos y tablas). */
export function leerBloquesXml(xml: string): BloqueDocx[] {
  const cuerpo = /<w:body>([\s\S]*)<\/w:body>/.exec(xml)?.[1] ?? xml
  const bloques: BloqueDocx[] = []
  for (const m of cuerpo.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)) {
    bloques.push(m[0].startsWith('<w:tbl>') ? leerTabla(m[0]) : leerParrafo(m[0]))
  }
  return bloques
}

/** Lee un .docx (buffer) y devuelve sus bloques. */
export async function leerDocx(buffer: Uint8Array | Buffer): Promise<BloqueDocx[]> {
  const zip = await JSZip.loadAsync(buffer)
  const archivo = zip.file('word/document.xml')
  if (!archivo) throw new Error('El .docx no contiene word/document.xml')
  return leerBloquesXml(await archivo.async('string'))
}
