# Mapa del repositorio

Qué hay en cada lugar, cómo funciona y sus trampas. Se actualiza al cerrar cada tarea.

## App
| Ruta | Qué es | Notas |
|---|---|---|
| `app/src/main/index.ts` | Proceso principal: ventana, seguridad, IPC (`app:info`), abre la base de datos | ESM. `__dirname` se obtiene de `import.meta.url`. El preload se carga como `../preload/index.cjs` |
| `app/src/main/db.ts` | Capa de datos con `node:sqlite` y migraciones | Solo se agregan migraciones al final del arreglo `MIGRACIONES` |
| `app/src/preload/index.ts` | Expone `window.amib` con el mínimo de funciones | Se compila a CJS porque corre con sandbox |
| `app/src/preload/api.d.ts` | Tipos compartidos de la API (`InfoApp`, `ApiAmib`) | El renderer los importa como tipo |
| `app/src/renderer/` | Interfaz React + Tailwind v4 | CSP en `index.html`. Los tokens del tema están en `src/styles.css` (`@theme`) |
| `app/src/core/examen.ts` | Estructura oficial (9 áreas, 210 preguntas, 258 min), escala estimada 200–1100 y `dictaminar()` con las dos reglas de pase | Alias `@core/*`. La escala es un supuesto configurable (`aciertosEn600`) |
| `e2e/app.spec.ts` | E2E con Electron real; guarda la captura en `test-results/` | En Linux corre con `npm run e2e:linux` (xvfb) |

## Configuración
| Archivo | Qué es |
|---|---|
| `electron.vite.config.ts` | Builds de main, preload (CJS) y renderer (React + Tailwind) |
| `tsconfig.node.json` / `tsconfig.web.json` | Tipos del proceso principal y del renderer. `core` está en ambos |
| `vitest.config.ts` | Pruebas unitarias en `app/src/**` y `tools/**`. Pide cobertura ≥80% en `core` |
| `electron-builder.yml` | Instalador NSIS de Windows, que solo empaqueta `out/` |
| `.github/workflows/ci.yml` | Pruebas en Linux (typecheck, unitarias, E2E con captura) y luego el instalador de Windows como artefacto |
| `.claude/settings.json` + `.claude/hooks/session-start.sh` | Al iniciar una sesión en la nube, instala dependencias |
| `skills-lock.json` | Registro de las skills de Emil Kowalski instaladas. Lo usa `npx skills update` |

## Herramientas de Claude
Ver `docs/herramientas.md`. Resumen:
- `.claude/skills/`: 12 skills de diseño de Emil Kowalski y 5 de ECC.
- `.claude/agents/`: 9 agentes de ECC.
- `.claude/rules/ecc/`: reglas `common`, `typescript`, `web` y `react`.

## Material de estudio (`AMIB Data/`, no se modifica)
| Archivo | Qué es | Trampas |
|---|---|---|
| `Examen Integral Asesor en Estrategias de Inversión.docx` | Temario oficial, con ~540 objetivos de aprendizaje | No da pesos por debajo del nivel área |
| `Preguntas Tipo.docx` | 44 preguntas de ejemplo; la clave está en negritas | 7 conflictos entre letra y texto en negritas: **manda el texto**. Las preguntas 37–44 no son de la Serie 210 |
| `Manual_EBSPMV_completo.md` | Manual de Ética limpio, con marcadores `<!-- pag. N del PDF -->` | El "Ensayo de examen" tiene 31 preguntas con tabla de respuestas |
| `AMIB_1_completo.md` | OCR del manual oficial (360 pp). Los objetivos van en `####` | OCR ruidoso: numeración rota (`6.14` = `6.4`) y tablas deformes. Los repasos están en `N.N. REPASO DEL CAPÍTULO`, sin clave. Usa el término anterior a 2014 "sociedades de inversión" |
| `702510249-Manual…2023.pdf` | Manual de terceros con capa de texto (`pdftotext -layout`) | Los repasos (`Repaso`, ~141 preguntas) no traen clave; las opciones no están marcadas |
| `AMIB Fig 3_vf.docx` | Notas de Cesar sobre Títulos de Deuda (versión final) | El formato está en colores de *run*, no en estilos: morado `7030A0` para títulos, rojo `C00000` para términos, verde `3A7C22` para resúmenes |
| `Bibliografía por Materia.docx` | Bibliografía por área | Exige leyes vigentes |
| `Caso_Practico_Bienes_Raices.xlsx` | Otro curso | Se ignora |

## Herramientas de terceros en el repo
- `ECC/` (Everything Claude Code v2.2.3) y `graphify/`: solo son fuentes. No se compilan ni se modifican.
