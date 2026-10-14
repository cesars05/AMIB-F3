---
capitulo: 8
numero: "8.6.21"
numeroOriginal: "8.6.20"
correccionNumero: "dudosa"
titulo: "Identificar la formación de Ratio Spread Cail y Put, Tunel, Condor."
origen: "encabezado"
paginas:
  inicio: 281
  fin: 285
objetivoId: "derivados.derivados-financieros-ii.contratos-de-opcion.o14"
objetivoCandidato: "derivados.derivados-financieros-ii.contratos-de-opcion.o14"
confianza: 0.968
exclusivoFig3: false
fig3Parcial: false
---

Ratio Call Spread Corto

Ratio Put Sprear Largo

Ratio Put Spread Corto

Esta estrategia combina un call largo y dos call cortos con un strike mayor, los vencimientos y emisión son simultáneos

RATIO CALL SPREAD (CORTO) = 2 CALL LARGO STRIKE MAYOR + CALL CORTO STRIKE MENOR

El inversionista espera una pequeña alza en el subyacente, seguida de una fuerte caída en la volatilidad

Esta estrategia combina un put corto y dos put largos con un strike menor, los vencimientos y emisión son simultáneos

RATIO PUT SPREAD (LARGO) =2 PUT LARGO STRIKE MENOR + PUT CORTO STRIKE MAYOR

El rosto de contratarión es muy bajo o nulo, el inversionista espera una importante caida en el precio.

Estáa estrategia combina un put largo y dos put cortos con un strike menor, los vencimientos y emisión son simultáneos

RATIO CALL SPREAD (CORTO) = 2 PUT LARGO STRIKE MENOR + PUT CORTO STRIKE MAYOR

El inversionista espera una pequeña baja en el subyacente, seguida de una fuerte caída en la volatilidad

Pág: 279

Representación de un Ratio Call Spread Corto

Representación de un fiatio Put Spreald Largo:

Representación de un Ratio Call Spreard Corto

seo — as

$e

$65

<!-- page 282 -->
Tunel Alcista

Tunel Bajista

Esta estrategia forma parte de estrategía protectivas denominadas Risk Reversal o Collar. Consiste en comprar una opción call y vender una opción put con precio de ejercicio siempre inferior. Ambas opciones out of the money.

Es una estrategia que si se realiza correctamente debería ser prima cero. Con esta estrategia tanto el beneficio como la pérdida son ilimitadas.

TUNEL ALCISTA = CALL LARGO STRIKE MAYOR + PUT CORTO STRIKE MENDR

Consiste en vender una epción call y comprar una opción put con precio de ejercicio siempre inferior. Ambas opciones out of the money.

Es una estrategia que si se realiza correctamente debería ser prima caro, Con esta estrategia tanto el beneficio como la pérdida sc ilimitadas,

TUNEL ALCISTA = CALL CORTO STRIXE MAYOR + PUT LARGO STRIKE MENOR

Púg. 280

Representación de un Tunel Alcista:

En el gráfico, se tiene derecho a comprar a 65 y

obligación de comprar a 55.

Representación de un Ratio Call Spread Corto

En el gráfico, se tiene derecho a vender a 55 y

obligación de vender a 65.

<!-- page 283 -->
Condor

Muy similar a la Estrategia butternfly spread, Utilizada cuando se espera que el precio del subyacente no sufra cambios importantes hacia el futuro, se estructura con las siguientes opciones:

1 call largo con un precio strike más bajo, in the money (X1)

1 call corto con un precio strike Intermedio menor, in the money (X+) 1 call corto con un precio strike intermedio mayor, out the money (Xa) 1 call largo con un precio strike más alto, out the money ()

Donde : X1 < Xa < Xa< Xa Todas las opciones tienen la misma fecha de vencimiento.

A vencimiento el valor de posición será:

» Cerosiel precio del subyacente es inferior a X: 0 por encima de Xa

- Positivo si el precio del subyacente esta entre Xi y X:
Representación Gráfica

Pág. 281

<!-- page 284 -->
8.7

8.7.1.

Griegas

Delta

Gamma

Theta

Vega

Rho

B.7.2.

Delta

Gamma

Theta

SENSIBILIDAD Y GESTIÓN DE LAS GRIEGAS EN CONTRATOS DE OPCIÓN

Identificar el concepto de las sensibilidades: delta, gamma, theta, rho y vega

Las griegas, representan la sensibilidad de la prima de la opción, con respecto alos cambios en los componentes de la opción (Precio del subyacente, Plazo, Volatilidad, Tasa de interés). Es una herramienta utilizada en la gestión del riesgo, de portafolios de opciones.

Medida de cambio de una opción respecto al cambio en el precio del blen subyacente. Cambio opción x cambio subyacente

Tasa de cambio de la delta del portafolio con respecto al cambio en el precio del bien subyacente. Cambio delta x cambio subyacente

Tasa de cambio de un portafolio con respecto al paso del tiempo con tedo lo demás sin cambio. Cambio apción x cambio tiempo

Tasa de cambio del valor de un portafolio respecto a la volatilidad del bien subyacente. Cambia opción x cambio volatilidad

Tasa de cambio del valor de un portafolio con respecto a la tasa de interés. Cambio opción x cambia Tasa de interés

Interpretar los valores de: delta, gamma, theta, rho y vega

Matemáticamente representa la PRIMÉRA DERIVADA DE LA PRIMA CON RESPECTO AL PRECIO. Dicho en otras palabras, cuánto va a cambiar la prima de la Opción, por cambios en el precio del subyacente.

e — Enlasopciones CALL la delta varía desde 0 a1, existe una relación directa (5ano a la alza). Esto quiere decir que entra más suba el precio del subyacente más sube la prima de mercado del CALL.

s Enlasopciones PUT la delta varia desde 0 a -1, existe una relación inversa (Gano a la baja). Esto quiere decir que entra más haje el precio del subyacente más sube la prima de mercado del PUT.

Matemáticamente representa la SEGUNDA DERIVADA DE LA PRIMA CON RESPECTO AL PRECIO. Permite ajustar Delta cuando el cambio en el precio del subyacente es grande, a Enlasopciones en posición larga. La GAMMA es positiva

» Enlasopriones en posición carta, La GANIMA es negativa

Matemáticamente representa la PRIMERA DERIVADA DE LA PRIMA CON RESPECTO AL TIEMPO. Dicho en otras palabras, cuánto va a cambiar la prima de la Opción, por el paso del tiempo hacia vencimiento.

e LaTHETA tiene un impacto negativo sobre la prima.

Pág 282

Ú

= 9

E=

<!-- page 285 -->
Vepga Matemáticamente representa la PRIMERA DERIVADA DE LA PRIMA CON RESPECTO A LA VOLATILIDAD. Dicho en otras palabras, cuánto va a cambiar la prima de la Opción, por cambios en volatilidard del subyacente.

La VEGA tiene una relación directa con la prima. » Siincrementa la volatilidad, incrementa la prima » Si disminuye la volatilidad, disminuye lz prima

Rho Representa la PRIMERA DERIVADA DE LA PRIMA CON RESPECTO A LA TASA DE INTERÉS. Esto quiere decir, cuánto va a cambiar la prima de la Opción, por cambios en la tasa de interés (Costo financiero).

- Siincrementa la tasa, incrementa la prima
e Sidisminuye la tasa, disminuye la prima
