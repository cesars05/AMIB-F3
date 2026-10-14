# Dudas de las lecciones 1 a 7 de Derivados Financieros I y II

Archivos: `content/lecciones/derivados/01` a `07` y `content/preguntas/generadas/derivados-financieros.json` (105 preguntas, `g.derivados.l1.q01` a `g.derivados.l7.q15`). Fuentes consultadas, en este orden: `AMIB Data/AMIB_1_completo.md` (OCR, capítulo 8, secciones 8.1 a 8.7, páginas 241 a 289 del PDF); las imágenes de `AMIB 1.pdf` de las páginas 245, 247 a 250, 252, 255, 256, 258 a 265, 268, 273, 275, 281, 282 y 285 a 287, renderizadas para leer lo que el OCR dañó; y el manual 2023 solo para aclarar. Las páginas que se citan son las del PDF, que coinciden con los marcadores `<!-- page N -->` del OCR (la página impresa suele ser dos menos). Todos los ejemplos resueltos del manual se reprodujeron en Python antes de redactar: precio futuro del IPC (45,762.1891), del dólar (20.009928), base (0.2495), nocional (16,090,801), utilidades y pérdidas, valor intrínseco y extrínseco, delta, prima por delta, delta por gamma, theta, rho y vega.

## Errores o incongruencias del manual (resueltos en la lección)

1. **Cuadro de liquidación al vencimiento de futuros (página 252).** El segundo cuadro se titula "contrato de opción de venta LIQUIDABLE EN EFECTIVO", pero está dentro de 8.4.2 (futuros) y describe al largo con (SPOT − STRIKE) y al corto con (STRIKE − SPOT), que es la liquidación de un futuro. La lección lo presenta como futuro y lo advierte en una trampa.
2. **Signo de la base (página 259).** La definición dice "diferencia entre el precio del futuro y el precio del mercado", pero el ejemplo resuelto calcula precio de mercado menos precio del futuro (15.98 − 15.7305 = 0.2495), y el manual 2023 la define como contado menos futuro. La pregunta `l4.q10` sigue el procedimiento del ejemplo y no incluye como distractor el valor con el signo contrario, para no castigar la definición literal. **Pregunta para Cesar:** ¿confirmas que en el examen se espera el procedimiento del ejemplo (mercado menos futuro para un largo)?
3. **Variable mal rotulada en el nocional (página 260).** En el paso 3 del ejemplo 1 el manual escribe "#CON = 10,000"; ese número es el tamaño del contrato y el número de contratos es 100. El resultado ($16,090,801) es correcto. El manual usa el precio futuro redondeado a 6 decimales (16.090801) antes de multiplicar; las preguntas `l4.q11` y `l4.q14` siguen esa convención y lo dicen en la explicación.
4. **Cuarto sintético (página 274).** El encabezado dice "Compra de Put Sintético" para la combinación call corto + activo largo, que por la fórmula del propio manual (PUT SINTETICO CORTO) es la venta. La lección usa la fórmula.
5. **Bull spread, caso 3 (página 275).** El manual dice que sobre el techo "no se ejerce el call corto"; en rigor el call corto sí lo ejerce su contraparte y por eso la ganancia queda limitada a techo menos piso. La lección solo usa el resultado (techo menos piso).
6. **Fórmulas de los ratio spreads (página 281).** La fórmula impresa del Ratio Call Spread Corto (2 call largo strike mayor + call corto strike menor) contradice su descripción (un call largo y dos call cortos de strike mayor) y su gráfica (cero hasta 60, pico en 65 y caída después). La del Ratio Put Spread Corto aparece rotulada como "RATIO CALL SPREAD (CORTO)" y con las posiciones invertidas respecto a su descripción (un put largo y dos put cortos de strike menor). La lección sigue la descripción y la gráfica, y ninguna pregunta depende de esas fórmulas. **Pregunta para Cesar:** ¿hay alguna fuente (notas del curso) que confirme la estructura que se pregunta en el examen?
7. **Túnel bajista (página 282).** Su fórmula aparece rotulada "TUNEL ALCISTA" y su gráfica como "Ratio Call Spread Corto". Por la descripción (vender call y comprar put) y la gráfica (derecho a vender a 55, obligación de vender a 65) es el túnel bajista: call corto strike mayor + put largo strike menor.
8. **Liquidación en efectivo de opciones (página 266).** La definición dice "diferencia entre el precio del bien subyacente y el precio de mercado"; por las fórmulas de la página 267 debe entenderse diferencia entre el precio de ejercicio y el precio de mercado. La lección usa las fórmulas.
9. **Rho y la prima (página 285).** El manual afirma sin distinción que si sube la tasa sube la prima. En la teoría eso vale para los calls; en los puts la relación es inversa. Ninguna pregunta pregunta el sentido de rho en un put; la lección lo advierte en la explicación ampliada.
10. **Fórmula PRHO (páginas 287 y 288).** El manual usa el cambio relativo de la tasa: PRHO = PRIMA + RHO × ((TNVA − TANT) ÷ TANT), y así obtiene 9.9876. La definición habitual de rho usa el cambio en puntos porcentuales (daría 9.8760). La pregunta `l7.q11` sigue la fórmula del manual (es la fórmula precargada de la HP) y deja el otro método como distractor. **Pregunta para Cesar:** ¿confirmas que se use la fórmula del manual?
11. **Delta del put tras un cambio (página 286).** La interpretación "al disminuir el precio del subyacente se incrementa la Delta" debe leerse en valor absoluto: pasa de −0.3397 a −0.348020. La lección lo aclara.
12. **Paridad put-call (página 273).** El manual da la fórmula discreta C + X ÷ (1 + R)^t = S0 + P y, después, versiones con capitalización continua y dividendos. La pregunta `l7.q09` usa la discreta, que es la fórmula principal, y no pone como distractor el resultado continuo (4.3651) para evitar ambigüedad.

## Errores del OCR verificados contra la imagen del PDF

13. Página 258: el OCR dice 50 días, spot 19.77, tasa 7.72% y $20.0093; la imagen dice **90 días, 19.72, 7.2% y $20.0099**, que son los datos que reproducen los resultados.
14. Página 261: el OCR dice pérdida total de $272,500,000; la imagen dice **$22,500,000** (15,000 × 1,500).
15. Página 286: el OCR dice gamma 0.016 en el enunciado; la imagen dice **0.018**, consistente con el resultado 0.502.
16. Página 245: el fideicomiso de Asigna es el **F/30,430** (el OCR dice F/30,43D).
17. Página 255: la columna del futuro sobre el euro es ilegible en el OCR; de la imagen: clase EURO, liquidación en efectivo, 10,000 euros, ciclo mensual hasta 10 años, fluctuación 0.0001 pesos y puja de un peso. La pregunta `l4.q04` usa esos datos y lo anota en `notas`.
18. Página 256: la fluctuación mínima de los futuros sobre acciones es **$.01 por acción** (el OCR dice "$T1"); la tabla de futuros de tasas (TIIE, CETE, SWAP, Bonos M, UDI) se transcribió de la imagen.
19. Páginas 264 y 265: las gráficas de las posiciones básicas usan **strike $5 y prima $1** (el OCR lee "55" y "51").

## Discrepancias con el manual 2023

20. **Puja del swap.** AMIB 1 (página 263) dice 0.25 pb (0.0025%); el manual 2023 dice 0.0001 pb. La pregunta `l5.q08` sigue AMIB 1 y está marcada `por-verificar`.
21. **Tamaño del swap.** En la tabla de futuros de tasas (página 256) la clase SW mide $1,000,000; el contrato de swap de TIIE28 (página 263) mide $100,000, y el manual 2023 lista los swaps en $100,000. La lección los trata como dos contratos distintos (futuro sobre swap y contrato de swap). **Pregunta para Cesar:** ¿sabes si el examen pregunta el tamaño del futuro sobre swap?
22. **Posición opuesta.** AMIB 1 la define para efectos de AIM (largos de una serie contra cortos de otra serie de la misma clase); el manual 2023 la describe como los contratos que cancelan los abiertos. Se usó la definición de AMIB 1.

## Objetivos del temario que AMIB 1 no desarrolla

23. **Cuándo se fortalece o se debilita la base** (`liquidacion-en-mercados-organizados.o03`): AMIB 1 solo da la definición y el cálculo; no se generaron preguntas sobre fortalecimiento o debilitamiento.
24. **Condiciones regulatorias de Banco de México para liquidar swaps** (`contratos-de-swap.o02` de Derivados I): no aparecen en AMIB 1. No se preguntó. Requiere fuente externa (circulares de Banxico).
25. **Valor nocional de las opciones** (`contratos-de-opcion.o01` de Derivados II): AMIB 1 no trae fórmula ni ejemplo. El ejercicio del manual 2023 (puts del NAFTRAC) no coincide con ninguna de sus opciones si se calcula como strike × 100 × contratos (da $1,536,000). No se preguntó.
26. **Interés abierto y volumen de opciones** (`contratos-de-opcion.o06`): se resuelve con el mismo método que en futuros (lección 2); no se generaron preguntas separadas.
27. **Calcular el monto de la liquidación diaria** (página 249, Figura 3): el manual no trae un ejemplo propio; la lección 3 usa un ejemplo ilustrativo con el mismo método que el manual aplica a utilidades y pérdidas (página 261).

## Ejemplos propios (ilustrativos) que no están en el manual

28. Liquidación diaria del IPC (lección 3), paridad put-call con $4.20, $60, 9% y 3 meses, bull spread 20/24, straddle de strike 50 y cobertura delta de 5,000 calls (lección 7). Se calcularon con la lógica de las fórmulas del manual; no son cifras de AMIB.

## Vigencia

29. Quedaron con `vigencia: por-verificar` las 21 preguntas que dependen de condiciones de contratación, porcentajes, plazos u horarios que MexDer, Asigna o las autoridades pueden cambiar: l1.q08, l2.q14, l3.q03, l3.q05, l3.q06, l3.q08, l3.q10, l3.q11, l3.q15, l4.q04, l4.q05, l4.q08, l4.q13, l4.q15, l5.q04, l5.q08, l5.q10, l5.q15, l6.q06, l6.q10 y l7.q14. Conviene contrastarlas con las condiciones generales vigentes de MexDer y el reglamento de Asigna antes del examen.
