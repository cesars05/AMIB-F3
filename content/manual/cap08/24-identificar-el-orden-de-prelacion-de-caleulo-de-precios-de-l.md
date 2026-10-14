---
capitulo: 8
numero: "8.4.7"
numeroOriginal: "8.4.7"
correccionNumero: "ninguna"
titulo: "Identificar el orden de prelación de cáleulo de precios de liquidación de los contratos de futura listados en el Mercado Mexicano de Derivados (MexDer)."
origen: "encabezado"
paginas:
  inicio: 257
  fin: 259
objetivoId: "derivados.derivados-financieros-i.contratos-de-futuro.o05"
objetivoCandidato: "derivados.derivados-financieros-i.contratos-de-futuro.o05"
confianza: 1
exclusivoFig3: false
fig3Parcial: false
---

Orden de Finalizado una sesión de negociación, MexDer calculará los precios de liquidación diaria

Prelación para cada serie, de acuerdo con el orden de prelación y la metodología siguientes:

a) El -álculo del Precio de Liquidación diaria, en primera instancía, + =rá el precio yue resulte del promedio ponderado de los precios pactados en las operaciones de los Contratos de Futuro celebradas durante los últimos 5 minutos de la sesión de negociación por Serie y ajustado a la Puja más cercana.

En caso que no se hayan concertado operaciones durante el periodo que se

establece en el inciso anterior, el Precio de Liquidación Diaria para cada Serie será

el precio promedio ponderado por volumen de las Posturas y/o Cotizaciones en firme vigentes al final de la sesión de negociación.

€) Si al cierre de la sesión no existe al menos una Postura de compra y una de venta para un Contrato de Futuro con misma Fecha de Vencimiento, el Precio de Liquidación Diaria será el Precio Futuro pactado en la última operación celebrada durante la sesión de remate,

d) si durante la sesión de remate no se hubiese celebrado operación alguna para una Fecha de Vencimiento de un Contrato de Futuro, el Precio de Liquidación Diaria será el que se ohtenga de la subasta convocada por MexDer en términos de su reglamento.

e) Si en la subasta anterior el mayor precio de compra resulta inferior al menor precio de venta, el precio de hquidación diaria será el promedio ponderado por volumen de las posturas y/o cotizaciones en firme vigentes al final de la sesión de negociación, conforme a la fórmula del inciso anterior.

£Lei AZÉ — 2— L-———— — -- ——- . -- a

Pág. 755

<!-- page 258 -->
84.8. Calcular precios futuros de los contratos listados en el Mercado Mexicano de Derivados (MexDer) de los diferentes subyacentes

Precio Futuro

del IPC Con la fórmula PRECIO.FUTURO de la caleuladora financiera HP:

PRECIO.FUTURO:PFWD=(1+(TMAY + 36000 X DIAS)) + (1+(TMEN + 36000 X DIAS)) X SPOT

Donde:

PFWD — Precio Fwd o teórico

TMAY- Tasa pesos o costo financiero

DIAS = Días del contrato

TMEN — Tasa dólares o tasa de rendimiento

SPOT — Tipo de cambio o precio actual del subyacente.

Ejemplo:

Se parta un contrato de Futuro a 50 días sobre el IPC, sí en promedio este indice paga dividendos de 2% anual y que la tasa de interés es del 7% anual. Considerando que el nivel del indice al momento de ser pactado es de 45,200. ¿Cuál es el precio del Futuro?

[PAWD] = ¿? [SPOT] =45,200 [TMAY] =7 ITMEN] =2 [DIAS] — =90

Pedimos PEWD = 45,762 es el Precio Futuro del IPC.

Precio Teórico Ejemplo:

Futuro del Délar — El tipo de cambio spot se encuentra en 19.72 pesos por dólar; la tasa de referencia en México es del 7.2% anual y la tasa en EVA es del 1.3% anual; calcular el precio teórico del contrato de futuro a 90 días:

Can la fórmula PRECIO.FUTURO de la calculadora financiera HP:

[PFWD] =? [SPOT] =19.77 [TMAY] =7.72 [TMEN] =1.3 IDIAS)] =90

Pedimos PFWD = $20.0093 es el Precio Futuro del dólar.

Pág. 256

a =

<!-- page 259 -->
Ea T

E 1

Es E

E e s

L:

m .
