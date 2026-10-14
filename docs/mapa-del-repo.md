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
| `tools/parse-manual.ts` | `AMIB_1_completo.md` (OCR) → capítulos y secciones (`SeccionManual`): numeración normalizada, páginas, cuerpo crudo, Fig. 3 y bloque de repaso | Numeración por programación dinámica sobre el orden del documento (ver gotchas). 413 secciones: 351 `####` + 61 recuperadas + el formulario |
| `tools/similitud.ts` | Similitud de texto tolerante a OCR (tokens sin acentos ni palabras vacías, ponderados por rareza, coincidencia difusa) | Pura. La usa `vincular-manual.ts` |
| `tools/vincular-manual.ts` | Vincula cada sección con su objetivo del temario (mismo área del capítulo) y marca `exclusivoFig3` en la taxonomía | Umbral 0.55 (`UMBRAL_VINCULO`); alta ≥ 0.8. Por debajo, `objetivoId: null` pero se guarda `objetivoCandidato` |
| `tools/parse-repaso.ts` | Preguntas de `N.N. REPASO DEL CAPÍTULO` → borradores sin clave (`manual-repaso.cNN.qNN`) | Solo acepta preguntas con exactamente 4 opciones a–d; el resto se cuenta como omitida |
| `tools/manual-archivos.ts` | Escribe `content/manual/capNN/NN-<slug>.md` (frontmatter YAML + OCR crudo) y `indice.json` | `NN` es el ordinal de la sección en el capítulo; `build-content` borra y regenera la carpeta completa |
| `tools/parse-ensayo-etica.ts` | "Ensayo de examen" del manual de Ética → `content/preguntas/oficial/etica-ensayo.json` | 31 preguntas, ids `etica-ensayo.NN`; clave de la tabla "Sección de respuestas" |
| `tools/validar.ts` | Validación pura: esquemas, ids únicos globales, `subtemaId`/`objetivoId` existentes y resumen | Las preguntas se reconocen por estar bajo `content/preguntas/` |
| `tools/construir.ts` | Orquesta los parsers (sin escribir a disco) | Lo usan `build-content.ts` y su prueba |
| `tools/build-content.ts` / `validate-content.ts` | Scripts de `npm run content:build` / `validate:content` | `generado` es la fecha del día (AAAA-MM-DD); el resto de la salida es determinista |
| `content/taxonomia.json` | Taxonomía de 9 áreas → materias → subtemas → objetivos | `exclusivoFig3 = true` en 25 objetivos (los vinculados con confianza ≥ 0.55 a una sección exclusiva de la Figura 3 del manual); el resto en `false` |
| `content/preguntas/oficial/` | Preguntas oficiales de ejemplo y ensayo de Ética | 75 preguntas, todas `validada` |
| `content/preguntas/repasos/manual-amib1.json` | 130 preguntas de repaso de los capítulos 1–9 del manual | Todas `borrador`, `clave: null`, nota `sin clave: requiere resolución y validación`. 48 preguntas omitidas por OCR irrecuperable |
| `content/manual/indice.json` + `content/manual/capNN/*.md` | Índice (`SeccionManualSchema`) y una sección por archivo con el OCR crudo | El texto NO está limpio: es la materia prima de la etapa de limpieza |

Gotchas de los parsers:
- **"~540 objetivos" eran filas, no objetivos.** La tabla del temario tiene 541 filas con texto: 465 objetivos y 76 encabezados de subtema. Un objetivo es lo que inicia con verbo en infinitivo (`-ar/-er/-ir`); lo demás es encabezado.
- **`tipo` de los objetivos:** `calculo` solo con `calcular`/`resolver` o si el texto dice cálculo/fórmula (49 objetivos). `interpretar` y `determinar` son conceptuales y quedan en `teoria`.
- **Materias con espacios dobles** ("Marco  Normativo II"): se colapsan antes de generar nombres e ids. Los objetivos antes de un encabezado van a un subtema `General`.
- **Preguntas Tipo mezcla tablas y párrafos sueltos** (las 37–44 no están en tablas). Por eso el parser aplana todo a líneas y usa una máquina de estados. Los encabezados de sección a veces van en la celda 2 de una tabla de 129 filas, y una opción puede llamarse igual que una sección ("Fondos de Inversión" en la q14): un encabezado solo cuenta si la pregunta en curso ya tiene texto en su campo.
- **Conflictos letra/texto: son 6** (q1, 4, 10, 17, 22, 32), no 7. La q34 no tiene conflicto. Las q5, 9 y 31 traen negritas solo en el texto (la letra no), sin conflicto. Las 44 claves por texto coinciden con el fixture de `parse-preguntas-tipo.test.ts`.
- **Cálculo en Preguntas Tipo:** el enunciado tiene al menos dos cifras (q10, 11, 16, 19, 23, 24, 29, 30). Una sola cifra (q31, "95%") no basta.
- **Duplicados:** las q25–28 de Preguntas Tipo (Ética) están copiadas en el ensayo (q1, 12, 15, 19) con la misma clave. Se conservan y el ensayo lleva `duplicado de tipo.NN`.
- **Marcadores de página del manual de Ética:** `<!-- pag. N del PDF -->` va al **final** de la página N. La página de una pregunta es el marcador anterior + 1 (`PAGINA_SIGUIENTE_AL_MARCADOR`).
- **Manual `AMIB_1_completo.md`, numeración.** El OCR rompe los números (`1.14.4` = 1.1.4, `5.4` = 6.4, `B.3.8` = 8.3.8, `84.1.7` = 4.1.7, `3.0.4` = 3.9.4) y repite o desordena otros (`4.3.10` antes de `4.3.8`). `normalizarNumeracion` elige, para cada encabezado, el número `t.s` que minimiza ediciones + huecos con la restricción de que crezcan; el dígito del capítulo sale del `## Capítulo N`, nunca del OCR. `correccionNumero`: `ninguna`, `formato` (coma/letra/capítulo), `secuencia` (un dígito corregido, lectura única) o `dudosa` (26 secciones; hay otra lectura casi igual de buena: **no confíes en esos números**, ordena por posición en el documento). `numeroOriginal` conserva lo impreso.
- **Manual, encabezados perdidos.** 61 `####` se perdieron: quedan como línea `N.N.N. Identificar…`. Se recuperan solo si empiezan la línea, el primer grupo es el capítulo y siguen palabras (letras tipo dígito B/O/I/l/S y comas se toleran). Un candidato suelto que no cabe en la secuencia se descarta salvo que empiece con verbo de objetivo. **Faltan ~54 números en la secuencia** (encabezados sin ningún rastro, p. ej. 1.1.3, 2.1.9, 6.2.2): su texto queda dentro de la sección anterior.
- **Manual, páginas.** `<!-- page N -->` abre la página N del PDF (el pie "Pág. M" impreso va 2 menos). `paginas.fin` es la última página con texto: la 360 está vacía, así que el formulario termina en 359. Los capítulos comparten la página de arranque con el cierre del anterior.
- **Manual, Figura 3.** `exclusivoFig3` = la sección entera: el marcador "(INFORMACIÓN FIGURA 3)*" está en el encabezado del tema (3.15, 8.8, 8.11, 9.4, 9.6: vale hasta el siguiente tema) o en el de la sección (9.2.9–9.2.16 salvo 9.2.12, y 8.3.8). Si el marcador solo aparece en una línea del cuerpo (8.3.6 y 8.6.2) → `fig3Parcial`, no exclusiva. Hay 27 secciones exclusivas y 25 objetivos marcados (9.6.2 queda bajo el umbral con 0.47 y 9.6.3/9.6.4 caen en el mismo objetivo: el verbo "Interpretar" no basta para separarlos).
- **Manual, vínculo con el temario.** El temario NO tiene todos los objetivos del manual (p. ej. 6.1.1 "concepto de mercado de deuda"): esa sección cae en el vecino más parecido con confianza media. 19 objetivos reciben más de una sección. 108 objetivos del temario no tienen sección. Los encabezados de los capítulos 1 y 8.1–8.2 son nombres de tema ("Conceptos Básicos"), no objetivos: casi no vinculan.
- **Repasos del manual.** Los números de pregunta se pierden, las opciones vienen en una línea, con marcadores como `bl`/`dj`, o faltan; el id usa el ordinal de la pregunta en el capítulo (contando las omitidas). Se omiten las que no tienen 4 opciones, con enunciado truncado, columnas mezcladas o restos de otra pregunta. Quedan enunciados con ruido al inicio ("Ea ¡y p ==") y algún texto pegado al final de una opción: las notas dicen `OCR: …`. Hay que revisar cada una contra la página antes de validarla.
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
