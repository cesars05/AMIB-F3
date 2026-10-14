# Plan maestro: AMIB Figura 3 — App de estudio, diagnóstico y simulador

## 0. Contexto
Cesar prepara el examen **AMIB Asesor en Estrategias de Inversión (Figura 3, Serie 210)**. Quiere una **app de escritorio local para Windows** con:
1. **Quiz con progreso**: su nivel actual frente al nivel necesario para aprobar, respetando las áreas obligatorias.
2. **Examen con guía para reforzar**: práctica con explicación y repaso dirigido.
3. **Personalización real**: detectar qué falla, primero por área y luego por subtema, separando **teoría** de **cálculo**.
4. **Guías en formato de láminas con notas**: cada tema se presenta como una secuencia de **láminas** (estilo presentación o PDF) con un **panel de notas debajo de cada lámina**, donde Cesar escribe las suyas. No es Obsidian: lo que importa es el diseño y la forma de presentar la información. Llevan mapas conceptuales y se exportan a Word (completas o por sección) y a PowerPoint (las láminas como diapositivas y las notas como notas del orador).
5. **Simulacro realista**: 210 preguntas, 4 h 18 min, escala 200–1100, más modos por módulo.

Criterios de calidad que pidió:
- Banco **extenso, que no se repita**.
- Preguntas teóricas **difíciles y con trampas**.
- Diseño **profesional estilo financiero** (Bloomberg / FT).
- Que yo me **autoextienda con skills y MCPs** y que **piense antes de hacer**.

Material en `cesars05/AMIB-F3` (privado, rama `main`). Se trabaja en `claude/trusting-ptolemy-io4gmo` partiendo de `main`. Este plan ya pasó una revisión crítica independiente (Opus) y sus hallazgos están integrados.

---

## 1. Protocolo de trabajo ("pensar antes de hacer")
Cada entregable relevante (pantalla, parser, motor, lote de preguntas, guía) pasa por estos pasos antes de construirse:

| Paso | Qué responde | Dónde queda |
|---|---|---|
| 1. Propósito | ¿Qué problema de estudio resuelve? ¿Cómo se mide que funciona? | `docs/fichas/<tarea>.md` |
| 2. Proceso | Pasos, datos, herramientas, qué puede fallar | Ficha |
| 3. Output | Qué se entrega exactamente | Ficha |
| 4. Presentación | ¿Es la mejor forma de mostrarlo? Se comparan 2–3 alternativas | Prototipos y capturas |
| 5. Decisión | Qué se eligió y por qué | `docs/decisiones/ADR-xxx.md` |
| 6. Verificación | Pruebas y revisión independiente | Pruebas y reporte |

- Lo que Cesar ve (pantallas, formato de guías, mapas, estilo de preguntas) se le muestra en versiones para que elija **antes** de escalar.
- Al cerrar cada etapa: demo con capturas, lista de qué probar en Windows y aprobación de Cesar. Al iniciar la siguiente, se replantea el plan con lo aprendido.
- **Skills propias del proyecto** (en `.claude/skills/`): `generar-preguntas`, `validar-pregunta`, `verificar-cita`, `redactar-guia`. Sirven para que cualquier sesión o modelo siga exactamente el mismo proceso.

### Notas de workflow (memoria del proyecto para trabajar más rápido)
Se mantienen vivas a lo largo de todo el proyecto y se actualizan al cerrar cada tarea:
- `docs/mapa-del-repo.md`: qué hay en cada archivo y carpeta y cómo funciona. Ejemplos:
  - "`AMIB_1_completo.md`: los objetivos van en `####`; ojo, el OCR numera mal (`6.14` = `6.4`)."
  - "`Preguntas Tipo.docx`: manda el texto en negritas, no la letra."
- `docs/bitacora.md`: qué se hizo, qué funcionó, qué no y por qué. Incluye atajos descubiertos (comandos, scripts, prompts que dieron buen resultado) y errores para no repetirlos.
- Sección "Lecciones" en `CLAUDE.md`: las reglas más importantes que salen de la bitácora. Se carga en cada sesión, así cualquier modelo arranca sabiendo lo aprendido.
- Al terminar cada etapa se revisan las notas: se borra lo obsoleto y se condensa lo útil.

### Uso de modelos
| Modelo | Para qué |
|---|---|
| **Opus** | Arquitectura, motor de diagnóstico, redacción de preguntas difíciles y guías, revisiones críticas |
| **Sonnet** | Código, parsers, pantallas, pruebas |
| **Haiku** | Tareas masivas mecánicas: etiquetado, primera validación, limpieza del OCR (con control de que no cambie cifras) |

---

## 2. Inventario del material (verificado)
| Archivo (`AMIB Data/`) | Qué es | Uso |
|---|---|---|
| `Examen Integral…docx` | Temario oficial Serie 210: 9 áreas, subtemas, **465 objetivos** bajo 76 encabezados de subtema y 22 materias (49 de cálculo; "interpretar" y "determinar" son conceptuales en el temario). Sin pesos debajo del nivel área | Columna vertebral de la taxonomía |
| `Preguntas Tipo.docx` | 44 preguntas en 11 secciones. La clave se marca en negritas, **pero en 6 preguntas (1, 4, 10, 17, 22, 32) la letra en negritas no coincide con el texto en negritas**. Manda el texto en negritas, comprobado recalculando las preguntas de cálculo | Referencia de estilo y dificultad. Las 8 de cálculo (10, 11, 16, 19, 23, 24, 29, 30) fijan las **convenciones del examen**: año de 360 días, interés simple, tasas del periodo, rendimientos de fondos sin anualizar |
| `Manual_EBSPMV_completo.md` + PDF | Ética oficial (AMIB 2012), con "Ensayo de examen" de 31 preguntas y tabla de respuestas | Guía de Ética y 31 preguntas con clave |
| `AMIB_1_completo.md` (OCR, 360 pp) | Manual oficial completo, 10 capítulos, temas exclusivos de Figura 3 marcados, ~10 "Repaso" **sin clave**, guías de teclas de la HP-17bII. OCR ruidoso. Usa todavía el nombre anterior a 2014, "sociedades de inversión" (19 veces) | Fuente principal para guías y para generar preguntas |
| `702510249-Manual…2023.pdf` | Manual de terceros con texto, 9 capítulos, ~141 preguntas de repaso **sin clave** | Fuente secundaria y respaldo del OCR |
| `AMIB Fig 3_vf.docx` | Notas de Cesar: **solo Títulos de Deuda** (el final quedó sin terminar) | Plantilla de formato y primera guía |
| `Bibliografía por Materia.docx` | Bibliografía por área. Exige leyes "vigentes" | Referencias de cada guía |
| `images/` | 8 figuras de Ética | Ilustraciones |
| `Caso_Practico_Bienes_Raices.xlsx` | Otro curso | Se ignora |
| `Code`, `README.md` | Marcadores vacíos | Se reemplazan |
| `ECC/`, `graphify/` | Herramientas de desarrollo | Se excluyen de la compilación y de los índices |

### Estructura del examen
| Área | Preguntas | Obligatoria (≥600) |
|---|---|---|
| Ética | 20 | ✅ |
| Servicios de Inversión | 20 | |
| Marco Normativo I–III | 25 | |
| Matemáticas Financieras y Portafolios | 25 | |
| Mercado de Capitales I–II | 25 | ✅ |
| Títulos de Deuda I–II | 25 | ✅ |
| Fondos de Inversión | 20 | |
| Derivados I–II y Riesgos I–II | 25 | ✅ |
| Análisis Económico, Financiero y Técnico | 25 | |
| **Total** | **210** en 4 h 18 min (≈74 s por pregunta) | Promedio ≥600 en escala 200–1100 |

Hay extraordinario **modular** (solo áreas obligatorias, si se aprobó el promedio) e **integral**.

**Preguntas disponibles:** 75 con clave (44 de ejemplo + 31 de Ética) y unas 250 de repasos sin clave.

**Búsqueda en línea:** no existe un banco oficial gratuito. Hay un simulador de pago del Tec de Monterrey, cursos privados y `open-exam-prep.com` (600+ preguntas), que no se pudo abrir desde aquí. No se copia material de pago. Si Cesar tiene acceso legítimo a algún material, puede aportarlo como `fuente: externa`.

---

## 3. Herramientas
| Herramienta | Uso | Cuándo |
|---|---|---|
| **ECC** (solo lo que se use) | Agentes `planner`, `architect`, `tdd-guide`, `code-reviewer`, `typescript-reviewer`, `react-reviewer`, `security-reviewer`, `e2e-runner`; skills `tdd-workflow`, `e2e-testing`, `frontend-a11y`, `verification-loop`; reglas `common` + `typescript` + `web` | E0 |
| **Skills de Emil Kowalski** (`npx skills@latest add emilkowalski/skills`) | `apple-design`, `emil-design-eng`, `prototype`, `animate`, `find-animation-opportunities`, `animation-vocabulary`, `review-animations`, `improve-animations`, `animation-performance`, `ask-sonner`, `break-ui`, `pick-ui-library` (detalle en 4b) | E0 en adelante |
| **Skills de la sesión** | `dataviz` (gráficas), `docx` (Word), `pptx` (después), `artifact-design` (prototipos rápidos para revisar) | Según la etapa |
| **Playwright** | Pruebas E2E y **capturas** para que Cesar vea avances sin instalar nada | Desde E0 |
| **GitHub Actions (`windows-latest`)** | Construir el **instalador de Windows** en cada avance. Cesar lo descarga sin instalar Node ni herramientas de compilación | Desde E0 |
| **MCP de diagramas** (Mermaid o Excalidraw, a evaluar) | Generar y probar mapas conceptuales | E2 |
| **OmniRoute** (en la PC de Cesar) | Gateway local de modelos gratuitos para el modo con IA. En la nube se prueba con un servidor simulado compatible con OpenAI | E2 |
| **WebSearch / WebFetch** y oEmbed de YouTube | Buscar y verificar videos por tema en cada sesión | E2 en adelante |
| Extracción: `pdftotext`, `pdftohtml`, `pypdf`, `python-docx` (ya disponibles) | Parsers | E1 |
| Graphify | Pospuesto. Solo si el código crece lo suficiente para justificarlo | — |

Reglas:
- Lo instalado se guarda **en el repo** (`.claude/skills/`, `.mcp.json`, `.claude/settings.json`) y se documenta en `docs/herramientas.md`.
- Antes de instalar algo, se revisa su origen y cuánto contexto consume, y se explica en una línea por qué.
- Si la red o los permisos lo bloquean, se avisa.

---

## 4. Arquitectura
### Stack
- **Electron + React + TypeScript** (`electron-vite`) e instalador NSIS con `electron-builder` **compilado en GitHub Actions**. Sin firma digital: Windows SmartScreen mostrará una advertencia, documentada en la guía de instalación.
- **Base de datos local**: la decisión se toma en un spike de E0 y queda en un ADR. Preferencia: **evitar módulos nativos** (`node:sqlite` incluido en Electron, o `sql.js` en WASM) para no compilar en Windows. `better-sqlite3` queda como respaldo. Para un solo usuario (~2,000 preguntas, decenas de miles de intentos) cualquiera alcanza.
- **Seguridad Electron**: `contextIsolation`, `sandbox: true`, sin `nodeIntegration`, CSP estricta, bloqueo de navegación y `window.open`, validación Zod de todo lo que cruza IPC, y Markdown sanitizado (`rehype-sanitize`), porque las guías las escribe un modelo.
- **UI**:
  - React, Tailwind y Radix UI (accesible).
  - Gráficas con Recharts o visx; mapas con React Flow o Mermaid.
  - Los mapas se convierten a PNG para poder exportarlos a Word.
- **Datos**: Zod para validar el contenido al compilar. Exportación con `docx`; `pptxgenjs` después.
- **Pruebas**: Vitest con ≥80% de cobertura en `core/` y Playwright.

### Estructura del repo
```
app/src/main       proceso principal: DB, IPC, exportación
app/src/preload    puente seguro
app/src/renderer   pantallas
app/src/core       lógica pura probada: puntaje, dominio, selector, simulacro
content/           fuente de verdad versionada
  taxonomia.json
  preguntas/<area>/*.json
  plantillas-calculo/*.ts
  tarjetas/<area>/*.json      flashcards de datos duros
  guias/<area>/<tema>.md      láminas separadas por `---`, con bloques propios
  recursos/videos.json        videos por tema
  mapas/<area>/*.json
tools/             ingestión, generación, validación
docs/              fichas, ADRs, herramientas, guía de uso
.github/workflows/ CI y build de Windows
```

### Modelo de datos
- **Taxonomía**:
  - `Area(id, nombre, preguntas_examen, obligatoria)` → `Tema` → `Subtema(tipo: teoria|calculo|mixto, exclusivo_fig3)` → `Objetivo(texto oficial, verbo)`.
  - El peso dentro de cada área es **uniforme por objetivo**. Es un supuesto documentado, porque el temario no da pesos por debajo del área.
- **Pregunta**:
  - Identidad y contenido: `id` estable, `version`, enunciado, 4 opciones, clave, explicación, `por_que_no` por opción.
  - Clasificación: `subtema_id`, `objetivo_id`, tipo (teoría o cálculo), formato (directa, EXCEPTO, caso, cálculo), `es_trampa`, dificultad 1–5, `etiquetas_error` por distractor.
  - Origen: fuente (`oficial-ejemplo`, `manual-repaso`, `externa`, `generada`), **`cita_textual`** (fragmento literal del manual con página).
  - Ciclo de vida: `vigencia` (`verificada` o `por_verificar`) y estado (`borrador`, `validada`, `reportada`, `retirada`). **Nunca se borra; se retira**, para no romper el historial.
- **Plantilla de cálculo**: parámetros con rangos, fórmula con las convenciones del examen (360 días, interés simple…), distractores generados a partir de errores de método. Cada instancia guarda su **semilla**.
- **Tarjeta** (flashcard): pregunta corta y respuesta. Cubre reguladores, plazos, montos, porcentajes y horarios.
- **Intento**: pregunta, versión, semilla, respuesta, acierto, `tiempo_ms`, confianza ("seguro / dudé / adiviné"), modo, sesión, fecha.
- **Paquete de contenido versionado**: actualizar preguntas no borra el progreso. El progreso vive en la carpeta de usuario de Windows, con respaldo y restauración en JSON.


### Modos de estudio (decisión de Cesar): primero se aprende, luego se evalúa
Una sesión **no empieza con un examen**. Desde Inicio hay cuatro maneras de estudiar:

| Modo | Para qué | Flujo |
|---|---|---|
| **Lección guiada** (por subtema) | Aprender un tema | 1) **Explicación por partes**: láminas con el tema dividido en sus conceptos, fichas de instrumentos y mapa conceptual. 2) **Puntos clave**: lo que hay que memorizar. 3) **Práctica guiada**: preguntas con explicación inmediata. 4) **Mini examen** al final (5–10 preguntas), que alimenta el diagnóstico |
| **Repaso rápido** | Lo más importante que debes saber **hoy** | Tarjetas y puntos clave priorizados por peso en el examen, por tus debilidades y por lo que olvidarás pronto. 10–20 minutos, con 3–5 preguntas de control al final |
| **Repaso completo desde cero** | Recorrer todo el temario en orden | Todas las lecciones guiadas en el orden del temario (área → materia → subtema), con avance guardado. Las 4 obligatorias van primero si así lo elige el plan |
| **Evaluación directa** | Medirse | Práctica libre, simulacro por módulo, modular extraordinario, rápido o integral |

El **Plan de hoy** mezcla estos modos según la intensidad y el diagnóstico. Por ejemplo: lección de un subtema débil, luego repaso rápido de tarjetas vencidas y al final un mini examen.

### Fuente de las lecciones: `AMIB_1_completo.md`
- Es el manual oficial completo en OCR: 10 capítulos, 351 secciones `####` (una por objetivo de aprendizaje) y marcadores `<!-- page N -->`.
- **Ingesta (`tools/parse-manual.ts`)**:
  - Corta el manual por capítulo y sección.
  - Detecta encabezados que el OCR perdió (líneas que empiezan con numeración tipo `6.2.3.`).
  - Guarda el rango de páginas de cada sección.
  - Marca las secciones "INFORMACIÓN FIGURA 3".
  - Vincula cada sección con su objetivo del temario por similitud de texto, con nivel de confianza.
  - Escribe `content/manual/capNN/<seccion>.md`, el OCR crudo con metadatos.
  - Extrae las preguntas de "Repaso del capítulo" como `borrador`, porque no traen clave.
  - Completa `exclusivoFig3` en la taxonomía.
- **Limpieza** (modelos, por sección): corrige errores de OCR sin cambiar ninguna cifra. Un script compara números, porcentajes y plazos antes y después. El manual 2023, que sí tiene texto, sirve de respaldo para pasajes ilegibles.
- **Redacción de lecciones** (Opus, por subtema): láminas con el formato de las notas de Cesar. Cada lámina cita su página del manual. Se empieza con Títulos de Deuda (capítulo 6) y se combina con sus notas.

### Arranque personalizado (onboarding)
Primera vez que se abre la app:
1. Fecha del examen.
2. Modo de estudio:
   - **Intensivo** (p. ej. 2–3 h/día, 6 días).
   - **Ligero** (p. ej. 45–60 min/día, 4–5 días).
   - **Personalizado** (minutos por día y días por semana).
3. Autoevaluación rápida por área ("domino / más o menos / nunca lo he visto").
4. Examen diagnóstico.

Con esto se genera un **plan de estudio por días**: qué áreas, cuántas preguntas, qué guías y cuándo hacer un simulacro. Se recalcula cada semana según el progreso real, y Cesar puede cambiar el modo en cualquier momento.

### Modos de IA
La app funciona en dos modos, seleccionables en Configuración:
| Modo | Qué hace | Requiere |
|---|---|---|
| **Sin internet** (por omisión) | Todo lo prevalidado: banco, plantillas, guías, diagnóstico, simulacros | Nada |
| **Con IA (modelos gratuitos)** | Tutor "explícame de otra forma", chat sobre la lámina actual, preguntas extra al momento sobre un subtema débil, resumen de errores de la sesión | OmniRoute instalado y corriendo en la PC de Cesar, con cuentas en los proveedores gratuitos que quiera usar |

- **Integración con OmniRoute** (`github.com/diegosouzapw/OmniRoute`, MIT): es un gateway local que expone un endpoint compatible con OpenAI en `http://localhost:20128/v1` y reparte las peticiones entre proveedores gratuitos (OpenRouter `:free`, Groq, Cerebras, NVIDIA NIM, Cloudflare…), con respaldo automático si uno falla.
- La app tiene una capa `ProveedorIA` con dos implementaciones: OmniRoute por omisión y un endpoint compatible con OpenAI configurable (sirve también para la API de Anthropic si algún día se quiere).
- **Respuestas ancladas**: la IA recibe el texto de la guía o lámina y la cita del manual, y debe responder con base en eso. Así se reducen los errores de los modelos gratuitos.
- Las preguntas generadas en vivo quedan como `generada-en-vivo`. **No cuentan para el simulacro ni para la probabilidad de aprobar**; sí cuentan para la práctica.
- Cuidados:
  - Los modelos gratuitos son más débiles y sus límites cambian.
  - Se envía texto de estudio a proveedores externos, nunca datos personales.
  - La app detecta si OmniRoute no responde y vuelve sola al modo sin internet.

### Recursos en video (YouTube)
- Biblioteca de videos **por tema y subtema**, que crece con cada sesión de desarrollo: busco canales y videos que expliquen temas de la AMIB/MIB, verifico que el enlace existe (con el oEmbed de YouTube) y los guardo en `content/recursos/videos.json` con tema, duración, canal y una nota de por qué sirve.
- Cesar también puede pegar enlaces desde la app y asignarlos a un tema.
- En cada lámina o subtema débil aparece "ver video". El video se abre en el navegador, y en modo sin internet solo se muestra el enlace.
- Nota: en la búsqueda inicial no apareció un canal especializado claro. Se priorizan videos de conceptos generales (bonos, CETES, derivados, CAPM…) en español y de fuentes reconocibles.


### Memoria del estudiante (perfil que el sistema recuerda)
Todo lo que hace Cesar queda registrado y se convierte en un **perfil persistente** que alimenta el diagnóstico, el selector y las gráficas del Inicio:
- **Registro de eventos** (tabla `intento` y tabla `evento`): cada respuesta (con tiempo, confianza y opción elegida), cada lámina vista, cada tarjeta repasada, cada simulacro.
- **Perfil por subtema y objetivo** (calculado y guardado en caché):
  - aciertos e intentos;
  - dominio con su banda de confianza;
  - tiempo promedio contra el ritmo del examen (74 s);
  - última vez que se vio;
  - estado: *no visto*, *débil*, *en progreso* o *dominado*;
  - errores frecuentes, por etiqueta de distractor;
  - aciertos "adivinando".
- **Lo que el sistema recuerda**, visible en el Inicio y en el Diagnóstico:
  - dónde falla más;
  - patrones de error;
  - objetivos sin ver;
  - temas dominados;
  - temas importantes pendientes (obligatorios o de alto peso);
  - tiempo por pregunta por área.
- **Gráficas desde el día 1**:
  - dominio por área contra la meta;
  - tiempo por pregunta contra 74 s;
  - cobertura del temario (vistos / 465);
  - evolución semanal;
  - mapa de calor por subtema;
  - historial de simulacros.
- Todo es local, con respaldo en JSON, y se puede reiniciar. No sale de la PC salvo el texto de estudio que use el modo con IA.

### Motor de diagnóstico (proporcionado a un solo usuario)
1. **Examen diagnóstico inicial** de 60–90 preguntas, estratificado por área. Da evidencia desde el día 1.
2. **Dominio por subtema**: estimación Beta, ponderada por recencia, con banda de confianza. Se muestra **% de aciertos con su banda** y aparte el puntaje estimado en la escala 200–1100.
3. **Dos niveles**: primero área y tema; con más datos, subtema y objetivo. Siempre separa teoría y cálculo.
4. **Diagnóstico por tipo de error**: las etiquetas de los distractores explican **por qué** falla. Ejemplos: "confundes precio limpio con sucio", "usas 365 en vez de 360".
5. **Selector**: por omisión 50% subtemas débiles, 25% repasos vencidos y 25% no vistos, con más peso en las áreas obligatorias. Las paramétricas se regeneran con números nuevos. La repetición espaciada es tipo **Leitner** (simple), tanto para preguntas como para tarjetas.
6. **Preparación**: probabilidad de aprobar mediante Monte Carlo sobre exámenes de 210 preguntas, con las dos reglas (promedio ≥600 y ≥600 por área obligatoria).
   - **Meta por omisión: ≥75% de aciertos en cada área obligatoria.** Con 20–25 preguntas por área y una conversión supuesta de 600 ≈ 60% de aciertos, la probabilidad de aprobar las 4 obligatorias es de ~0.35 con 65% de aciertos, ~0.65 con 70% y ~0.88 con 75%.
7. **Calibración del sesgo "difícil"**: las preguntas `es_trampa` se reportan por separado. La proyección se calibra contra el estilo de las preguntas oficiales para no subestimar a Cesar.
8. **Se descarta** calibrar la dificultad tipo Elo: con un solo usuario no hay datos suficientes por pregunta.

---

## 4b. Diseño y experiencia (UX)
**Idea central:** la *identidad visual* es financiera (Bloomberg / FT). La *interacción y el movimiento* siguen los principios de Apple y de Emil Kowalski, para que estudiar horas sea ameno y no cansado.

### Skills de Emil Kowalski y para qué sirve cada una
| Skill | Uso en el proyecto |
|---|---|
| `apple-design` | Principios de interfaz y movimiento de Apple (jerarquía clara, deferencia al contenido, profundidad, respuesta inmediata al toque o clic). Base de las decisiones de UX |
| `emil-design-eng` | Criterio general de diseño e ingeniería de interfaces: espaciado, tipografía, estados, pulido |
| `prototype` | Varias versiones de cada pantalla clave para que Cesar elija |
| `animate` | Construir cada animación eligiendo curva, duración y propiedades |
| `find-animation-opportunities` | Detectar dónde el movimiento ayuda (y dónde debe quedarse quieto) |
| `animation-vocabulary` | Describir con precisión el movimiento deseado al planear cada pantalla |
| `review-animations` / `improve-animations` | Auditoría estricta de las animaciones al cerrar cada etapa |
| `animation-performance` | Que nada pierda cuadros (importante en Electron y laptops modestas) |
| `ask-sonner` | Notificaciones tipo toast: guardado de notas, racha, "pregunta reportada", modo IA desconectado |
| `break-ui` | Probar con casos extremos: enunciados larguísimos, 0 intentos, 10,000 intentos, nombres de instrumentos largos |
| `pick-ui-library` | Usar librerías establecidas (Radix, Recharts, React Flow) en vez de reinventar |
| `mobile-native`, `animate-expo`, `write-swift` | No aplican (app de escritorio) |

### Principios de UX del estudio
- **Respuesta inmediata y clara**: al contestar, la opción correcta se resalta en verde y la elegida en rojo, y se abre la explicación con una transición corta (~200 ms). Sin efectos que distraigan.
- **Progreso que motiva**: las barras por área se animan al subir, con la línea de meta (75%) siempre visible. Marcas sutiles al cruzar la meta en un área obligatoria.
- **Láminas**: transición suave entre láminas, navegación por teclado (←/→), panel de notas que se expande sin saltos.
- **Simulacro**: modo de concentración, sin animaciones ni distracciones, igual que el examen real. El temporizador cambia de color solo en los últimos minutos.
- **Densidad tipo terminal con calma tipo Apple**: muchos datos, pero bien jerarquizados (KPIs grandes, detalle al expandir).
- **Accesibilidad**: respetar "reducir movimiento" de Windows, contraste AA, todo usable con teclado.
- **Atajos de teclado** para estudiar rápido: 1–4 o A–D para responder, Enter para continuar, R para reportar, N para nota.

### Proceso de diseño por pantalla
1. Describir la pantalla con `animation-vocabulary`, `apple-design` y el protocolo de la sección 1 (propósito, output, presentación).
2. Hacer 2–3 prototipos con `prototype`, en la identidad Terminal (Bloomberg) y con detalles editoriales del FT.
3. Cesar elige.
4. Implementar con `animate`, revisar con `review-animations`, `animation-performance` y `break-ui`.
5. Capturas y lista de prueba para Windows.


### Temas y tipografía seleccionables (decisión de Cesar)
- La app tiene un **sistema de temas intercambiables** basado en tokens de diseño (colores, tipografía, densidad). En **Ajustes → Apariencia**, Cesar elige:
  - **Terminal**: oscuro, estilo Bloomberg.
  - **Editorial**: salmón, estilo FT.
  - **Enfoque**: grafito, estilo Apple.
  - **Claro**: blanco, sobrio y profesional, estilo semanario económico. **Es el tema por omisión (confirmado por Cesar).**
- **Tipografía** seleccionable entre fuentes conocidas de Windows: Arial, Calibri y Segoe UI. Las cifras siempre usan dígitos tabulares.
- Las pantallas se construyen solo con tokens, nunca con colores literales, para que cualquier tema funcione en todas. Una prueba E2E recorre los 4 temas con capturas.
- Al iniciar, la app abre en **Inicio**, el hub para elegir sección (Sesión de hoy, Practicar, Diagnóstico, Simulacro, Guías, Tarjetas, Videos, Ajustes). Nunca abre directo en un examen.

## 5. Banco de preguntas: cómo se hace extenso, difícil y confiable
1. **Piloto primero**: 30 preguntas de Títulos de Deuda. Cesar las califica por dificultad, claridad y trampas. Con el piloto se **mide el costo** (tokens y tiempo) para estimar el banco completo antes de escalar.
2. **Guía de redacción** (`docs/guia-preguntas.md`):
   - Estilo AMIB: casos, "EXCEPTO", "es correcto que…".
   - Distractores plausibles, cada uno etiquetado. Confusiones típicas: CETES/BONDES/Bonos M, limpio/sucio, reporto/directo, TIIE/Fondeo, cifras y plazos exactos, quién regula qué.
   - Prohibido: opciones obvias o ambiguas.
3. **Cálculo paramétrico**: 49 objetivos de cálculo, que dan unas 40–50 plantillas. Ejemplos: tasa real, descuento de CETE, precio limpio y sucio, premio de reporto, precio de salida, duración, VaR, CAPM, Sharpe, futuros, opciones y rendimientos de fondos.
   - Las 8 preguntas oficiales de cálculo son **pruebas fijas** de las fórmulas.
   - **Formato de 4 decimales**, como en el examen en línea: clave y distractores se calculan con precisión completa y se muestran a 4 decimales. Un validador rechaza instancias con opciones repetidas o casi iguales a 4 decimales.
   - Las explicaciones incluyen **las teclas de la HP-17bII**, tomadas de las guías del manual.
4. **Meta de volumen**: ~3 preguntas de teoría por objetivo (~1,250 para 416 objetivos de teoría), más plantillas ilimitadas y tarjetas. El orden es por áreas obligatorias.
5. **Validación** (no depende de que Cesar sepa la respuesta):
   - **Cita textual obligatoria**: un script verifica que el fragmento citado existe en el texto del manual. Sin cita que coincida, la pregunta sigue en `borrador`.
   - Un segundo modelo resuelve sin ver la clave. Si no coinciden, la pregunta va a revisión.
   - Chequeos automáticos de calidad:
     - Posición de la clave balanceada entre a, b, c y d.
     - La correcta no es sistemáticamente la opción más larga.
     - Proporción de "EXCEPTO" parecida a la de las oficiales.
     - Detección de duplicados y casi duplicados.
   - El OCR limpiado por Haiku pasa un diff que verifica que **se conservan todas las cifras**.
   - Lo normativo se marca `vigencia: por_verificar`, porque el manual usa terminología anterior a 2014 y la bibliografía exige leyes vigentes. Las cifras clave se contrastan con la ley vigente cuando sea posible.
   - **Botón "reportar esta pregunta"** dentro del quiz. Cesar solo revisa lo reportado o dudoso y una muestra, no las ~1,500.
6. Solo las preguntas `validada` entran al simulacro. Un tablero muestra la cobertura por área, subtema y objetivo.

---

## 6. Etapas (cortes verticales por área)
En lugar de terminar cada capa para todas las áreas, se construye **un área completa de punta a punta** y luego se replica. Así Cesar obtiene valor desde los primeros días.

### E0. Fundaciones y entrega a Windows (Sonnet)
- Partir de `main`. Crear `README`, `CLAUDE.md` (protocolo, convenciones, modelos), `.gitignore` y la exclusión de `ECC/` y `graphify/`.
- Esqueleto de Electron + React + TS. **Spike de la base de datos y ADR.** Base de seguridad de Electron.
- **CI en GitHub Actions**: pruebas en Linux e **instalador de Windows** como artefacto descargable.
- Instalar lo necesario de ECC, las skills de Emil y Playwright. Hook de inicio de sesión (`session-start-hook`) para que cada sesión instale y pruebe.
- **Terminado**: Cesar descarga el instalador desde GitHub, lo abre en Windows y ve la pantalla inicial.

### E1. Práctica inmediata: "M1 — Practicar ya" (Sonnet y Opus)
- **Identidad visual (alcance reducido)**:
  - Tema **Terminal** estilo Bloomberg: fondo casi negro, acentos ámbar y naranja, verde y rojo, cifras monoespaciadas y tabulares, alta densidad.
  - Prototipos en 2–3 versiones de **2 pantallas**: **Dashboard** y **Pregunta**. Cesar elige.
  - Tokens de diseño con paleta validada (`dataviz`, contraste AA).
- **Parsers con TDD**:
  - Temario a `taxonomia.json` (conteos verificados).
  - Preguntas Tipo con la regla "texto en negritas > letra en negritas", marcando conflictos; la prueba fija las 44 claves.
  - Ética: 31 preguntas con su tabla de respuestas.
  - Repasos a `borrador`.
- **Pantallas mínimas**:
  - **Onboarding**: fecha del examen, modo intensivo, ligero o personalizado, y autoevaluación. Genera un plan diario v1.
  - Práctica por área y tema, con retroalimentación.
  - **Examen diagnóstico inicial** con lo disponible.
  - Dashboard por área con la meta de 75%.
  - Botón "reportar".
  - Tarjetas básicas.
- **Terminado**: Cesar practica las 75 preguntas oficiales en la app instalada y ve su progreso por área.

### E2. Corte vertical 1: Títulos de Deuda completo (Opus redacta, Sonnet construye)
- **Banco**:
  - Piloto de 30 preguntas, con medición de costo.
  - Ajuste de la guía de redacción.
  - Banco completo de Deuda: teoría, más plantillas de cálculo con pruebas, más tarjetas.
- **Guía de Deuda en láminas**:
  - Migrar las notas de Cesar a láminas y terminar la sección inconclusa de subastas.
  - Visor de láminas a pantalla completa con navegación por teclado.
  - Debajo de cada lámina, dos paneles:
    - **Notas de Cesar**: editables, se guardan solas y aparecen en las exportaciones.
    - **Explicación ampliada**: el texto detallado y la cita al manual.
  - Bloques `:::ficha` y `:::resumen` con la paleta de sus apuntes: morado `7030A0` para títulos, rojo `C00000` para términos, rojo vivo para excepciones y verde para resúmenes.
  - Cada lámina enlaza a sus preguntas ("practicar esta lámina"), a sus videos y a las láminas relacionadas.
  - Se prototipan 2–3 diseños de lámina (más visual, más denso, ficha tipo terminal) para que Cesar elija.
- **Mapas conceptuales de Deuda**:
  - Contenido: jerarquía de instrumentos, subasta de CETES, cadena reporto → premio → precio de salida, ventanas de liquidación.
  - Se presentan 2–3 formatos para que Cesar elija.
- **Exportación**:
  - **Word**: la guía completa o por sección, con mapas en PNG, índice, tablas y las notas de Cesar.
  - **PowerPoint** (`pptxgenjs`): las láminas como diapositivas y las notas como notas del orador. Sale de la misma fuente, por eso se adelanta a E2.
- **Modo por módulo**: simulacro de Deuda de 25 preguntas con ~31 min.
- **Modo con IA v1**:
  - Capa `ProveedorIA` y conexión a OmniRoute.
  - Tutor anclado a la lámina.
  - Preguntas extra en vivo, marcadas como no validadas.
  - Regreso automático al modo sin internet si OmniRoute no responde.
- **Videos de Deuda**: primeros enlaces verificados por subtema y la opción de que Cesar agregue los suyos.
- **Diagnóstico v1**: dominio por subtema de Deuda, teoría frente a cálculo, errores frecuentes y botón "practicar esto".
- **Terminado**: Cesar estudia Deuda de punta a punta (guía, mapa, práctica, diagnóstico, módulo, Word) y aprueba el formato. **Esta es la plantilla para las demás áreas.**

### E3. Cortes 2–4: Ética, Mercado de Capitales, Derivados y Riesgos
- Se repite la receta de E2 en las otras tres áreas obligatorias, con lo aprendido.
- **Simulacro modular extraordinario**: solo áreas obligatorias.
- **Terminado**: las 4 obligatorias tienen banco para ≥3 simulacros sin repetir, guía, mapas y diagnóstico.

### E4. Motor completo y simulacro integral
- Selector adaptativo global, Leitner, plan de estudio por días hasta la fecha del examen, y probabilidad de aprobar con Monte Carlo.
- **Simulacro integral**:
  - 210 preguntas con la distribución oficial y 4 h 18 min.
  - Marcar para revisar; sin retroalimentación hasta el final.
  - **Boleta** estilo reporte financiero: puntaje por área, pase por las dos reglas, tiempos e historial.
- Pruebas con **estudiantes sintéticos**: el motor debe detectar debilidades programadas.
- **Terminado**: simulacro integral E2E y las proyecciones tienen sentido con datos sintéticos.

### E5. Cortes 5–9: áreas no obligatorias
Servicios de Inversión, Marco Normativo, Matemáticas y Portafolios, Fondos, y Análisis Económico/Financiero/Técnico.

### E6. Extensiones
- Tema **Editorial** estilo FT: fondo salmón `#FFF1E5` y titulares serif.
- Mejoras del tutor IA y de la biblioteca de videos según el uso real.

### Hitos y calendario (examen en 1–2 meses)
El cuello de botella es generar y validar contenido, no el código. Por eso **las áreas obligatorias van primero** y lo no obligatorio puede quedar con menos profundidad si el tiempo aprieta.

| Hito | Etapas | Meta | Qué obtiene Cesar |
|---|---|---|---|
| M1 | E0–E1 | Semana 1 | App instalada, onboarding (intensivo o ligero), práctica con las 75 preguntas oficiales, diagnóstico |
| M2 | E2 | Semana 2 | Deuda completa: láminas, notas, mapas, banco, diagnóstico, Word y PowerPoint, modo IA |
| M3 | E3 | Semanas 3–4 | Las 4 obligatorias listas y simulacro modular |
| M4 | E4 | Semana 4–5 | Simulacro integral, plan diario y probabilidad de aprobar |
| M5 | E5–E6 | Semanas 5–7 | Áreas no obligatorias y extensiones |

Las fechas son metas y dependen del tiempo de sesión disponible y de las revisiones de Cesar. Si la fecha del examen se acerca, se recorta E5–E6 y no se recortan las obligatorias.

---

## 7. Riesgos
| Riesgo | Mitigación |
|---|---|
| Preguntas con errores | Cita textual verificada por script, doble resolución, chequeos automáticos, botón de reportar, solo `validada` en simulacro |
| Normativa vieja (manuales 2012–2023) | `vigencia: por_verificar` por omisión y contraste de cifras clave con la ley vigente |
| Claves de Preguntas Tipo inconsistentes | Regla de prioridad, conflictos marcados y pruebas fijas |
| Banco más difícil que el examen real | `es_trampa` separado y calibración contra las preguntas oficiales |
| Escala 200–1100 desconocida | Mostrar % con banda primero; meta conservadora de 75%; conversión configurable |
| Módulos nativos en Windows | Base sin módulo nativo e instalador compilado en Actions |
| Costo y tiempo de generar ~1,500 preguntas | Medir en el piloto y avanzar por áreas obligatorias |
| Cesar no puede validar lo que está aprendiendo | La validación es automática con citas; él solo revisa lo reportado |
| Electron no se ve desde la nube | Capturas con Playwright e instalador en cada hito |
| OneDrive bloquea `.git` | Mover el proyecto a `C:\Dev\AMIB` |

---

## 8. Verificación
- **Unitarias (`core/` ≥80%)**:
  - Distribución de 210 y reglas de pase.
  - Conversión de escala y Beta/Leitner.
  - Selector sin repetición y semillas reproducibles.
  - Plantillas contra las 7 preguntas oficiales de cálculo.
- **Parsers**: 44 claves con 6 conflictos resueltos, 31 de Ética y conteos del temario.
- **Contenido**: `validate:content`, que revisa esquemas, IDs estables, cita textual existente, duplicados y balance de claves.
- **E2E (Playwright)**: diagnóstico → práctica → progreso → módulo → boleta → exportar a `.docx` (se abre y se valida).
- **Revisión**: `code-reviewer` y `security-reviewer` de ECC, más una crítica con Opus en cada etapa.
- **Aceptación**: Cesar instala desde Actions y sigue una lista guiada en cada hito.

---

## 9. Decisiones de Cesar y preguntas pendientes
**Ya decidido:**
- Examen en 1–2 meses. La intensidad (intensivo, ligero o personalizado) se elige en el onboarding.
- Dos modos: sin internet y con IA mediante modelos gratuitos (OmniRoute).
- Guías como láminas con notas debajo, no Obsidian.
- Videos de YouTube por tema, que crecen con cada sesión.
- Notas de workflow vivas para mejorar la eficiencia.
- Nunca ha presentado el examen: meta conservadora de ≥75% por área obligatoria.

**Pendiente, con respuesta por omisión** (se confirma en el camino):
- P0. OmniRoute: por omisión se integra y se documenta cómo instalarlo en Windows. Cesar crea las cuentas de los proveedores gratuitos que quiera.
- P5. Guías de las 8 áreas sin notas: por omisión las redacto yo con tu formato y tú las revisas.
- P6. Preguntas 37–44 (MexDer/SENTRA): por omisión se guardan como "extra", fuera del simulacro.
- P7. `open-exam-prep.com` y otros simuladores: por omisión no se usan, salvo que tú aportes material legítimo.
- P8. Calculadora: por omisión se asume la HP-17bII, con teclas en las explicaciones.
- P9. Meta de "listo": por omisión ≥75% de aciertos por área obligatoria.
- P10. `ECC/` y `graphify/`: por omisión se quedan en el repo, excluidos de la compilación.
