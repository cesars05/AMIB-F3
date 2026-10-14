/**
 * Marcado en línea de las lecciones y preguntas. Se interpreta a un árbol de nodos y la interfaz lo convierte en
 * elementos de React: nunca se inyecta HTML crudo. Marcas admitidas:
 *   **texto**  negritas
 *   [[texto]]  término clave (rojo de las notas)
 *   \( ... \)  fórmula en línea (TeX)
 */
export type NodoMarcado =
  | { t: 'texto'; v: string }
  | { t: 'negrita'; hijos: NodoMarcado[] }
  | { t: 'termino'; hijos: NodoMarcado[] }
  | { t: 'tex'; v: string }

const MARCAS = [
  { abre: '**', cierra: '**', t: 'negrita' as const },
  { abre: '[[', cierra: ']]', t: 'termino' as const },
  { abre: '\\(', cierra: '\\)', t: 'tex' as const }
]

export function interpretarMarcado(texto: string): NodoMarcado[] {
  const nodos: NodoMarcado[] = []
  let resto = texto
  let acumulado = ''
  const volcar = () => {
    if (acumulado) nodos.push({ t: 'texto', v: acumulado })
    acumulado = ''
  }
  while (resto.length > 0) {
    let consumido = false
    for (const m of MARCAS) {
      if (!resto.startsWith(m.abre)) continue
      const fin = resto.indexOf(m.cierra, m.abre.length)
      // Una marca sin cierre, o vacía, se deja como texto literal.
      if (fin <= m.abre.length) continue
      const interior = resto.slice(m.abre.length, fin)
      volcar()
      nodos.push(m.t === 'tex' ? { t: 'tex', v: interior.trim() } : { t: m.t, hijos: interpretarMarcado(interior) })
      resto = resto.slice(fin + m.cierra.length)
      consumido = true
      break
    }
    if (!consumido) {
      acumulado += resto[0]
      resto = resto.slice(1)
    }
  }
  volcar()
  return nodos
}

/** Texto plano sin marcas (para títulos de pestaña, etiquetas accesibles y pruebas). */
export function textoPlano(texto: string): string {
  const plano = (ns: NodoMarcado[]): string => ns.map((n) => (n.t === 'texto' ? n.v : n.t === 'tex' ? n.v : plano(n.hijos))).join('')
  return plano(interpretarMarcado(texto))
}
