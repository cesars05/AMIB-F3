# Bitácora

Formato: fecha · etapa · qué se hizo · qué funcionó · qué no · atajos y lecciones.

## 2026-10-14 · Planeación
- **Hecho:**
  - Material inventariado.
  - Plan maestro escrito, criticado por un agente Opus independiente, corregido y aprobado (`docs/plan-maestro.md`).
- **Hallazgos clave:**
  - Las claves de `Preguntas Tipo.docx` tienen 7 conflictos entre la letra y el texto en negritas.
  - Los repasos no traen clave.
  - El temario tiene ~540 objetivos, no ~600.
  - No existe un banco de preguntas gratuito oficial.
- **Atajo:** clonar el repo en el scratchpad (`git clone --depth 1`) para explorar sin tocar la rama de trabajo.

## 2026-10-14 · E0 Fundaciones
- **Hecho:**
  - Spike de base de datos (ADR-001: `node:sqlite` en Electron 44).
  - Esqueleto de Electron + React + TS con electron-vite y su base de seguridad.
  - Módulo `core/examen.ts` (estructura oficial, escala estimada, reglas de aprobación) con 9 pruebas.
  - E2E con Playwright sobre el Electron real.
  - Empaquetado validado (`app.asar` solo lleva `out/`).
  - CI con instalador de Windows y hook de inicio de sesión.
  - Skills de Emil Kowalski y agentes, skills y reglas de ECC (ver `docs/herramientas.md`).
- **Funcionó:**
  - Un agente Sonnet en paralelo instaló y revisó las skills mientras se armaba la app.
  - `npx skills add … -a claude-code --copy -y -s <skill>` instala solo las skills elegidas, dentro del proyecto.
- **No funcionó:**
  - `npm install` con vitest 4 + vite 7 dio el error `edgesOut`. Se resolvió con vitest 3.2.
  - Las capturas en xvfb salieron con artefactos porque la pantalla virtual era pequeña.
- **Pendiente para Cesar:** descargar el instalador desde Actions y confirmar que abre en Windows.

## 2026-10-14 · E1 Parsers de contenido
- **Hecho:**
  - `tools/` con tres parsers puros, validados con los esquemas Zod de `core/contenido.ts`, y dos scripts: `npm run content:build` (escribe `content/`) y `npm run validate:content` (valida y resume; sale con 1 si hay errores).
  - `content/taxonomia.json`: 22 materias, 76 subtemas, 465 objetivos (49 de cálculo).
  - `content/preguntas/oficial/preguntas-tipo.json`: 44 preguntas, todas con clave y `validada`.
  - `content/preguntas/oficial/etica-ensayo.json`: 31 preguntas del ensayo de Ética, con clave y página.
  - 73 pruebas nuevas en `tools/**/*.test.ts`, que leen los archivos reales de `AMIB Data/`.
- **Hallazgos:**
  - El temario no tiene ~540 objetivos: tiene **465 objetivos + 76 encabezados de subtema = 541 filas con texto**. Cualquier cifra de "~540 objetivos" contaba los encabezados.
  - Los conflictos letra/texto en `Preguntas Tipo.docx` son **6** (preguntas 1, 4, 10, 17, 22 y 32), no 7. La 34 no tiene conflicto: letra y texto están en negritas en la opción a (solo el punto final va sin negritas). Las 44 claves por texto en negritas coinciden con el fixture.
  - Las preguntas 25 a 28 de Preguntas Tipo (Ética) están copiadas tal cual en el ensayo del manual (preguntas 1, 12, 15 y 19), con la misma clave. Se conservan ambas y el ensayo lleva la nota `duplicado de tipo.NN`.
  - Los marcadores `<!-- pag. N del PDF -->` del manual de Ética cierran la página N, no la abren. La página de una pregunta es el marcador anterior **+ 1** (verificado con `pdftotext`).
- **Decisión de regla:** `tipo = 'calculo'` solo si el verbo es `calcular` o `resolver`, o el texto menciona cálculo/fórmula. `interpretar` y `determinar` no bastan: en el temario son conceptuales (p. ej. "Determinar en situaciones concretas el cumplimiento del principio ético…").
- **Pendiente:** `exclusivoFig3` queda en `false` para todos los objetivos (TODO en `parse-temario.ts`).
- **Atajo:** `fast-xml-parser` no hizo falta; con expresiones regulares sobre `word/document.xml` basta (las tablas no están anidadas) y se controla mejor la negrita por *run*.
