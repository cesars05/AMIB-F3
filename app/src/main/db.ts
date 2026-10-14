import { DatabaseSync } from 'node:sqlite'

/** Migraciones en orden. Nunca se editan las ya publicadas: solo se agregan nuevas. */
const MIGRACIONES: readonly string[] = [
  `CREATE TABLE meta (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
   CREATE TABLE intento (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     pregunta_id TEXT NOT NULL,
     pregunta_version INTEGER NOT NULL DEFAULT 1,
     semilla INTEGER,
     respuesta INTEGER NOT NULL,
     correcta INTEGER NOT NULL CHECK (correcta IN (0, 1)),
     tiempo_ms INTEGER NOT NULL,
     confianza TEXT,
     modo TEXT NOT NULL,
     sesion_id TEXT NOT NULL,
     fecha TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
   );
   CREATE INDEX intento_pregunta ON intento(pregunta_id);`
]

export function abrirBaseDeDatos(ruta: string): DatabaseSync {
  const db = new DatabaseSync(ruta)
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
  migrar(db)
  return db
}

export function migrar(db: DatabaseSync): number {
  const actual = Number((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version)
  for (let v = actual; v < MIGRACIONES.length; v++) {
    db.exec('BEGIN')
    try {
      db.exec(MIGRACIONES[v]!)
      db.exec(`PRAGMA user_version = ${v + 1}`)
      db.exec('COMMIT')
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
  }
  return MIGRACIONES.length
}
