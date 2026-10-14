# ADR-001: Base de datos local con `node:sqlite`

- **Estado:** aceptada (E0, 2026-10-14)
- **Contexto:**
  - La app guarda el progreso (intentos, sesiones, notas) en la PC de Cesar.
  - Un módulo nativo como `better-sqlite3` obliga a compilar binarios para Windows, y las sesiones de desarrollo corren en Linux.
  - Cesar no tiene un entorno de compilación.
- **Opciones evaluadas:**
  - `better-sqlite3`: rápido y maduro, pero es un módulo nativo que hay que recompilar para cada versión de Electron y Windows.
  - `sql.js` (WASM): sin binarios nativos, pero toda la base vive en memoria y se reescribe completa al guardar.
  - `node:sqlite`: viene incluido en el Node que trae Electron. No es nativo de terceros ni requiere compilar.
- **Prueba (spike):** en Electron 44.7.2 (Node 24.21.0), `require('node:sqlite').DatabaseSync` creó tablas, insertó y consultó correctamente bajo xvfb.
- **Decisión:**
  - Usar `node:sqlite`, con la base en `userData/amib.db`, modo WAL y migraciones por `PRAGMA user_version`.
  - La capa `app/src/main/db.ts` aísla la API. Si hiciera falta cambiar a `better-sqlite3`, solo se toca esa capa.
- **Consecuencias:**
  - Ningún módulo nativo, y el instalador se compila sin herramientas extra.
  - `node:sqlite` aún se marca experimental en Node. El riesgo se cubre con pruebas de la capa de datos, y Electron se fija en una versión exacta.
