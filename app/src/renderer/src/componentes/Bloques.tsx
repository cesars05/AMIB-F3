import type { Bloque } from '@core/leccion'
import { Inline } from './Inline'
import { Tex } from './Tex'

/** El TeX puro de `logica` y `valores` va en bloque; si el autor mezcló texto con \( \), se interpreta como marcado. */
function Matematica({ texto }: { texto: string }) {
  return texto.includes('\\(') ? <Inline texto={texto} /> : <Tex tex={texto} bloque />
}

export function FormulaDosPasos({ logica, leyenda, valores, resultado }: { logica: string; leyenda?: [string, string][]; valores?: string; resultado?: string }) {
  return (
    <div className="fx">
      <div className="fx-fila">
        <div className="fx-tag">Paso 1: fórmula</div>
        <div>
          <div className="fx-mate">
            <Matematica texto={logica} />
          </div>
          {leyenda && leyenda.length > 0 && (
            <div className="fx-leyenda">
              {leyenda.map(([simbolo, significado]) => (
                <span key={simbolo + significado}>
                  <b>
                    <Tex tex={simbolo} />
                  </b>{' '}
                  = <Inline texto={significado} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {valores && (
        <div className="fx-fila">
          <div className="fx-tag">Paso 2: con valores</div>
          <div className="fx-mate">
            <Matematica texto={valores} />
          </div>
        </div>
      )}
      {resultado && (
        <div className="fx-fila">
          <div className="fx-tag">Resultado</div>
          <div className="fx-res">{resultado.includes('\\(') || !resultado.includes('\\') ? <Inline texto={resultado} /> : <Tex tex={resultado} />}</div>
        </div>
      )}
    </div>
  )
}

export function BloqueVista({ bloque }: { bloque: Bloque }) {
  switch (bloque.tipo) {
    case 'parrafo':
      return (
        <p>
          <Inline texto={bloque.texto} />
        </p>
      )
    case 'ficha':
      return (
        <div>
          {bloque.titulo && (
            <h3 className="ficha-titulo">
              <Inline texto={bloque.titulo} />
            </h3>
          )}
          <div className="ficha">
            {bloque.filas.flatMap(([concepto, explicacion], i) => [
              <div key={`c${i}`}>
                <Inline texto={concepto} />
              </div>,
              <div key={`e${i}`}>
                <Inline texto={explicacion} />
              </div>
            ])}
          </div>
        </div>
      )
    case 'resumen':
      return (
        <div className="resumen">
          <b className="etq">{bloque.etiqueta}:</b> <Inline texto={bloque.texto} />
        </div>
      )
    case 'formula':
      return <FormulaDosPasos logica={bloque.logica} leyenda={bloque.leyenda} valores={bloque.valores} resultado={bloque.resultado} />
    case 'pasos':
      return (
        <div className="pasos">
          {bloque.pasos.map((p, i) => (
            <div key={i} className="paso" data-n={i + 1}>
              {p.cuando && <time>{p.cuando}</time>}
              <b>
                <Inline texto={p.titulo} />
              </b>
              <span>
                <Inline texto={p.texto} />
              </span>
            </div>
          ))}
        </div>
      )
    case 'tabla': {
      const trampas = new Set(bloque.trampas.map(([f, c]) => `${f}:${c}`))
      return (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                {bloque.encabezados.map((h, i) => (
                  <th key={i} scope="col">
                    <Inline texto={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloque.filas.map((fila, f) => (
                <tr key={f}>
                  {fila.map((celda, c) => {
                    const trampa = trampas.has(`${f}:${c}`)
                    return (
                      <td key={c} className={trampa ? 'trampa' : undefined}>
                        <Inline texto={celda} />
                        {trampa && <span className="solo-lectores"> (trampa típica de examen)</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    case 'lista':
      return (
        <ol className="lista-num">
          {bloque.items.map((it, i) => (
            <li key={i}>
              <Inline texto={it} />
            </li>
          ))}
        </ol>
      )
    case 'calculadora':
      return (
        <div className="calc">
          <span className="etiqueta">Calculadora financiera: {bloque.funcion}</span>
          <div className="entradas">
            {bloque.entradas.map(([tecla, valor], i) => (
              <span key={i}>
                <kbd>{tecla}</kbd> {valor}
              </span>
            ))}
          </div>
          <span>
            Resultado: <kbd>{bloque.salida[0]}</kbd> = <b>{bloque.salida[1]}</b>
          </span>
        </div>
      )
    case 'trampa':
      return (
        <div className="trampa-caja">
          <b className="etq">Trampa de examen:</b> <Inline texto={bloque.texto} />
        </div>
      )
  }
}
