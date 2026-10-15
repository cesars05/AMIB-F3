> **Instrucciones / notas de navegación**
> - **Qué es:** Gramática de gráficas medida en los decks del usuario + recetas nativas (`stacked_columns`, `waterfall`, `football_field`, `tornado`…) y anotaciones.
> - **Cuándo leerlo:** Cada vez que un slide lleve una gráfica, antes de escribir el código.
> - **Siguiente:** Coordenadas del bloque de gráfica en `grid-typography.md`; después, render y QC (`rotation-qc.md`).
> - Flujo: SKILL.md → style-systems → adaptation → slide-catalog → (structural-diagrams | charts | thinkcell-library | shapes-components | images) → grid-typography → rotation-qc

# Gramática de gráficos (medida) + recetas

Base: 63 gráficas nativas medidas (Aztlan 34, AZTD 29, FEMSA 24) + gráficas de los bancos (visual). Las recetas están implementadas en `scripts/house.py`; para **datos propios** construye gráficas nativas editables (python-pptx). Las figuras de reportes de terceros sí pueden ir como screenshot (ver `images.md` regla 8: así se arman los decks de commodities de Aztlan). En ambos casos **renderiza y mira** el resultado antes de entregar (`scripts/render.ps1`).

## 1. Reglas que comparten todos los buenos ejemplos
1. **Barras/columnas: sin gridlines y sin eje de valores** (`valAx delete=1` en 23/23 barras AZTD y 12/12 Aztlan). El valor vive en data labels. Línea base negra/gris 0.75–1 pt.
2. **Líneas y scatter: sí eje de valores** 9 pt (gridlines muy claras opcionales #E6E6E6, 0.5 pt). Sin markers salvo puntos clave.
3. **Header de gráfica fuera de la gráfica** (texto 16 bold + regla + unidad 12 itálica — Aztlan; o barra de color — bancos). Título interno de la gráfica: apagado (`autoTitleDeleted`).
4. **Un color de sujeto, el resto neutro**: sujeto dorado #F5C400 o color de marca; peers navy/steel/grises; promedio de peers navy oscuro. Forecast/estimado = tinte claro del mismo color. Negativo = steel/rojo, positivo = navy/verde.
5. **Data labels**: 9 pt (mode), 10 pt si pocas barras; totales **bold** arriba; dentro de segmentos oscuros en blanco; formato con unidades personalizado (`+0.0"pp";-0.0"pp"`, `0.0"%"`, `$#,##0`, `0.0"x"`).
6. **Leyenda abajo**, 9 pt, sin borde; serie única → sin leyenda; líneas → etiqueta al final de la línea (mejor que leyenda).
7. **Fuente en el source line del slide**, no debajo de la gráfica.
8. Ordenar: barras horizontales de categorías ordenadas por valor (peor→mejor o mayor→menor), salvo orden natural (años, regiones fijas).

## 2. Parámetros medidos
| Tipo | gapWidth | overlap | Labels | Ejes | Fuente |
|---|---|---|---|---|---|
| Columnas apiladas | **80** (40–150) | 100 | 9 pt inside (blanco), total bold arriba | val borrado | Aztlan, FEM |
| Columnas agrupadas | 80–100 | −27 | 9–10 outEnd | val borrado | Aztlan |
| Barras horizontales pareadas (sujeto vs peers) | **60** | **−15** | 9 outEnd, sujeto bold | val borrado, cat 10 pt | AZTD s5 |
| Barras divergentes (gap) | 60 | — | 10 outEnd `+0.0"pp"` | val borrado; línea en cero | AZTD s5–s9 |
| Columnas de retorno | 45–55 | — | 10 outEnd `0.0%` | val borrado | AZTD s3 |
| Líneas | — | — | etiqueta final | val 9 pt, gridlines claras | 2.25 pt Aztlan (17/20); 1.25–1.5 peers + 2.5 sujeto (AZTD) |
| Línea de promedio/meta | — | — | label itálica | — | punteada roja #F21C27 (Aztlan) / navy con puntos en extremos (MS) |
| Doughnut | holeSize 55–65 | — | % fuera o dentro | — | ING, FEM |

## 3. Recetas (función en `house.py` → qué replica)
| Receta | Función | Replica | Notas de construcción |
|---|---|---|---|
| Columnas apiladas + total + CAGR + zona forecast | `stacked_columns(..., totals=True, forecast_from=i, cagr=(i0,i1))` | DC s3, JEF p10, BOFA-GP p13 | totales = serie extra invisible valor 0 con label custom `INSIDE_BASE`; zona forecast = rectángulo #F2F2F2 detrás calculado con layout manual del plot; CAGR = óvalo + flecha encima |
| Columnas/barras simples con color por punto | `bar_chart(..., highlight=[idx], horizontal=…)` | ALLOC s9, AZTD s3, DEU s3 | sujeto en acento, resto en primario/gris; línea de meta opcional `target=2.0` |
| Barras pareadas sujeto vs peers | `paired_bars()` | AZTD s5 | gap 60 / overlap −15; sujeto dorado bold |
| Barras divergentes ordenadas | `diverging_bars()` | AZTD s5–s9 | colores por signo por punto; labels `+0.0"pp"` |
| Líneas con etiquetas finales | `line_chart(..., end_labels=True)` | GS p11, BOFA-T p5, AZTD s3 | label solo en el último punto: "Nombre 131" en color de serie; sujeto grueso |
| Waterfall / bridge | `waterfall()` | GTT s21, FEM s16, ALLOC s20, JEF p17 | serie base invisible + subidas (pos) + bajadas (neg) + totales (primario) apiladas |
| Football field horizontal | `football_field()` | BARC-N p15, BARC-F p9 | barra apilada: offset invisible + rango; labels low/high custom; líneas verticales punteadas de referencia calculadas desde min/max del eje |
| Tornado | `tornado()` | BOFA-T p10, JEF p20 | barras agrupadas overlap 100 con valores −/+ alrededor de 0; labels en extremos; línea base punteada |
| Maturity ladder | `bar_chart()` por año + `pill()` "vida promedio" | DEU s4/s12 | barra resaltada para el bono nuevo |
| Donut + KPI | `donut()` | ING s4, JAZZ s15 | número grande en el hueco; ≤ 5 rebanadas |
| Heat map de sensibilidad | `heatmap_table()` | ING s34, ALLOC s14 | escala rojo→amarillo→verde (o 2 colores); base con borde punteado |
| Tabla house-style | `table()` | KLA s13, AZTD s3, JEF, BOFA | header primario blanco bold, zebra #F2F2F2 opcional, números a la derecha, fila de mediana/comparación bold con banda gris |

## 4. Anotaciones (lo que separa una gráfica "IB" de una default)
* **Una idea por gráfica, anotada**: óvalo CAGR, línea de promedio con label, caja punteada sobre el periodo relevante, callout de evento. Máx. 3.
* **Metric strip**: fila de óvalos/pills o mini tabla alineada a cada barra (BOFA, GS, ALLOC s9) cuando hay una segunda métrica por categoría (margen, leverage, # deals).
* **Etiquetas finales** en líneas, en el color de la serie, con el valor; peers en gris fino.
* **Bandas sombreadas** para periodos (forecast, Covid, periodo de oferta) con label itálica arriba.
* **Logos como etiquetas de categoría** cuando las categorías son empresas (ALLOC s9, BARC-N p16, JAZZ s9).
* **Break "//"** en barras fuera de escala con nota (BARC-N p16, JEF p20).

## 5. Qué NO hacer (visto en Jazz/Netflix y en screenshots)
Gridlines pesadas + eje de valores + labels a la vez; títulos internos "Chart Title"; leyenda a la derecha con 1 serie; colores default de Office; 3-D/sombras; pegar screenshots oscuros de Bloomberg/LSEG como gráfica (reconstruir con datos; screenshot solo como "exhibit" enmarcado, máx. 1 por sección); más de 5 series; pies con > 5 rebanadas.
