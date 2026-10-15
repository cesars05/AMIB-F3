> **Instrucciones / notas de navegación**
> - **Qué es:** Diccionario de formas y componentes sueltos (header bar, label block, cajas punteadas, pills, tabs, callouts, pentágonos BofA…) con medidas y la función de house.py.
> - **Cuándo leerlo:** Cuando necesites una pieza específica o decidir qué forma usar (esquinas, sombras, punteados).
> - **Siguiente:** Vuelve a la receta del slide (`slide-catalog.md` / `structural-diagrams.md`).
> - Flujo: SKILL.md → style-systems → adaptation → slide-catalog → (structural-diagrams | charts | thinkcell-library | shapes-components | images) → grid-typography → rotation-qc

# Vocabulario de formas y componentes

Frecuencia medida de geometrías (forensics): Aztlan = casi todo `rect` + `line` (+ `homePlate`, `chevron`, `bracketPair`, `snipRoundRect` ocasional); FEMSA = `rect`, `line`, `roundRect`, `ellipse`, `chevron`, `custGeom` (cilindros, arte), `wedgeRectCallout`, `parallelogram`, `mathPlus/Equal/Multiply`; Think-cell = `custGeom` (funnels, pirámides). Bancos (visual): rect + barras de color; BofA/Barclays/Jazz agregan pentágonos/flechas; GS agrega roundRect con sombra.
Todo se construye con formas nativas editables (nunca imagen de un diagrama). Funciones en `scripts/house.py`.

| Componente | Forma (python-pptx `MSO_SHAPE`) | Medidas típicas | Texto | Dónde se vio | Función en house.py |
|---|---|---|---|---|---|
| **Header bar** sobre exhibit | `RECTANGLE` relleno primario, sin borde | h 0.30–0.34 (16:9), ancho = exhibit | blanco bold 11–12 centrado | todos los bancos, MS | `header_bar()` |
| **Block header Aztlan** | textbox + `line` 1 pt negra | h0.347 + regla + unidad itálica 12 | 16 bold #404040 | Aztlan, AZTD | `block_header()` |
| **Label block** (encabezado de fila) | `RECTANGLE` primario | w 1.3–2.4, h = fila | blanco bold 11–12 centrado | JEF, BOFA, ALLOC s11, JAZZ s4 | `label_block()` |
| **Flecha-tag** horizontal | `PENTAGON` (homePlate) / `RIGHT_ARROW` | w 1.6–2.4, h 0.45–0.75 | blanco 11–12 | BARC-F, JAZZ, KLA s7 | `arrow_tag()` |
| **Pentágono vertical** (fase) | `PENTAGON` rotado 90° (punta abajo) | w 1.3, h = bloque | blanco bold | BOFA-GP p21 | `phase_pentagon()` |
| **Chevron de secuencia** | `CHEVRON` (1º puede ser `PENTAGON`) | w 2.4–2.9, h 0.45–0.63, overlap −0.12 | blanco bold 14–16 | ALLOC s5/s16, ING, KLA s7 | `chevron_row()` |
| **Takeaway banner** | `RECTANGLE` taupe/celeste/crema | full width, h 0.35–0.5 | bold itálica 11–12 centrado | BOFA, GS | `banner()` |
| **Barra de conclusión** | `ROUNDED_RECTANGLE` marca (adj 0.15) | full width, h 0.55 | blanco bold 12–14 | ALLOC s10/s13, FEM | `conclusion_bar()` |
| **Caja de bullets** bajo header | `RECTANGLE` blanco, borde 0.75 pt gris/negro | h 1.5–3.5 | 10–11, lead-in bold | KLA s3, MIT s11 (D1) | `bullet_box()` |
| **Card gris** | `RECTANGLE` #F2F2F2 (sin borde o borde #C0C0C0) | — | título 12 bold + regla + bullets | ALLOC s5, MS | `card()` |
| **KPI tile** (solo como apoyo de una gráfica o diagrama, nunca un slide de solo tiles — el usuario lo rechazó) | `RECTANGLE` gris claro o primario | 1.8×1.1 junto a donut / tabla | número 20–24 bold + label 10–12 | ING, ALLOC s11 | `kpi_tile()` |
| **Caja punteada de resalte** | `RECTANGLE`/`ROUNDED_RECTANGLE` sin relleno, borde rojo 1–1.5 pt `dash` | ajustada a fila/columna | — | GS, BARC, CS, BOFA, ALLOC s10 | `dashed_box()` |
| **Marco temático** (módulo 1/4) | `RECTANGLE` sin relleno, borde `dash` color del tema | contenido completo | nombre del tema 16 bold color + pill tintada | AZTD s10+ | `theme_frame()` |
| **Pill de estadística** | `RECTANGLE`/`ROUNDED_RECTANGLE` tinta clara + borde del color | h 0.25 | 9 bold | AZTD, GS | `pill()` |
| **Óvalo métrico** sobre barra | `OVAL` blanco borde primario | 0.6×0.28 | 9 bold | BOFA-GP p4/p6, MS p8 (gris) | `metric_oval()` |
| **Círculo numerado** | `OVAL` primario | 0.32–0.45 | blanco bold 11–14 | GTT s9, ALLOC s8, GS, DEU | `num_circle()` |
| **Marcador de anotación** A/B/C | `OVAL` rojo | 0.22 | blanco bold 9 | BOFA-T p7 | `num_circle(color=neg)` |
| **Callout con guía** | textbox con borde fino + `line` al punto | ≤ 2.2 w | 9 pt: fecha bold + texto | BARC-N p8, JEF p4, ALLOC s6 | `callout()` |
| **Callout con puntero** | `RECTANGULAR_CALLOUT` (wedgeRectCallout) amarillo pálido/gris | — | 9 pt | BOFA-T p5, ALLOC s14 | `callout(pointer=True)` |
| **Tab rotado** (agrupa filas) | `RECTANGLE` primario/gris, texto rotado 270° | w 0.25–0.3 | blanco bold 9 | BARC-N, BARC-F p9, BOFA-T p11, JEF | `side_tab()` |
| **Bracket / llave** | `LEFT_BRACKET`/`RIGHT_BRACE` o 3 líneas | — | label 9 | BARC-F p14, ALLOC s15, GS p28 | `bracket()` |
| **Operadores** | `MATH_PLUS`, `MATH_MINUS`, `MATH_EQUAL`, `MATH_MULTIPLY` en círculo gris | 0.3 | — | FEM s13, ALLOC s8, BOFA-T p9 | `operator()` |
| **Flecha CAGR** | `line`/connector con flecha + óvalo "CAGR x%" | diagonal sobre barras | 9–10 bold | DC, JEF p10, BOFA-GP p13 | `cagr_arrow()` |
| **Chevron gigante de fondo** | `CHEVRON` gris #E8EAED detrás de bloques | alto completo | — | MS p6 | `chevron_backdrop()` |
| **Tombstone / logo cell** | `ROUNDED_RECTANGLE` borde fino + logo + 2 líneas | 1.4×1.1 | 8–9 | GS p6/p33 | `logo_cell()` |
| **Leyenda manual** | cuadrito 0.2 + texto 9 itálica | — | — | ALLOC s3 | `legend_items()` |

Reglas de forma:
* Esquinas rectas por defecto (Aztlan, Barclays, CS, Jefferies). Redondeadas = señal de "panel/tarjeta" (GS, FEMSA, MS) — si las usas, usa el mismo radio (adj ≈ 0.08–0.15) en todo el deck.
* Sombra: solo FEMSA (agenda, header strips) y GS (paneles). Aztlan/bancos clásicos: sin sombra, sin 3-D, sin gradientes.
* Punteado: rojo = "mira aquí / recomendado"; gris = "referencia / estimado"; color de tema = "módulo".
* Un solo color de acento fuerte por slide; los demás bloques en primario + grises.
* Texto dentro de formas: márgenes internos 0.05–0.08 in; ancla al centro para labels, arriba para bullets.
