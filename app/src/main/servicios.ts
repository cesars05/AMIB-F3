/**
 * Servicios de la aplicación: combinan el contenido en memoria, la base de datos y el motor de estudio.
 * No dependen de Electron, de modo que se prueban con una base en memoria.
 */
import { randomInt } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { crearAzar, type Azar } from '../core/barajar'
import type { Pregunta } from '../core/contenido'
import { AREAS } from '../core/examen'
import type { Leccion } from '../core/leccion'
import { calcularPerfil, resumenDeTaxonomia, type ResumenTaxonomia } from '../core/perfil'
import { crearConfig, dominioParaPlan, planDeHoy, type PlanDia } from '../core/plan'
import { seleccionarPreguntas, type Seleccion } from '../core/selector'
import { armarSimulacro, probabilidadAprobar, type Simulacro } from '../core/simulacro'
import type { AreaId } from '../core/examen'
import type {
  Ajustes,
  AjusteGuardar,
  EntradaSeleccionar,
  EntradaSimulacro,
  IntentoEntrada,
  LeccionMeta,
  PerfilApp,
  ResultadoRegistro,
  ResumenContenido
} from '../preload/api'
import type { Contenido } from './contenido-loader'
import {
  exportarProgreso,
  guardarAjuste,
  guardarNota,
  importarProgreso,
  insertarIntentos,
  leerAjustes,
  listarIntentos,
  obtenerNota,
  registrarSesion,
  type FilaIntento
} from './repositorio'

export interface DependenciasServicios {
  db: DatabaseSync
  contenido: Contenido
  ahora?: () => Date
  azar?: () => Azar
}

export const MIN_INTENTOS_PROBABILIDAD = 30

export function crearServicios(dep: DependenciasServicios) {
  const { db, contenido } = dep
  const ahora = dep.ahora ?? (() => new Date())
  const azar = dep.azar ?? (() => crearAzar(randomInt(0, 2 ** 31)))

  /** Banco con las preguntas reportadas marcadas: así el motor las excluye sin tocar el contenido versionado. */
  const bancoEfectivo = (): Pregunta[] => {
    const rep = new Set(leerAjustes(db).reportadas)
    if (rep.size === 0) return contenido.banco
    return contenido.banco.map((p) => (rep.has(p.id) && p.estado !== 'retirada' ? { ...p, estado: 'reportada' as const } : p))
  }
  const taxonomia = (): ResumenTaxonomia =>
    contenido.taxonomia ? resumenDeTaxonomia(contenido.taxonomia) : { areas: AREAS.map((a) => ({ area: a.id, obligatoria: a.obligatoria, subtemas: [] })) }

  function resumen(): ResumenContenido {
    const banco = bancoEfectivo()
    const porEstado: Record<string, number> = {}
    const validadasPorTipo = { teoria: 0, calculo: 0 }
    const validadasPorArea = new Map<AreaId, number>()
    for (const p of banco) {
      porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1
      if (p.estado === 'validada') {
        validadasPorTipo[p.tipo]++
        validadasPorArea.set(p.area, (validadasPorArea.get(p.area) ?? 0) + 1)
      }
    }
    const lecciones: LeccionMeta[] = contenido.lecciones.map((l) => ({
      id: l.id,
      area: l.area,
      materia: l.materia,
      subtemaId: l.subtemaId,
      orden: l.orden,
      titulo: l.titulo,
      resumen: l.resumen,
      duracionMin: l.duracionMin,
      laminas: l.laminas.length,
      preguntas: l.practica.length + l.miniExamen.length
    }))
    const areas = AREAS.map((a) => {
      const t = contenido.taxonomia?.areas.find((x) => x.area === a.id)
      const materias = (t?.temas ?? []).map((m) => ({ id: m.id, nombre: m.nombre, subtemas: m.subtemas.map((s) => ({ id: s.id, nombre: s.nombre, objetivos: s.objetivos.length })) }))
      return {
        area: a.id,
        materias,
        objetivos: materias.reduce((s, m) => s + m.subtemas.reduce((x, y) => x + y.objetivos, 0), 0),
        lecciones: lecciones.filter((l) => l.area === a.id).length,
        preguntasValidadas: validadasPorArea.get(a.id) ?? 0
      }
    })
    return {
      areas,
      totalObjetivos: areas.reduce((s, a) => s + a.objetivos, 0),
      lecciones,
      preguntas: { porEstado, validadasPorTipo, total: banco.length },
      errores: contenido.errores.length,
      erroresMuestra: contenido.errores.slice(0, 20)
    }
  }

  function leccion(id: string): Leccion {
    const l = contenido.lecciones.find((x) => x.id === id)
    if (!l) throw new Error(`No existe la lección ${id}`)
    return l
  }

  function preguntas(ids: readonly string[]): Pregunta[] {
    const rep = new Set(leerAjustes(db).reportadas)
    const out: Pregunta[] = []
    for (const id of ids) {
      const p = contenido.preguntas.get(id)
      if (p) out.push(rep.has(id) && p.estado !== 'retirada' ? { ...p, estado: 'reportada' } : p)
    }
    return out
  }

  function seleccionar(e: EntradaSeleccionar): Seleccion {
    return seleccionarPreguntas({ banco: bancoEfectivo(), intentos: listarIntentos(db), n: e.n, ahora: ahora(), azar: azar(), filtro: e.filtro, excluirIds: e.excluirIds })
  }

  function simulacro(e: EntradaSimulacro): Simulacro {
    return armarSimulacro({ tipo: e.tipo, area: e.area, banco: bancoEfectivo(), intentos: listarIntentos(db), ahora: ahora(), azar: azar() })
  }

  function registrarIntentos(entradas: readonly IntentoEntrada[]): ResultadoRegistro {
    const fecha = ahora()
    const filas: FilaIntento[] = entradas.map((e) => {
      const p = contenido.preguntas.get(e.preguntaId)
      if (!p) throw new Error(`Pregunta desconocida: ${e.preguntaId}`)
      if (p.clave === null) throw new Error(`La pregunta ${p.id} no tiene clave`)
      const correcta = e.respuesta === p.clave
      return {
        preguntaId: p.id,
        preguntaVersion: p.version,
        respuesta: e.respuesta,
        correcta,
        tiempoMs: e.tiempoMs,
        confianza: e.confianza,
        modo: e.modo,
        sesionId: e.sesionId,
        fecha: fecha.toISOString(),
        area: p.area,
        subtemaId: p.subtemaId ?? e.subtemaId,
        objetivoId: p.objetivoId,
        tipo: p.tipo,
        dificultad: p.dificultad,
        etiquetaError: correcta ? undefined : p.opciones[e.respuesta]?.etiquetaError,
        conPistas: e.conPistas ?? false
      }
    })
    insertarIntentos(db, filas, fecha)
    return { ok: true, resultados: filas.map((f) => ({ preguntaId: f.preguntaId, correcta: f.correcta })) }
  }

  function perfil(): PerfilApp {
    const f = ahora()
    const ajustes = leerAjustes(db)
    const intentos = listarIntentos(db)
    const p = calcularPerfil({ intentos, taxonomia: taxonomia(), ahora: f })
    const tipoPorArea = Object.fromEntries(AREAS.map((a) => [a.id, { teoria: { intentos: 0, aciertos: 0 }, calculo: { intentos: 0, aciertos: 0 } }])) as PerfilApp['tipoPorArea']
    for (const i of intentos) {
      const c = tipoPorArea[i.area][i.tipo]
      c.intentos++
      if (i.correcta) c.aciertos++
    }
    const hayAutoevaluacion = Object.keys(ajustes.autoevaluacion).length > 0
    let prob: number | null = null
    if (p.intentosTotales > 0 || hayAutoevaluacion) {
      const dominio: Partial<Record<AreaId, number>> = {}
      for (const a of AREAS) dominio[a.id] = dominioParaPlan(p, a.id, ajustes.autoevaluacion)
      const semilla = (p.intentosTotales * 2654435761 + Math.floor(f.getTime() / 86400000)) >>> 0
      prob = probabilidadAprobar(dominio, crearAzar(semilla), 2000)
    }
    return {
      ...p,
      probabilidadAprobar: prob,
      fuenteProbabilidad: p.intentosTotales >= MIN_INTENTOS_PROBABILIDAD ? 'intentos' : 'autoevaluacion',
      reportadas: ajustes.reportadas,
      tipoPorArea
    }
  }

  function planHoy(): PlanDia | null {
    const a = leerAjustes(db)
    if (!a.fechaExamen) return null
    const config = crearConfig({
      fechaExamen: a.fechaExamen,
      modo: a.modo,
      minutosDia: a.minutosDia,
      diasSemana: a.diasSemana,
      ...(a.diasActivos && a.diasActivos.length ? { diasActivos: a.diasActivos } : {}),
      autoevaluacion: a.autoevaluacion
    })
    return planDeHoy({
      config,
      perfil: perfil(),
      lecciones: contenido.lecciones.map((l) => ({ id: l.id, area: l.area, orden: l.orden, duracionMin: l.duracionMin, subtemaId: l.subtemaId })),
      ahora: ahora(),
      leccionesVistas: a.leccionesVistas
    })
  }

  function guardarAjusteValidado(a: AjusteGuardar): Ajustes {
    guardarAjuste(db, a.clave, a.valor)
    return leerAjustes(db)
  }

  return {
    resumen,
    leccion,
    preguntas,
    seleccionar,
    simulacro,
    registrarIntentos,
    perfil,
    planHoy,
    ajustes: () => leerAjustes(db),
    guardarAjuste: guardarAjusteValidado,
    nota: (leccionId: string, laminaId: string) => obtenerNota(db, leccionId, laminaId),
    guardarNota: (leccionId: string, laminaId: string, texto: string) => guardarNota(db, leccionId, laminaId, texto, ahora()),
    registrarSesion: (s: Parameters<typeof registrarSesion>[1]) => registrarSesion(db, s),
    exportar: () => exportarProgreso(db, ahora()),
    importar: (crudo: unknown) => importarProgreso(db, crudo)
  }
}

export type Servicios = ReturnType<typeof crearServicios>
