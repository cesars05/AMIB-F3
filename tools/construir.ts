/** Orquesta los parsers: lee `AMIB Data/` y devuelve los objetos de `content/` (sin escribir a disco). */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ArchivoPreguntasSchema, Taxonomia } from '../app/src/core/contenido'
import type { z } from 'zod'
import { leerDocx } from './docx'
import { parsearEnsayoEtica } from './parse-ensayo-etica'
import { parsearPreguntasTipo } from './parse-preguntas-tipo'
import { parsearTemario } from './parse-temario'
import { DOC_MANUAL_ETICA, DOC_PREGUNTAS_TIPO, DOC_TEMARIO, SALIDA_ENSAYO_ETICA, SALIDA_PREGUNTAS_TIPO, SALIDA_TAXONOMIA } from './rutas'

type ArchivoPreguntas = z.infer<typeof ArchivoPreguntasSchema>

export interface ResultadoConstruccion {
  /** ruta relativa a la raíz del repo → contenido a escribir */
  salidas: Map<string, Taxonomia | ArchivoPreguntas>
  taxonomia: Taxonomia
  preguntasTipo: ArchivoPreguntas
  ensayoEtica: ArchivoPreguntas
}

/** `generado` es una fecha ISO (AAAA-MM-DD). */
export async function construirContenido(raiz: string, generado: string): Promise<ResultadoConstruccion> {
  const temario = await leerDocx(readFileSync(join(raiz, DOC_TEMARIO)))
  const tipoDocx = await leerDocx(readFileSync(join(raiz, DOC_PREGUNTAS_TIPO)))
  const manual = readFileSync(join(raiz, DOC_MANUAL_ETICA), 'utf8')

  const taxonomia = parsearTemario(temario, DOC_TEMARIO, generado)
  const preguntasTipo = parsearPreguntasTipo(tipoDocx, DOC_PREGUNTAS_TIPO, generado)
  const ensayoEtica = parsearEnsayoEtica(manual, DOC_MANUAL_ETICA, generado, preguntasTipo.preguntas)

  const salidas = new Map<string, Taxonomia | ArchivoPreguntas>([
    [SALIDA_TAXONOMIA, taxonomia],
    [SALIDA_PREGUNTAS_TIPO, preguntasTipo],
    [SALIDA_ENSAYO_ETICA, ensayoEtica]
  ])
  return { salidas, taxonomia, preguntasTipo, ensayoEtica }
}
