/**
 * Parser del manual oficial en OCR (`AMIB Data/AMIB_1_completo.md`, Tesseract) → capítulos y secciones.
 *
 * Estructura del Markdown (ruidosa):
 * - `## Capítulo N. TÍTULO` (10 capítulos; el 10 es el formulario).
 * - Encabezados de tema `N.N. TÍTULO EN MAYÚSCULAS` o `### N.N Título`.
 * - Una sección por objetivo de aprendizaje: `#### N.N.N. <texto del objetivo>`. El OCR perdió ~60 de esos `####`
 *   (queda la línea `N.N.N. Identificar…` sin almohadillas) y rompió numeraciones (`1.14.4.` = 1.1.4, `5.4` = 6.4).
 * - Marcadores `<!-- page N -->` al INICIO de la página N del PDF (el pie "Pág. M" impreso va 2 menos).
 * - `N.N. REPASO DEL CAPÍTULO`: preguntas de opción múltiple sin clave (ver `parse-repaso.ts`).
 * - "(INFORMACIÓN FIGURA 3)*": contenido exclusivo de la Figura 3 (regla de alcance en `RE_FIG3` y `parsearManual`).
 *
 * Todo es puro: recibe el texto y devuelve objetos. La lectura de disco vive en `construir.ts`.
 */
import { colapsar, sinAcentos } from './texto'
import { distanciaEdicion } from './similitud'

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Títulos canónicos (los del índice del manual): el OCR del encabezado trae basura ("MATEMÁTICAS FINANCIERAS Y — Lalra € Carza"). */
export const TITULOS_CAPITULO: Readonly<Record<number, string>> = {
  1: 'Ética',
  2: 'Servicios de Inversión',
  3: 'Marco Normativo',
  4: 'Matemáticas Financieras y Portafolios de Inversión',
  5: 'Mercado de Capitales',
  6: 'Títulos de Deuda',
  7: 'Fondos de Inversión',
  8: 'Derivados y Riesgos',
  9: 'Análisis Económico, Financiero y Técnico',
  10: 'Formulario'
}

/** Cantidad de temas `N.k` con secciones por capítulo (el siguiente, `N.k+1`, es el repaso). Del índice del manual. */
export const TEMAS_POR_CAPITULO: Readonly<Record<number, number>> = { 1: 4, 2: 5, 3: 15, 4: 3, 5: 9, 6: 5, 7: 4, 8: 11, 9: 8 }

/** Alcance del marcador de la Figura 3: ver `parsearManual`. Tolera el OCR: `[INFORMACIÓN FIGURA 3)"`, `(INFORMACIÓN FIGURA 3)*`. */
const RE_FIG3 = /[(\[]?\s*INFORMACI[ÓO]N\s+FIGURA\s*3\s*[)\]]?\s*[*"”']?/gi
const RE_FIG3_PRUEBA = /INFORMACI[ÓO]N\s+FIGURA\s*3/i

const RE_CAPITULO = /^##\s+Cap[ií]tulo\s+(\d{1,2})\s*\.\s*(.*)$/
const RE_PAGINA = /^<!--\s*page\s+(\d+)\s*-->\s*$/
/** Tema: `### 1.2 Título` o `6.14. ELEMENTOS BÁSICOS.` (en mayúsculas). Solo dos grupos numéricos. */
const RE_TEMA = /^(#{1,3}\s+)?([0-9]{1,2})\s?[.,]\s?([0-9]{1,3})\s*[.,]?\s+(\S.*)$/
/** Sección: tres grupos numéricos con `.` o `,` (el OCR confunde ambos) y letras parecidas a dígitos (B=8, O=0, l/I=1, S=5). */
const RE_SECCION = /^(#{4}\s+)?(([0-9BOoIlS]{1,3})\s?[.,]\s?([0-9BOoIlS]{1,3})\s?[.,]\s?([0-9BOoIlS]{1,3}))(?:\s?[.,]|\s)\s*(.*)$/

const SEMEJANTES: Readonly<Record<string, string>> = { B: '8', O: '0', o: '0', I: '1', l: '1', S: '5' }
const comoDigitos = (s: string) => s.replace(/[BOoIlS]/g, (c) => SEMEJANTES[c] ?? c)

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type CorreccionNumero = 'ninguna' | 'formato' | 'secuencia' | 'dudosa'

export interface SeccionManual {
  capitulo: number
  /** Número normalizado ("6.1.3"), único dentro del capítulo salvo `correccion: 'dudosa'`. */
  numero: string
  /** Número tal como lo imprime el OCR ("6.1,3" / "1.14.4" / ""). */
  numeroOriginal: string
  correccion: CorreccionNumero
  titulo: string
  /** `encabezado` (`####`), `recuperado` (la línea de numeración sin `####`) o `capitulo` (el formulario completo). */
  origen: 'encabezado' | 'recuperado' | 'capitulo'
  /** Páginas del PDF (marcadores `<!-- page N -->`). */
  paginas: { inicio: number; fin: number }
  /** OCR crudo del cuerpo (sin la línea del encabezado), recortado. */
  texto: string
  /** Toda la sección es exclusiva de la Figura 3. */
  exclusivoFig3: boolean
  /** El cuerpo contiene un subtema marcado "(INFORMACIÓN FIGURA 3)*" pero la sección no lo está entera. */
  fig3Parcial: boolean
}

export interface BloqueRepaso {
  capitulo: number
  /** Título del encabezado (`REPASO DEL CAPÍTULO`). */
  titulo: string
  paginas: { inicio: number; fin: number }
  /** Líneas no vacías con la página en que cae cada una. */
  lineas: { texto: string; pagina: number }[]
}

export interface CapituloManual {
  numero: number
  titulo: string
  paginas: { inicio: number; fin: number }
  secciones: SeccionManual[]
  repaso: BloqueRepaso | null
}

export interface ManualParseado {
  capitulos: CapituloManual[]
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

/** Quita el marcador de la Figura 3 y devuelve si lo tenía. */
export function quitarMarcadorFig3(texto: string): { texto: string; marcado: boolean } {
  const marcado = RE_FIG3_PRUEBA.test(texto)
  return { texto: colapsar(texto.replace(RE_FIG3, ' ')), marcado }
}

const esMayusculas = (s: string) => {
  const letras = s.match(/\p{L}/gu) ?? []
  if (letras.length < 5) return false
  const may = letras.filter((c) => c === c.toLocaleUpperCase('es') && c !== c.toLocaleLowerCase('es')).length
  return may / letras.length >= 0.85
}

/** Quita basura inicial (comillas, guiones, dígitos pegados al verbo: "1dentificar" → "dentificar"). */
function limpiarTitulo(s: string): string {
  return colapsar(s.replace(/^[^\p{L}¿¡]+/u, ''))
}

function recortarTitulo(titulo: string, max = 220): { titulo: string; resto: string } {
  if (titulo.length <= max) return { titulo, resto: '' }
  const corte = titulo.lastIndexOf(' ', max)
  const k = corte > 40 ? corte : max
  return { titulo: titulo.slice(0, k).trim(), resto: titulo.slice(k).trim() }
}

// ─── Candidatos a encabezado ─────────────────────────────────────────────────

export interface Candidato {
  /** Índice de línea. */
  i: number
  /** `####` (seguro) o línea suelta con numeración (débil: puede ser un falso positivo). */
  fuerte: boolean
  /** Grupos tal como vienen, ya con letras→dígitos. */
  g1: string
  g2: string
  g3: string
  /** Número tal como lo imprime el OCR, sin espacios ("1,1.1", "B.3.8"). */
  original: string
  tituloBruto: string
  /** El texto empieza como un objetivo (verbo en infinitivo): un candidato débil así casi seguro es un encabezado perdido. */
  empiezaConVerbo: boolean
}

/** Edición mínima para separar `N.t.s`: devuelve `null` si la línea no es un candidato válido en este capítulo. */
function candidatoSeccion(linea: string, i: number, capitulo: number): Candidato | null {
  const m = RE_SECCION.exec(linea)
  if (!m) return null
  const fuerte = Boolean(m[1])
  const [g1, g2, g3] = [comoDigitos(m[3]!), comoDigitos(m[4]!), comoDigitos(m[5]!)]
  const titulo = limpiarTitulo(m[6] ?? '')
  // Débil: el primer grupo debe ser exactamente el capítulo y debe seguir texto con letras (verbo u objeto).
  if (!fuerte) {
    if (g1 !== String(capitulo)) return null
    if ((titulo.match(/\p{L}{3,}/gu) ?? []).length < 2) return null
  }
  if (!/^\d+$/.test(g1 + g2 + g3)) return null
  const primera = sinAcentos(titulo).toLowerCase().split(/\s+/)[0] ?? ''
  const empiezaConVerbo = /^[a-z]{4,}(?:ar|er|ir)(?:l[oa]s?)?$/.test(primera)
  return { i, fuerte, g1, g2, g3, original: m[2]!.replace(/\s+/g, ''), tituloBruto: m[6] ?? '', empiezaConVerbo }
}

// ─── Numeración: programación dinámica sobre el orden del documento ──────────

type Valor = number // t*100 + s
const valorDe = (t: number, s: number): Valor => t * 100 + s
const tDe = (v: Valor) => Math.floor(v / 100)
const sDe = (v: Valor) => v % 100

const COSTO_SALTAR_FUERTE = 5
const COSTO_SALTAR_DEBIL = 1.3
/** Un candidato débil que empieza con verbo de objetivo es casi seguro un encabezado perdido: cuesta más descartarlo. */
const COSTO_SALTAR_DEBIL_CON_VERBO = 2.8
/** Se descartan estados que cuestan más que el mejor + este margen (acelera la búsqueda sin cambiar el resultado práctico). */
const PODA = 6
const COSTO_HUECO_SECCION = 0.1
const COSTO_HUECO_TEMA = 0.25
const MARGEN_DUDOSA = 1.1

/** Costo de pasar del último valor asignado `u` (0 = inicio) a `v`; `Infinity` si no es estrictamente creciente. */
function costoTransicion(u: Valor, v: Valor): number {
  const [t, s] = [tDe(v), sDe(v)]
  // Al inicio no se sabe en qué tema empieza el fragmento (puede faltar el comienzo): solo se prefiere una sección baja.
  if (u === 0) return COSTO_HUECO_SECCION * (s - 1)
  const [tu, su] = [tDe(u), sDe(u)]
  if (t === tu && s > su) return COSTO_HUECO_SECCION * (s - su - 1)
  if (t > tu) return COSTO_HUECO_TEMA * (t - tu - 1) + COSTO_HUECO_SECCION * (s - 1)
  return Infinity
}

interface Opcion {
  valor: Valor
  costo: number
}

function opcionesDe(c: Candidato, maxTema: number): Opcion[] {
  const crudo = `${c.g2}.${c.g3}`
  const r: Opcion[] = []
  for (let t = 1; t <= maxTema; t++)
    for (let s = 1; s <= 60; s++) {
      const costo = distanciaEdicion(crudo, `${t}.${s}`)
      if (costo <= 2) r.push({ valor: valorDe(t, s), costo })
    }
  return r
}

interface Estado {
  costo: number
  /** Estado anterior (clave) y valor elegido para este candidato (null = saltado). */
  previo: string | null
  elegido: Valor | null
}

/**
 * Asigna a cada candidato un valor `t.s` (o lo salta) minimizando: ediciones respecto al texto del OCR + huecos
 * en la secuencia + candidatos saltados, con la restricción de que los valores crecen estrictamente.
 * Devuelve, por candidato, el valor elegido (null = saltado) y el costo total.
 */
function resolverSecuencia(cands: readonly Candidato[], opciones: readonly Opcion[][], excluir?: { k: number; valor: Valor }): { valores: (Valor | null)[]; costo: number } {
  // estados[k]: último valor asignado tras procesar los candidatos 0..k.
  const estados: Map<Valor, Estado>[] = []
  let anterior = new Map<Valor, Estado>([[0, { costo: 0, previo: null, elegido: null }]])
  for (let k = 0; k < cands.length; k++) {
    const actual = new Map<Valor, Estado>()
    const c = cands[k]!
    const costoSaltar = c.fuerte ? COSTO_SALTAR_FUERTE : c.empiezaConVerbo ? COSTO_SALTAR_DEBIL_CON_VERBO : COSTO_SALTAR_DEBIL
    for (const [u, e] of anterior) {
      const saltar = e.costo + costoSaltar
      const previoS = actual.get(u)
      if (!previoS || saltar < previoS.costo) actual.set(u, { costo: saltar, previo: String(u), elegido: null })
      for (const o of opciones[k]!) {
        if (excluir && excluir.k === k && excluir.valor === o.valor) continue
        const paso = costoTransicion(u, o.valor)
        if (!Number.isFinite(paso)) continue
        const total = e.costo + paso + o.costo
        const previoV = actual.get(o.valor)
        if (!previoV || total < previoV.costo) actual.set(o.valor, { costo: total, previo: String(u), elegido: o.valor })
      }
    }
    const minimo = Math.min(...[...actual.values()].map((e) => e.costo))
    for (const [u, e] of actual) if (e.costo > minimo + PODA) actual.delete(u)
    estados.push(actual)
    anterior = actual
  }
  let mejor: Valor = 0
  let mejorCosto = Infinity
  for (const [u, e] of anterior) if (e.costo < mejorCosto) [mejor, mejorCosto] = [u, e.costo]
  const valores: (Valor | null)[] = new Array(cands.length).fill(null)
  let u = mejor
  for (let k = cands.length - 1; k >= 0; k--) {
    const e = estados[k]!.get(u)!
    valores[k] = e.elegido
    u = Number(e.previo)
  }
  return { valores, costo: mejorCosto }
}

interface NumeroResuelto {
  numero: string
  correccion: CorreccionNumero
  /** El candidato se saltó (débil: no es un encabezado; fuerte: no cabe en la secuencia). */
  descartado: boolean
}

/**
 * Normaliza la numeración de los candidatos de UN capítulo.
 * - `ninguna`: el OCR ya traía un número válido en la secuencia.
 * - `formato`: solo cambió el formato, no el número: separador `,` por `.`, letra por dígito (`B.3.8`) o el dígito del capítulo
 *   (que se toma del encabezado `## Capítulo N`, no del OCR: `84.1.7` → 4.1.7).
 * - `secuencia`: se corrigieron dígitos de tema/sección porque una sola lectura encaja con la secuencia.
 * - `dudosa`: había otra lectura casi igual de buena, o no cupo en la secuencia (se deja el número impreso).
 */
export function normalizarNumeracion(cands: readonly Candidato[], capitulo: number): NumeroResuelto[] {
  const maxTema = TEMAS_POR_CAPITULO[capitulo] ?? 0
  const opciones = cands.map((c) => opcionesDe(c, maxTema))
  const base = resolverSecuencia(cands, opciones)
  let anterior: { valor: Valor; dudosa: boolean } | null = null
  return cands.map((c, k) => {
    const v = base.valores[k]!
    const impreso = `${capitulo}.${Number(c.g2)}.${Number(c.g3)}`
    if (v === null) return { numero: c.fuerte ? impreso : '', correccion: 'dudosa' as const, descartado: !c.fuerte }
    const numero = `${capitulo}.${tDe(v)}.${sDe(v)}`
    let correccion: CorreccionNumero
    if (numero === impreso) correccion = c.original === numero ? 'ninguna' : 'formato'
    else {
      // Cambió algún dígito de tema/sección. Solo es "secuencia" si la lectura es única y la corrección es pequeña y aislada.
      const alterna = resolverSecuencia(cands, opciones, { k, valor: v })
      const unica = alterna.costo - base.costo >= MARGEN_DUDOSA
      const unaEdicion = distanciaEdicion(`${c.g2}.${c.g3}`, `${tDe(v)}.${sDe(v)}`) <= 1
      const salto = anterior ? (tDe(v) === tDe(anterior.valor) ? sDe(v) - sDe(anterior.valor) : sDe(v) + 99) : sDe(v)
      correccion = unica && unaEdicion && salto <= 3 && !anterior?.dudosa ? 'secuencia' : 'dudosa'
    }
    anterior = { valor: v, dudosa: correccion === 'dudosa' }
    return { numero, correccion, descartado: false }
  })
}

// ─── Parser principal ────────────────────────────────────────────────────────

interface LineaAnotada {
  texto: string
  pagina: number
}

interface TemaDetectado {
  i: number
  esRepaso: boolean
  fig3: boolean
  titulo: string
}

function detectarTema(linea: string): TemaDetectado | null {
  const m = RE_TEMA.exec(linea)
  if (!m) return null
  const sinMarca = quitarMarcadorFig3(m[4]!)
  const encabezado = Boolean(m[1])
  if (!encabezado && !esMayusculas(sinMarca.texto)) return null
  if (!/\p{L}{3,}/u.test(sinMarca.texto)) return null
  return { i: -1, esRepaso: /\bREPASO\b/i.test(sinMarca.texto), fig3: sinMarca.marcado, titulo: sinMarca.texto.replace(/[.\s]+$/, '') }
}

/** Cuerpo de una sección ya recortado: texto crudo, páginas y marca de contenido parcial de la Figura 3. */
function cuerpoDe(lineas: readonly LineaAnotada[], desde: number, hasta: number, paginaInicio: number): { texto: string; fin: number; fig3Parcial: boolean } {
  const trozo = lineas.slice(desde, hasta)
  const sustantivas = trozo.filter((l) => !RE_PAGINA.test(l.texto) && l.texto.trim() !== '')
  const fin = sustantivas.length ? sustantivas[sustantivas.length - 1]!.pagina : paginaInicio
  const texto = trozo
    .map((l) => l.texto)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { texto, fin: Math.max(fin, paginaInicio), fig3Parcial: sustantivas.some((l) => RE_FIG3_PRUEBA.test(l.texto)) }
}

/**
 * Corta el manual por capítulo y sección.
 *
 * Regla de alcance de la Figura 3 (`exclusivoFig3`, la sección entera es exclusiva):
 * 1. el encabezado del TEMA lleva el marcador ("3.15. ASESORÍA EN INVERSIONES (INFORMACIÓN FIGURA 3)*"): todas las
 *    secciones hasta el siguiente encabezado de tema;
 * 2. el propio encabezado de la sección (`####` o línea recuperada) lleva el marcador.
 * Si el marcador aparece en una línea del cuerpo (un subtema suelto, p. ej. "Calcular el monto de la liquidación
 * diaria. (INFORMACIÓN FIGURA 3)*" dentro de 8.3.6), la sección queda con `fig3Parcial: true` y `exclusivoFig3: false`.
 */
export function parsearManual(md: string): ManualParseado {
  const crudas = md.split(/\r?\n/)
  // Anota la página de cada línea (el marcador abre la página) y localiza capítulos.
  const lineas: LineaAnotada[] = []
  const inicios: { capitulo: number; i: number }[] = []
  let pagina = 0
  for (const texto of crudas) {
    const p = RE_PAGINA.exec(texto)
    if (p) pagina = Number(p[1])
    const cap = RE_CAPITULO.exec(texto)
    if (cap) inicios.push({ capitulo: Number(cap[1]), i: lineas.length })
    lineas.push({ texto, pagina })
  }
  if (inicios.length === 0) throw new Error('No se encontró ningún "## Capítulo N."')

  const capitulos: CapituloManual[] = inicios.map((ini, k) => {
    const hasta = inicios[k + 1]?.i ?? lineas.length
    return construirCapitulo(ini.capitulo, lineas, ini.i, hasta)
  })
  return { capitulos }
}

function construirCapitulo(capitulo: number, lineas: readonly LineaAnotada[], desde: number, hasta: number): CapituloManual {
  const paginaCap = lineas[desde]!.pagina
  const ultimaPagina = lineas.slice(desde, hasta).reduce((p, l) => Math.max(p, l.pagina), paginaCap)

  // Capítulo sin secciones numeradas (el formulario): una sola sección con todo el contenido.
  if (!(capitulo in TEMAS_POR_CAPITULO)) {
    const c = cuerpoDe(lineas, desde + 1, hasta, paginaCap)
    const sec: SeccionManual = {
      capitulo,
      numero: String(capitulo),
      numeroOriginal: String(capitulo),
      correccion: 'ninguna',
      titulo: TITULOS_CAPITULO[capitulo] ?? `Capítulo ${capitulo}`,
      origen: 'capitulo',
      paginas: { inicio: paginaCap, fin: c.fin },
      texto: c.texto,
      exclusivoFig3: false,
      fig3Parcial: false
    }
    return { numero: capitulo, titulo: TITULOS_CAPITULO[capitulo] ?? `Capítulo ${capitulo}`, paginas: { inicio: paginaCap, fin: ultimaPagina }, secciones: [sec], repaso: null }
  }

  // 1) Eventos de la zona del capítulo: temas, candidatos a sección y repaso.
  const temas = new Map<number, TemaDetectado>()
  const cands: Candidato[] = []
  let iRepaso = -1
  for (let i = desde + 1; i < hasta; i++) {
    const texto = lineas[i]!.texto
    if (iRepaso >= 0) break
    const tema = detectarTema(texto)
    if (tema && !RE_SECCION.test(texto.replace(/^#{1,3}\s+/, ''))) {
      temas.set(i, { ...tema, i })
      if (tema.esRepaso) iRepaso = i
      continue
    }
    const c = candidatoSeccion(texto, i, capitulo)
    if (c) cands.push(c)
  }
  const finZona = iRepaso >= 0 ? iRepaso : hasta

  // 2) Numeración normalizada sobre todo el capítulo.
  const resueltos = normalizarNumeracion(cands, capitulo)
  const encabezados = cands.map((c, k) => ({ c, r: resueltos[k]! })).filter((x) => !x.r.descartado)

  // 3) Límites de cada sección: hasta el siguiente encabezado o tema.
  const limites = [...encabezados.map((e) => e.c.i), ...[...temas.keys()].filter((i) => i < finZona)].sort((a, b) => a - b)
  const siguienteLimite = (i: number) => limites.find((l) => l > i) ?? finZona

  // 4) Fig. 3 de tema: vigente desde el encabezado de tema con marcador hasta el siguiente tema.
  const temaFig3En = (i: number): boolean => {
    let vigente = false
    for (const [ti, t] of [...temas].sort((a, b) => a[0] - b[0])) {
      if (ti > i) break
      vigente = t.fig3
    }
    return vigente
  }

  const secciones: SeccionManual[] = encabezados.map(({ c, r }) => {
    const linea = lineas[c.i]!
    const { texto: sinMarca, marcado } = quitarMarcadorFig3(limpiarTitulo(c.tituloBruto))
    let titulo = sinMarca
    let desdeCuerpo = c.i + 1
    // El encabezado puede continuar en el siguiente párrafo (empieza en minúscula y el encabezado no cierra con punto).
    for (let n = 0; n < 2 && !/[.:;]$/.test(titulo); n++) {
      const j = lineas.findIndex((l, idx) => idx >= desdeCuerpo && idx < siguienteLimite(c.i) && l.texto.trim() !== '')
      if (j < 0) break
      const sig = lineas[j]!.texto.trim()
      if (!/^\p{Ll}/u.test(sig) || sig.length > 220 || RE_PAGINA.test(sig)) break
      const q = quitarMarcadorFig3(sig)
      titulo = colapsar(`${titulo} ${q.texto}`)
      desdeCuerpo = j + 1
    }
    const recorte = recortarTitulo(titulo)
    const cuerpo = cuerpoDe(lineas, desdeCuerpo, siguienteLimite(c.i), linea.pagina)
    const texto = recorte.resto ? `${recorte.resto}\n\n${cuerpo.texto}`.trim() : cuerpo.texto
    const exclusivo = marcado || temaFig3En(c.i)
    return {
      capitulo,
      numero: r.numero,
      numeroOriginal: c.original,
      correccion: r.correccion,
      titulo: recorte.titulo,
      origen: c.fuerte ? 'encabezado' : 'recuperado',
      paginas: { inicio: linea.pagina, fin: cuerpo.fin },
      texto,
      exclusivoFig3: exclusivo,
      fig3Parcial: !exclusivo && cuerpo.fig3Parcial
    }
  })

  const repaso: BloqueRepaso | null =
    iRepaso < 0
      ? null
      : {
          capitulo,
          titulo: temas.get(iRepaso)!.titulo,
          paginas: { inicio: lineas[iRepaso]!.pagina, fin: ultimaPagina },
          lineas: lineas
            .slice(iRepaso + 1, hasta)
            .filter((l) => l.texto.trim() !== '' && !RE_PAGINA.test(l.texto))
            .map((l) => ({ texto: l.texto.trim(), pagina: l.pagina }))
        }

  return { numero: capitulo, titulo: TITULOS_CAPITULO[capitulo] ?? `Capítulo ${capitulo}`, paginas: { inicio: paginaCap, fin: ultimaPagina }, secciones, repaso }
}
