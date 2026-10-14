import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface TexProps {
  tex: string
  /** Fórmula en bloque (centrada) o en línea. */
  bloque?: boolean
}

/**
 * Único lugar donde se inyecta HTML: la salida de KaTeX.renderToString, que escapa el TeX de entrada.
 * `trust: false` impide \href, \url, \includegraphics y similares; `throwOnError: false` muestra el TeX roto en rojo.
 */
export function Tex({ tex, bloque = false }: TexProps) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: bloque, throwOnError: false, trust: false, strict: 'ignore', output: 'htmlAndMathml', maxExpand: 500 }),
    [tex, bloque]
  )
  return <span className={bloque ? 'tex tex-bloque' : 'tex'} dangerouslySetInnerHTML={{ __html: html }} />
}
