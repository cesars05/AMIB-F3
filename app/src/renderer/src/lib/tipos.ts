import type { Pregunta } from '@core/contenido'
import type { PreguntaPresentada } from '@core/selector'

/** Pregunta lista para mostrar: contenido más el orden de opciones decidido por el motor. */
export interface Item {
  pregunta: Pregunta
  presentacion: Pick<PreguntaPresentada, 'permutacion' | 'clave'>
}
