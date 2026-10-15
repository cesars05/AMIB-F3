> **Instrucciones / notas de navegación**
> - **Qué es:** PASO 2: qué variantes de slide existen por tema (overview, peers, valuación, deuda, allocation…), estructura de deck por tipo y la tabla "quiero mostrar X → opciones 1/2/3".
> - **Cuándo leerlo:** Al armar el storyline y al elegir el layout de cada slide.
> - **Siguiente:** Para construir: `structural-diagrams.md` (diagramas), `charts.md` (gráficas), `thinkcell-library.md` (formas think-cell), `shapes-components.md` (piezas sueltas).
> - Flujo: SKILL.md → style-systems → adaptation → slide-catalog → (structural-diagrams | charts | thinkcell-library | shapes-components | images) → grid-typography → rotation-qc

# Catálogo de slides por tema

> Todas las variantes de este catálogo son **puntos de partida**: adapta número, orden y acomodo de las formas al mensaje (`adaptation.md`). Las fuentes muestran el lenguaje visual, no una estructura obligatoria.

Para cada tema: **variantes vistas** (fuente → archivo de render), **cuándo usar cada una**, **zonas** y **orden de lectura**. IDs de layout (`C2`, `D1`, `F6`…) remiten a `07_Template_Analysis/LAYOUT_LIBRARY.md` (zonas medidas).
Claves de fuente: KLA, MIT (Mitsubishi), GTT, DC (Data Centers), ING (Ingevity), AZTD (AZTD vs Peers), FEM (M&A FEMSA), ALLOC (Allocation FEMSA), DEU (Deuda FEMSA), TC (Think-cell), GS, BOFA-GP (Green Plains), BOFA-T (Taro), BARC-N (Nuvei), BARC-F (FBL), CS, JEF, MS (Morgan Stanley), JAZZ/NFLX.
Renders: Aztlan/FEMSA → `07_Template_Analysis/renders/<deck>/slide_NN.png`; bancos → `07_Template_Analysis/renders_ib/<KEY>/pNN.png`.

---------------------------------------------------------------------
## 0. Estructura de deck por tipo
| Tipo | Secuencia típica |
|---|---|
| **Stock pitch / research (Aztlan)** | Portada → Disclaimer → Company Overview → (Quant model) → Investment Call → 3–6 Key topics (claim + gráfica + bullets) → Market/Competition → Valuation → Riesgos → Apéndice financiero (IS, BS, CF, ratios, WACC, DCF, sensibilidad) → Cierre |
| **Performance review (AZTD)** | Portada → Disclaimer → Resumen (2 gráficas + tabla) → por periodo: divisor → contribución → allocation → selection → módulos por sector (1/4…4/4) → regiones |
| **Board / fairness (bancos)** | Portada → Notice → Agenda → Transaction overview / términos → Situation / stock performance → Management projections → Valuation summary (football field) → Comps → Precedentes → DCF + sensibilidad → WACC → Premiums → Apéndice |
| **Estrategia / M&A / capital allocation (FEMSA)** | Portada → Agenda romana → Entendiendo la empresa → Situación actual → Mercado → Opciones/targets → Valuación/impacto → Comparación de opciones → Recomendación → Plan de ejecución → Conclusión → Referencias → Cierre |
| **Financiamiento / deuda (DEU, NFLX)** | Portada → Exec summary → Necesidad de fondos (escenarios) → Opciones (equity / senior notes / convertible) → Comparables de deuda → Pro-forma credit stats → Términos propuestos → Hedge/riesgos → Conclusión |
| **Corporativo / IR (MS)** | Portada → Notice → KPIs titulares → 1 slide por pilar/segmento (2–3 paneles) → metas → End notes |

---------------------------------------------------------------------
## 1. Portada, agenda, divisores, cierre
| Variante | Fuente | Cuándo |
|---|---|---|
| Campo sólido de marca + logo + título 40 + fecha | Aztlan (KLA s1, AZTD s1) | research interno, sobrio |
| Arte abstracto de marca a sangre + nombres del equipo itálica abajo-izq | FEM s1, ALLOC s1, DEU s1 | deck académico/cliente con equipo |
| Ola/ribbon de marca en 70% superior + logos banco/cliente abajo | BOFA | estilo banco moderno |
| Tarjeta blanca dentro de campo de color | BARC-N | sobrio, muy limpio |
| Blanco con título entre dos reglas grises | JEF | minimalista |
Agenda: pills romanas + barras grises (FEM/ALLOC s2) · círculo numerado navy + barra celeste (GS p2) · lista con números y páginas a la derecha (BARC-F p2).
Divisor: campo navy con título 40 (Aztlan, AZTD s20 "2025 / Calendar year") · gris claro con título navy (GS) · blanco con número grande + franja de arte (BOFA). Cierre = misma arte que portada, solo logo (+ "Thank you / Q&A" opcional).

## 2. Executive summary / Investment call / conclusión
| Variante | Fuente | Zonas / receta | Cuándo |
|---|---|---|---|
| **Texto con secciones etiquetadas** | KLA s6, MIT s9, ING s7 (Aztlan F5) | full width 14 pt justificado: 1 bullet intro → "Catalysts" (bold) 4–5 bullets lead-in negrita → "Key Risks to Monitor" con lead-ins **rojos** | investment call; audiencia que lee |
| **Banner + bullets con sub-guiones** | GS p3 | banner crema con borde navy (frase central bold itálica) → 2 bullets cuadrados nivel 1 → 3–5 guiones | board summary |
| **Filas "#N + flecha + caja gris"** | JAZZ s3/s16, NFLX s6/s10 | 4 filas: rect negro "#1" 0.67 → rightArrow navy 2.42 (label) → roundRect gris 6.58 (explicación 12 pt); paso 1.36 in (×1.333 en 16:9) | conclusiones por método; 3–5 mensajes paralelos |
| **Cards numeradas de conclusión** | DEU s16 (F6) | 3 cards: círculo 01–03, barra de acento, header bold, 3 bullets, banda inferior | recomendación final |
| **Progresión de chevrons + conclusiones** | ALLOC s16 | 4 homePlate de gris → rosa → marca → oscuro ("Situación → Programa → Oportunidad → Target") + cajas bajo cada uno → barra gris "Conclusiones" con cola hacia abajo → 3 columnas de bullets con separadores verticales | narrativa de "dónde estamos → a dónde vamos" |
| **Changes table** | BOFA-T p4, JEF p22 | bloques label navy + 2 columnas (antes / ahora), banda gris abajo "Bolding indicates a change" | actualización de un análisis previo |

## 3. Company overview (cómo lo presenta cada casa)
| Variante | Fuente | Orden de lectura | Imagen |
|---|---|---|---|
| **Bullets + logo + 3 boxes de segmento + foto de producto** | KLA s3 | 2–3 bullets bold (qué hace, posición, moat) arriba-izq · logo arriba-der · fila de 3 headers de color (segmento + "% of revenue" itálica) con caja de bullets 10 pt debajo · render del producto a la derecha de los boxes | sí: producto (KLA), foto de planta (GTT) |
| **Bullets + 3 boxes con borde redondeado (bracket) + foto** | GTT s3 | igual que KLA, boxes con `bracketPair` en lugar de header de color | foto ambiental del activo |
| **Tabla de segmentos con tags de color** | MIT s3 (T3) | 1 bullet intro → tabla: tag de color por segmento (rect h0.3) · Gross profit (%) · Net income (%) · descripción 10 pt con lead-in bold | no (logo) |
| **Rueda/donut de portafolio** | MIT s4 | donut de exposición central con flechas grandes de tinta a los lados (texto de estrategia) | gráfico propio de la empresa (recrear) |
| **Estructura / organigrama** | ALLOC s3, BOFA-GP p7, MS p7 | diagrama 60% + panel gris explicativo 35% · o header bar → 3 barras → tiles pastel | no |
| **Highlights con tiles de ícono** | GS p16 | izquierda: 9 pills con borde (fortalezas) · derecha 2×2 tiles sólidos color con ícono blanco + caption | íconos de línea |
| **Dual platform con diagramas** | GTT s7 | 2 headers grises oscuros (#404040) con diagrama técnico/foto debajo + bullets lead-in | sí, diagrama técnico de la empresa |
| **"Entendiendo X Forward"** | FEM s3 | 3 columnas con header parallelogram (gris / rosa / marca): prioridades (roundRects) · estrategia (cajas conectadas punteadas) · claridad (íconos en círculo + subtítulos subrayados) | íconos |
Regla: Company overview = **qué hace + dónde gana + cuánto pesa cada parte**. Siempre muestra el mix (% revenue) y una prueba de posición (market share, patentes, #1). Máx. 1 imagen.

## 4. Mercado / industria / drivers
| Variante | Fuente | Receta |
|---|---|---|
| **Claim + 2 gráficas lado a lado** | KLA s9/s10, DC s4/s5 (C3) | header 16 bold + regla + unidad itálica por gráfica; bullets 2–3 debajo de cada una |
| **Texto izq + 2 gráficas apiladas der** | KLA s14 (C2) | texto x0.575 w7.1 · gráficas x8.085 w4.79 h2.0 c/u |
| **Drivers numerados con foto + chevron de conclusión** | GTT s9 (D5) | 3 filas: foto 1.1×0.75 · círculo navy numerado · título en acento + 2 sublíneas itálica · chevron grande → conclusión en itálica bold | 
| **Bloques label + bullets + gráfica** | FEM s6 | 3 bloques label marca (Mercado fragmentado / Tensión geopolítica / In-store) con bullets ➢ a la derecha · gráfica de columnas con línea de promedio a la derecha |
| **4 mini-charts macro con bullet-conclusión bajo cada uno** | FEM s7 | grid 2×2, cada mini gráfico con título 11 bold + unidad itálica + 1 bullet bold-itálica de lectura |
| **Cadena de valor con chevrons + bracket rojo punteado** | KLA s7 (D2) | fila de chevrons de colores, bracket rojo `dash` sobre los pasos en foco, 2 cajas header + texto debajo |
| **Funnel de targets** | FEM s8 | bullets de criterios izq · flecha doble vertical "Match estratégico / financiero" · embudo con logos en capas · target final abajo |

## 5. Competencia / peers / benchmarking
| Variante | Fuente | Receta |
|---|---|---|
| **Columnas con logos como categorías + filas de métricas alineadas** | ALLOC s9 | barras (sujeto gris o acento, peers marca) · logos debajo del eje · filas en cajas redondeadas punteadas (EBITDA mg, yield, EV, mkt cap) alineadas a cada barra |
| **Small multiples de barras horizontales con logos compartidos** | BARC-N p16 | 4 paneles, logos como etiqueta de fila, sujeto en color, peers navy, mediana en caja punteada |
| **Tabla de comps con logos** | BOFA-T p11, JEF p14, KLA s13 (T1) | header de color, filas por grupo con banda de color, **mediana fila navy texto blanco, media fila azul**, sujeto en bloque separado con tab rotado |
| **AZTD vs peers (barras pareadas + gap divergente)** | AZTD s5–s9 | izq: barras horizontales pareadas (sujeto dorado, peers navy) · der: barras divergentes ordenadas (neg steel, pos navy) con etiquetas `+0.0pp` |
| **Bubble/scatter de posicionamiento** | AZTD s11, DC s9 (C8), CS p5 | burbuja = tamaño; ejes con título; sujeto etiquetado; opcional línea de regresión + caja con ecuación |
| **Liga / league table** | GS p32 | grid de rankings (celda navy = nosotros) + barras con callout punteado "46% above #2" |

## 6. Desempeño financiero / proyecciones
| Variante | Fuente | Receta |
|---|---|---|
| **Columnas apiladas con total + CAGR + zona forecast** | DC s3 (C1), JEF p10, BOFA-GP p13 | totales bold arriba; flecha diagonal con "CAGR x%" (o óvalo); rectángulo gris #F2F2F2 detrás de los años E con "Forecast" itálica; % del último año dentro de la barra |
| **Tabla de proyecciones + Commentary con marcadores** | BOFA-T p7/p15 | tabla (historicals header azul claro / projections navy), filas anómalas en caja roja punteada con letra A–D en círculo rojo; caja "Commentary" (header navy) explica cada letra |
| **Tabla de mgmt plan + 3 paneles de metas** | BARC-N p10 | tabla izq con CAGR en caja y línea punteada vertical actual|proyectado · der: 3 paneles (header teal → caja gris "Target: 15–20%" → mini columnas) |
| **Escenarios 2×2** | NFLX s4 | 4 mini charts con header bar navy (Base / Upside / Downside / Extreme), región crítica en rectángulo rojo |
| **Bridge / waterfall** | GTT s21, FEM s16 (C5), ALLOC s20 | verde (+) / rojo (−) / marca (totales); logos/banderas arriba de cada barra cuando cada paso es una entidad |
| **KPI tiles + donut** | ING s4/s23, GTT s20 (C9) | donut con número en el hueco + 3–4 tiles (número 24 bold + label 10) |

## 7. Valuación
| Variante | Fuente | Receta |
|---|---|---|
| **Football field horizontal (canónico)** | BARC-N p15, BARC-F p9 | barras flotantes por método agrupadas con tabs rotados (Comparables / Intrinsic / For reference); referencia en gris; ◆ para puntos únicos; low/high en los extremos; líneas verticales punteadas para precio no afectado y oferta con label arriba; derecha: "Assumptions" en cajas apiladas |
| **Football field vertical** | JEF p12, BOFA-T p8 | columnas flotantes coloreadas por familia con header de color encima; precios de referencia como líneas horizontales con label a la derecha; criterios bajo cada columna |
| **AVP – análisis a varios precios** | GS p27, BARC-N p6, BARC-F p10 | columnas = precios; columna recomendada en caja (punteada roja / celeste); filas de premium e implied multiples; puntos marcando medianas de precedentes |
| **DCF** | BOFA-T p9, JEF p17, JAZZ s13 | tabla UFCF (fila FCF en banda navy blanca) → "Perpetuity growth method" → tablas de sensibilidad conectadas con "+" y "=" · o waterfall PV FCF → EV → Equity |
| **Tornado** | BOFA-T p10, JEF p20 | barras izq (claras) / der (oscuras) alrededor de línea punteada del valor base; labels en extremos; fila del valor base en banda gris con caja punteada |
| **Heat map de sensibilidad** | ING s34, ALLOC s14, FEM s17 (C10) | rojo→amarillo→verde, caso base con borde punteado + callout "Caso base" |
| **WACC** | BOFA-T p18, BARC-F p29, JEF p24 | tabla build-up (cost of equity / debt / WACC fila navy) + columna "Source" itálica; peers para beta debajo |
| **Regresión** | BARC-F p14, CS p5 | tabla de build arriba con sujeto en caja punteada · scatter con 1–2 líneas de regresión y R² en cajas |

## 8. Precio / mercado de la acción
| Variante | Fuente | Receta |
|---|---|---|
| **Línea con eventos anotados** | BARC-N p8, JEF p4, ALLOC s6 | línea única; círculos rojos u óvalos punteados en fechas; callouts con fecha bold + descripción + precio; bandas sombreadas para periodos; caja "Market statistics" arriba-der; tira resumen debajo (VWAP, 52W) |
| **Indexado vs peers con etiquetas finales** | GS p11/p13, BOFA-T p5 | sujeto en color, peers finos, mediana punteada gruesa; tags rellenos al final de cada línea con valor; mini tabla de retornos con columna clave en caja |
| **VWAP / premios** | GS p12 | línea + 52W high/low; tabla lateral de VWAPs con fila actual resaltada crema |
| **Analistas** | GS p14, JEF p13 | barras por analista + mediana/precio de cierre como líneas; ✓ por metodología; histograma de targets |

## 9. Capital allocation / retorno al accionista (FEMSA)
| Variante | Fuente | Receta |
|---|---|---|
| **Timeline de años con chevrons + cards** | ALLOC s5 | 5 chevrons marca con años → card gris por año (título 12 bold + regla + bullets lead-in bold) |
| **Columnas apiladas de distribuciones + 3 cajas** | ALLOC s7 | ordinario / extraordinario / recompras en tonos de marca, labels en cajitas, total arriba · 3 cajas con borde a la derecha (cifras en marca bold) · caja total redondeada |
| **Cilindros / slices (bridge 3D)** | ALLOC s8 | slices grises decrecientes → final en marca; círculos numerados; operadores (−, ≈) entre slices; bracket + pill con total. **Máx. 1 por deck** |
| **Matriz de comparación de opciones** | ALLOC s10, NFLX s11, GS p23 | headers redondeados (dimensión en marca, opciones en gris) · filas con separador punteado · celdas ganadoras en caja roja punteada · **barra de conclusión** abajo |
| **"¿Quién se beneficia? / Impacto cuantitativo"** | ALLOC s11/s12 | 2 paneles con header gris oscuro; izq cajas grises con lead-in bold; der bloques label marca + celdas KPI (label bold + número grande marca) |
| **Rango de precio + heat map** | ALLOC s14 | número-línea con tags min/target/max · barras apiladas de ratings · heat map · caja gris de reglas |

## 10. Deuda / financiamiento
| Variante | Fuente | Receta |
|---|---|---|
| **Tabla de bonos con banderas** | DEU s4/s12 (T7) | bono, emisión, vencimiento, tipo, tasa, moneda (bandera), monto; filas de acción encerradas |
| **Maturity ladder** | DEU s4/s12 (C11) | columna apilada por bucket con año a la derecha + pill "vida promedio 15.6 años" |
| **Term-sheet cards** | DEU s7/s10/s11 (D9), NFLX s12 | cards redondeadas: banda header oscura + 3 cajas label/valor (Nocional / Cupón / Plazo); card de resultado con número verde grande |
| **Leverage vs política** | DEU s3/s8 (C13) | barras (propia en marca, otras gris) + línea punteada de meta (2.0x) |
| **Pro-forma credit stats** | NFLX s9 | tabla histórica | ajustes | proyectada con filas clave en rectángulo rojo + 3 bullets de lectura |
| **Comparación de instrumentos** | NFLX s11 | grid con filas alternadas navy/gris, criterio bold a la izquierda |
| **Covenants / condiciones 2×3** | DEU s14 (D10) | tira gris de título + subheader de marca + párrafo corto |

## 11. Transacción / términos / proceso
| Variante | Fuente | Receta |
|---|---|---|
| **Key terms grid** | JEF p6/p8, BARC-F p6, CS | bloque label (steel/navy) + caja con borde fino y bullets 9–10 pt; o label bold pequeño + bullets con regla celeste entre filas |
| **Fases con pentágonos verticales** | BOFA-GP p21 | pentágono navy punta-abajo por fase + bullets + regla gris entre fases |
| **Timeline con flechas-tag** | BARC-F p4 | tag homePlate cyan por etapa + bullets cronológicos |
| **Gantt** | GS p28 | header de años navy, grid semanal, barras púrpura, ★ hitos, brackets "~3 weeks" |
| **Calendario** | BOFA-GP p23 | mini-calendarios con fechas resaltadas + tabla de eventos con columna de entidad coloreada |
| **Estructura antes / después** | BOFA-GP p7, ALLOC s15 | organigramas lado a lado con % de propiedad; tiles antes→después con chevron |
| **Listas de compradores / partners** | GS p25, JAZZ s18 | barras verticales de color por tier + logos; o header bar "Tier 1" + grid de logos |

## 12. Riesgos
| Variante | Fuente | Receta |
|---|---|---|
| Bullets rojos dentro del investment call | KLA s6 | "Key Risks to Monitor" con lead-in rojo bold |
| **3 escenarios con label + puntero** | ALLOC s19 | 3 headers marca (shape con triángulo hacia abajo) sobre cards con borde + header bold de la card |
| Matriz probabilidad × impacto | TC (matrices) | cuadrantes con burbujas numeradas + leyenda |
| Árbol de riesgos | MIT s10 (D3) | raíz arriba, 4 hijos, cajas de bullets |

## 13. Apéndice
Estados financieros (MIT s23–27, ING s26–30, T4): layout `FinancialStatements`, 8–9 pt, columnas E tintadas, banda CAGR. Notas al pie con letras (JEF p23). End notes (MS p17–18). Referencias APA (ALLOC s18).

---------------------------------------------------------------------
## 14. Elegir layout según el mensaje ("si quiero presentar X → A / B / C")
| Quiero mostrar… | Opción 1 | Opción 2 (rotar) | Opción 3 (rotar) |
|---|---|---|---|
| 1 idea muy clara | 1 gráfica grande con 1 callout + barra con cola (`tail_bar`) y conclusión | diagrama estructural (`structural-diagrams.md`) | think-cell tc:13 / tc:24 con la fase clave resaltada |
| Evolución en el tiempo | columnas + CAGR + forecast (C1) | línea con eventos (sección 8) | chevrons de años + cards (ALLOC s5) |
| Composición / mix | donut + KPI tiles (C9) | barra 100% horizontal (BARC-F p13) | tabla con tags de color (MIT s3) |
| Comparar vs peers | barras pareadas + gap (AZTD) | logos + filas de métricas (ALLOC s9) | tabla comps con mediana (T1) |
| Puente A→B | waterfall (C5) | cilindros (ALLOC s8, 1 vez) | build-up con +, ×, = (FEM s13, D8) |
| Rango de valor | football field horizontal | vertical por familias (JEF) | AVP table |
| Sensibilidad | heat map (C10) | tornado | mini grids 3×3 (BARC-N p18) |
| Proceso / pasos | cadena con foco (KLA s7, `process_chain`) | pentágonos verticales (BOFA) / think-cell tc:13, tc:24 | road map tc:18 / timeline tc:20 |
| Opciones / decisión | matriz con ganadora punteada + barra conclusión | columnas pro/contra (+/–) con recomendada amarilla (GS p23) | "#N flecha + caja gris" |
| Estructura / quién es dueño | árbol con colores por categoría (ALLOC s3, `struct_box`) | círculos anidados (ALLOC s4, `nested_circles`) | antes/después |
| Ciclo / pilares alrededor de una idea | think-cell tc:15 (4 segmentos) | tc:14 (6 segmentos) | tc:12 / tc:11 |
| Embudo / selección | think-cell tc:2 | tc:3 horizontal | funnel de targets (FEM s8) |
| Capas / moat / prioridades | think-cell tc:4 (pirámide) | árbol de riesgos (D3) | matriz tc:10 |
| Varias piezas del mismo análisis (1/4, 2/4…) | módulo enmarcado punteado con color por tema (AZTD s10) | — | — |
| Mensajes paralelos (3–5) | boxes de color + cajas de bullets (D1) | filas label + bullets (JEF) | cards numeradas (F6) |
Regla de rotación en `rotation-qc.md`.
