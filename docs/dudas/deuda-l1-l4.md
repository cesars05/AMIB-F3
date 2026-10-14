# Dudas de contenido: Títulos de Deuda, lecciones 1 a 4

Fecha: 2026-10-14. Alcance: `content/lecciones/deuda/01` a `04` y `content/preguntas/generadas/deuda-l1-l4.json`.

Fuentes consultadas en este orden: `AMIB Data/AMIB_1_completo.md` (capítulo 6, secciones 6.1.1 a 6.2.4, más 6.4.2 y 6.5.1 a 6.5.3 para los ejemplos y las subastas), las notas de Cesar (`AMIB Data/AMIB Fig 3_vf.docx`) y el manual 2023 (texto extraído del PDF). Cada punto indica qué se verificó y qué decisión se tomó mientras Cesar no confirme.

1. **Primer reintento de la TIIE.** El OCR del manual (p. 184) imprime "12:15:50 oras". Las notas de Cesar y el manual 2023 dicen 12:15, y la secuencia del procedimiento (12:00, 12:15, 12:30) lo confirma. Se adoptó 12:15:00 (pregunta `g.deuda.l1.q08`, con nota).

2. **Vigencia del procedimiento de la TIIE.** El manual describe la TIIE por cotizaciones (mínimo seis instituciones) y el manual 2023 la da a plazos de 28 y 91 días. No menciona la TIIE de fondeo ni el posible retiro de los plazos de 91 y 182 días que Banxico ha anunciado en años recientes. Las preguntas de TIIE quedan con vigencia `por-verificar`. Conviene confirmar qué versión evalúa el examen vigente.

3. **Quién calcula la UDI.** El manual (p. 186) dice que el INEGI la calcula los días 10 y 25 y que Banxico da a conocer su valor esos días. En la práctica el INEGI publica el INPC y Banxico calcula y publica la UDI. La lección sigue el manual y la pregunta `g.deuda.l1.q05` solo afirma que Banxico da a conocer su valor los días 10 y 25, lo cual es correcto con ambas lecturas.

4. **Tasa del BPA182.** El manual (p. 190) la describe como "Tasa de Referencia más Protección contra la Inflación (Opción)", con referencia a CETES a 182 días. Las notas de Cesar la describen como el máximo entre la inflación del periodo (cambio de la UDI) y la tasa de CETES a 182 días. El manual 2023 dice "tasa CETES más tasa inflación" en su tabla y "tasa CETES 182 o cambio del valor de la UDI" en la ficha. Las tres versiones no coinciden; por eso no se generó ninguna pregunta sobre la mecánica exacta del BPA182.

5. **BONDES F.** El manual AMIB 1 no los menciona (solo BONDES D y su variante BONDE91, referenciados a la Tasa Ponderada de Fondeo Bancario). Si el examen vigente incluye BONDES F (referenciados a la TIIE de fondeo), habría que agregarlos a la lección 3.

6. **Subasta de CETES a tasa múltiple y días de la semana.** Que las subastas regulares de CETES sean a tasa múltiple proviene de las notas de Cesar; el manual AMIB 1 solo define los tipos de subasta (p. 205) sin asignarlos a CETES. Que las posturas sean en martes y la liquidación en jueves proviene de las notas y del manual 2023 (colocación siempre en jueves salvo día inhábil). La lección lo presenta como dato por verificar y ninguna pregunta depende de ello.

7. **Moneda de los intereses de los UMS.** El manual (p. 190) dice que los UMS "devengan intereses en pesos cada seis meses", aunque están denominados en divisas distintas al peso. Parece un arrastre del texto de los Bonos M. Las preguntas solo usan el valor nominal (1,000 dólares) y la forma de colocación.

8. **Plazos emitidos de UDIBONOS.** El manual AMIB 1 dice 3, 5 y 10 años; el manual 2023 dice 3, 10 y 30 años en la ficha y 3, 10 y 20 en su tabla. La lección sigue el manual AMIB 1 y no se pregunta el dato.

9. **CBICs frente a PIC-FARAC.** El manual AMIB 1 distingue plazo (CBICs: se establece en la colocación; PIC-FARAC: 5 a 30 años) y periodicidad (CBICs: mensual, trimestral o semestral; PIC-FARAC: 182 días). El manual 2023 atribuye a ambos 182 días y 5 a 30 años. Se siguió el manual AMIB 1 (pregunta `g.deuda.l3.q14`).

10. **Plazo de los pagarés corporativos.** El OCR es ilegible ("Va de la? años", p. 194). El manual 2023 dice "de 1 a 7 años" y las notas de Cesar "de 1 año en adelante". La lección usa "de 1 a 7 años"; no hay pregunta sobre este dato.

11. **Bonos Bancarios para la Vivienda.** En la p. 193 el OCR coloca, bajo ese subtítulo, la definición general de obligaciones (crédito colectivo a cargo de una sociedad anónima y sus tres tipos: hipotecarias, quirografarias y convertibles). Parece un problema de maquetación en dos columnas: el texto propio de los bonos para la vivienda no aparece. Las notas de Cesar asignan esos tres tipos a los bonos para la vivienda; la lección los presenta como tipos de obligaciones, que es lo que dice el propio texto ("Existen 3 tipos de obligaciones"). Convendría revisar la página en el PDF.

12. **Ejemplo de Bono M en la p. 202.** El OCR imprime precio limpio 105.564023, intereses 0.1889 y precio sucio 105.8529. La suma no cuadra. El recálculo con la fórmula de bono a tasa fija (720 días, cupón 8.5 %, rendimiento 5.47 %) da precio limpio 105.664023 e intereses 0.188889, y su suma, 105.852912, coincide con el precio sucio impreso. Se concluye que el precio limpio correcto es 105.664023 (error de OCR o de impresión).

13. **Ejemplo de UDIBONO en la p. 202.** El enunciado del OCR dice que la UDI vale "54.857913", pero los cálculos usan 4.857918. Con los datos redondeados que imprime el manual, 96.121811 por 4.857918 da 466.951876 y el manual reporta 466.951874; la diferencia es de redondeo. La lección cita el valor del manual.

14. **Proveedores de precios autorizados.** Que en México haya dos (PIP y Valmer), autorizados y supervisados por la CNBV, proviene de las notas de Cesar; el manual no lo menciona. Se dejó solo en la explicación ampliada, como dato por verificar.

15. **Claves de emisión.** Las claves BI, LD, M, S, IM, IQ e IS provienen del manual 2023 (pp. 56 y 57); el manual AMIB 1 no las trae. La pregunta tipo oficial 21 ("Un IM emitido por el IPAB es un bono...") muestra que el examen las usa. La pregunta `g.deuda.l3.q15` queda en `borrador` hasta confirmar la fuente.

16. **Hora de posturas de los valores del IPAB.** El OCR de la p. 206 imprime "10:00:0D"; el manual 2023 confirma las 10:00 horas del día hábil anterior a la colocación. Se adoptó 10:00:00 (pregunta `g.deuda.l3.q11`, con nota).

17. **Operaciones que integran la Tasa Ponderada de Fondeo Gubernamental.** El manual dice "se incluyen las operaciones en reporto" con títulos gubernamentales, mientras que para la bancaria dice expresamente "en directo y en reporto". La lectura de que la gubernamental considera solo reporto se apoya en ese contraste y en las notas de Cesar. Las preguntas `g.deuda.l1.q03` y `g.deuda.l1.q06` dependen de esta lectura.

18. **Bonos M como "familia de más reciente creación".** El manual lo afirma, pero el dato es antiguo (posteriormente se crearon otros instrumentos, como los BONDES F). La lección lo atribuye al manual y no se pregunta.

19. **Definición de CEDES en el manual 2023.** El manual 2023 define el CEDE como certificado de depósito de almacenes generales, que es otro título. Se ignoró y se siguió el manual AMIB 1.

20. **Ubicación del objetivo de indicadores de Banxico.** En el temario, "Señalar la utilidad de los indicadores" pertenece al subtema Subastas (Títulos de Deuda II), pero en el manual es la sección 6.1.9. Se incluyó en la lección 1 por el orden del manual; la pregunta `g.deuda.l1.q10` lleva el objetivo del subtema Subastas.
