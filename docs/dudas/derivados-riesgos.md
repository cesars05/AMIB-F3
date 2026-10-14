# Dudas de contenido: Derivados y Riesgos, parte B (Riesgos I y II)

Fecha: 2026-10-14. Alcance: `content/lecciones/derivados/10` a `13` y `content/preguntas/generadas/derivados-riesgos.json`.

Fuentes consultadas en este orden: `AMIB Data/AMIB_1_completo.md` (capítulo 8, secciones 8.9.1 a 8.11.3, páginas 290 a 301 del PDF, más la p. 247 sobre las AIM y las pp. 148 y 149 del capítulo 4 para varianza y riesgo de portafolio), las páginas 290 a 301 renderizadas desde `AMIB Data/AMIB 1.pdf` para leer figuras y tablas que el OCR no recupera, el manual 2023 (texto extraído del PDF, secciones 4.5.4 a 4.5.9) y las notas de Cesar (`AMIB Data/AMIB Fig 3_vf.docx`, que no tratan este tema). Cada punto indica qué se verificó y qué decisión se tomó mientras Cesar no confirme.

1. **Temas pedidos que el manual no cubre.** El encargo mencionaba VaR histórico y Montecarlo como cálculo, backtesting, stress testing, pérdida esperada y no esperada, y escalas de corto plazo. Ninguno de los dos manuales los desarrolla: el AMIB 1 solo nombra los cuatro métodos de VaR de las AIM (Monte Carlo, ASIGNA, Paramétrico e Histórico, al 99 %, p. 247) y la "valuación de riesgos y escenarios extremos" de Asigna (p. 297); la tabla de calificaciones solo es de largo plazo (p. 299). Para no inventar contenido, las lecciones se limitan a esas menciones. Si el examen vigente evalúa esos temas, habría que conseguir otra fuente oficial.

2. **Factor de confianza de 99 %.** El manual solo usa 1.65 para 95 % (p. 295) y menciona 99 % como nivel habitual (p. 296) sin dar su factor. La lección explica 2.33 como valor de la distribución normal, y las preguntas que lo usan (`g.derivados.l12.q12`) lo dan en el enunciado. Conviene confirmar si el examen usa 2.33 o 2.326.

3. **Divisor de la varianza.** El capítulo 8 (p. 290) define la varianza dividiendo entre el número total de datos, pero el ejemplo del capítulo 4 (p. 148) divide entre n menos 1 (42 ÷ 2 = 21; desviación 4.58). La lección enseña ambas versiones y las preguntas indican explícitamente el divisor (`g.derivados.l10.q04` y `q13`). El OCR del ejemplo del capítulo 4 imprime además "(9-9)" donde debe decir "(8-9)".

4. **Errata en la tabla de escalas locales (p. 299).** Leída sobre la imagen del PDF: en la fila de mxBB- la columna de Moody's dice "Aa3.mx" (debe ser Ba3.mx) y en la fila de B- la columna de S&P dice "mxA-" (debe ser mxB-). La lección muestra la tabla corregida y lo advierte. Ninguna pregunta depende de esas dos celdas. El OCR de la tabla es casi ilegible, por lo que las citas textuales de `g.derivados.l13.q03`, `q06` y `q11` usan los únicos fragmentos que el OCR conserva y llevan nota.

5. **Escala de intensidad de la correlación (p. 291).** La figura muestra la escala 1, 0.75, 0.5, 0.25, 0, 0.25, 0.5, 0.75, 1 con las etiquetas fuerte, media, débil, nula, débil, media y fuerte; los valores del lado negativo aparecen sin signo (solo "-0.25" lo conserva). Se interpretó como simétrica (−1 a 1). La pregunta `g.derivados.l10.q15` usa 0.15 (positiva débil), que no depende de los límites exactos entre categorías.

6. **Definición de correlación con una palabra faltante.** El manual (p. 290) dice "cuando los valores de una de ellas sistemáticamente con respecto a los valores homónimos de la otra"; falta el verbo (presumiblemente "varían"). No afecta a las preguntas.

7. **Parámetros de sensibilidad de una opción (p. 301).** El manual dice "volatilidad (beta), tasa de interés (DV01) y tiempo". En la teoría de opciones la sensibilidad a la volatilidad es la vega y la beta mide la sensibilidad de una acción frente al mercado; el DV01 es propio de bonos. La pregunta `g.derivados.l13.q15` se formuló como literal del manual ("Según el texto del manual") y lleva nota. Si el examen usa otra redacción, conviene revisarla.

8. **Riesgo de liquidez en situaciones extremas (objetivo 8.11.1).** El objetivo del temario habla de diferenciales entre compra y venta, pero el texto del manual (p. 300) desarrolla en su lugar el "riesgo de liquidez por fondeo de operaciones" (riesgo de liquidación, ejemplo FOREX). La lección presenta lo del manual y relaciona el diferencial con la definición de riesgo de liquidez de la p. 292 (venta a descuentos inusuales), advirtiendo que es una interpretación. Ninguna pregunta evalúa el diferencial compra venta.

9. **Signo del FVA.** El OCR (p. 296) imprime "Valor ajustado al riesgo=Valor libre de riesgo- CVA+DVA + FVA"; en la imagen del PDF el último signo es "±". La lección usa ±. La pregunta de cálculo (`g.derivados.l12.q07`) excluye el FVA para evitar la ambigüedad del signo.

10. **VaR relativo.** El manual (p. 296) define el VaR relativo como "la cantidad absoluta en riesgo más las ganancias esperadas". En la literatura suele llamarse VaR relativo (a la media) al que no descuenta la ganancia esperada, lo cual es coherente con esa suma. La lección y la pregunta `g.derivados.l12.q08` siguen literalmente al manual.

11. **Duración: fuentes de los cálculos.** El manual AMIB 1 solo define la duración (p. 291). El ejemplo numérico (bono de 2 años, cupón 8 %, tasa 10 %, Macaulay 1.885229) y la tabla de DV01 provienen del manual 2023 y se reprodujeron en Python: la duración modificada por fórmula (1.885229 ÷ 1.05 = 1.7955) coincide con la que el manual 2023 obtiene por diferencias de precios (1.79), y los cuatro DV01 de su tabla (0.0396, 0.0987, 0.0366, 0.0746) se reproducen con cupones semestrales. El precio que el manual 2023 imprime ($96.454067) difiere en la sexta decimal del recálculo ($96.454049) por redondeo de cada flujo.

12. **Numeración del manual.** El OCR numera la sección del riesgo financiero como "8.2.1" y el riesgo corporativo y soberano (8.9.9) aparece dentro del archivo del objetivo 8.9.8 (`content/manual/cap08/66-...md`); el índice no tiene archivo propio para 8.9.9. El contenido está completo en la p. 294.

13. **Repasos y preguntas oficiales relacionadas.** Se revisaron `tipo.17`, `tipo.18` y `manual-repaso.c08.q20` a `q22` para no duplicarlas. Las preguntas generadas sobre VaR, riesgo de mercado, riesgo de crédito y baja de calificación usan otra redacción, otros datos o el otro extremo de la definición.
