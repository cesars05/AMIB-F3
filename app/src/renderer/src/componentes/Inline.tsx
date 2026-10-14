import { Fragment, type ReactNode } from 'react'
import { interpretarMarcado, type NodoMarcado } from '../lib/marcado'
import { Tex } from './Tex'

function nodos(ns: NodoMarcado[]): ReactNode {
  return ns.map((n, i) => {
    switch (n.t) {
      case 'texto':
        return <Fragment key={i}>{n.v}</Fragment>
      case 'negrita':
        return <strong key={i}>{nodos(n.hijos)}</strong>
      case 'termino':
        return (
          <span key={i} className="t">
            {nodos(n.hijos)}
          </span>
        )
      case 'tex':
        return <Tex key={i} tex={n.v} />
    }
  })
}

/** Renderiza el marcado en línea (**negrita**, [[término]], \( TeX \)) como elementos de React. */
export function Inline({ texto }: { texto: string }) {
  return <>{nodos(interpretarMarcado(texto))}</>
}
