import type { Pregunta } from '@core/contenido'
import type { PreguntaPresentada } from '@core/selector'
import { etiquetaLegible, LETRAS, NOMBRE_CORTO } from '../lib/formato'
import { Inline } from './Inline'

export interface PreguntaVistaProps {
  pregunta: Pregunta
  presentacion: Pick<PreguntaPresentada, 'permutacion' | 'clave'>
  /** Posición mostrada que el estudiante eligió (o null). */
  elegida: number | null
  /** Muestra la clave y la explicación (práctica) o no (simulacro y mini examen). */
  revelar: boolean
  onElegir?: (posicion: number) => void
  deshabilitada?: boolean
  /** Texto de contexto sobre el enunciado. */
  meta?: string
  /** Muestra el patrón de error registrado al fallar. */
  mostrarPatron?: boolean
}

/** Posición que se muestra para la opción original `i`. */
export function textoMostrado(p: Pregunta, presentacion: Pick<PreguntaPresentada, 'permutacion'>, pos: number): string {
  return p.opciones[presentacion.permutacion[pos]!]!.texto
}

export function PreguntaVista({ pregunta: p, presentacion, elegida, revelar, onElegir, deshabilitada, meta, mostrarPatron = true }: PreguntaVistaProps) {
  const original = elegida === null ? null : presentacion.permutacion[elegida]!
  const acerto = elegida !== null && elegida === presentacion.clave
  const opcionElegida = original === null ? undefined : p.opciones[original]
  return (
    <div className="pregunta">
      <span className="meta">{meta ?? `${NOMBRE_CORTO[p.area]}, ${p.tipo === 'calculo' ? 'cálculo' : 'teoría'}${p.dificultad ? `, dificultad ${p.dificultad}` : ''}`}</span>
      <p className="enunciado">
        <Inline texto={p.enunciado} />
      </p>
      <div className="opciones" role="group" aria-label="Opciones de respuesta">
        {presentacion.permutacion.map((_, pos) => {
          let clase = ''
          let marca = ''
          if (revelar && pos === presentacion.clave) {
            clase = 'ok'
            marca = 'Correcta'
          } else if (revelar && pos === elegida) {
            clase = 'mal'
            marca = 'Tu respuesta'
          } else if (!revelar && pos === elegida) clase = 'elegida'
          return (
            <button
              key={pos}
              type="button"
              className={`opcion ${clase}`}
              disabled={revelar || deshabilitada}
              aria-pressed={!revelar ? pos === elegida : undefined}
              onClick={() => onElegir?.(pos)}
              data-opcion={LETRAS[pos]}
            >
              <span className="letra">{LETRAS[pos]})</span>
              <span className="valor">
                <Inline texto={textoMostrado(p, presentacion, pos)} />
              </span>
              <span className="marca-op">{marca}</span>
            </button>
          )
        })}
      </div>
      {revelar && (
        <div className="porque" role="status" aria-live="polite">
          <b>{elegida === null ? `Sin responder. La respuesta es ${LETRAS[presentacion.clave]}).` : acerto ? 'Correcto.' : `Incorrecto. La respuesta es ${LETRAS[presentacion.clave]}).`}</b>
          {p.explicacion && (
            <span>
              <Inline texto={p.explicacion} />
            </span>
          )}
          {!acerto && elegida !== null && opcionElegida?.porQueNo && (
            <span>
              <Inline texto={opcionElegida.porQueNo} />
            </span>
          )}
          {!acerto && mostrarPatron && opcionElegida?.etiquetaError && <span className="patron">Patrón registrado en tu perfil: {etiquetaLegible(opcionElegida.etiquetaError)}</span>}
        </div>
      )}
    </div>
  )
}
