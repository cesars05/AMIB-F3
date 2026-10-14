# Dudas de las lecciones de Mercado de Capitales (lecciones 1 a 7)

Archivos: `content/lecciones/capitales/01` a `07` y `content/preguntas/generadas/capitales.json` (105 preguntas, ids `g.capitales.l1.q01` a `g.capitales.l7.q15`). Fuentes consultadas, en este orden: `AMIB Data/AMIB_1_completo.md` (OCR del capítulo 5, páginas 153 a 179 del PDF), las imágenes de las páginas 153 a 179 de `AMIB 1.pdf` renderizadas con `pdftoppm` para leer lo que el OCR dañó (en particular 155, 158, 160 a 163, 165 a 170 y 174 a 179), el manual 2023 (texto extraído) y la pregunta oficial `tipo.16` de `Preguntas Tipo.docx`. Las páginas citadas son las del PDF, que coinciden con los marcadores `<!-- page N -->` del OCR. Todas las citas textuales de las preguntas se verificaron por script contra el texto de su página.

## Errores del OCR verificados contra la imagen del PDF

1. **Rendimiento efectivo (página 158).** El OCR dice "cotización en la BMV era de 526.74" y, en la lista de variables, "VINI = 25.74". La imagen dice $26.74 en ambos lugares, que es el valor que reproduce el resultado del manual (28.62 ÷ 26.74 − 1 = 7.030665%).
2. **ADR (página 174).** El OCR del enunciado dice US$16.87; la imagen dice US$16.82, que reproduce $64.79.
3. **Dividendo en acciones (página 177).** El OCR dice "AN = 1"; la imagen dice AN = 2, consistente con 25.20 × 10 ÷ 12 = $21.00. El OCR del dividendo de ALFA dice "DIV = 038"; la imagen dice 0.98.
4. **Split de GMODELO (página 179).** El OCR imprime 54.541744; la imagen y el cálculo dan **$4.641744** (74.50 × 2 ÷ 32.1).
5. **Horario de BIVA (página 161).** El OCR dice "Subasta de apertura para warrants 08:00:00 a 06:30:00"; la imagen dice 08:30:00.
6. **Variación de un índice (página 165).** La tabla del ejemplo quedó ilegible en el OCR; se transcribió de la imagen (rendimientos 3.00%, −4.00%, 2.40%, 4.50%, −0.20%; pesos 25%, 24%, 20%, 17%, 14%), que reproduce 1.007% y 101.007 puntos.
7. **Postura a mercado de BIVA (página 159).** El OCR dice "MET"; se transcribió como MKT (sigla de market). Es lectura probable; la imagen tampoco es nítida.

## Posibles erratas del propio manual

8. **Arbitraje sin comisiones (página 176).** El enunciado da un tipo de cambio de $20.27, pero la lista de variables y la sustitución usan $20.15. Además, 5.13 ÷ 2 × 20.15 = 51.684750 exactamente; el manual imprime $51.69 (con $20.27 sería $51.9926). En ambos casos la decisión es la misma (largo BMV, corto NYSE). La lección muestra los dos datos y la nota.
9. **Arbitraje con comisiones (página 176): conclusión discutible.** El manual suma la comisión al precio de la BMV ($58.50 × 1.012 = $59.20), la compara con el equivalente del ADR ($58.80) y concluye "comprar en NYSE y vender en BMV". Sin embargo, si la comisión también se paga al vender en la BMV, el ingreso neto sería 58.50 × 0.988 = $57.80, menor que el costo de $58.80 en NYSE: con esos datos no habría utilidad en ningún sentido. La lección reproduce la respuesta del manual y explica que la comisión vuelve inconveniente la compra en la BMV. Las preguntas del banco (`l6.q08`, `l6.q12`, `l6.q13`) usan datos en que el criterio del manual y el de utilidad neta coinciden, para no depender de esta ambigüedad. **Pregunta para Cesar:** ¿confirmas que el examen sigue el criterio del manual (sumar la comisión al precio y comparar) aunque no garantice utilidad?
10. **Rendimiento anualizado (página 158).** El enunciado pide el rendimiento "efectivo y anualizado", pero el manual solo resuelve el efectivo. Se usó la convención de las preguntas oficiales (interés simple, año de 360 días): 7.030665 × 360 ÷ 210 = 12.0526%. La pregunta `l2.q06` quedó en `borrador` por esta razón.

## Decisiones de método que conviene confirmar

11. **Rendimiento con dividendos (`l2.q11`, borrador).** La fórmula de 5.3.1 no incluye dividendos. Se sumó el dividendo al valor final porque la página 155 dice que el rendimiento de la acción se compone de dividendos y ganancias de capital.
12. **Eventos simultáneos (`l7.q09`, borrador).** El orden "primero se resta el dividendo en efectivo y después se reparte entre AN + AA" se tomó de la pregunta oficial `tipo.16` (clave $18.10). AMIB 1 no trata eventos simultáneos. Con el orden inverso el resultado cambia en el segundo decimal.
13. **Rendimiento con split entre compra y venta (`l7.q12`, borrador).** Combina 5.3.1 con 5.9.1; el manual no presenta el caso combinado.
14. **Índice ponderado por capitalización (`l4.q11`, borrador).** El manual da los pesos ya calculados; aquí se derivan de la capitalización (el objetivo pide considerar la ponderación de las acciones). Es matemáticamente equivalente a multiplicar el índice por la razón de capitalizaciones.
15. **Comisión en ambos mercados (`l6.q12`, borrador).** El planteamiento viene del manual 2023 (sección 2.14.3). La fórmula de la HP 17bII+ ADR.EUA.ARBITRAJE (variables $ACC, $ADR, RATIO, TCAM, COM) también es del manual 2023; las láminas solo la usan con COM = 0 porque no se pudo confirmar cómo entra la comisión en ese solucionador.
16. **Certificados de participación amortizables.** AMIB 1 solo define los no amortizables (página 155). La caracterización de los amortizables (pagan el valor nominal y se estudian como deuda) es una inferencia didáctica de la lección 1; ninguna pregunta depende de ella salvo como distractor (`l1.q06`).
17. **Derechos corporativos y patrimoniales.** AMIB 1 los menciona sin detallarlos; el contenido (voz y voto, suscripción; reparto de utilidades) proviene del manual 2023.

## Discrepancias entre AMIB 1 y el manual 2023

18. **Etapa 2 del precio de cierre en la BMV.** AMIB 1: de 15:01:00 a 15:05:59 con ejecución a más tardar a las 15:06. Manual 2023: de 15:01 a 15:09:59 con ejecución a las 15:10. Se siguió AMIB 1 (`l3.q06`); ninguna opción usa los horarios del manual 2023 para no castigar a quien los haya estudiado.
19. **Revisión del IPC.** AMIB 1 distingue reconstitución (tercer viernes de marzo y septiembre) y reponderación (tercer viernes de junio y diciembre); el manual 2023 dice "revisada de manera semestral (junio y diciembre)". Se siguió AMIB 1 (`l4.q13`).
20. **Índices internacionales.** Latibex: 34 emisoras (AMIB 1) frente a 24 (2023). Bovespa: indicador de 70 emisores (AMIB 1) frente a 50 (2023). Nikkei 225: el manual 2023 dice "integrado por 500 compañías", probablemente un error. Se siguieron las cifras de AMIB 1 y ninguna pregunta usa las cifras en conflicto como clave.
21. **Entrada de México al MILA.** AMIB 1: "en diciembre de 2014 se oficializó la entrada"; manual 2023: incorporación en junio de 2014 y primera operación el 2 de diciembre de 2014. Ninguna pregunta pregunta el mes; el año (2014) coincide.

## Datos regulatorios o sujetos a cambio

22. Horarios de sesión (BMV y BIVA), pujas, lotes, porcentajes de suspensión (15%; −7%, −13% y −20%), filtros de precio (5%) e importe ($200, $500, $800 y $1,400 millones), criterios y límites de los índices (35 emisoras, 25% y 60%, 10%, 15%, 10 mil millones, 50 millones, 52 empresas del FTSE BIVA), requisitos y causales del formador de mercado, funciones del analista independiente y reglas del préstamo de valores son disposiciones de las bolsas, de la CNBV o de Banxico. Las 39 preguntas que dependen de ellos están marcadas `vigencia: por-verificar`. Conviene contrastarlas con los reglamentos vigentes de la BMV y de BIVA antes del examen.
23. En el filtro de importe de $1,400 millones, el manual escribe los ETF con la serie marcada con un asterisco (DIA, DLN, DVY, EWJ, EWZ, IVV, QQQ, SPY). Se omitió el símbolo por la regla de estilo.

## Temas del temario que el capítulo 5 de AMIB 1 no cubre

24. **Liquidación de las operaciones de capitales.** El temario general del área menciona la liquidación, pero el capítulo 5 no indica el plazo de liquidación de acciones (por ejemplo, T+2). No se incluyó ningún dato ni pregunta. **Pregunta para Cesar:** ¿tienes en tus notas el plazo vigente que pide el examen?
25. **Notas estructuradas con componentes de capital** (objetivo `conceptos-basicos.o06`): AMIB 1 no las describe; no se incluyeron.
26. **Préstamo de valores** también se estudia en Títulos de Deuda (lección 5, preguntas `g.deuda.l5.q04`, `q10` y `q15` sobre el plazo de 5 días, las garantías y el premio). Para no duplicarlas, las preguntas de capitales se enfocan en la condición del prestamista, quién puede prestar, la autorización de la CNBV y la regulación de Banxico.
