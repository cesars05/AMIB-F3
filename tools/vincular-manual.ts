/**
 * Vincula cada sección del manual con un objetivo del temario (`content/taxonomia.json`) por similitud de texto,
 * y marca como `exclusivoFig3` los objetivos cuya sección del manual es exclusiva de la Figura 3.
 */
import type { AreaId } from '../app/src/core/examen'
import type { Taxonomia } from '../app/src/core/contenido'
import type { SeccionManual } from './parse-manual'
import { construirPesos, distanciaEdicion, similitudTokens, tokens, verboInicial } from './similitud'

/** Área del examen que corresponde a cada capítulo del manual. El 10 (formulario) no tiene área. */
export const AREA_DE_CAPITULO: Readonly<Record<number, AreaId | undefined>> = {
  1: 'etica',
  2: 'servicios',
  3: 'normativo',
  4: 'matematicas',
  5: 'capitales',
  6: 'deuda',
  7: 'fondos',
  8: 'derivados',
  9: 'analisis'
}

/**
 * Umbral de vinculación. Por debajo, `objetivoId` queda en null.
 * Justificación (ver bitácora): con la distribución real de puntajes, por debajo de 0.45 el mejor candidato casi
 * nunca es el objetivo correcto: los títulos de tema del capítulo 1 ("Conceptos Básicos") y los encabezados
 * truncados por el OCR se parecen a varios objetivos por igual.
 */
export const UMBRAL_VINCULO = 0.55
/** Bandas de confianza para reportar: alta ≥ 0.8, media ≥ UMBRAL_VINCULO, baja = debajo del umbral. */
export const UMBRAL_ALTA = 0.8
/** Suma por coincidir el verbo inicial. Pequeño a propósito: solo desempata. */
const BONO_VERBO = 0.05
export type BandaConfianza = 'alta' | 'media' | 'baja'
export const bandaDe = (confianza: number): BandaConfianza => (confianza >= UMBRAL_ALTA ? 'alta' : confianza >= UMBRAL_VINCULO ? 'media' : 'baja')

export interface Vinculo {
  /** Objetivo elegido, o null si el mejor puntaje no llega a `UMBRAL_VINCULO`. */
  objetivoId: string | null
  /** Puntaje 0–1 del mejor candidato (se conserva aunque `objetivoId` sea null). */
  confianza: number
  /** Mejor candidato descartado por debajo del umbral, para revisión manual. */
  candidatoId: string
  /** Segundo mejor puntaje del mismo área: si está muy cerca, el vínculo es ambiguo. */
  segundo: number
}

interface ObjetivoPlano {
  id: string
  texto: string
  tokens: string[]
  verbo: string
}

function objetivosPorArea(tax: Taxonomia): Map<AreaId, ObjetivoPlano[]> {
  const r = new Map<AreaId, ObjetivoPlano[]>()
  for (const a of tax.areas) {
    const lista: ObjetivoPlano[] = []
    for (const t of a.temas) for (const s of t.subtemas) for (const o of s.objetivos) lista.push({ id: o.id, texto: o.texto, tokens: tokens(o.texto), verbo: verboInicial(o.texto) })
    r.set(a.area, lista)
  }
  return r
}

const redondear = (x: number) => Math.round(x * 1000) / 1000

/** Mejor objetivo del área del capítulo para cada sección. Determinista: en empate gana el primero del temario. */
export function vincularObjetivos(secciones: readonly SeccionManual[], tax: Taxonomia): Vinculo[] {
  const porArea = objetivosPorArea(tax)
  const pesos = construirPesos([...porArea.values()].flatMap((l) => l.map((o) => o.texto)))
  return secciones.map((sec) => {
    const area = AREA_DE_CAPITULO[sec.capitulo]
    const candidatos = area ? (porArea.get(area) ?? []) : []
    const tit = tokens(sec.titulo)
    const verbo = verboInicial(sec.titulo)
    let mejor = { id: '', puntaje: 0 }
    let segundo = 0
    for (const o of candidatos) {
      // Mismo verbo (tolerando el OCR) desempata entre objetivos casi iguales ("Identificar…" vs "Distinguir…").
      const mismoVerbo = verbo !== '' && o.verbo !== '' && distanciaEdicion(verbo, o.verbo) <= 2
      const p = Math.min(1, similitudTokens(tit, o.tokens, pesos).puntaje + (mismoVerbo ? BONO_VERBO : 0))
      if (p > mejor.puntaje) {
        segundo = mejor.puntaje
        mejor = { id: o.id, puntaje: p }
      } else if (p > segundo) segundo = p
    }
    const confianza = redondear(mejor.puntaje)
    return { objetivoId: mejor.id && confianza >= UMBRAL_VINCULO ? mejor.id : null, confianza, candidatoId: mejor.id, segundo: redondear(segundo) }
  })
}

/**
 * Devuelve una copia de la taxonomía con `exclusivoFig3 = true` en los objetivos cuya mejor sección del manual
 * (la de mayor confianza entre las vinculadas a ese objetivo) es exclusiva de la Figura 3.
 * No toca el resto de los objetivos (quedan como los dejó `parsearTemario`).
 */
export function marcarExclusivoFig3(tax: Taxonomia, secciones: readonly SeccionManual[], vinculos: readonly Vinculo[]): Taxonomia {
  const mejorPorObjetivo = new Map<string, { confianza: number; fig3: boolean }>()
  secciones.forEach((sec, k) => {
    const v = vinculos[k]
    if (!v?.objetivoId) return
    const previo = mejorPorObjetivo.get(v.objetivoId)
    if (!previo || v.confianza > previo.confianza) mejorPorObjetivo.set(v.objetivoId, { confianza: v.confianza, fig3: sec.exclusivoFig3 })
  })
  return {
    ...tax,
    areas: tax.areas.map((a) => ({
      ...a,
      temas: a.temas.map((t) => ({
        ...t,
        subtemas: t.subtemas.map((s) => ({
          ...s,
          objetivos: s.objetivos.map((o) => (mejorPorObjetivo.get(o.id)?.fig3 ? { ...o, exclusivoFig3: true } : o))
        }))
      }))
    }))
  }
}
