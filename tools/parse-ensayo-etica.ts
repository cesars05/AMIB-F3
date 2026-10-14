/**
 * Parser del "Ensayo de examen" del manual de Ética (`Manual_EBSPMV_completo.md`) →
 * `content/preguntas/oficial/etica-ensayo.json`.
 *
 * El Markdown es irregular: las opciones pueden ir en párrafos separados, con viñetas y sangría, o varias en una
 * misma línea (`a) verdad b) hábito c) libertad`). La clave sale de la tabla "Sección de respuestas".
 */
import { ArchivoPreguntasSchema, type PreguntaEntrada } from '../app/src/core/contenido'
import { clave as claveTexto, colapsar } from './texto'

export interface PreguntaEnsayo {
  numero: number
  enunciado: string
  opciones: string[]
  /** Página del PDF donde empieza la pregunta (ver `PAGINA_SIGUIENTE_AL_MARCADOR`). */
  pagina: number
}

/**
 * Los marcadores `<!-- pag. N del PDF -->` van al FINAL de la página N: el contenido que los sigue está en la
 * página N+1. Verificado con `pdftotext` sobre `Manual EBSPMVweb.pdf` (el "Ensayo de examen" abre la p. 74 y sigue
 * al marcador `pag. 73`; la pregunta 13 abre la p. 76 y sigue al marcador `pag. 75`).
 */
export const PAGINA_SIGUIENTE_AL_MARCADOR = 1

const RE_MARCADOR = /^<!--\s*pag\.\s*(\d+)\s+del PDF\s*-->\s*$/
const RE_SUBAREA = /^\s*(?:#+\s*)?sub\s+[áa]rea\s*:/i
const RE_PREGUNTA = /^\s*(?:-\s+)?(\d+)\.-\s*(.*)$/

/** Quita viñeta y sangría iniciales de una línea. */
const sinViñeta = (l: string) => l.replace(/^\s*(?:-\s+)?/, '').trimEnd()

export function extraerEnsayo(md: string): PreguntaEnsayo[] {
  const lineas = md.split(/\r?\n/)
  const inicio = lineas.findIndex((l) => /^##\s+Ensayo de examen\s*$/.test(l))
  if (inicio < 0) throw new Error('No se encontró la sección "Ensayo de examen"')
  const fin = lineas.findIndex((l, i) => i > inicio && /^##\s+/.test(l))
  const hasta = fin < 0 ? lineas.length : fin

  let pagina = 0
  for (let i = 0; i < inicio; i++) pagina = Number(RE_MARCADOR.exec(lineas[i]!)?.[1] ?? pagina)

  type Trozo = { numero: number; pagina: number; lineas: string[] }
  const trozos: Trozo[] = []
  for (let i = inicio + 1; i < hasta; i++) {
    const linea = lineas[i]!
    const marcador = RE_MARCADOR.exec(linea)
    if (marcador) {
      pagina = Number(marcador[1])
      continue
    }
    if (!linea.trim() || RE_SUBAREA.test(linea)) continue
    const p = RE_PREGUNTA.exec(linea)
    if (p) trozos.push({ numero: Number(p[1]), pagina: pagina + PAGINA_SIGUIENTE_AL_MARCADOR, lineas: [p[2] ?? ''] })
    else trozos.at(-1)?.lineas.push(sinViñeta(linea))
  }

  return trozos.map((t) => {
    const lineasLimpias = t.lineas.map((l) => l.trim()).filter(Boolean)
    const texto = lineasLimpias.join('\n')
    // Busca a), b), c), d) en orden, cada una precedida por inicio de línea o espacio.
    const posiciones: number[] = []
    let desde = 0
    for (const letra of ['a', 'b', 'c', 'd']) {
      const m = new RegExp(`(?:^|\\s)${letra}\\)\\s`).exec(texto.slice(desde))
      if (!m) throw new Error(`Pregunta ${t.numero}: no se encontró la opción ${letra})`)
      const pos = desde + m.index + (m[0].startsWith(letra) ? 0 : 1)
      posiciones.push(pos)
      desde = pos + 2
    }
    const enunciado = texto
      .slice(0, posiciones[0])
      .split('\n')
      .map(colapsar)
      .filter(Boolean)
      .join('\n')
    const opciones = posiciones.map((pos, i) => colapsar(texto.slice(pos + 2, posiciones[i + 1] ?? texto.length)))
    return { numero: t.numero, enunciado, opciones, pagina: t.pagina }
  })
}

/** Tabla `|1.|**c)**|17.|**b)**|` → mapa número → letra. */
export function extraerRespuestas(md: string): Map<number, string> {
  const lineas = md.split(/\r?\n/)
  const inicio = lineas.findIndex((l) => /^##\s+Secci[óo]n de respuestas\s*$/.test(l))
  if (inicio < 0) throw new Error('No se encontró la sección "Sección de respuestas"')
  const fin = lineas.findIndex((l, i) => i > inicio && /^##\s+/.test(l))
  const tabla = lineas.slice(inicio + 1, fin < 0 ? undefined : fin).join('\n')
  const mapa = new Map<number, string>()
  for (const m of tabla.matchAll(/\|\s*(\d+)\.\s*\|\s*\*\*([a-d])\)\*\*\s*(?=\|)/g)) mapa.set(Number(m[1]), m[2]!)
  return mapa
}

export interface PreguntaReferencia {
  id: string
  enunciado: string
  opciones: readonly { texto: string }[]
  clave: number | null
}

/** Compara con otro conjunto (p. ej. Preguntas Tipo) y devuelve las notas de duplicado, por número. */
function notasDuplicado(enunciado: string, claveTextoOpcion: string, referencia: readonly PreguntaReferencia[]): string[] {
  const notas: string[] = []
  const norm = (s: string) => claveTexto(s).replace(/[^a-z0-9 ]/g, '').trim()
  for (const r of referencia) {
    if (norm(r.enunciado) !== norm(enunciado)) continue
    notas.push(`duplicado de ${r.id}`)
    const correcta = r.clave === null ? undefined : r.opciones[r.clave]?.texto
    if (correcta !== undefined && norm(correcta) !== norm(claveTextoOpcion)) notas.push(`la clave difiere de la de ${r.id}`)
  }
  return notas
}

export function parsearEnsayoEtica(md: string, fuente: string, generado: string, referencia: readonly PreguntaReferencia[] = []) {
  const respuestas = extraerRespuestas(md)
  const preguntas: PreguntaEntrada[] = extraerEnsayo(md).map((q) => {
    const letra = respuestas.get(q.numero)
    if (!letra) throw new Error(`Pregunta ${q.numero}: sin clave en la sección de respuestas`)
    const clave = 'abcd'.indexOf(letra)
    return {
      id: `etica-ensayo.${String(q.numero).padStart(2, '0')}`,
      area: 'etica',
      enunciado: q.enunciado,
      opciones: q.opciones.map((texto) => ({ texto })),
      clave,
      tipo: 'teoria',
      formato: /\bEXCEPTO\b/i.test(q.enunciado) ? 'excepto' : 'directa',
      fuente: 'manual-ensayo',
      cita: { documento: 'AMIB Data/Manual_EBSPMV_completo.md', pagina: q.pagina },
      estado: 'validada',
      notas: notasDuplicado(q.enunciado, q.opciones[clave] ?? '', referencia)
    }
  })
  return ArchivoPreguntasSchema.parse({ fuente, generado, preguntas })
}
