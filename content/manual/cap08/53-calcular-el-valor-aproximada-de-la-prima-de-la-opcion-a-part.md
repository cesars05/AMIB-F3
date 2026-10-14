---
capitulo: 8
numero: "8.7.6"
numeroOriginal: "5.7.6"
correccionNumero: "formato"
titulo: "Calcular el valor aproximada de la prima de la opción a partir del valor de la theta y el cambio en el tiempo"
origen: "encabezado"
paginas:
  inicio: 287
  fin: 287
objetivoId: "derivados.derivados-financieros-ii.contratos-de-opcion.o07"
objetivoCandidato: "derivados.derivados-financieros-ii.contratos-de-opcion.o07"
confianza: 1
exclusivoFig3: false
fig3Parcial: false
---

Prima a partir de Theta

Ejemplo: Si la prima de la opción PUT se ubica en $20 de cotización y cuenta con una THETA anual de 32,18, considerando todo lo demás constante, determinar la nueva prima de la opción si transcurre un día hacia el vencimiento. Utilizar un año base de 360 días,

Utilizando la Fórmula de PTHETA de la calculadora financiera HP:

PRIMA.THETA: PTHETA=PRIMA + (DIAS x [-THETA + BASÉ))

Donde:

PTHETA = Nueva prima a partir de theta PRIMA = Prima actual. Antes de transcurrir el tiempo

THETA = Theta anual (ingresar el dato positivo) DIAS = Dias transcurridos hacia vencimiento

BASE = Año base proporcionado

Identificamos Variables:

PTHETA = ¿? PRIMA = 20

THETA = 32.18 1DDAS=1

BASE = 360

La nueva PRIMA de la opción = 19.9106

Interpretación: La THETA tiene un impacto negativo en la prima de la opción.
