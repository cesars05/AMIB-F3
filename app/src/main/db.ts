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
   CREATE INDEX intento_pregunta ON intento(pregunta_id);`,
  // Migración 2 (ADR-002): ajustes, notas por lámina, sesiones, cajas de Leitner y columnas del motor en `intento`.
  `CREATE TABLE ajustes (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
   CREATE TABLE nota_lamina (
     leccion_id TEXT NOT NULL,
     lamina_id TEXT NOT NULL,
     texto TEXT NOT NULL,
     actualizado TEXT NOT NULL,
     PRIMARY KEY (leccion_id, lamina_id)
   );
   CREATE TABLE sesion (
     id TEXT PRIMARY KEY,
     modo TEXT NOT NULL,
     inicio TEXT NOT NULL,
     fin TEXT,
     configuracion_json TEXT,
     resultado_json TEXT
   );
   CREATE TABLE caja_leitner (
     item_id TEXT PRIMARY KEY,
     tipo TEXT NOT NULL,
     caja INTEGER NOT NULL CHECK (caja BETWEEN 1 AND 5),
     proxima TEXT NOT NULL
   );
   ALTER TABLE intento ADD COLUMN area TEXT;
   ALTER TABLE intento ADD COLUMN subtema_id TEXT;
   ALTER TABLE intento ADD COLUMN objetivo_id TEXT;
   ALTER TABLE intento ADD COLUMN tipo TEXT;
   ALTER TABLE intento ADD COLUMN dificultad INTEGER;
   ALTER TABLE intento ADD COLUMN etiqueta_error TEXT;
   ALTER TABLE intento ADD COLUMN con_pistas INTEGER NOT NULL DEFAULT 0;
   CREATE INDEX intento_sesion ON intento(sesion_id);`
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
