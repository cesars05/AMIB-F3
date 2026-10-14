/**
 * Del manual parseado a los archivos de `content/manual/`: un Markdown por sección (frontmatter YAML + OCR crudo)
 * y el índice `indice.json`. Puro: devuelve rutas relativas a la raíz del repo y su contenido.
 */
import { IndiceManualSchema, type IndiceManual } from '../app/src/core/contenido'
import type { CapituloManual, SeccionManual } from './parse-manual'
import { slug } from './texto'
import type { Vinculo } from './vincular-manual'
import { CARPETA_MANUAL, DOC_MANUAL_AMIB } from './rutas'

const dos = (n: number) => String(n).padStart(2, '0')

/** `content/manual/capNN/NN-<slug>.md`; NN es el ordinal de la sección en el capítulo (estable, único, ordena igual que el manual). */
export function rutaSeccion(capitulo: number, ordinal: number, titulo: string): string {
  const s = slug(titulo).slice(0, 60).replace(/-+$/g, '') || 'seccion'
  return `${CARPETA_MANUAL}/cap${dos(capitulo)}/${dos(ordinal)}-${s}.md`
}

/** Frontmatter YAML. Los textos van como cadenas JSON (JSON es YAML válido) para no tener que escapar nada. */
export function frontmatter(campos: Record<string, unknown>): string {
  const linea = (k: string, v: unknown, sangria = ''): string[] => {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      return [`${sangria}${k}:`, ...Object.entries(v).flatMap(([kk, vv]) => linea(kk, vv, `${sangria}  `))]
    }
    return [`${sangria}${k}: ${JSON.stringify(v)}`]
  }
  return ['---', ...Object.entries(campos).flatMap(([k, v]) => linea(k, v)), '---'].join('\n')
}

export interface ArchivosManual {
  indice: IndiceManual
  /** ruta relativa a la raíz del repo → contenido Markdown */
  archivos: Map<string, string>
}

export function construirArchivosManual(capitulos: readonly CapituloManual[], vinculos: readonly Vinculo[], generado: string): ArchivosManual {
  const secciones = capitulos.flatMap((c) => c.secciones)
  const porSeccion = new Map<SeccionManual, Vinculo>(secciones.map((s, k) => [s, vinculos[k]!]))
  const archivos = new Map<string, string>()
  const entradas = capitulos.flatMap((cap) =>
    cap.secciones.map((s, i) => {
      const v = porSeccion.get(s)!
      const archivo = rutaSeccion(cap.numero, i + 1, s.titulo)
      const meta = {
        capitulo: s.capitulo,
        numero: s.numero,
        numeroOriginal: s.numeroOriginal,
        correccionNumero: s.correccion,
        titulo: s.titulo,
        origen: s.origen,
        paginas: s.paginas,
        objetivoId: v.objetivoId,
        objetivoCandidato: v.candidatoId || null,
        confianza: v.confianza,
        exclusivoFig3: s.exclusivoFig3,
        fig3Parcial: s.fig3Parcial
      }
      archivos.set(archivo, `${frontmatter(meta)}\n\n${s.texto}\n`)
      return { ...meta, archivo, caracteres: s.texto.length }
    })
  )
  const indice = IndiceManualSchema.parse({ fuente: DOC_MANUAL_AMIB, generado, secciones: entradas })
  return { indice, archivos }
}
