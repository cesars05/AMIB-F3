# AMIB F3: terminal de estudio

App de escritorio para Windows que sirve para preparar el examen **AMIB Figura 3 · Asesor en Estrategias de Inversión (Serie 210)**. Combina práctica con diagnóstico personalizado, guías en láminas con notas, simulacros realistas y un modo opcional con IA.

> Estado: **Etapa E0, fundaciones**. Ya está el esqueleto de la app, la base de datos local, las pruebas y el instalador de Windows por CI. Las pantallas de estudio llegan en E1. El plan completo está en [`docs/plan-maestro.md`](docs/plan-maestro.md).

## Instalar en Windows (sin programar nada)
1. En GitHub, abre la pestaña **Actions**, entra a la ejecución más reciente del workflow **CI** que esté en verde y baja hasta **Artifacts**.
2. Descarga **AMIB-F3-instalador-windows** (es un `.zip`) y extrae el `.exe`.
3. Ejecuta el instalador. Windows SmartScreen puede advertir que la app no está firmada: elige **Más información → Ejecutar de todas formas**.

Tu progreso se guarda en tu computadora (`%APPDATA%\AMIB F3\amib.db`) y no se sube a ningún lado.

## Desarrollo
Requisitos: Node 22+.
```bash
npm install
npm run dev        # abre la app
npm test           # pruebas unitarias
npm run typecheck
npm run e2e        # prueba de punta a punta con Electron
```

## Estructura
| Ruta | Contenido |
|---|---|
| `app/src/main` | Proceso principal de Electron: base de datos, IPC, exportaciones |
| `app/src/preload` | Puente seguro entre la interfaz y el proceso principal |
| `app/src/renderer` | Interfaz (React + Tailwind) |
| `app/src/core` | Lógica pura y probada: reglas del examen, puntaje, diagnóstico |
| `content/` | Temario, preguntas, guías y videos (desde E1) |
| `tools/` | Scripts de ingestión y validación de contenido (desde E1) |
| `docs/` | Plan, mapa del repo, bitácora, decisiones (ADR), herramientas |
| `AMIB Data/` | Material original de estudio (sin modificar) |
| `ECC/`, `graphify/` | Herramientas de desarrollo de terceros (no forman parte de la app) |
