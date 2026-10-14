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

## 2026-10-14 · E1 Prototipos de diseño
- **Hecho:**
  - Prototipos de **Pregunta** (Terminal, Editorial, Enfoque) y de **Inicio** (Terminal, Editorial, Enfoque, Claro), publicados como artifacts con selector. Copia en `docs/prototipos/`.
- **Decisiones de Cesar:**
  - Las pantallas de pregunta están bien.
  - El Inicio es un hub para elegir sección, no un examen directo.
  - Quiere poder **elegir el diseño** y agregar uno blanco y sobrio con Arial o Calibri.
  - El backend debe **recordar todo del estudiante** y mostrarlo en gráficas.
  - Los problemas numéricos del examen en línea usan **4 decimales**.
- **Bug encontrado al revisar:** un velo con `opacity: 0` seguía interceptando clics. Siempre hay que agregar `pointer-events: none` cuando está oculto.
- **Atajo:** las capturas con Playwright de cada variante (`scratchpad/shot*.mjs`, con Chromium de `/opt/pw-browsers`) detectan solapes y textos invisibles antes de publicar. Si un archivo local no tiene doctype, el navegador entra en modo quirks y las tablas no heredan el color.

## 2026-10-14 · E1 Ingesta del manual oficial (AMIB_1)
- **Hecho:**
  - `tools/parse-manual.ts`: `AMIB_1_completo.md` → 10 capítulos y **413 secciones** (351 `####` + 61 encabezados recuperados + el formulario como sección única). Por capítulo: 20, 28, 74, 41, 39, 32, 41, 77, 60, 1.
  - Cada sección lleva número normalizado y el impreso, páginas del PDF, cuerpo OCR crudo, `exclusivoFig3`/`fig3Parcial` y su objetivo del temario con confianza. Se escribe en `content/manual/capNN/NN-<slug>.md` + `content/manual/indice.json` (`SeccionManualSchema` en `core/contenido.ts`).
  - `tools/vincular-manual.ts` + `tools/similitud.ts`: vínculo por similitud de tokens. Umbral 0.55; alta ≥ 0.8. **323 alta, 57 media, 33 sin vínculo** (el formulario incluido). Con la taxonomía, 25 objetivos quedan con `exclusivoFig3 = true`.
  - `tools/parse-repaso.ts`: **130 preguntas** de repaso como `borrador` sin clave (`content/preguntas/repasos/manual-amib1.json`); 48 omitidas por no poder reconocer las 4 opciones. Por capítulo (extraídas/omitidas): 25/0, 15/6, 9/6, 12/3, 18/7, 20/5, 4/8, 19/6, 8/7.
  - `validate-content` valida el índice (esquema, objetivos existentes, páginas monótonas, archivos presentes). Pruebas nuevas para cada módulo (189 en total, con los archivos reales).
- **Hallazgos:**
  - La numeración del OCR no se arregla con reglas locales: `1.14.4` puede ser 1.1.3 o 1.1.4. Se resolvió con una búsqueda sobre todo el capítulo (ediciones mínimas + secuencia creciente) y se marcan como `dudosa` las 26 lecturas ambiguas; el orden del documento manda.
  - El temario no contiene todos los objetivos del manual y viceversa: 357 de 465 objetivos tienen sección y 19 tienen dos.
  - Las preguntas de repaso llegan con columnas mezcladas; omitir fue mejor que adivinar. El capítulo 7 (fondos) es el peor: 4 de 12.
  - Un `Pág. M` impreso va 2 por debajo del marcador `<!-- page N -->`; la última página (360) está vacía.
- **Decisión de regla:** la sección es exclusiva de la Figura 3 solo si el marcador está en el tema o en su propio encabezado; un subtema suelto marcado dentro del cuerpo la deja como `fig3Parcial`.
- **Pendiente:** limpieza de OCR por sección (con diff de cifras), resolver y validar las 130 preguntas de repaso (sin clave), y revisar a mano las secciones con numeración `dudosa` y las 33 sin vínculo.


## 2026-10-14 · Verificación de las claves en conflicto (Preguntas Tipo)
Regla nueva: antes de preguntarle a Cesar, se consulta `AMIB_1_completo.md`. Resultado para las 6 preguntas con conflicto entre letra y texto en negritas (manda el texto):
1. tipo.01 (Teoría Dow, EXCEPTO): clave a) "la diversificación mitiga el riesgo". **Confirmada**: el manual (9.7.3) lista las seis premisas y ninguna es la diversificación.
2. tipo.04 (formación de continuación): clave d) "triángulo descendente". **Confirmada**: el manual (9.7.4) ubica los triángulos en formaciones de continuación y la cabeza y hombros en cambio de tendencia (9.7.6).
3. tipo.10 (tasa real): clave a) 1.94 %. **Confirmada por cálculo**.
4. tipo.17 (volatilidad de precios en un fondo): clave d) "de mercado". **Confirmada**: el manual define riesgo de mercado como pérdida ante movimientos de precios (cap. 7).
5. tipo.22 (derechos del instrumento hasta el vencimiento): clave c) "compra en directo". **Confirmada**: el manual (6.1.10 y 6.3.1) describe la operación en directo hasta el vencimiento.
6. tipo.32 (quién aprueba sobrevaluación y subvaluación): clave a) "el contralor normativo así como el responsable de la administración integral de riesgos". **No verificable en las fuentes**: el manual (7.3.7) explica el mecanismo pero no quién lo aprueba, y el manual 2023 no lo trata. Se mantiene el texto en negritas; queda pendiente de consultar a Cesar o la regulación vigente.
