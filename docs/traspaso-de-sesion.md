# Traspaso de sesión (léase primero en una conversación nueva)

Este documento permite continuar el proyecto en una sesión nueva de Claude sin perder contexto ni calidad. Se actualiza en cada hito. Última actualización: 2026-10-14, v1 en construcción.

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

## 4. Estado actual
**Hecho y en GitHub:**
1. E0 completo:
   1. Esqueleto Electron con seguridad.
   2. Base de datos `node:sqlite` (ADR-001).
   3. CI e instalador de Windows como artefacto.
   4. Skills de diseño de Emil Kowalski y agentes de ECC en `.claude/`.
2. Núcleo:
   1. `core/examen.ts`: reglas oficiales.
   2. `core/contenido.ts`: esquemas.
   3. `core/barajar.ts`: barajado equilibrado.
   4. `core/leccion.ts`: esquema de lecciones con bloques estructurados y regla de estilo.
3. Contenido:
   1. Taxonomía de 465 objetivos.
   2. 75 preguntas oficiales validadas (44 tipo y 31 del ensayo de Ética).
   3. 413 secciones del manual vinculadas al temario.
   4. 130 preguntas de repaso.
   5. 175 claves oficiales de los repasos (`content/claves/respuestas-libro-amib1.json`, página 359 del PDF).
4. Prototipos aprobados en `docs/prototipos/`: Pregunta, Inicio (4 temas) y Lección CETES. Este último es la referencia de formato.
5. Investigación de la estructura de las preguntas AMIB: `docs/investigacion/estructura-preguntas-amib.md`.
6. Arquitectura de la app v1: `docs/decisiones/ADR-002-arquitectura-app-v1.md`.

**En curso al momento de escribir esto** (si la sesión se cortó, verificar con `git status` y `git log`):
1. Aplicación de las claves oficiales a los repasos, alineadas por número del libro, y validador de estilo en `tools/validar.ts`.
2. Lecciones 1 a 8 de Títulos de Deuda en `content/lecciones/deuda/` y sus preguntas generadas en `content/preguntas/generadas/`. Se validan con `npx tsx tools/validar-lecciones.ts`.
3. Motor de estudio en `app/src/core/`: intentos, dominio, perfil, Leitner, selector, simulacro y plan.

## 5. Convenciones de trabajo
1. Protocolo "pensar antes de hacer" y uso de modelos: Opus redacta contenido y diseña; Sonnet programa con TDD; Haiku hace tareas masivas.
2. Los subagentes trabajan en archivos separados y no hacen commit. El agente principal verifica (`npm test`, `npm run typecheck`, `npm run validate:content`) y hace commit y push.
3. La bitácora (`docs/bitacora.md`) y el mapa (`docs/mapa-del-repo.md`) se actualizan al cerrar cada tarea.
4. Las capturas de pantalla se hacen con Playwright y el Chromium de `/opt/pw-browsers`. La red de la sesión bloquea cdnjs, así que MathJax se sirve localmente desde npm en las pruebas.

## 6. Pendientes (orden sugerido)
1. Integrar y subir los trabajos en curso de la sección 4.
2. Construir las pantallas reales según ADR-002:
   1. Onboarding.
   2. Inicio con perfil y gráficas.
   3. Lección.
   4. Practicar.
   5. Diagnóstico.
   6. Simulacro.
   7. Ajustes con temas y letra.
3. Agregar KaTeX local.
4. Lecciones de las otras tres áreas obligatorias: Ética, Mercado de Capitales y Derivados y Riesgos. Después, el resto.
5. Plantillas de cálculo paramétricas con 4 decimales.
6. Exportación a Word y PowerPoint.
7. Modo con IA (OmniRoute) y biblioteca de videos.
8. Fase de diseño visual, que debe quedar menos plano.
9. Mantener `docs/dudas-v2.md` al día.
