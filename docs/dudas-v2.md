# Dudas para la v2

Este documento reúne las dudas que no se pudieron resolver con las fuentes (primero `AMIB_1_completo.md`, luego el manual 2023 y las notas de Cesar). El detalle completo de cada área está en `docs/dudas/`. Aquí van primero las que necesitan una decisión de Cesar y después las que solo requieren verificación contra la regulación vigente.

## 1. Decisiones que necesita tomar Cesar
1. **Pregunta oficial tipo.32** (quién aprueba la sobrevaluación y subvaluación en fondos): el manual (7.3.7) no lo indica. Quedó con la opción en negritas y marcada "por verificar".
2. **Claves del libro (p. 359) que contradicen el manual.** Se conservó la clave oficial y la pregunta quedó en borrador:
   1. 1.19: el libro indica el Código de Ética; el manual (1.3.5) apunta a la autorregulación.
   2. 2.7: el libro indica el Comité; el manual (2.2) apunta al responsable de supervisar el cumplimiento.
   3. 2.8: el libro indica "cada dos años"; el manual (2.1.3) dice "en todo momento".
   4. 2.14: el libro indica "1 y 4"; el análisis del manual apunta a "1 y 2".
   5. 4.10: con las cifras legibles del OCR ninguna opción coincide con la clave.
   6. Ética, repaso 5: el libro contradice la p. 20 del manual sobre "forma de actuación". ¿Se sigue el texto del manual?
3. **Clave del ensayo de Ética, pregunta 9:** la clave dice "moral", pero el propio texto del manual apunta a "derecho". ¿Se corrige?
4. **Liquidación a 48 horas de CETES:** el manual usa la tasa de descuento directamente en la fórmula de tasa equivalente (resultado $9.8367); el método estricto da $9.8366. ¿Se sigue el método del manual?
5. **Arbitraje internacional con comisiones (Capitales, p. 176):** si la comisión de la BMV también aplica en la venta, no hay ganancia en ninguna dirección y la conclusión del manual es discutible. Las preguntas usan datos en los que ambos criterios coinciden. ¿El examen sigue el método del manual?
6. **Signo de la base en futuros (p. 259):** el manual la define como futuro menos contado, pero su ejemplo calcula contado menos futuro. Las preguntas siguen el ejemplo y no castigan la definición literal.
7. **Tabla de calificaciones:** ¿el mínimo global de corto plazo de Moody's se muestra como "3" (como está impreso) o como "P-3"?
8. **Temas que el manual no cubre** y que el temario o el examen podrían preguntar: VaR histórico y Montecarlo como cálculo, backtesting, pruebas de estrés, pérdida esperada y no esperada, escalas de corto plazo, plazo de liquidación de operaciones de capitales y cuándo se fortalece o debilita la base. ¿Se agrega otra fuente?

## 2. Erratas del manual detectadas y corregidas en las lecciones
1. Precio de salida del reporto impreso $9.988031; la fórmula del propio manual da $9.984428.
2. Ejemplo de CETES a 91 días con 15 transcurridos: impreso 5.166563 %, correcto 5.166663 %.
3. Bono M (p. 202): precio limpio del OCR 105.564023, correcto 105.664023.
4. Tabla de calificaciones (p. 299): "Aa3.mx" debe ser "Ba3.mx" y "mxA-" en el renglón B- debe ser "mxB-".
5. Arbitraje sin comisiones: el enunciado da TC $20.27 pero sustituye $20.15.
6. Fórmulas de ratio spread y túnel bajista (pp. 281 y 282) contradicen la descripción y las gráficas del manual; las lecciones siguen la descripción.
7. Cifras dañadas por el OCR en los repasos 4.1, 4.5 y 4.12, que se corrigieron con la clave oficial y el cálculo.

## 3. Datos que se deben verificar contra la regulación vigente
Están marcados en las preguntas con `vigencia: por-verificar` (horarios de subastas, TIIE y TIIE de fondeo, FIX, reglas de permuta, garantías de préstamo de valores, horarios de la BMV, organismos autorregulatorios, porcentajes y plazos normativos). El manual AMIB 1 tiene años y algunas cifras pueden haber cambiado; por ejemplo, el manual todavía dice "sociedades de inversión" en lugar de "fondos de inversión" y no menciona la TIIE de fondeo.

## 4. Supuestos del motor de estudio
Ver `docs/dudas/motor.md`: umbrales de los niveles de dominio, decaimiento por olvido, días de los simulacros integrales y meta de 75 % por área obligatoria.

## 5. Pendientes de contenido para la v2
1. Las cinco áreas no obligatorias (Servicios de Inversión, Marco Normativo, Matemáticas y Portafolios, Fondos, y Análisis Económico, Financiero y Técnico) quedaron a medias porque se alcanzó el límite de gasto mensual de la API. Se regeneran con `docs/prompts/`.
2. 34 de las 175 preguntas de repaso del libro no se pudieron extraer del OCR (sobre todo el capítulo 7). Se pueden transcribir a mano desde el PDF.
3. Tarjetas, videos, modo con IA (OmniRoute), exportación a Word y PowerPoint, y la fase de diseño visual.

## 6. Detalle por área
`docs/dudas/etica.md`, `capitales.md`, `deuda-l1-l4.md`, `deuda-l5-l8.md`, `derivados-financieros.md`, `derivados-riesgos.md`, `repasos.md`, `motor.md`.
