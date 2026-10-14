/** Acceso a la base de datos (`node:sqlite`): intentos, ajustes, notas, sesiones, cajas de Leitner y respaldo. */
import type { DatabaseSync } from 'node:sqlite'
import { AreaIdSchema } from '../core/contenido'
import type { Intento, ModoIntento, TipoPregunta } from '../core/intentos'
import { actualizarCaja, proximaRevision, type ItemLeitner } from '../core/leitner'
import type { Ajustes, EntradaSesion } from '../preload/api'
import { AJUSTES_POR_OMISION, CLAVES_AJUSTE, ESQUEMAS_AJUSTE, EsquemaRespaldo, type Respaldo } from './ipc-esquemas'

/** Intento ya enriquecido por el servicio con los datos de la pregunta. */
export interface FilaIntento {
  preguntaId: string
  preguntaVersion: number
  respuesta: number
  correcta: boolean
  tiempoMs: number
  confianza?: string
  modo: string
  sesionId: string
  fecha: string
  area: string
  subtemaId?: string
  objetivoId?: string
  tipo: string
  dificultad?: number
  etiquetaError?: string
  conPistas: boolean
}

export function insertarIntentos(db: DatabaseSync, filas: readonly FilaIntento[], ahora: Date): void {
  const ins = db.prepare(
    `INSERT INTO intento (pregunta_id, pregunta_version, respuesta, correcta, tiempo_ms, confianza, modo, sesion_id, fecha,
       area, subtema_id, objetivo_id, tipo, dificultad, etiqueta_error, con_pistas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const leer = db.prepare('SELECT caja, proxima FROM caja_leitner WHERE item_id = ?')
  const guardar = db.prepare(
    `INSERT INTO caja_leitner (item_id, tipo, caja, proxima) VALUES (?, 'pregunta', ?, ?)
     ON CONFLICT(item_id) DO UPDATE SET caja = excluded.caja, proxima = excluded.proxima`
  )
  db.exec('BEGIN')
  try {
    for (const f of filas) {
      ins.run(
        f.preguntaId,
        f.preguntaVersion,
        f.respuesta,
        f.correcta ? 1 : 0,
        f.tiempoMs,
        f.confianza ?? null,
        f.modo,
        f.sesionId,
        f.fecha,
        f.area,
        f.subtemaId ?? null,
        f.objetivoId ?? null,
        f.tipo,
        f.dificultad ?? null,
        f.etiquetaError ?? null,
        f.conPistas ? 1 : 0
      )
      // Un acierto adivinado no sube de caja (misma regla que `cajasDesdeIntentos`).
      const acierto = f.correcta && f.confianza !== 'adivine'
      const previo = leer.get(f.preguntaId) as { caja: number; proxima: string } | undefined
      const item: ItemLeitner | undefined = previo ? { id: f.preguntaId, caja: previo.caja as ItemLeitner['caja'], ultimaRevision: f.fecha } : undefined
      const nuevo = actualizarCaja(f.preguntaId, item, acierto, ahora)
      guardar.run(f.preguntaId, nuevo.caja, proximaRevision(nuevo).toISOString())
    }
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

interface FilaBd {
  pregunta_id: string
  area: string | null
  subtema_id: string | null
  objetivo_id: string | null
  tipo: string | null
  dificultad: number | null
  correcta: number
  tiempo_ms: number
  confianza: string | null
  modo: string
  sesion_id: string
  fecha: string
  etiqueta_error: string | null
  con_pistas: number
}

/** Lee los intentos como los entiende el motor. Se omiten filas heredadas sin área (anteriores a la migración 2). */
export function listarIntentos(db: DatabaseSync): Intento[] {
  const filas = db
    .prepare(
      `SELECT pregunta_id, area, subtema_id, objetivo_id, tipo, dificultad, correcta, tiempo_ms, confianza, modo, sesion_id, fecha, etiqueta_error, con_pistas
       FROM intento ORDER BY fecha, id`
    )
    .all() as unknown as FilaBd[]
  const out: Intento[] = []
  for (const f of filas) {
    const area = AreaIdSchema.safeParse(f.area)
    if (!area.success) continue
    const i: Intento = {
      preguntaId: f.pregunta_id,
      area: area.data,
      tipo: (f.tipo === 'calculo' ? 'calculo' : 'teoria') as TipoPregunta,
      correcta: f.correcta === 1,
      tiempoMs: f.tiempo_ms,
      modo: f.modo as ModoIntento,
      sesionId: f.sesion_id,
      fecha: f.fecha
    }
    if (f.subtema_id) i.subtemaId = f.subtema_id
    if (f.objetivo_id) i.objetivoId = f.objetivo_id
    if (f.dificultad && f.dificultad >= 1 && f.dificultad <= 5) i.dificultad = f.dificultad as Intento['dificultad']
    if (f.confianza === 'seguro' || f.confianza === 'dude' || f.confianza === 'adivine') i.confianza = f.confianza
    if (f.etiqueta_error) i.etiquetaError = f.etiqueta_error
    if (f.con_pistas) i.conPistas = true
    out.push(i)
  }
  return out
}

// ─── Ajustes ─────────────────────────────────────────────────────────────────

export function leerAjustes(db: DatabaseSync): Ajustes {
  const filas = db.prepare('SELECT clave, valor FROM ajustes').all() as { clave: string; valor: string }[]
  const out: Record<string, unknown> = { ...AJUSTES_POR_OMISION }
  for (const { clave, valor } of filas) {
    if (!(CLAVES_AJUSTE as string[]).includes(clave)) continue
    try {
      const r = ESQUEMAS_AJUSTE[clave as keyof Ajustes].safeParse(JSON.parse(valor))
      if (r.success) out[clave] = r.data
    } catch {
      /* valor corrupto: se conserva el de omisión */
    }
  }
  return out as unknown as Ajustes
}

export function guardarAjuste(db: DatabaseSync, clave: keyof Ajustes, valor: unknown): void {
  db.prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor').run(clave, JSON.stringify(valor))
}

// ─── Notas y sesiones ────────────────────────────────────────────────────────

export function obtenerNota(db: DatabaseSync, leccionId: string, laminaId: string): string {
  const f = db.prepare('SELECT texto FROM nota_lamina WHERE leccion_id = ? AND lamina_id = ?').get(leccionId, laminaId) as { texto: string } | undefined
  return f?.texto ?? ''
}

export function guardarNota(db: DatabaseSync, leccionId: string, laminaId: string, texto: string, ahora: Date): void {
  db.prepare(
    `INSERT INTO nota_lamina (leccion_id, lamina_id, texto, actualizado) VALUES (?, ?, ?, ?)
     ON CONFLICT(leccion_id, lamina_id) DO UPDATE SET texto = excluded.texto, actualizado = excluded.actualizado`
  ).run(leccionId, laminaId, texto, ahora.toISOString())
}

export function registrarSesion(db: DatabaseSync, s: EntradaSesion): void {
  db.prepare(
    `INSERT INTO sesion (id, modo, inicio, fin, configuracion_json, resultado_json) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET fin = excluded.fin, configuracion_json = excluded.configuracion_json, resultado_json = excluded.resultado_json`
  ).run(s.id, s.modo, s.inicio, s.fin ?? null, s.configuracion === undefined ? null : JSON.stringify(s.configuracion), s.resultado === undefined ? null : JSON.stringify(s.resultado))
}

// ─── Respaldo del progreso ───────────────────────────────────────────────────

export function exportarProgreso(db: DatabaseSync, ahora: Date): Respaldo {
  const todo = <T>(sql: string) => db.prepare(sql).all() as unknown as T[]
  const ajustes: Record<string, string> = {}
  for (const f of todo<{ clave: string; valor: string }>('SELECT clave, valor FROM ajustes')) ajustes[f.clave] = f.valor
  return {
    formato: 'amib-f3-respaldo',
    version: 1,
    exportado: ahora.toISOString(),
    ajustes,
    intentos: todo<Respaldo['intentos'][number]>(
      `SELECT pregunta_id, pregunta_version, semilla, respuesta, correcta, tiempo_ms, confianza, modo, sesion_id, fecha,
         area, subtema_id, objetivo_id, tipo, dificultad, etiqueta_error, con_pistas FROM intento ORDER BY id`
    ),
    notas: todo<Respaldo['notas'][number]>('SELECT leccion_id, lamina_id, texto, actualizado FROM nota_lamina'),
    sesiones: todo<Respaldo['sesiones'][number]>('SELECT id, modo, inicio, fin, configuracion_json, resultado_json FROM sesion'),
    cajas: todo<Respaldo['cajas'][number]>('SELECT item_id, tipo, caja, proxima FROM caja_leitner')
  }
}

/** Reemplaza el progreso actual por el del respaldo (validado) en una sola transacción. */
export function importarProgreso(db: DatabaseSync, crudo: unknown): { intentos: number } {
  const r = EsquemaRespaldo.parse(crudo)
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM intento; DELETE FROM nota_lamina; DELETE FROM sesion; DELETE FROM caja_leitner; DELETE FROM ajustes;')
    const aj = db.prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?)')
    for (const [clave, valor] of Object.entries(r.ajustes)) if ((CLAVES_AJUSTE as string[]).includes(clave)) aj.run(clave, valor)
    const ins = db.prepare(
      `INSERT INTO intento (pregunta_id, pregunta_version, semilla, respuesta, correcta, tiempo_ms, confianza, modo, sesion_id, fecha,
         area, subtema_id, objetivo_id, tipo, dificultad, etiqueta_error, con_pistas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    for (const i of r.intentos)
      ins.run(i.pregunta_id, i.pregunta_version, i.semilla, i.respuesta, i.correcta, i.tiempo_ms, i.confianza, i.modo, i.sesion_id, i.fecha, i.area, i.subtema_id, i.objetivo_id, i.tipo, i.dificultad, i.etiqueta_error, i.con_pistas)
    const nota = db.prepare('INSERT INTO nota_lamina (leccion_id, lamina_id, texto, actualizado) VALUES (?, ?, ?, ?)')
    for (const n of r.notas) nota.run(n.leccion_id, n.lamina_id, n.texto, n.actualizado)
    const ses = db.prepare('INSERT INTO sesion (id, modo, inicio, fin, configuracion_json, resultado_json) VALUES (?, ?, ?, ?, ?, ?)')
    for (const s of r.sesiones) ses.run(s.id, s.modo, s.inicio, s.fin, s.configuracion_json, s.resultado_json)
    const caja = db.prepare('INSERT INTO caja_leitner (item_id, tipo, caja, proxima) VALUES (?, ?, ?, ?)')
    for (const c of r.cajas) caja.run(c.item_id, c.tipo, c.caja, c.proxima)
    db.exec('COMMIT')
    return { intentos: r.intentos.length }
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}
