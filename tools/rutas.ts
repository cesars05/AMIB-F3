/** Rutas del repositorio, calculadas desde la ubicación de este archivo (no del directorio de trabajo). */
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

export const RAIZ = fileURLToPath(new URL('..', import.meta.url))
export const DATOS = join(RAIZ, 'AMIB Data')
export const CONTENIDO = join(RAIZ, 'content')

export const DOC_TEMARIO = 'AMIB Data/Examen Integral Asesor en Estrategias de Inversión.docx'
export const DOC_PREGUNTAS_TIPO = 'AMIB Data/Preguntas Tipo.docx'
export const DOC_MANUAL_ETICA = 'AMIB Data/Manual_EBSPMV_completo.md'

export const SALIDA_TAXONOMIA = 'content/taxonomia.json'
export const SALIDA_PREGUNTAS_TIPO = 'content/preguntas/oficial/preguntas-tipo.json'
export const SALIDA_ENSAYO_ETICA = 'content/preguntas/oficial/etica-ensayo.json'

export const DOC_MANUAL_AMIB = 'AMIB Data/AMIB_1_completo.md'
export const SALIDA_REPASOS_MANUAL = 'content/preguntas/repasos/manual-amib1.json'
export const SALIDA_INDICE_MANUAL = 'content/manual/indice.json'
/** Carpeta de las secciones del manual: `content/manual/capNN/NN-<slug>.md`. */
export const CARPETA_MANUAL = 'content/manual'
