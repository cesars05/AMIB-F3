---
capitulo: 8
numero: "8.7.7"
numeroOriginal: "8.7.7"
correccionNumero: "ninguna"
titulo: "Calcular el valor aproximado de la prima de la opción a partir del valor de la rho y el cambio en la tasa de interés [tanto local como foránea, según sea el caso)"
origen: "encabezado"
paginas:
  inicio: 287
  fin: 288
objetivoId: "derivados.derivados-financieros-ii.contratos-de-opcion.o08"
objetivoCandidato: "derivados.derivados-financieros-ii.contratos-de-opcion.o08"
confianza: 1
exclusivoFig3: false
fig3Parcial: false
---

Prima a partir de Rho

Ejemplo: El valor de RHO es 0.0496 cuando el valor de la prima de la Opción cotiza en $10.00, y la tasa de interés es del 10%. Calcular el valor de la nueva prima, si la tasa de interés varía del 10% al 7.5% [la tasa bajó un 25%).

Utilizando la Fórmula de PRHO de la calculadora financiera HP:

PRHO=PRIMAHRHO x [[(TNVA-TANT) + TANT)]

Donde: PRHO = Nuevo Valor de la Prima cuando cambia la tasa de interés PRIMA = Valor original de la Prima RHO = Valor de Rho.

TNVA = Valor de la tasa de interés nueva TANT = Valor de la tasa de interés anterior

Pág. 285

<!-- page 288 -->
Sustituimos: [RHO] = 0.0496 [PRIMA] = 10 [TANT] = 10 [TNVA] = 7.5

Pedimos [PRHO] = 9.9876 es la nueva prima de la Opción
