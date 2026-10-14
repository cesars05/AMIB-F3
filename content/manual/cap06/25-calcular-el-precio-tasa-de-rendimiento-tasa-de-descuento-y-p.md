---
capitulo: 6
numero: "6.4.1"
numeroOriginal: "6.4.1"
correccionNumero: "ninguna"
titulo: "Calcular el precio, tasa de rendimiento, tasa de descuento Y plazo de los instrumentos que cotizan a descuento"
origen: "encabezado"
paginas:
  inicio: 200
  fin: 201
objetivoId: "deuda.titulos-de-deuda-ii.valuacion-de-bonos.o01"
objetivoCandidato: "deuda.titulos-de-deuda-ii.valuacion-de-bonos.o01"
confianza: 0.949
exclusivoFig3: false
fig3Parcial: false
---

(con cálculos al vencimiento y entre fechas).

Formulas a Utilizar

- — Esta fórmula sirve para encontrar tanto el PRECIO del título como la Tasa de DESCUENTO,
SPR = VN x (1 (*TD X DIAS=36000))

Donde: SPR — Precio 5TD — Tasa de descuento YN — Yalor nominal DIAS — Dias por vencer

- Esta fórmulz sirve para encontrar tanto el PRECIO del título como la Tasa de RENDIMIENTO.
SPR=VN + (1 + (XTR x DIAS +36000))

Donde:

SPR — Precio TR — Tasa de rendimiento YN — Yalor nominal DIAS — Cías por vencer

= Estafórmula sirve para encontrar tanto la tasa de DESCUENTO como la tasa de RENDIMIENTO.

%TD = %TR + ( 1+( 9ATA X DIAS = 36000 )) Donde:

%TD — Tasa de descuento — *%TR - Tasa de rendimiento DIAS — Dias por vencer

- Esta fórmula sirve para determinar la TASA EQUIVALENTE a través de la curva de tasas.
%ATEQUI = ((( %TR X DIAS + 36000) + 1 ) 1 (DIAEQ +DIAS ) — 1 ) X 35000 <DIAEQ

Donde:

%TEQUI — Tasa equivalente TR — Tasa en el plazo original (Desc a Rend). DIAS — Dias o plazo original DIAEQ — Plazo al cual que me quiero llevar la tasa.

198 -

EZl

1a)

E .

Ea — 0

<!-- page 201 -->
E=3

É

ES E E

E=

Instrumentos Ejemplo: que Cotizan ¿Cuál es el precio de unos CETES que tienen 94 días por vencer y una tasa de a Descuento descuento del 4.52%? Utilizando la fórmula de PRECIO. DESCTO de la calculadora financiera HP, capturamos los datos: [vN] = 10 (*%TD] = 4.52 [DIAS] = 94 Solicitamos el precio: [SPR] = $9.881978

Para calcular la tasa de rendimiento, utilizamos la fórmula DESC.REND de la calculadora financiera HP:

P4TD] = 4.52

[DIAS] = 94

Solicitamos la tasa de rendimiento: [4TR) = 4.573983%

Ejemplo:

¿Cuál es la tasa de descuento de unos CETES a Y1 días y tiene 15 días transcurridos y un precio de $9.8909267

Utilizando la fórmula de PRECIO.DSCTO de la calculadora financiera HP, capturamos los datos:

IYN]=10

[SPR] = 9.890926

[DIAS] = 91-15=76

Solicitamos la tasa de descuento: [%TD] = 5.166563%

Ejemplo Determine el precio de liquidación de un CETES can 72 úías por vencer, tasa de descuento 8.4%, liquidando a 48 horas.

Paso 1

Con la fórmula de tasa equivalente, no llevamas la tasa del 8.4% a 72 dias a 70 días %TR = B.4

DIAS = 72

DIAEQ = 70

Solicitamos [*TEQUI] = 8.39805%

Pasa 2

[VN] = 10

[4TD) = 8.39805 Tasa de descuento equivalente a 70 días (DIAS] = 70

Solicitamos el precio: [SPR] = $9.8367

- 199

<!-- page 202 -->
