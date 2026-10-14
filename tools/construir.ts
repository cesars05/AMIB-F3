/** Orquesta los parsers: lee `AMIB Data/` y devuelve los objetos de `content/` (sin escribir a disco). */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ArchivoPreguntasSchema, type IndiceManual, type Taxonomia } from '../app/src/core/contenido'
import type { z } from 'zod'
import { aplicarClaves, ClavesLibroSchema, CIFRAS_VERIFICADAS, contarPalabras, PESO_FUENTE_LIMPIA, totalesPorCapitulo, type ResumenClaves } from './claves-libro'
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
  RUTA_CLAVES_LIBRO,
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
  resumenClaves: ResumenClaves
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
  const claves = ClavesLibroSchema.parse(JSON.parse(readFileSync(join(raiz, RUTA_CLAVES_LIBRO), 'utf8')))
  const { archivo: repasosSinClave, resumen: resumenRepasos } = parsearRepasos(
    manual.capitulos.flatMap((c) => (c.repaso ? [c.repaso] : [])),
    DOC_MANUAL_AMIB,
    generado,
    totalesPorCapitulo(claves)
  )
  // Vocabulario del manual (sin los repasos): una palabra del repaso que casi no aparece aquí suele ser un error de OCR.
  // Las fuentes sin OCR (manual de Ética, preguntas oficiales) dan por buena una palabra con una sola aparición.
  const vocabulario = contarPalabras(secciones.map((x) => `${x.titulo} ${x.texto}`))
  contarPalabras([manualEtica], PESO_FUENTE_LIMPIA, vocabulario)
  contarPalabras(
    [...preguntasTipo.preguntas, ...ensayoEtica.preguntas].flatMap((q) => [q.enunciado, ...q.opciones.map((o) => o.texto)]),
    PESO_FUENTE_LIMPIA,
    vocabulario
  )
  const { preguntas: conClave, resumen: resumenClaves } = aplicarClaves(repasosSinClave.preguntas, claves, vocabulario, CIFRAS_VERIFICADAS)
  const repasosManual = ArchivoPreguntasSchema.parse({ ...repasosSinClave, preguntas: conClave })

  const salidas = new Map<string, Taxonomia | ArchivoPreguntas | IndiceManual | string>([
    [SALIDA_TAXONOMIA, taxonomia],
    [SALIDA_PREGUNTAS_TIPO, preguntasTipo],
    [SALIDA_ENSAYO_ETICA, ensayoEtica],
    [SALIDA_REPASOS_MANUAL, repasosManual],
    [SALIDA_INDICE_MANUAL, indiceManual],
    ...archivos
  ])
  return { salidas, taxonomia, preguntasTipo, ensayoEtica, repasosManual, resumenRepasos, resumenClaves, manual, vinculos, indiceManual }
}
