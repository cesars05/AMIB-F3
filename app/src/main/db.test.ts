import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { abrirBaseDeDatos, migrar } from './db'

describe('base de datos', () => {
  it('aplica migraciones y es idempotente', () => {
    const db = abrirBaseDeDatos(':memory:')
    const v = (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version
    expect(v).toBeGreaterThan(0)
    expect(migrar(db)).toBe(v)
    db.prepare("INSERT INTO intento (pregunta_id, respuesta, correcta, tiempo_ms, modo, sesion_id) VALUES ('q1', 0, 1, 1000, 'practica', 's1')").run()
    expect((db.prepare('SELECT COUNT(*) AS n FROM intento').get() as { n: number }).n).toBe(1)
  })
})

describe('migración 2', () => {
  it('crea las tablas del ADR-002 y amplía intento', () => {
    const db = abrirBaseDeDatos(':memory:')
    expect(Number((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version)).toBe(2)
    const tablas = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((t) => t.name)
    for (const t of ['ajustes', 'nota_lamina', 'sesion', 'caja_leitner']) expect(tablas).toContain(t)
    const cols = (db.prepare('PRAGMA table_info(intento)').all() as { name: string }[]).map((c) => c.name)
    for (const c of ['area', 'subtema_id', 'objetivo_id', 'tipo', 'dificultad', 'etiqueta_error', 'con_pistas']) expect(cols).toContain(c)
  })
  it('migra una base que ya estaba en la versión 1 sin perder intentos', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(`CREATE TABLE meta (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
      CREATE TABLE intento (id INTEGER PRIMARY KEY AUTOINCREMENT, pregunta_id TEXT NOT NULL, pregunta_version INTEGER NOT NULL DEFAULT 1, semilla INTEGER,
        respuesta INTEGER NOT NULL, correcta INTEGER NOT NULL CHECK (correcta IN (0, 1)), tiempo_ms INTEGER NOT NULL, confianza TEXT, modo TEXT NOT NULL,
        sesion_id TEXT NOT NULL, fecha TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')));
      CREATE INDEX intento_pregunta ON intento(pregunta_id);
      INSERT INTO intento (pregunta_id, respuesta, correcta, tiempo_ms, modo, sesion_id) VALUES ('q1', 0, 1, 1000, 'practica', 's1');
      PRAGMA user_version = 1;`)
    expect(migrar(db)).toBe(2)
    expect((db.prepare('SELECT COUNT(*) AS n FROM intento').get() as { n: number }).n).toBe(1)
    expect((db.prepare('SELECT con_pistas FROM intento').get() as { con_pistas: number }).con_pistas).toBe(0)
  })
})
