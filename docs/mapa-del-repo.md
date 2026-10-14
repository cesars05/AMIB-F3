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
| `tsconfig.node.json` / `tsconfig.web.json` | Tipos del proceso principal (incluye `tools/**`) y del renderer. `core` está en ambos |
| `vitest.config.ts` | Pruebas unitarias en `app/src/**` y `tools/**`. Pide cobertura ≥80% en `core` |
| `electron-builder.yml` | Instalador NSIS de Windows, que solo empaqueta `out/` |
| `.github/workflows/ci.yml` | Pruebas en Linux (typecheck, unitarias, E2E con captura) y luego el instalador de Windows como artefacto |
| `.claude/settings.json` + `.claude/hooks/session-start.sh` | Al iniciar una sesión en la nube, instala dependencias |
| `skills-lock.json` | Registro de las skills de Emil Kowalski instaladas. Lo usa `npx skills update` |

## Contenido (`tools/` → `content/`)
`content/` es la fuente de verdad versionada y se **genera** desde `AMIB Data/`. No se edita a mano: se corrige el parser (o el dato fuente) y se regenera con `npm run content:build`. `npm run validate:content` lo valida con los esquemas de `app/src/core/contenido.ts`.

| Ruta | Qué es | Notas |
|---|---|---|
| `tools/docx.ts` | Lector mínimo de `.docx` (JSZip + expresiones regulares sobre `word/document.xml`): bloques de párrafos y tablas con *runs* y negritas | Supone tablas no anidadas y negritas en `w:b` del *run*. Ambas cosas se verificaron en los `.docx` actuales |
| `tools/texto.ts` | `slug`, `colapsar` (espacios/NBSP/saltos), `clave` | Los ids salen de `slug` (sin acentos) |
| `tools/parse-temario.ts` | Temario `.docx` → `content/taxonomia.json` | 22 materias, 76 subtemas, 465 objetivos. Ver gotchas abajo |
| `tools/parse-preguntas-tipo.ts` | `Preguntas Tipo.docx` → `content/preguntas/oficial/preguntas-tipo.json` | 44 preguntas, ids `tipo.NN`. Clave = texto en negritas |
| `tools/parse-ensayo-etica.ts` | "Ensayo de examen" del manual de Ética → `content/preguntas/oficial/etica-ensayo.json` | 31 preguntas, ids `etica-ensayo.NN`; clave de la tabla "Sección de respuestas" |
| `tools/validar.ts` | Validación pura: esquemas, ids únicos globales, `subtemaId`/`objetivoId` existentes y resumen | Las preguntas se reconocen por estar bajo `content/preguntas/` |
| `tools/construir.ts` | Orquesta los parsers (sin escribir a disco) | Lo usan `build-content.ts` y su prueba |
| `tools/build-content.ts` / `validate-content.ts` | Scripts de `npm run content:build` / `validate:content` | `generado` es la fecha del día (AAAA-MM-DD); el resto de la salida es determinista |
| `content/taxonomia.json` | Taxonomía de 9 áreas → materias → subtemas → objetivos | `exclusivoFig3` está en `false` en todo (TODO) |
| `content/preguntas/oficial/` | Preguntas oficiales de ejemplo y ensayo de Ética | 75 preguntas, todas `validada` |

Gotchas de los parsers:
- **"~540 objetivos" eran filas, no objetivos.** La tabla del temario tiene 541 filas con texto: 465 objetivos y 76 encabezados de subtema. Un objetivo es lo que inicia con verbo en infinitivo (`-ar/-er/-ir`); lo demás es encabezado.
- **`tipo` de los objetivos:** `calculo` solo con `calcular`/`resolver` o si el texto dice cálculo/fórmula (49 objetivos). `interpretar` y `determinar` son conceptuales y quedan en `teoria`.
- **Materias con espacios dobles** ("Marco  Normativo II"): se colapsan antes de generar nombres e ids. Los objetivos antes de un encabezado van a un subtema `General`.
- **Preguntas Tipo mezcla tablas y párrafos sueltos** (las 37–44 no están en tablas). Por eso el parser aplana todo a líneas y usa una máquina de estados. Los encabezados de sección a veces van en la celda 2 de una tabla de 129 filas, y una opción puede llamarse igual que una sección ("Fondos de Inversión" en la q14): un encabezado solo cuenta si la pregunta en curso ya tiene texto en su campo.
- **Conflictos letra/texto: son 6** (q1, 4, 10, 17, 22, 32), no 7. La q34 no tiene conflicto. Las q5, 9 y 31 traen negritas solo en el texto (la letra no), sin conflicto. Las 44 claves por texto coinciden con el fixture de `parse-preguntas-tipo.test.ts`.
- **Cálculo en Preguntas Tipo:** el enunciado tiene al menos dos cifras (q10, 11, 16, 19, 23, 24, 29, 30). Una sola cifra (q31, "95%") no basta.
- **Duplicados:** las q25–28 de Preguntas Tipo (Ética) están copiadas en el ensayo (q1, 12, 15, 19) con la misma clave. Se conservan y el ensayo lleva `duplicado de tipo.NN`.
- **Marcadores de página del manual de Ética:** `<!-- pag. N del PDF -->` va al **final** de la página N. La página de una pregunta es el marcador anterior + 1 (`PAGINA_SIGUIENTE_AL_MARCADOR`).
- **Extras:** las 8 preguntas de MexDer y de concertación en el mercado de capitales (q37–44) llevan `extra: true` y `seccionOriginal`; no entran al simulacro.

## Herramientas de Claude
Ver `docs/herramientas.md`. Resumen:
- `.claude/skills/`: 12 skills de diseño de Emil Kowalski y 5 de ECC.
- `.claude/agents/`: 9 agentes de ECC.
- `.claude/rules/ecc/`: reglas `common`, `typescript`, `web` y `react`.

## Material de estudio (`AMIB Data/`, no se modifica)
| Archivo | Qué es | Trampas |
|---|---|---|
| `Examen Integral Asesor en Estrategias de Inversión.docx` | Temario oficial: 465 objetivos de aprendizaje bajo 76 encabezados de subtema | No da pesos por debajo del nivel área |
| `Preguntas Tipo.docx` | 44 preguntas de ejemplo; la clave está en negritas | 6 conflictos entre letra y texto en negritas (q1, 4, 10, 17, 22, 32): **manda el texto**. Las preguntas 37–44 no son de la Serie 210 |
| `Manual_EBSPMV_completo.md` | Manual de Ética limpio, con marcadores `<!-- pag. N del PDF -->` | El "Ensayo de examen" tiene 31 preguntas con tabla de respuestas. Sus q1, 12, 15 y 19 repiten las q25–28 de Preguntas Tipo |
| `AMIB_1_completo.md` | OCR del manual oficial (360 pp). Los objetivos van en `####` | OCR ruidoso: numeración rota (`6.14` = `6.4`) y tablas deformes. Los repasos están en `N.N. REPASO DEL CAPÍTULO`, sin clave. Usa el término anterior a 2014 "sociedades de inversión" |
| `702510249-Manual…2023.pdf` | Manual de terceros con capa de texto (`pdftotext -layout`) | Los repasos (`Repaso`, ~141 preguntas) no traen clave; las opciones no están marcadas |
| `AMIB Fig 3_vf.docx` | Notas de Cesar sobre Títulos de Deuda (versión final) | El formato está en colores de *run*, no en estilos: morado `7030A0` para títulos, rojo `C00000` para términos, verde `3A7C22` para resúmenes |
| `Bibliografía por Materia.docx` | Bibliografía por área | Exige leyes vigentes |
| `Caso_Practico_Bienes_Raices.xlsx` | Otro curso | Se ignora |

## Herramientas de terceros en el repo
- `ECC/` (Everything Claude Code v2.2.3) y `graphify/`: solo son fuentes. No se compilan ni se modifican.
