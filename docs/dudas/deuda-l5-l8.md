# Dudas de las lecciones 5 a 8 de Títulos de Deuda (reporto, valuación y subastas)

Archivos: `content/lecciones/deuda/05` a `08` y `content/preguntas/generadas/deuda-l5-l8.json`. Fuentes consultadas, en este orden: `AMIB Data/AMIB_1_completo.md` (OCR, capítulo 6, páginas 196 a 208 del PDF, y 160 para garantías del préstamo de valores), las imágenes de esas mismas páginas de `AMIB 1.pdf` (renderizadas para leer lo que el OCR dañó), el manual 2023 y las notas de Cesar (`AMIB Fig 3_vf.docx`). Las páginas que se citan son las del PDF, que coinciden con los marcadores `<!-- page N -->` del OCR.

## Errores del manual detectados (resueltos con el cálculo)

1. **Precio de salida del reporto (página 198).** El manual imprime $9.988031, pero su propia fórmula da 9.977222 × (1 + 6.5 × 4 ÷ 36000) = **9.984428**. Se comprobó con el premio: 501,141 títulos × 0.007206 ≈ $3,611.11, que sí coincide con el premio del manual. La lección usa 9.984428 y advierte del error. Para obtener 9.988031 haría falta una tasa de 9.75%, que no aparece en el ejercicio.
2. **Tasa de descuento del ejemplo de 91 días con 15 transcurridos (página 201).** El manual imprime 5.166563%; con sus datos (precio $9.890926 y 76 días) resulta **5.166663%**. A 4 decimales cambia el resultado (5.1666% frente a 5.1667%). La lección muestra el valor calculado y menciona la diferencia.

## Errores del OCR verificados contra la imagen del PDF

3. Página 197: el OCR dice tasa de descuento de 8.72%; la imagen dice **8.2%**, que es la que reproduce el precio de entrada $9.977222.
4. Página 202: el OCR dice precio limpio $105.564023; la imagen y el cálculo dan **$105.664023** (consistente con el precio sucio 105.8529).
5. Página 208: el OCR dice "ciclo de 25 días" para la cuenta única; la imagen y las notas de Cesar dicen **28 días**. La pregunta `g.deuda.l8.q10` usa 28 y lo anota en `notas`; su cita textual evita la cifra.
6. Página 197: la tabla de calificaciones mínimas para reporto quedó ilegible en el OCR. Se transcribió de la imagen. La celda de Moody's en escala global de corto plazo dice solo "3" (probablemente P-3). Moody's local de largo plazo aparece como "Aa3.mx" en AMIB 1 y "Aa3-mx" en el manual 2023. **Pregunta para Cesar:** ¿confirmas "3" tal como está impreso, o prefieres mostrar "P-3"?

## Decisiones de método que conviene confirmar

7. **Liquidación a 48 horas de CETES (página 201).** El manual mete la tasa de descuento (8.4%) directamente en la fórmula de tasa equivalente, aunque esa fórmula está planteada para una tasa de rendimiento. El procedimiento estricto (convertir a rendimiento, llevar a 70 días y regresar a descuento) da un precio de $9.836628 frente a $9.836705 del manual; a 4 decimales ambos son $9.8366 y $9.8367. Las preguntas `g.deuda.l6.q11` y `q12` siguen el método del manual. **Pregunta para Cesar:** ¿se queda así, como lo pide el manual?
8. **Fórmulas de bonos reconstruidas.** El manual no imprime las fórmulas TASA.FIJA.182 ni BONO.S/TASA, solo las teclas. Las que se muestran en la lección 7 se reconstruyeron y reproducen a 6 decimales los cuatro ejemplos del manual (Bono M 105.664023, Udibono 96.121811, BPAG91 98.890348 y BPA182 98.9226) y la pregunta de repaso 6.23 (103.3946). En BONO.S/TASA el cupón vigente se toma a la tasa cupón, los cupones futuros a la tasa líder y todo se descuenta a tasa líder más sobretasa.
9. **Tasa líder del BPA182.** El ejemplo del manual usa "la tasa de CETES semestral"; la tabla del manual 2023 describe el BPA como "tasa CETES + tasa inflación". La lección sigue el ejemplo de AMIB 1 y no profundiza en la protección contra la inflación porque el manual no da más detalle.
10. **Udibono en pesos (página 202).** El manual imprime $466.951874; el producto 96.121811 × 4.857918 da 466.951876. La diferencia está en el sexto decimal y no afecta a 4 decimales.

## Datos regulatorios o que no están en AMIB 1

11. **Garantías del préstamo de valores.** El capítulo 6 no las menciona; están en 5.3.5 (página 160). La pregunta `g.deuda.l5.q10` cita esa página y está marcada `por-verificar`.
12. **Colocación en jueves, horarios de convocatoria del IPAB y plazo del reporto de 1 a 360 días** provienen del manual 2023 y de las notas de Cesar; AMIB 1 no los menciona. Se usan en la lección como complemento y no son clave de ninguna pregunta.
13. **Horarios de subastas y permuta** (11:30, 11:00, 10:00, 12:00, 30 y 60 minutos, 60% de posición larga neta) son disposiciones de Banxico que pueden cambiar. Las preguntas correspondientes quedaron con `vigencia: por-verificar`. Conviene contrastarlas con la circular vigente de Banxico antes del examen.
14. **Duración y convexidad** no se incluyeron: no forman parte de los objetivos del capítulo 6 en `content/taxonomia.json`.
