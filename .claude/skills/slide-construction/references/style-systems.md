> **Instrucciones / notas de navegación**
> - **Qué es:** PASO 1: elegir el sistema visual del deck (Aztlan, FEMSA, banco, MS o marca del cliente) y saber cómo presenta cada banco.
> - **Cuándo leerlo:** Al iniciar cualquier deck nuevo, o cuando el usuario pregunte "¿cómo lo presentaría GS/BofA/Barclays?".
> - **Siguiente:** Después ve a `adaptation.md` y luego a `slide-catalog.md`.
> - Flujo: SKILL.md → style-systems → adaptation → slide-catalog → (structural-diagrams | charts | thinkcell-library | shapes-components | images) → grid-typography → rotation-qc

# Sistemas de estilo (cómo presenta cada casa)

Fuentes: decks en `06_Templates/`. Los `.pptx` están **medidos** (python-pptx + COM, ver `07_Template_Analysis/forensics/*.json`); los PDF de bancos son escaneos → posiciones **aproximadas**, expresadas como fracción del slide (fx, fy) para que apliquen a 13.33×7.5 o 10×7.5.
Notas crudas deck por deck: `07_Template_Analysis/IB_REVIEW_NOTES.md`.

Regla de oro: **elige UN sistema por deck** y no mezcles marcos. Lo que sí se puede tomar de otro sistema es un *componente* (p. ej. el football field de Barclays dentro de un deck Aztlan), recoloreado con los tokens del sistema elegido.

---------------------------------------------------------------------
## A. Aztlan (analyst house style) — default para research / stock pitch / performance review
Usado en: KLA, Mitsubishi, GTT, Data Centers, Ingevity, AZTD vs Peers. Medido.

| Elemento | Spec (13.333 × 7.5 in) |
|---|---|
| Fuente | Arial en todo |
| Regla superior | línea 1 pt #002060, y0.313, x0.565→12.828 (arriba del título) |
| Título | Arial 28 regular negro, x0.575 y0.533 w9.827 h0.454 (1 línea, ≤ ~62 caracteres) |
| Subtítulo | Arial 16 navy #221D55, y0.989 h0.286 — **el "so-what" cuantificado** |
| Logo | top-right x10.403 y0.362 w2.425 h0.897 (zona x ≥ 10.4, y ≤ 1.3 prohibida para contenido) |
| Área de contenido | x 0.575→12.877, y 1.446→6.78 |
| Fuente/Source | Arial 10 *itálica*, centrado, y6.951 |
| Página | Arial 11 #002060, derecha x12.416 y6.951 |
| Footer legal | 9 pt gris claro #B2BCCB, 3 líneas, x0.565 y6.828 |
| Portada / divisor / cierre | campo navy #221D55 completo, logo blanco/dorado, título Arial 40 blanco, subtítulo 24 |

Tokens: navy #221D55 / #242852, rule #002060, **gold #F5C400 (sujeto / highlight)**, steel #7F8FA9 / #9DAAC0, light blue #ACCBF9 / #C2D7F6, green #42825D, risk red #C00000, greys #404040 #7F7F7F #D9D9D9 #F2F2F2.
Convención de títulos: *"Tema + periodo: veredicto"* / subtítulo con los números que lo prueban — ej. "Sectors 2024-26: Materials Lagged, Industrials Led" / "Materials (-5.0pp) and Financials (-3.2pp) cost the most; Industrials (+3.1pp) added the most".
Énfasis en texto: **lead-in en negrita** + cifra clave en negrita navy + 1 cláusula de riesgo en **rojo negrita** máx. por bullet.
Imágenes: sí, con propósito (ver `images.md`): foto/render del producto en Company Overview, fotos numeradas en "drivers", logo de la empresa a la derecha del overview.

## B. FEMSA / académico de marca (team deck) — cuando el deck es "para" una empresa cliente
Usado en: M&A FEMSA, Allocation FEMSA, Deuda FEMSA. Medido.

| Elemento | Spec |
|---|---|
| Fuente | Helvetica (Arial solo para número de página) |
| Título | Helvetica 28 **bold color de marca** (#862633), x0.667 y0.375 h0.572 |
| Subtítulo | Helvetica 14 *itálica* negra, y0.947 — pregunta guía o so-what |
| Regla | **debajo** del título, y0.936, x0.667→12.667, color de marca |
| Logo cliente | top-right x11.581 y0.505 w1.086 h0.25 |
| Source | Helvetica 8 itálica gris #7F7F7F, izquierda, x0.76 y6.951 ("Source: …") |
| Portada/cierre | campo de marca (#8E2F3C) con arte abstracto lineal derivado del logo, título 40 bold blanco, fecha 24 itálica, **nombres del equipo itálica 11 abajo-izquierda**; cierre = misma arte, solo logo |
| Agenda | pills con números romanos (#9B2C39, w0.622) + barras gris claro (#F2F2F2, w10.99 h0.38) con sombra suave, paso 0.573 in |

Tokens: wine #862633 / #9B2C39 / #7B2330 / dark #4E161E, rose #B96A73 / #EAD2D2, cream #FEF3DA, greys, + colores de categoría solo cuando codifican algo (NYSE azul #3D8FC9, BMV slate #8087A1).
Rasgos: más "diagramático" que Aztlan (estructuras accionarias, cilindros, chevrons de años, barras de conclusión de color de marca, iconos de línea en círculos). Cada slide suele cerrar con una **barra de conclusión** (roundRect color de marca, texto blanco bold 12–14, full width).

## C. Bancos de inversión (pitch books / board materials) — referencia para valuación, M&A, fairness, financiamiento
Rasgos comunes a todos: marco muy estable, **títulos temáticos** (sustantivo, no oración: "Valuation Summary", "Selected Precedent Transactions") — el mensaje vive en un *banner* o en el subtítulo; cada exhibit lleva **barra de encabezado de color** encima; fuentes y notas numeradas (1)(2) en 7–9 pt abajo-izquierda en TODA página con datos; logos solo como identificación (tablas de comps/precedentes, tombstones); casi nunca fotos.

| Banco | Marco | Formas firma | Paleta |
|---|---|---|---|
| **Goldman Sachs** (PowerSchool 2024) | Título grande bold navy, 1–2 líneas, Title Case, *afirmación* ("Sponsors Remained Most Active Buyers"); logo box top-right; barra navy gruesa al pie | Paneles **rounded** con sombra suave; banner celeste con borde navy bajo el título (so-what); tiles sólidos de color con ícono blanco (investment highlights); "metric strips" arriba/abajo de la gráfica; columna recomendada con **relleno amarillo + borde rojo punteado**; círculos numerados | navy #0C2454, celeste #D6E8F7, azul #6E9BCB, púrpura #6B1F6E, naranja #F39200, rojo #A6192E, crema #FCF6DA |
| **BofA Securities** (Green Plains 2023, Taro 2024) | Título en **2 niveles tipo breadcrumb**: sección (24 light) / tema (16 gris); portada y divisores con **arte de olas navy/azul**; logo del cliente abajo-derecha | **Banner taupe** (#D9D2CA) con frase bold-itálica = takeaway; **pentágonos apuntando hacia abajo** (navy) como etiquetas de fase; bloques navy cuadrados como encabezado de fila; **óvalos/pills** con métricas sobre cada barra; tags rojos punteados "Confidential"/"For Reference Only"; marcadores **A B C D en círculo rojo** sobre filas + caja "Commentary" que los explica; paneles laterales navy con el título de la gráfica | navy #032061 / #0A1F5C, royal #0250C4, azul #1A8FE3, verde #2CA02C, rojo #E31B23, taupe |
| **Barclays** (Nuvei 2024) | Título bold negro 24, regla celeste al pie, logo derecha; portada **cyan con tarjeta blanca** | Barra azul royal full-width sobre cada exhibit (+ teal para la 2ª familia); **tabs verticales rotados** que agrupan filas; cajas rojas punteadas para resaltar columnas; callouts con borde punteado de color según tipo de evento | cyan #00AEEF, royal #1F6FD1, navy #0A2D5C, teal #12A19A |
| **Barclays** (FBL 2021) | Título regular + doble regla; "Project X / Confidential" rojo abajo-derecha | **Tags tipo flecha (homePlate) cyan** a la izquierda de cada bloque de texto ("Key Takeaways", "Scope"); barras teal/cyan de 2 niveles | cyan, teal-navy #0E5C84 |
| **Credit Suisse** (NewStar 2017) | Banner de disclaimer rojo arriba; título navy + subtítulo gris mismo tamaño; **círculo navy con número de sección** junto al título | Tabla izquierda + "Selected commentary" derecha (ambos con header navy subrayado); **caja roja punteada sobre una fila** + nota punteada que la explica; caja gris con la ecuación de regresión | navy #0B3B73, steel #6A9BC0, gris #D9DDE1 |
| **Jefferies** (Focus 2023) | Minimalista: título bold condensado 18 negro; portada blanca entre dos reglas grises | Bloques steel-blue (label) + caja con borde fino (texto) = grid de términos; **un color por familia de análisis reutilizado en todo el deck** (verde = trading comps, mostaza = precedentes, púrpura = DCF) | steel #4F73A3, #A9C0DA, verde #8DB58A, mostaza #E2C36B, púrpura #9B88C7 |
| **Morgan Stanley** (strategic update 2026, corporativo/IR) | Título **"Negrita: claim regular"** en una línea; mucho blanco; sin subtítulo | Tiles grises con número gigante azul; barra azul sobre cada panel (2–3 paneles iguales); gráficas sin ejes con pastel por panel y **líneas punteadas de promedio con puntos**; pills grises con margen % sobre barras; chevron gris gigante detrás de "pilares → metas" | MS blue #0A5AA6, navy, púrpura #6633CC, verde #1A7F5A, pasteles |
| *"Goldman Stanley"* (Jazz/Netflix, BIWS — entrenamiento) | Título Arial 24 + regla navy + cuadrito navy en el borde izquierdo | Fila "#N negro + flecha navy + caja gris redondeada" (medida, ver `shapes-components.md`) | navy #113D63, gris #CCD1D7, steel #5E7C9E. **No copiar sus gráficas** (defaults de Excel) |

### "Las de BofA no usan cuadrados normales" — qué formas son exactamente
1. **Pentágono vertical** (PowerPoint `Arrow: Pentagon`/`homePlate` rotado 90°, punta abajo) como etiqueta de cada fase de un proceso, altura = altura del bloque de bullets a su derecha.
2. **Óvalos con borde navy y relleno blanco** que llevan una cifra encima de cada barra (métricas alineadas a la categoría).
3. **Banner taupe full-width** (rectángulo sin borde) con texto bold itálico centrado — el takeaway de la página.
4. **Pills rojas punteadas** (rectángulo redondeado, borde rojo `dash`) como sellos de estado.
5. **Círculos rojos con letra** (A, B, C…) como marcadores de anotación.
6. **Rectángulos de esquina normal** solo para los bloques label navy y las tablas.
Barclays usa la versión horizontal (homePlate apuntando a la derecha, cyan) del mismo recurso; Jazz/Netflix usan `rightArrow`.

---------------------------------------------------------------------
## D. Marca del cliente (swap de tokens)
Cuando el deck es para/sobre una empresa con identidad fuerte (ej. Halliburton, FEMSA):
1. Mantén el **grid y la tipografía** del sistema A o B.
2. Sustituye: `primary` (títulos B / headers de tabla / serie principal), `primary_dark`, `tint_1`, `tint_2` (series 2–3, callouts), `accent` (máx. 1 highlight por slide). Muestrea el color del logo en raster (no de memoria).
3. Neutros, verde/rojo semántico y reglas no cambian.
4. Portada: arte de marca a sangre o campo sólido + logo; texto solo en la zona plana de la imagen.
Ver `scripts/house.py` → `SYSTEMS` (`aztlan`, `femsa`, `ib_navy`, `ms_clean`) y `make_brand_system()`.
