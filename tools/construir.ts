/** Orquesta los parsers: lee `AMIB Data/` y devuelve los objetos de `content/` (sin escribir a disco). */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ArchivoPreguntasSchema, IndiceManual, Taxonomia } from '../app/src/core/contenido'
import type { z } from 'zod'
import { leerDocx } from './docx'
import { construirArchivosManual } from './manual-archivos'
import { parsearEnsayoEtica } from './parse-ensayo-etica'
import { parsearManual, type ManualParseado } from './parse-manual'
import { parsearPreguntasTipo } from './parse-preguntas-tipo'
import { parsearRepasos, type ResumenRepasoCapitulo } from './parse-repaso'
import { parsearTemario } from './parse-temario'
import {
  DOC_MANUAL_AMIB,
  DOC_MANUAL_ETICA,
  DOC_PREGUNTAS_TIPO,
  DOC_TEMARIO,
  SALIDA_ENSAYO_ETICA,
  SALIDA_INDICE_MANUAL,
  SALIDA_PREGUNTAS_TIPO,
  SALIDA_REPASOS_MANUAL,
  SALIDA_TAXONOMIA
} from './rutas'
import { marcarExclusivoFig3, vincularObjetivos, type Vinculo } from './vincular-manual'

type ArchivoPreguntas = z.infer<typeof ArchivoPreguntasSchema>

export interface ResultadoConstruccion {
  /** ruta relativa a la raíz del repo → contenido a escribir (los `string` son Markdown; el resto, JSON) */
  salidas: Map<string, Taxonomia | ArchivoPreguntas | IndiceManual | string>
  taxonomia: Taxonomia
  preguntasTipo: ArchivoPreguntas
  ensayoEtica: ArchivoPreguntas
  repasosManual: ArchivoPreguntas
  resumenRepasos: ResumenRepasoCapitulo[]
  manual: ManualParseado
  vinculos: Vinculo[]
  indiceManual: IndiceManual
}

/** `generado` es una fecha ISO (AAAA-MM-DD). */
export async function construirContenido(raiz: string, generado: string): Promise<ResultadoConstruccion> {
  const temario = await leerDocx(readFileSync(join(raiz, DOC_TEMARIO)))
  const tipoDocx = await leerDocx(readFileSync(join(raiz, DOC_PREGUNTAS_TIPO)))
  const manualEtica = readFileSync(join(raiz, DOC_MANUAL_ETICA), 'utf8')
  const manualAmib = readFileSync(join(raiz, DOC_MANUAL_AMIB), 'utf8')

  const taxonomiaBase = parsearTemario(temario, DOC_TEMARIO, generado)
  const preguntasTipo = parsearPreguntasTipo(tipoDocx, DOC_PREGUNTAS_TIPO, generado)
  const ensayoEtica = parsearEnsayoEtica(manualEtica, DOC_MANUAL_ETICA, generado, preguntasTipo.preguntas)

  const manual = parsearManual(manualAmib)
  const secciones = manual.capitulos.flatMap((c) => c.secciones)
  const vinculos = vincularObjetivos(secciones, taxonomiaBase)
  const taxonomia = marcarExclusivoFig3(taxonomiaBase, secciones, vinculos)
  const { indice: indiceManual, archivos } = construirArchivosManual(manual.capitulos, vinculos, generado)
  const { archivo: repasosManual, resumen: resumenRepasos } = parsearRepasos(
    manual.capitulos.flatMap((c) => (c.repaso ? [c.repaso] : [])),
    DOC_MANUAL_AMIB,
    generado
  )

  const salidas = new Map<string, Taxonomia | ArchivoPreguntas | IndiceManual | string>([
    [SALIDA_TAXONOMIA, taxonomia],
    [SALIDA_PREGUNTAS_TIPO, preguntasTipo],
    [SALIDA_ENSAYO_ETICA, ensayoEtica],
    [SALIDA_REPASOS_MANUAL, repasosManual],
    [SALIDA_INDICE_MANUAL, indiceManual],
    ...archivos
  ])
  return { salidas, taxonomia, preguntasTipo, ensayoEtica, repasosManual, resumenRepasos, manual, vinculos, indiceManual }
}
