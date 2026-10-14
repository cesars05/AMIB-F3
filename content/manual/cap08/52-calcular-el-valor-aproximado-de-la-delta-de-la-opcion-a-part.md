---
capitulo: 8
numero: "8.7.5"
numeroOriginal: "8.7.5"
correccionNumero: "ninguna"
titulo: "Calcular el valor aproximado de la delta de la opción a partir del valor de la gamma y el cambio en el subyacente"
origen: "recuperado"
paginas:
  inicio: 286
  fin: 286
objetivoId: "derivados.derivados-financieros-ii.contratos-de-opcion.o06"
objetivoCandidato: "derivados.derivados-financieros-ii.contratos-de-opcion.o06"
confianza: 1
exclusivoFig3: false
fig3Parcial: false
---

Delta a partir de Gamma

Opción CALL

Ejemplo: Si se cuenta con una Úpción con Delta = 0.43 y Gamma = 0.016, actualmente el valor del subyacente se encuentra en $40. Calcular el valor de la Delta si el valor del subyacente sube a 544.

Utilizando la Fórmula de NUEVA.DELTA.2.PRECIOS de la calculadora financiera HP:

Permite encontrar la NUEVA DELTA ajustada par GAMMA

NUEVA.DELTA.2.PRECIOS:NDEL=DELTA+((SUB2-5UB1) x GAMA) Donde: DELTA = Valor de la Delta Original SUB1 = Valor del Subyacente al inicio sua2 = Valor del Subyacente al final, GAMA = Valor de Gamma

Sustituimos: [DELTA]) = 0.43 [GAMA] = 0.018 [sUB1] = 40 [SUB2] = 44

Pedimos [NDEL] = 0.502 es la nueva Delta de la Opción Interpretación: En un call al incrementarse el precio del subyacente se incrementa la Delta.

Opción PUT

Ejempla: Determine la nueva Delta de la opción, si la Prima del Put es igual a $2.0454, la Gammia=.0832 y la Delta es de- 0.3397, el del Precio Subyacente sufrió un cambio de - $0.10

Utilizando la Fórmula de NUEVA.DELTA.CAMBIOS de la calculadora financiera HP: Permite encontrar la NUEVA DELTA ajustada por GAMIMA

NUEVA.DELTA.CAMBIOS:NDEL=DELTA+(CAMS x GAMA) Donde: DELTA = Valor de la Delta Original CAMS = Variación positiva o negativa del precio del Subyacente GAMA = Valor de Gamma

Sustituimos: IDEETA] = -0.3397 (Recordar que la Delta del PUT es negativa) ICAMS] = -0.10 (Varizción de menos 10 centavos) [GAMA] = 0.0832

Pedimos [NDEL] = -0.348020 es la nueva Delta de la Opción

Interpretación: En un put al disminuir el precio del subyacente se incrementa la Delta.

Pág. 284

<!-- page 287 -->
