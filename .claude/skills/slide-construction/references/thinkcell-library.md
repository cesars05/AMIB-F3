> **Instrucciones / notas de navegación**
> - **Qué es:** Catálogo del deck curado `06_Templates\Thinkcell.pptx` (keys tc:N) para importar y recolorear formas think-cell; nota sobre ppttc para gráficas think-cell.
> - **Cuándo leerlo:** Cuando quieras variedad de formas (embudos, ciclos, pirámides, road map, fases) sin dibujarlas desde cero.
> - **Siguiente:** Adapta el diagrama importado con `adaptation.md`; si no hay uno adecuado, usa `structural-diagrams.md`.
> - Flujo: SKILL.md → style-systems → adaptation → slide-catalog → (structural-diagrams | charts | thinkcell-library | shapes-components | images) → grid-typography → rotation-qc

# Formas de think-cell: catálogo del deck curado del usuario

> Los diagramas importados también se adaptan: vacía slots que sobren, combínalos con primitivas (`node`, `flow`, `callout`, `tail_bar`) y ajusta el foco (`adaptation.md`).

think-cell está instalado (`C:\Program Files (x86)\think-cell`). Hay dos usos:

1. **Formas y diagramas (lo principal).** `Deck.import_elements(slide, key, box, texts)` (en `scripts/tclib.py`) copia el diagrama de un slide fuente al slide destino como formas nativas y lo recolorea con el sistema del deck. Se mapean los colores del tema think-cell; cualquier otro color saturado pasa al primario o a un tinte según su luminosidad, y los grises se conservan. También recolorea los íconos SVG. Fuerza la fuente del sistema, quita los tags de think-cell y agrupa todo escalado dentro de `box`. No hace falta licencia para editar el resultado. `Deck.tc_slots(key)` lista los textos en orden de lectura para llenarlos con `texts={índice: "texto" | ["línea 1", "línea 2"]}`.
2. **Gráficas think-cell con datos.** Se generan por línea de comandos con un JSON `.ppttc` (probado: `ppttc.exe archivo.ppttc -o salida.pptx`). Esto requiere una plantilla con elementos que tengan nombre (AddRangeData Name). Para las gráficas del deck usa primero las recetas nativas de `charts.md`; ppttc es para cuando el usuario pida una gráfica think-cell editable.

Alcance acordado con el usuario: **solo su deck `06_Templates\Thinkcell.pptx`** (keys `tc:N`). La librería completa instalada (≈500 slides) quedó renderizada en `07_Template_Analysis\thinkcell_library\` pero no está catalogada. Para usar una pieza de ahí, ábrela por su key `"<archivo>:<n>"` (por ejemplo `"Processes, Flow Charts, Phases:14"`) solo si el usuario la pide.

Las importaciones probadas (tc:4, 13, 15, 18, 21, 24 y una de la librería) se ven bien en Aztlan y en FEMSA.

| Key | Diagrama | Concepto / cuándo usarlo | Notas |
|---|---|---|---|
| tc:2 | Embudo III (6 fases) | proceso de selección / descarte (targets M&A, pipeline) | 18 slots: título, bullets y "Phase n" por nivel |
| tc:3 | Embudo horizontal II | lo mismo de izquierda a derecha, para dejar espacio de texto arriba y abajo | |
| tc:4 | Pirámide de 5 capas recortada + íconos | capas de un moat, jerarquía de prioridades, estructura de capital | slots: 0 = texto lateral; 1, 3, 5, 7, 9 = título + descripción por capa |
| tc:5 | Intersección | dónde se cruzan dos conjuntos (sinergias) | contiene un objeto think-cell que se descarta |
| tc:6 | Aspectos comunes | dos entidades con un centro compartido | |
| tc:7 | Venn | 3 conjuntos (estrategia, capacidades, mercado) | |
| tc:8 | Supply chain | hub central con nodos alrededor | íconos |
| tc:9 | Mapa mundial | presencia geográfica | grupos por región; recolorea las regiones activas |
| tc:10 | Matriz de proceso 3×3 | atractivo vs. fuerza competitiva (GE/McKinsey) | ejes con flecha + leyenda |
| tc:11 | Círculo con 10 textos numerados | 10 iniciativas alrededor de una idea central | |
| tc:12 | Cuatro elementos circulares | 4 pilares alrededor de un concepto | |
| tc:13 | **Etapas de proceso** (4 tarjetas con puntero sobre una línea) | fases con fechas; una fase resaltada | slots: 0–3 = tarjetas [título, subtítulo, texto]; 4–7 = etiquetas de la línea |
| tc:14 | Seis segmentos circulares | ciclo de 6 pasos | |
| tc:15 / tc:21 | **Cuatro segmentos circulares** | 4 palancas o pasos de un ciclo, con texto a ambos lados | |
| tc:16 / tc:22 | Swim lane complejo | flujo con responsables por carril | denso: úsalo solo en apéndice |
| tc:17 | Timeline en arco | historia año por año | |
| tc:18 | **Road map** (carretera + pines) | hitos hacia una meta, "de hoy a 2030" | |
| tc:19 | Burbuja think-cell | — | es una gráfica think-cell: la importación la descarta; usa una receta nativa |
| tc:20 | Timeline horizontal con tarjetas arriba y abajo | hitos alternados | |
| tc:23 | Plan (4 cajas en ciclo con flechas) | ciclo de planeación / mejora continua | |
| tc:24 | **Fases/procesos** (chevrons + "S" numerada + objetivo) | fases y pasos hacia una meta | |

Reglas de uso:
- Escala entre 0.8 y 1.1 del tamaño original. Los textos no se escalan con el grupo, así que si el box es mucho más chico el texto se encima.
- Reemplaza **todo** el lorem ipsum (`tc_slots` muestra qué falta). Borra los slots que sobren dejando `""`.
- Un diagrama think-cell por slide. Va debajo del título y del so-what, y como cualquier exhibit puede llevar su barra de conclusión.
- Rotación: cuenta como familia **D (diagrama)**.
