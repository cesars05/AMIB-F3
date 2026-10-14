---
capitulo: 10
numero: "10"
numeroOriginal: "10"
correccionNumero: "ninguna"
titulo: "Formulario"
origen: "capitulo"
paginas:
  inicio: 349
  fin: 359
objetivoId: null
objetivoCandidato: null
confianza: 0
exclusivoFig3: false
fig3Parcial: false
---

é Asociados

GUÍA PARA FÓRMULAS CALCULADORA HP

Modelos: « HP-17BI1 0 HP-17B11+ y HP-19BI1 en cualquiera de sus versiones.

« Todas las fórmulas se introducen sin dejar espacios.

- Lastasas se introducen a la calculadora en “enteros”, por ejemplo, 20% se introduce como 20.
- Esimportante introducir toda la información en el orden mencionado.
e Se pueden cambiar los nombres de las variables, siempre y cuando se mantengan la consistencia en las mismas.

- Sesugiere ordenarlas por temas.
Guía para introducir fórmulas: Las opciones que se mencionan a continuación aparecen en la pantalla de la calculadora, para elegir la apción oprimir la flecha que está señalando la opción.

Pasos:

1. Desdeel menú principal de la calculadora, oprimir la tecla RESOL (español) o SOLVE (inglés).

2, Elegir la tecla NYO (español] o NEW linglés).

3. Aparece enla pantalla el abecedario, elegir las letras que se requieran para capturar la fórmula. OJO en la Calculadora modele 19BII se utiliza el teclado de la calculadora.

A. Los números y simbolas matemáticos se utilizan las teclas de la calculadora,

5. Los paréntesis están por encima del 9

6. Para elevar símbolo “ A “ primero se oprime la tecla de color (naranja, azul e verde, según modeto) que está encima de CLA y posteriormente la tecla de " X *

7. Una vez que se termine de capturar la fórmula oprimir la tecla /NPUT,

8. Paraverificar si se capturó correctamente, oprimir la opción CALC,

Etiquetas (opcional): Si se desea agregar una etiqueta con el nombre de la formula ESTO FACILITA LA LOCALIZACIÓN EN EL MENU DE FORMULAS, se debe realizar el siguiente procedimiento:

Antes de agregar la fórmula, teclear la etiqueta y al final del nombre agregar dos puntos “:" Ejemplo: Si quisiéramos agregar una etiqueta a la fórmula de Rendimiento Conocido:

RENDS=TASA x DIAS x VA + 36000 la teclearíamos de la siguiente forma:

RENDIMIENTO CONOCIDO:RENDS=TASA x DIAS x VA + 36000

. . ... a — —— — — n Pág. 347

<!-- page 350 -->
TEMA: CAPITALES

= RENODIMIENTO O TASA EFECTIVA: TASA.EFECTIVA:%TEFEC=(VEIN<VINI-1) x 100 Donde: TEFEC — Tasa efectiva VFIN — Valor Final VINI — Valor Inicial

- BARBITRAJE
ARBITRAJE: SACCION = (S$ADR + RATIO) x TC Donde: SACCION — Valor de la acción en pesos SADR — Valor del AOR en dólares RATIO — Proporción de acciones por cada ADR [V.G. 1:6) TC = Tipo de Cambio

- PRECIO AJUSTADO POR DIVIDENDO EN EFECTIVO
AJUSTADO.DIVS:5PDIV = PM -DIV Donde: SPON — Precio Ajustad + PM — Precio de Mercado DIV — Dividendo en efectivo

- PRECIO AJUSTADO POR DIVIDENDO EN ACCIONES
AJUSTADO.ACC: SPACC = PV x AA + (AN + AA)

Donde: SPACC — Precio Ajustado PM = Precio de Mercado AA — Acciones anteriores AN = Acciones Nuevas

e PRECIO AJUSTADO POR SUSCRIPCIÓN AJUSTADO.SUS:SPASUS = ((PIVINAA]HPSXAN) + (AN+AA) Donde: PASUS — Precio Ajustado PM — Precio de Mercado PS — Precio de Suscripción AA — Acciones anteriores AN — Acciones Nuevas

s PRECIO ANUSTADO POR SPLIT / CONTRASPLIT AJUSTDO.SPLIT: SPAS =[PMIXAA) - AN BDonde: SPAS — Precio Ajustado PM — Precio de Mercado AA — Arciones anteriores AN — Acciones Nuevas

— CCiai a Pág. 348

<!-- page 351 -->
TEMA: TÍTULOS DE DEUDA

- FÓRMULA BONOS SOBRETASA (Permite resolver instrumentos con sobretasa, V.G.: BONDES, BPA'S,
CEBUR C/SOBRETASA)

BONOS.S/TASA: IF[S[INTS):IF(FP[DXV:PZOC)=0:0:24CPNxPZOCk(1-FP(DXV+PZ0C)) +360)- INTS:(USPVIIETLVG+ST)xPZ0C+ 360:1P(DXV:PZOC))x*TLVGxPZOC=360+SPPV[(XTLVG+ST)xPZ0C+360:1P[DXV+PZ0OC))x100+INT$= (1- FP(DXV:PZOC))) + (1+(%TLVG+ST)xXPZOC:36000)*FP[DXV+PZOC)-INTS-PRS)

Bonde:

DXY — Días por vencer de todo el instrumento

PZOC — Plazo o días del cupán

%CPN — Tasa cupón anualizada

INTS - Intereses en pesos del cupón

%TLVG — Tasa líder vigente de mercado o tasa de referencia 5T - Sobretasa

PRS - Precio limpio incluyendo la sobretasa

Para utilizar esta fórmula, se ingresan los datos de la siguiente manera: 1. Seingresan los datos de DXV; PZOC y %CPN

2. Seresuelve para INTS (se oprime la tecia).

3. Seingresa *%TLVG y ST y se resuelve para PRS

Nota: Para calcular el precio sucio, solo hay que agregar al precio Nimplo encontrado (PR5) el valor de los intereses encontrados [INT5), esto es: PRECIO SUCIO = PRS + INTS

- FORMULA BONOS TASA FIA|Permite resolver instrumentos con tasa fija y cupón a 182 dias, V.G.:
UDIBONOS, M's,)

TASA.FIJA.182:1F(S(INT):1F[FF(DXV+182)=0:0:%CPNx282x(1-FP(DXV+182)) +360)- INT:WUSPY(LIDERX182+360:1P[DXV+182))+1SPPV(%LIDERX182+360:FP(DXV+1872))+SPPVISLIDEAK182+3 EO:IDXV=182))x360+ (182+100) +%CPN-(1-FP[DXV+182)))x LODX%CPNx|182+100)+360-PLIMPIO)

Donde:

DXY = Días por vencer

%CPN = Tasa del Cupón

INT = Intereses del cupón corrido

%LUDER = Tasa del Mercado o Tasa exigida o negociada o Tasa pactada. PLIMPIO = Precio Limpio

Uso:

1. Seingresan las %LIDER, DV y %CPN, y

2. Seresuelve para PLIMPIO,

3. Sise desea el precio sucio,

4. Al resultado obtenido se le pone un signo de + se solicita INT foprimir 2 veces) y luego se pone =.

| — Ki Kr T S7ua d GKSRrgrIIrIIKe€rlllrsrlIIIIK€IrrK€r€vgIvKIIIsvIIIKrrvrIKrKKKKIGI Il Pág. 349

<!-- page 352 -->
PREMIO DE UN REPORTO: PREMIO.REPORTO:SPREMIO=TASA x DIAS y VA + 356000

Donde:

SPREMIO — Intereses a recibir al vencimiento TASA — Tasa de la inversión

VA — Inversión inicial

DIAS — Plazo en días de la inversión

PRECIO DE SALIDA del reporto P.SALIDA:SPSAL = SPREN x [1 + ((?6TR + 36000) x DIAS))

Donde:

PSAL — Precio de Salida del Reporto SENTR — Precio de Entrada

TREND — Tasa de Rendimiento del Reporto DIAS — Días por Vencer del Reporto

PRECIO a partir de la Tasa de Descuento PRECIO.DSCTO:SPR = VN x (1 — (%TD X DIAS=36000)) Esta misma fórmula sirve para encontrar tanto el PRECIO del título como la Tasa de DESCUENTO.

Ponde:

SPR-— Precio

“TD — Tasa de descuento VN — Yalor nominal

DIAS — Días por vencer

» PRECIO apartir de la Tasa de Rendimiento

PRECIO.REND:SPR = VN = (1 + (%TR x DIAS =36000))

Esta misma fórmula sírve para encontrar tanto el PRECIO del título como la Tasa de RENDIMIENTO. Conde: SPR - Precio

- %TR — Tasa de rendimiento
YN — Valor nominal DIAS — Días por vencer

» TASADE DESCUENTO a partir de la Tasa de Rendimiento DESCTO.REND:*TD = %TR + [ 1 + ( %TR X DIAS - 36000 )) Esta misma fórmula sirve para encontrar tanto la tasa de DESCUENTO como la tasa de RENDIMIENTO.

Donde:

%TD - Tasa de descuento TR — Tasa de rendimiento DIAS — Días por vencer

Pág. 350

<!-- page 353 -->
- TASA EQUIVALENTE
EQUIVALENTE:%4TECUI = (( 6TR % DIAS + 36000) + 1 ) A (DIAEQ +DIAS ) — 1 ) X 36000 +DIAEO Donde: %TECUI — Tasa equivalente %TR = Tasa de rendimiento en el plazo original DIAS — Dias o plazo original DIAEO — Plazo af cual se va allevar la tasa.

TEMA: MATEMÁTICAS FINANCIERAS Y PORTAFOLIOS

e RENDIMIENTO OTASA EFECTIVA: TASA.EFECTIVA:%TEFEC=[VFIN+VINI-1) x 100 Donde: %TEFEC — Tasa efectiva VFIN — Valor Final VINI— Valor Inicial

a RENDIMIENTO O TASA ANUAL O NOMINAL: TASA.ANUAL:XTNOM=(VFIN=VINI-1) =DÍAS x 36000 Donde: %TNOM — Tasa nominal o anual VFIN — Valor Final VIN! — Valor Inicial DIAS — Plazo en días de la inversión

- RENDIMIENTO O INTERÉS SIMPLE:
INT.SIMPLE:VE=VA x 1 + [%TEFE x N +100)) Donde: SvF — Monto total a retirar [interéses + capital) "TEFE — Tasa efectiva de la inversión VA — Inversión inicial N — Número de periodos

- RENDIMIENTO O INTERÉS COMPUESTO:
INT.COMPUESTO:VF=VA x ((1 + STEFE + 100)"N) Donde: YF— Monto total a retirar (interéses + capital) %TEFE — Tasa efectiva de ta inversión VA — Inversión inicial N — Número de periodos

r — - << — — — — 0NZG

Pás. 351

<!-- page 354 -->
- TASAEFECTIVA ACUMULADA:
TASA.ACUMULADA:MACUM=L[[1 + %TEFE + 100)-'N)-1) x 100 Donde: %H%ACUM — Tasa efectiva acumulada (capitalizada) %TEFE — Tasa efectiva de la inversión N — Número de perindos

- TASAOCAPITALIZACIÓN CONTINUA
TASA.CONTINUA:VF=VA y (2.7182818*[%TEFE x N=100)) Donde: VF — Monto total a retirar (interéses + capital) con capitalización continua VA — Valor Presente con tasa continua TEFE - Tasa de interés efectiva N — Períodos

Con esta misma fórmula podemos calcular tanto el alor FUTURO como el valor PRESENTE.

s TASADE DESCUENTO A PARTIR DEL PRECIO TASA.DESCTO: %TD=(1 - SPR +VN)x[36000+DIA5) Donde: %TD — Tasa de Descuento SPA - Precio VN --Valor nominal DIAS — Días nor vencer

- TASADEDESCUENTO A PARTIR DE LA TAsA DE RENDIMIENTO
DESCTO.REND:S6TD = TR + ( 1 + ( *TR X DIAS = 36000 )) Esta misma fórmula sirve para encontrar tanto la tasa de DESCUENTO como la tasa de RENDIMIENTO. Donde: %TD = Tasa de descuento TR - Tasa de rendimiento DIAS — Días por vencer

- TASAREAL:
TASA REAL:XTREAL = ([ 1 + %TASA =100) = (1 + %INF +100)— 1) x 100 Donde: %TREAL — Tasa real %TASA — Tasa nominal q en pesos %INF - Tasa de inflación

Pag, 397

<!-- page 355 -->
E . S S E E ,E E

- TASA EQUIVALENTE
EQUIVALENTE:6TEQUI = ((( %TR X DIAS + 36000) + 1 ) * (DIAEQ +DIAS ) — 1 ) X 36000 +DIAEQ Donde: %TEQUI - Tasa equivalente %TA — Tasa de rendimiento en el plazo original DIAS — Días o plazo original DIAEQ — Plazo al cual se va a llevar la tasa.

- INTERPOLACIÓN LINEAL DE TASAS:
INTERPOL= (PINT - PCOR) + (PLAR - PCOR) x (TLAR - TCOR) + TCOR Donde: INTERPOL = Tasa Interpolada TCOR = Tasa asociada al menaor plazo icorto) TLAR = Tasa asociada al mayor plazo (largo) PINT = Plazo a Interpolar PCOR = Plazo corto 6 menor PLAR = Plazo largo o mayor

- RENDIMIÉNTO ESPERADO
CAPM.RND.ESPERADO: RE=RF+BETA x (RVI-RF) Donde; RE = Rendimiento Esperado RF = Tasa Libre de Riesgo RM = Rendimiento de Mercado BETA = Beta de la acción Con esta mi-ma fórmula se puede calcular el valor de BETA.

e Lafórmula de BETA, cuando te dan covarianza de un valor(1) con mereadol2) y la varianza del valor[1) es:

BETA=COV=-VAR

Donde: COY = la covarianza de un instrumento contra el mercado y VAR = la varianza del instrumento analizado.

Si la BETA = 0 (cero), se interpreta que tiene riesgo Q (Invertido en CETES)

Si la BETA es < 1 = Se interpreta que tiene riesgo menor que el mercado (Defensiva)

Si la BETA = 1 se interpreta que tiene el mismo riesgo del mercado (Nomnal)

Si la BETA > 1 se interpreta que tiene un nivel de riesgo superior al mercado (Agresiva)

—o————;> ——;;]; [ —[—[—]][—]——]—[——[£[[—_;; NA—l Pág- 353

<!-- page 356 -->
TEMA: DERIVADOS

PRECIO FORWARD o TEORICO PRECIO.FUTURO:PFWD=(1+[TMAY + 36000 X DIAS)) + (1+(TMEN + 36000 X DIAS)) X SPOT Donde: PFWD — Precio Fwd o teórico TMAY- Tasa pesos o costo financiero DIAS — Días del contrato TMEN — Tasa dólares o tasa de rendimiento SPOT — Tipo de cambio o precio actual del subyacente.

VALOR INTRÍNSECO CALL

INTRCALL:CALL = FSUB — PEJ Donde: CALL— Valor intrínseco del CALL PSUB — Precio del subyacente o precio de mercado PEJ — Precio de ejercicio pactado en contrato

VALOR INTRÍNSECO PUT

INTRPUT:PUT = PEJ — PSUB Dónde: PUT — Yalor intriínseco del PUT PSUB — Precio del subyacente o precio de mercato PEl — Precio de ejercicio pactado en contrato

VALOR EXTRINSECO

EXTRNSEC:EXT=PRIMA-1NT Donde: EXT — Valor extrínseco de la opción PRIMA — Yalor de la prima en el mercario tNT — Valor intrinseco de la opción

VALOR NOCIONAL DÓLARES

NOCIONAL.DA.USD:NOUSD = TDC x HCON x 10,000 Donde: NOUSD — Valor nocional del contrato TDOC — Tipo de cambio HACON = Número de contratos operados

VALOR NOCIONAL INDICE NOCIONAL.IFC:NOIPC = IPC x HCON x 10 Donde: NOIPC — Valor nacional del contrato IPC — Puntos del IPC 4CON — Númeso de contratos operados

Pág. 354

<!-- page 357 -->
u= ”_-

- VALOR NOCIONAL ACCIONES
NOCIONAL.ACCION:NOACC = SAC x HCON x 100 Donde: NOACC — Valor nociona! del contrato SAC — Precio de la Acción ACON - Número de contratos operados

GRIEGAS:

- DELTA
DELTA=(PRIL-PRI2) = ($UB1-SUB2) Donde: DELTA = Valor de la Delta PRI1 = Yalor de la Prima inicial PRIZ = Valor de la Prima al fina! SUB1 = Valor del Subyacente al inicio SUBZ2 = Valor del Subyacente al final.

- NUEVADELTA
NUEVA.DELTA.2.FRECIOS:NDEL=DELTA+[[SUB2-SUB1) x GAMA)

Donde: DELTA = Valor de la Delta Original suUB1 = Valor del Subyacente al inicio SUB2 = Yalor del Subyacente al final. GAMA = Valor de Gamma

NUEVA.DELTA.CAMBIOS:NDEL=DELTA+iCAMS x CAMA) Donde: DELTA = Valor de la dDelta Original CAMS = Variación positiva o negativa del precio del Sunyacente GAMA = Valor de Gamm.a

- THETA
PRIMA.THETA: PTHETA=PRIMA + (DIAS x [-THETA + BASE)) Donde: PTHETA = Nueva prima a partir de theta PRIMA = Prima actual. Antes de transcurrir el tiempo

THETA =Theta anual (ingresar el dato positivo] DIAS = Dias transcurridos hacia vencimiento BASE = Año base proporcionado

« VvEGA PRIMA.VEGA:PYVEGA=PRIMA+([VOL2-VOL1) x VEGA) Donde. PVEGA = Nuevo Valor de la Prima cuando cambia la volatilidad vOL1 = Valor de la volatilidad al mnicio PRIMA = Valor original de la Prima VOL2 = Valor de la volatilidad al final.

VEGA = Valor de VEGA

_ - — — ow ———]]]]]——s|Á0AMoXMOQil« — Pág. 355

<!-- page 358 -->
- RHO
PRIMA.RHO:PRHO=PRIMA+(RHO x ((TNVA-TANT) +TANT))

Donde:

PRHO = Nuevo Valor de la Prima cuando cambia la tasa de interés

PRIMA = Valor original de la Prima TNVA = Valor de la tasa de interés nueva

- VALOR EN RIESGO (VAR)
VAR= CONF x VA x (VOL+100) x ((1=252).50) Donde: VAR = Valor en Riesgo

RHO = Valor de Rho. TANT = Valor de la tasa de interés anterior

CONF = Nivel de Confianza VOL = Volatilidad del Portafolio

VA = Valor de la inversión

TEMA: ANÁLISIS FINANCIERO

RAZONES DE LIQUIDEZ:

- CIRCULANTE:LIQUIDEZ=ACIA=PCIR
- PRUEBA.ACIDO:ACIDO=(ACIR-INVEN)<PCIR
RAZONES DE ACTIVIDAD (PRODUCTIVIDAD;:

- ROTA.ACTIVO:ROT.ACT=VENTAS:ACTIVO
“ ROTFTA.ACT.FIJO:ROT.FIJO=VENTAS:ACT.FIJO

- ROTA.INVENTARIO:ROT.INVEN=CTOVTA:1NVENT
- CiA7.INVENTARIO:DIAS.INV=360-ROT.INV
RAZONES DE RENTABILIDAD:

- NARGEN.UTILIDAD:MARG.UT=U.NETA:VENTAS
- REND.ACTIVOS:ROA.ROI=U.NETA+ACTIVOX100
- REND.CAPITAL:RDE = UT.NETA + CAPITAL x 100
RAZONES DE COBERTURA:

- PASIVO.ACTIVO:PS/AC=PASIVO/ACTIVO
- APALANCAMIENTO:APALAN=PTOT+CAPITAL
- COBERTURA:COBER=(UAFIR+DEPRE+AMOR) +3NT
MÚLTIPLOS

- vVALOR.LIBRO:PS/LIBRO=PRECIO:V.LIBRO
- FLUJOXACC:FIJACC=(UTILIDAD+DEP+AMRT) >ACCIONES
———————] — — Pág. 356

E . S e

i=

<!-- page 359 -->
É

DALIFIMHON O3HTIM

SY M ILTIA

SINLedE

E al =l

SOQwAKIO

ONVONCSS NY

“SOPeIOSY Y

ougr - sogevopsany sersandsay

ezren) eme

<!-- page 360 -->
