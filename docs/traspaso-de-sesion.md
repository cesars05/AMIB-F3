# Traspaso de sesión (léase primero en una conversación nueva)

Este documento permite continuar el proyecto en una sesión nueva de Claude sin perder contexto ni calidad. Se actualiza en cada hito. Última actualización: 2026-10-15, mejora de UX y generación de áreas pendientes.

## 1. Cómo arrancar una sesión nueva
1. Abrir una sesión sobre el repositorio `cesars05/AMIB-F3`, rama `claude/trusting-ptolemy-io4gmo` (o la rama que indique la sección 6).
2. Primer mensaje sugerido: "Lee `docs/traspaso-de-sesion.md`, `CLAUDE.md`, `docs/plan-maestro.md`, `docs/bitacora.md` y `docs/mapa-del-repo.md`, y continúa con los pendientes de la sección 6."
3. `CLAUDE.md` se carga automáticamente y contiene el protocolo de trabajo, las reglas de estilo y las lecciones aprendidas. El hook de inicio instala las dependencias.

## 2. Objetivo del proyecto
App de escritorio para Windows (Electron, React, TypeScript, `node:sqlite`) para preparar el examen **AMIB Figura 3, Asesor en Estrategias de Inversión (Serie 210)**: 210 preguntas, 4 h 18 min, escala de 200 a 1100, aprobatorio 600, y 600 obligatorio en Ética, Mercado de Capitales, Títulos de Deuda y Derivados y Riesgos. Cesar presenta el examen en uno o dos meses.

## 3. Decisiones de Cesar (no se reabren sin preguntarle)
1. App local de escritorio (Electron + React + SQLite), con instalador de Windows compilado en GitHub Actions.
2. La app abre en **Inicio**, un hub de secciones (Sesión de hoy, Practicar, Diagnóstico, Simulacro, Guías, Tarjetas, Videos, Ajustes). Nunca abre directo en un examen.
3. **Tema Claro por omisión** (blanco, sobrio, estilo semanario económico). Terminal, Editorial y Enfoque se eligen en Ajustes. La letra se elige entre Arial, Calibri y Segoe UI.
4. **Primero se aprende y luego se evalúa.** Hay cuatro modos:
   1. Lección guiada: explicación por partes, puntos clave, práctica guiada y mini examen.
   2. Repaso rápido: lo importante para hoy.
   3. Repaso completo desde cero: en el orden del manual.
   4. Evaluación directa.
5. **Dominio exigente** en cinco niveles: Sin ver, Visto, Familiar, Competente y Dominado. Acertar una vez nunca es dominar. Para subir de nivel se requieren sesiones distintas y preguntas más difíciles. El nivel decae con el olvido.
6. **Memoria del estudiante**: el sistema recuerda fallos, temas no vistos, tiempos por pregunta, dominados y no dominados, y los muestra en gráficas desde el Inicio.
7. **Preguntas difíciles y con trampas.** Las opciones se barajan siempre, con la posición de la clave equilibrada. Los problemas numéricos se muestran **con 4 decimales**.
8. **Fórmulas como matemáticas, en dos pasos**: primero la fórmula con símbolos y una leyenda, y luego con los valores sustituidos y el resultado.
9. **Nivel de detalle de examen.** Por ejemplo: el proceso completo de emisión y subasta de CETES.
10. **Fuente principal: `AMIB Data/AMIB_1_completo.md`.** El manual 2023 y las notas de Cesar (`AMIB Fig 3_vf.docx`) solo complementan. El orden de los temas sigue al manual.
11. **Antes de preguntarle algo a Cesar se consulta el manual.** Solo se le pregunta lo que el manual no resuelve.
12. **Estilo de redacción académico**: sin guiones largos, sin guiones ni puntos como viñetas, sin el símbolo de grado ni asteriscos (ver `CLAUDE.md`).
13. **Modo con IA opcional** mediante OmniRoute (modelos gratuitos, `http://localhost:20128/v1`) y modo sin internet por omisión.
14. Las guías se presentan como láminas con notas debajo (no Obsidian) y se exportan a Word y PowerPoint.
15. Videos de YouTube por tema, verificados, que crecen con cada sesión.
16. Las dudas no resueltas se documentan en `docs/dudas-v2.md` para resolverlas en la v2.

## 4. Estado actual (2026-10-15)

**Etapa: Generación de áreas no obligatorias.** Se ha completado la mejora de UX basada en Apple Design y se está generando contenido para las 5 áreas pendientes.

**Hecho y en GitHub (rama `claude/trusting-ptolemy-io4gmo`, CI en verde):**

### Mejoras de UX (2026-10-15)
1. **Tokens de diseño mejorados** (`app/src/renderer/src/estilos/tokens.css`):
   - Sombras escalonadas: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`
   - Sombras específicas por componente: botón, tarjeta, dropdown, modal, kpi
   - Curvas de animación: `--ease`, `--ease-out`, `--ease-in`, `--ease-in-out`
2. **Componentes mejorados** (`app/src/renderer/src/estilos/componentes.css`):
   - Botones con sombras y efectos de hover: `--shadow-btn`, `--shadow-btn-hover`, `--shadow-btn-active`
   - Paneles con efectos de profundidad al hacer hover
   - Tarjetas de sección con elevación y feedback visual
   - KPIs con hover suave
3. **Animaciones nuevas** (`app/src/renderer/src/estilos/base.css`):
   - `entrada-escala`: Fade + scale para componentes
   - `fade-in`: Transición de opacidad suave
   - `entrada-deslizar`: Deslizamiento lateral

### Estado del contenido (2026-10-15)
1. App Electron v1 completa:
   - Pantallas: onboarding, Inicio con perfil y gráficas, lecciones guiadas con notas por lámina y KaTeX local, Practicar, Diagnóstico, Simulacro (integral, módulo, modular extraordinario y rápido) y Ajustes (4 temas, 3 letras, respaldo JSON).
   - Seguridad endurecida tras una revisión independiente.
   - Instalador de Windows como artefacto de GitHub Actions.
2. Motor en `app/src/core/`: examen, barajado equilibrado, dominio en 5 niveles, perfil, Leitner, selector, simulacros y plan diario. Más de 390 pruebas unitarias y 13 E2E.
3. Contenido:
   - Taxonomía de 465 objetivos.
   - 413 secciones del manual vinculadas al temario.
   - 75 preguntas oficiales.
   - 146 preguntas de repaso, con la clave del libro (p. 359) donde se pudo alinear.
   - **32 lecciones y 480 preguntas generadas en las cuatro áreas obligatorias**: Ética 6 lecciones, Capitales 7, Deuda 8, Derivados y Riesgos 11.
   - Unas 560 preguntas validadas en total.
4. Documentación:
   - Plan maestro y ADR-001 y ADR-002.
   - Investigación de la estructura de las preguntas AMIB.
   - Plantillas de los agentes redactores (`docs/prompts/`).
   - Dudas consolidadas en `docs/dudas-v2.md`.
   - Mejoras de UX documentadas en `docs/fichas/mejoras-ux-apple.md`.

### Generación en curso (2026-10-15)
**Áreas pendientes (5):**
1. **Servicios de Inversión** (en generación): 5-6 lecciones, ~150 preguntas
2. **Marco Normativo** (I-III): 11-12 lecciones, ~200 preguntas (se divide en 2 agentes)
3. **Matemáticas y Portafolios**: 6-7 lecciones, ~200 preguntas (60% cálculo)
4. **Fondos de Inversión**: 5-6 lecciones, ~150 preguntas (precios a 6 decimales)
5. **Análisis Económico, Financiero y Técnico**: 7-8 lecciones, ~200 preguntas

**Comandos para regenerar:**
```bash
cd docs/prompts && python asignaciones-areas-no-obligatorias.py
# Genera prompts:
# - prompt-servicios.txt
# - prompt-normativo-a.txt (capítulo 3, primera mitad)
# - prompt-normativo-b.txt (capítulo 3, segunda mitad)
# - prompt-matematicas.txt
# - prompt-fondos.txt
# - prompt-analisis.txt
```

**Incompleto (no subido):** las lecciones de Servicios de Inversión, Marco Normativo, Matemáticas, Fondos y Análisis quedaron a medias en disco cuando se alcanzó el límite de gasto mensual de la API. Se regeneran con `docs/prompts/`.

## 5. Convenciones de trabajo
1. Protocolo "pensar antes de hacer" y uso de modelos: Opus redacta contenido y diseña; Sonnet programa con TDD; Haiku hace tareas masivas.
2. Los subagentes trabajan en archivos separados y no hacen commit. El agente principal verifica (`npm test`, `npm run typecheck`, `npm run validate:content`) y hace commit y push.
3. La bitácora (`docs/bitacora.md`) y el mapa (`docs/mapa-del-repo.md`) se actualizan al cerrar cada tarea.
4. Las capturas de pantalla se hacen con Playwright y el Chromium de `/opt/pw-browsers`. La red de la sesión bloquea cdnjs, así que MathJax se sirve localmente desde npm en las pruebas.

## 6. Pendientes (orden sugerido)
1. Lecciones de las cinco áreas no obligatorias (con las plantillas de `docs/prompts/`), validar con `npx tsx tools/validar-lecciones.ts` y `npm run validate:content`, y subir.
2. Resolver con Cesar las dudas de `docs/dudas-v2.md` y aplicar sus respuestas.
3. Publicar un GitHub Release (enlace fijo al instalador) y, si Cesar lo pide, un Pull Request hacia `main`.
4. Tarjetas (flashcards) a partir de los puntos clave de las lecciones, con repetición Leitner.
5. Plantillas de cálculo paramétricas con 4 decimales, para no repetir preguntas numéricas.
6. Exportación de las lecciones a Word y PowerPoint, con las notas de Cesar.
7. Modo con IA (OmniRoute) y biblioteca de videos.
8. Fase de diseño visual, que debe quedar menos plano, con las skills de diseño.
