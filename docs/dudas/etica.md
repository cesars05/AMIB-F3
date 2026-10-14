# Dudas de contenido: Ética (lecciones 1 a 6)

Fecha: 2026-10-14. Alcance: `content/lecciones/etica/01` a `06` y `content/preguntas/generadas/etica.json` (90 preguntas, `g.etica.l1.q01` a `g.etica.l6.q15`).

Fuentes consultadas en este orden: `AMIB Data/AMIB_1_completo.md` (capítulo 1, páginas 5 a 27 del PDF, incluido el repaso del capítulo), las imágenes de las páginas 5 a 9, 11 y 19 a 22 de `AMIB 1.pdf` (renderizadas para leer tablas y diagramas que el OCR dañó), el manual oficial `AMIB Data/Manual_EBSPMV_completo.md` (páginas 9 a 80 del PDF, incluida la sección de respuestas del ensayo) y el manual 2023 (texto extraído). Las páginas citadas son las del PDF, que coinciden con los marcadores del OCR.

## Posibles erratas en las claves de los manuales

1. **Repaso de AMIB 1, pregunta 19 (p. 27).** El enunciado ("Lograr un mercado financiero eficiente, equitativo, transparente, seguro y de calidad con los estándares éticos, además de estar dispuesto a rendir cuentas...") reproduce literalmente el objeto de la **autorregulación** (p. 17), pero la clave del libro (p. 359) marca "Es el objeto del Código de Ética". El ingestor ya lo dejó en `borrador` con nota. Las preguntas generadas siguen el texto del manual: el objeto de la autorregulación no es objetivo del Código (`g.etica.l5.q06`, `g.etica.l5.q01`).

2. **Repaso de AMIB 1, pregunta 5 (p. 25).** La clave del libro dice que los principios **fundamentales** "establecen la forma de actuación de los profesionales". El texto del manual (p. 20) atribuye esa frase a los principios éticos **generales** y dice que los fundamentales "establecen los criterios de actuación en el mercado bursátil en particular". El manual 2023 distingue igual: generales, "establecen la forma de actuación"; fundamentales, "establecen el deber ser" (que coincide con la opción a de esa pregunta). Por la contradicción, `g.etica.l5.q13` quedó en `borrador`. **Pregunta para Cesar:** ¿se sigue el texto del manual (generales: forma de actuación; fundamentales: criterios de actuación) aunque contradiga la clave del libro?

3. **Ensayo del manual EBSPMV, pregunta 9.** El enunciado ("Establece un orden social obligatorio, no sujeto a la voluntad personal y se caracteriza por aplicarse de manera externa") describe la **norma jurídica** según el propio manual EBSPMV (p. 16) y AMIB 1 (p. 8). La sección de respuestas (p. 80) marca b) "moral"; el texto apunta a c) "derecho". La pregunta `etica-ensayo.09` está como `validada` con clave "moral" en `content/preguntas/oficial/etica-ensayo.json` (archivo que no es de este lote). Conviene revisarla. La lección 2 enseña que esa frase corresponde a la legalidad.

4. **Repaso de AMIB 1, pregunta 8 (p. 25).** La clave da "Prudencia" como principal característica del líder moral, mientras que el ensayo EBSPMV (pregunta 13) pregunta por la coherencia entre palabra y acción. No es contradicción estricta (el manual dice que el líder moral está guiado por la prudencia y que lo que más convence de él es la consistencia entre palabras y actos), pero un enunciado ambiguo puede tener dos respuestas defendibles. Las preguntas generadas distinguen las dos ideas (`g.etica.l3.q14` y `g.etica.l3.q15`).

5. **Repaso de AMIB 1, pregunta 3 (p. 25).** La clave del libro define el Código de Ética como "el conjunto de normas de mayor jerarquía dentro de la regulación expedida por cada entidad autorregulatoria". El manual EBSPMV (p. 54) lo describe como documento autorregulatorio y complemento de la normatividad, lo que se parece más a la opción b ("conjunto de normas que completa la regulación bursátil actual"). No se generó ninguna pregunta sobre esa definición.

## Diferencias entre fuentes (verificadas en la imagen del PDF)

6. **"Supervisores" o "superiores" (principio 1, p. 20).** AMIB 1 dice "informar de ello a sus supervisores" (confirmado en la imagen); el manual EBSPMV (p. 59) y el manual 2023 dicen "a sus superiores". El sentido es el mismo; `g.etica.l5.q05` cita AMIB 1.

7. **Definiciones de los principios éticos generales.** AMIB 1 (p. 20) y EBSPMV (p. 56) coinciden: imparcialidad, "tomar decisiones con base en criterios objetivos"; diligencia, "esmero, cuidado y oportunidad en el actuar". El manual 2023 define la imparcialidad como "no sacrificio de la justicia por intereses o consideraciones personales" y la diligencia solo como "esmero y cuidado". Las preguntas usan las definiciones de AMIB 1.

8. **Combinaciones de fin y objeto.** La tabla de AMIB 1 (p. 6, verificada en la imagen) tiene tres renglones; el manual EBSPMV (p. 27) agrega la cuarta (fin ilícito más medios ilícitos) y el manual 2023 solo tres. La lección presenta las cuatro y aclara la fuente.

9. **Características de los principios éticos.** AMIB 1 (p. 10) enumera obligatoriedad, generalidad, totalidad y permanencia; el manual EBSPMV (pp. 18 a 20) agrega conciencia y no coerción externa. `g.etica.l2.q04` pregunta expresamente por la lista de AMIB 1 y usa "coercibilidad" como opción falsa, que es falsa en ambas fuentes.

10. **Principio 3, igualdad de trato.** AMIB 1 (p. 22, imagen) imprime "principios de igualdad, trato y oportunidad"; EBSPMV y el manual 2023 dicen "igualdad de trato y oportunidad". Parece una coma de más en AMIB 1; la lección usa la segunda forma.

11. **Sujetos obligados (diagrama de la p. 19).** La columna de prestadores de servicios dice "Instituciones de Valores" (igual en EBSPMV, p. 55). La lección la interpreta como instituciones para el depósito de valores (Indeval). No hay pregunta que dependa de ese renglón.

12. **Fin de la moral.** AMIB 1 no dice cuál es el fin de la moral; el "bien común, que se logra mediante la justicia y las leyes" viene de los esquemas del manual EBSPMV (p. 10). Solo se usa como distractor (`g.etica.l1.q02`) y en la tabla de la lección 1.

## Datos que solo están en el manual EBSPMV o que pueden haber cambiado

13. **Origen legal de los organismos autorregulatorios.** AMIB 1 no menciona el art. 228 de la LMV, la lista de OAR en México ni el reconocimiento de la AMIB por la CNBV (20 de agosto de 2002). Todo viene del manual EBSPMV (pp. 46 a 50). Por eso `g.etica.l4.q13` cita ese manual (no AMIB 1, como pide la regla general de citas) y está marcada `por-verificar`. El manual 2023 dice que la CNBV "le confiere el carácter" de OAR también a BMV, MexDer, CCV, Indeval y Asigna, lo que no coincide del todo con EBSPMV (BMV, contrapartes centrales e Indeval lo son por ley). Conviene confirmar con la LMV vigente.

14. **Leyes citadas en el marco regulatorio.** El manual EBSPMV (p. 35) menciona la "Ley de Sociedades de Inversión", hoy Ley de Fondos de Inversión. La lección 4 lo indica; ninguna pregunta depende del nombre de la ley.

## Interpretaciones que conviene confirmar

15. **`g.etica.l6.q13` (viaje a cambio de la lista de clientes).** Podría leerse también como aceptación de un incentivo (principio 4). La clave sigue la ubicación expresa del manual EBSPMV (p. 69), que pone el ejemplo en el principio 6. Queda `validada` con nota.

16. **Rumor en los principios 2 y 5.** Ambos principios mencionan el rumor. Las preguntas siguen los ejemplos del manual EBSPMV: difundir rumores para elevar la demanda de un valor es principio 2 (p. 61; `g.etica.l5.q10`, cuyo distractor no incluye el principio 5 para evitar ambigüedad); recomendar con base en rumores no fundados es principio 5 (p. 68; `g.etica.l6.q08`). La pregunta 10 del repaso de AMIB 1 (operador que escucha rumores) tiene como clave el principio 2.

## Observaciones sobre la ingesta del capítulo 1 (no son de este lote)

17. La sección **1.2.1** ("Importancia y la utilidad de la Ética de la empresa", con el concepto de empresa y de ética de la empresa, p. 11) no aparece en ningún archivo de `content/manual/cap01/`: el corte pasa de `04-...` (1.1.5) a `05-...` (1.2.2). También la sección 1.1.3 quedó dentro de `02-conceptos-basicos.md`. Las lecciones se redactaron leyendo directamente `AMIB_1_completo.md`.

18. Vínculos de objetivos en `content/manual/cap01`: `09-etica-en-la-comunidad-bursatil-mexicana.md` está ligado a `codigo...o02`, pero su contenido corresponde a `etica-bursatil.o01`; `10-sanas-practicas-de-mercado.md` está ligado a `codigo...o07`, pero corresponde a `etica-bursatil.o02`; `19-principios-eticos-generales.md` no tiene objetivo y corresponde a `codigo...o06`. Las preguntas generadas usan los objetivos correctos.
