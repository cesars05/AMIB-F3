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
