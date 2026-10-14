---
capitulo: 8
numero: "8.4.11"
numeroOriginal: "8.4.11"
correccionNumero: "ninguna"
titulo: "Calcular el valor nocional de los contratos de futuro listados en el MexDer."
origen: "encabezado"
paginas:
  inicio: 259
  fin: 261
objetivoId: "derivados.derivados-financieros-ii.contratos-de-futuro.o02"
objetivoCandidato: "derivados.derivados-financieros-ii.contratos-de-futuro.o02"
confianza: 0.955
exclusivoFig3: false
fig3Parcial: false
---

Valor Nocional

Nocional por ;:Ief¡n¡ción: Es el importe total en pesos que ampara en un contrato. Las fórmulas se utilizan en función del subyacente que corresponda: Divisas NOCIONAL.DA.USD:NOUSD = TOC x 4CON x 10,000 Donde:

NOUSD - Valor nocional del contrato TDC - Tipo de cambio HCON — Numero de contratos operados

— T —

Púg. 257

<!-- page 260 -->
IPC

NOCIONALIPC:MOIPC = IPC x KCON x 10 Donde: NOIPC — Valor nocional del contrato IPC = Puntos del IPC 4CDN — Número de contratos operados

Acciones

NOCIONALACCION:NOACC = SAC x 4CON x 100 Donde: NOACEL — Yalor nocional del contrato SAC — Precio de la Acción K4CON — Número de contratos operados

Ejemplo 1:

Supongamos, que se desea poner largo en futuros a un plazo de 91 días, cuando el tipo de cambio SPOT cotiza a la compra en 15.4054 y la venta en 15.9420. La tasa en USD a 90 días es de 0.8% nominal, y la tasa en nuestro pais en 91 días se ubica en niveles del 4.5%.

¿Cuaál será el preció pactado o futuro de este contrato si el monto que se desea cubrir es 1'000,000 de 4SD? ¿Cuál será el valor nocional del contrato en pesos?

Procedimientos

1. Primeraidentifico el SPOT a utilizar: SPOT = $15.9420, Elijo el tipa de cambio de venta debido a que estoy comprando a futuro (Caza de cambio vende — Cliente compra].

2. Aplicola:FOrmula: Con la fármula PRECIO.FUTURO de la calculadora financiera HP: [SPOT] = 159420 (TMYA] =4,5 (TmINRY =08 [DIAS] = gi Pedimos PFWD = $16.090801 es el Precio Futuro del dólar.

3. Paracafcular el NOCIONAL, identificamos variables: NOUSD = ¿? TDC = 165.090801 HCON = 10,000

No, De Comtratos = 100 (cada contrato vale 10,000 dólares x 100 = 1'000,000) Multipficamos: 100 x 10000 x 16.090801 = 516'090,801 es el Nocional de esta operarión.

Pág. 258

<!-- page 261 -->
EXS

Ejemplo 2: ¿Cuál será el valor nocional de mí operación, si compre 20 contratos del DA en el Mexder con un valor de $15.75 por dólar?

Identificamos Variables: NOUSD = ¿? TDC = 15,75 HCON = 20

Multiplicamos: 20 x 10000 x 15.75 = $3'150,000 es el Nocional de esta operación

Ejemplo 3: ¿Cuál será el valor nociona!l de mi operación si vendi 10 contratos de futuro del !1PC en el Mexder con un nivel de 45,240 puntos?

Con la fórmula NOCIONAL de la calculadora financiera HP:

Donde: NOIRC =? IPC = 45,240 HCON = 10

Multiplicamos: 10 x 10 x 45'240 = $4'524,000 es el Nocional de esta operación
