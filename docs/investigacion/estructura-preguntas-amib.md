# Estructura de las preguntas del examen AMIB Figura 3 (Serie 210)

Fecha: 2026-10-14. Alcance: investigación de solo lectura sobre el repo, con búsqueda web.

**Limitación metodológica importante.** WebFetch falló en todas las llamadas (`getaddrinfo ENOTFOUND` para amib.com.mx, rankia.mx y bursatron.com.mx). Por eso NINGUNA página externa fue leída directamente. Todo lo externo proviene de los resúmenes que devolvió WebSearch (URLs listadas como resultado de búsqueda). Las citas textuales son solo las que aparecieron literalmente en esos resúmenes. Cada dato externo debe verificarse abriendo la URL. Se descartó un intento con curl por no estar permitido en este entorno.

---

## 1) Resumen ejecutivo

- El examen es de **opción múltiple, 4 opciones, 1 correcta + 3 distractores**; sin reactivos abiertos (manual AMIB 1.1.6 y proveedor, vía búsqueda; ver §2).
- Estructura oficial de la Serie 210: **210 reactivos en 9 materias**: Ética 20, Servicios de Inversión 20, Marco Normativo 25, Mat. Financieras y Portafolios 25, Mercado de Capitales 25, Títulos de Deuda 25, Fondos de Inversión 20, Derivados y Riesgos 25, Análisis Económico/Financiero/Técnico 25 (suma 210). Obligatorias de pase: Ética, Capitales, Deuda, Derivados y Riesgos.
- Escala 200–1100, aprobatorio 600 (global y en materias de pase). Hay reportes de que el Comité puede modificar la escala. No se encontró evidencia pública de IRT ni de cómo se escala.
- En las 44 preguntas oficiales de muestra: **18% de cálculo (8/44), 9% "EXCEPTO" (4/44), 0% "todas/ninguna de las anteriores", 0% casos largos**. Predomina la pregunta teórica directa de enunciado corto (mediana 18.5 palabras).
- Los **4 decimales** que reporta el usuario se corroboran: en las muestras de Fondos de Inversión los rendimientos vienen a 4 decimales (12.6336%) y los precios por acción a 6 decimales; el material de estudio local indica que TIIE y tipo de cambio FIX se cierran a 4 decimales. En otros temas se usan 2 decimales (1.94%, $18.10) y 3 en precio de CETES ($9.786).
- Los distractores de cálculo son **resultados de errores típicos** (usar 360 vs 365, no anualizar, no ajustar por dividendo en acciones), con valores muy cercanos (1.94/1.92/1.97/2.02).
- Los distractores teóricos son: entidad intercambiada (CNBV/Banxico/BMV), cuantificadores alterados (máxima/mínima, 50%/75%), o frases casi idénticas donde cambia una palabra (VaR, ética bursátil, MexDer).
- Sesgo observado en la muestra local: la **opción correcta es la más larga en 38.7% de los casos** (29/75) frente al 25% esperable, y la clave A aparece 40% (30/75). Ambos sesgos son artefactos de una muestra pequeña, y la clave A está además afectada por 6 conflictos de lectura de negritas. Nuestro generador NO debe copiarlos.
- Hasta ~30 reactivos matemáticos por examen y calculadora financiera (HP 17bII+, 12C, TI BA II) según un preparador (fiabilidad media; ver §3). El material local confirma que la HP 17bII+ trae fórmulas AMIB precargadas (PRECIO.DSCTO, BONO, PRECIO.FUTURO, DELTA, etc.).
- Lo que **no se pudo verificar**: reglas oficiales de calculadora, taxonomía de Bloom en AMIB, IRT, proporción real de negativas/casos, tiempo exacto de la Serie 210 (el usuario dice 4h18m; fuentes dicen "~4 horas"). Ver §7.

---

## 2) Lo que dice AMIB oficialmente

Todas las fuentes de esta sección son páginas de amib.com.mx devueltas por WebSearch. No se pudieron abrir (ver limitación). Las citas son literales del resumen de búsqueda salvo indicación.

| Dato | Fuente | Estado |
|---|---|---|
| Tabla de la Serie 210: 210 reactivos, 9 materias; Ética 20 (9.52%), Servicios 20, Marco Normativo 25, Mat. Fin. y Portafolios 25, Capitales 25, Deuda 25, Fondos 20, Derivados y Riesgos 25, Análisis 25; obligatorias de pase: Ética, Capitales, Deuda, Derivados y Riesgos | https://www.amib.com.mx/NetHelpGuiaDeCertificacionVersion6.0/Documents/examenintegralasesorenestrategiasdeinversinserie210.htm | Resumen de búsqueda; suma verificada = 210. No abierta |
| Preguntas de opción múltiple con una respuesta correcta y tres distractores (punto 1.1.6 del Manual de Políticas) | https://www.amib.com.mx/NetHelp/AMIBCERMA02ManualdePoliticasdeCertificacionyRegistroAMIBCertifica/Documents/1formulacindeexmenes.htm | Resumen de búsqueda. No abierta |
| Escala de 200 (mínima) a 1100 (máxima), 600 mínimo aprobatorio; "Aprobado" requiere 600 global y en materias de pase; el Comité puede modificar la escala | Resumen de búsqueda atribuido al manual oficial de AMIB; páginas candidatas: https://www.amib.com.mx/NetHelp/AMIBCERMA02ManualdePoliticasdeCertificacionyRegistroAMIBCertifica/Documents/1formulacindeexmenes.htm y https://www.amib.com.mx/NetHelp/AMIBCERMA02ManualdePoliticasdeCertificacionyRegistroAMIBCertifica/Documents/30comitdecertificacin.htm | Página exacta no identificada; no verificado |
| Examen a distancia: sin hablar, sin dispositivos electrónicos ni materiales de consulta en la habitación; sanciones por incumplimiento | https://www.amib.com.mx/NetHelp/AMIBCERMA02ManualdePoliticasdeCertificacionyRegistroAMIBCertifica/Documents/92aplicacindeexamendecertificacinadistanciadelaamib.htm (sección 9.2, manual v4.3) | Resumen de búsqueda |
| Sedes AMIB: turnos 8:00 y 13:00; retraso > 20 min pierde examen (9.1.7; otra fuente dice 10 min) | https://www.amib.com.mx/NetHelp/AMIBCERMA02ManualdePoliticasdeCertificacionyRegistroAMIBCertifica/Documents/91aplicacindeexamendecertificacinensedesadministradasporlaamib.htm | Versiones inconsistentes |
| Control del documento: manual v4.6 (2013) vs entrada 2021 v4.0; versión vigente incierta | https://www.amib.com.mx/NetHelp/AMIBCERMA02ManualdePoliticasdeCertificacionyRegistroAMIBCertifica/Documents/informacindecontroldeldocumento.htm | Resumen de búsqueda |
| Duración del examen Promotor de Valores: 190 reactivos, 3h53m (ejemplo de que AMIB publica tiempo por examen) | Manual oficial (según resumen de búsqueda) | La duración de la Serie 210 (4h18m, dato del usuario) no se confirmó |

Cita literal disponible (de un proveedor, no AMIB): "vendrá la pregunta y cuatro opciones a elegir. En ningún momento encontrarás reactivos abiertos." (resumen de búsqueda sobre https://imecaf.com/finanzas/cursos-finanzas/certificacion-amib-estrategias-de-inversion-figura-3-curso-84.html).

No hallado en AMIB: taxonomía de Bloom, reglas de calculadora, reglas de reintento, IRT, instructivo de redacción de reactivos.

---

## 3) Lo que dicen preparadores y examinados

| Fuente | Qué afirma | Fiabilidad |
|---|---|---|
| Bursatron, calculadora: https://blog.bursatron.com.mx/wordpress/la-calculadora-financiera-y-su-importancia-en-la-certificacion-amib/ | HP 17bII+ muy aceptada; también HP 17bII, 12c, 12c Platinum, TI BA II / BA II Plus; "hasta 30 preguntas" matemáticas en Figura 3 | Media (proveedor con interés comercial; > 4 años; sin leer directamente) |
| Rankia, https://www.rankia.mx/blog/asesoramex/5341400-que-figura-3-certificacion-amib-para-sirve | 210 reactivos, 9 materias, ~4 h, 600/1100, vigencia 3 años, renovable con 450 puntos | Media (blog de divulgación; coincide con AMIB) |
| Course Hero "Guía AMIB" (subida por usuario): https://www.coursehero.com/es/file/251298697/Guian-AMIB-abm-pdf/ | Temas por bloques, p. ej. primero las 20 de Ética | Baja (usuario anónimo, versiones inconsistentes). Solo metadatos; no se descargó |
| Course Hero, examen de muestra de una persona: https://www.coursehero.com/es/file/57042350/Examen-Amib-figura-3docx/ | Resultado de ejemplo: 108 aciertos y 21 errores; secciones normativo, SI, capitales, deuda, derivados, riesgos, análisis | Baja (anecdótico, antiguo, posiblemente con derechos de autor; no se copió) |
| IMECAF, https://imecaf.com/pdfs/84.pdf | Temario incluye precio limpio/sucio de bono y premios/precios de salida de reporto | Media (temario de curso) |
| Libros comerciales: Carrillo https://www.amazon.com/-/es/Asesor-Estrategias-Inversi%C3%B3n-preparaci%C3%B3n-Spanish/dp/B08P1CCJRM ; Delgado https://www.amazon.com.mx/Examen-Certificaci%C3%B3n-Figura-AMIB-Estudio/dp/B0DJ82Q359 ; Superprof https://www.superprof.mx/guia-certificacion-amib-figura-asesor-estrategias-inversion.html | Incluyen "expresiones para capturar en la calculadora", simulador y 500+ preguntas | Baja-media (ventas) |
| Tec de Monterrey, https://educacioncontinua.tec.mx/programas/preparacion-para-el-examen-de-certificacion-amib-f-3-virtual | Curso con guía de contenido y tests | Solo existencia; sin detalle de estilo |
| Reddit / Rankia foros | No se encontraron reportes de examinados sobre dificultad, decimales o tiempo | Sin datos |
| Simulador amibfigura3.com | Describe examen de seguros distinto; no usar | Irrelevante |

Conclusión: la información de estilo de reactivo proviene casi exclusivamente de las 44 preguntas oficiales de muestra del repo, no de la web.

---

## 4) Análisis estadístico de las 75 preguntas locales

Fuentes: `content/preguntas/oficial/preguntas-tipo.json` (44, oficiales AMIB) y `etica-ensayo.json` (31, derivadas del manual EBSPMV, no oficiales de examen). 4 de las 31 duplican `tipo.25–28`, por lo que hay 71 únicas. Todas tienen exactamente 4 opciones.

### 4.1 Distribución por área (44 oficiales)
| Área | n | | Área | n |
|---|---|---|---|---|
| capitales | 8 | | normativo | 4 |
| derivados | 8 | | deuda | 4 |
| analisis | 4 | | fondos | 4 |
| matematicas | 4 | | servicios | 4 |
| etica | 4 | | | |

### 4.2 Formato
| Métrica | Oficiales (44) | Ética-ensayo (31) | Total (75) |
|---|---|---|---|
| Directa | 32 (72.7%) | 31 | 63 (84%) |
| EXCEPTO (negativa) | 4 (9.1%) | 0 | 4 (5.3%) |
| Cálculo | 8 (18.2%) | 0 | 8 (10.7%) |
| "Todas/Ninguna/Ambas" | 0 | 0 | 0 |
| Caso/escenario largo | 0 (los de cálculo son problemas de 1-3 oraciones) | 0 | 0 |
| Enunciado termina en "?" / ":" | 14 / 20 | 14 / 12 | 28 / 32 (el resto: completar con "..." o "_____") |

Las 4 negativas son: tipo.01 (Análisis técnico), tipo.34, 35 y 36 (todas de Servicios de Inversión, tema normativo largo).

### 4.3 Longitud (palabras)
| Métrica | Oficiales | Ética-ensayo |
|---|---|---|
| Enunciado media / mediana / mín / máx | 21.6 / 18.5 / 5 / 55 | 27.1 / 19 / 5 / 104 |
| Enunciados > 35 palabras | 6 | 11 |
| Opción media (máx) | 5.0 (24) | 8.2 (46) |
| Opción correcta media | 5.1 | 8.3 |
| Correcta es la más larga | 20/44 (45%) | 9/31 (29%) |

Patrón: opciones de una palabra en definiciones (tipo.13, 14, 20, 41-44) y de 10-25 palabras en normativo/servicios, donde la correcta suele ser la más completa. Usar "la más larga" como pista funcionaría 39% del tiempo: hay que neutralizarlo.

### 4.4 Posición de la clave
| Posición | Oficiales | Ética-ensayo | Total | % |
|---|---|---|---|---|
| A | 21 | 9 | 30 | 40% |
| B | 10 | 8 | 18 | 24% |
| C | 6 | 8 | 14 | 19% |
| D | 7 | 6 | 13 | 17% |

Advertencia: 6 oficiales (tipo.01, 04, 10, 17, 22, 32) tienen "conflicto de clave" (letra en negritas vs texto en negritas, el parser tomó el texto) y 4 son duplicados. La sobrerrepresentación de A es probablemente muestral y/o artefacto del parseo. No se debe inferir un patrón de AMIB.

### 4.5 Números y decimales
Preguntas con dígitos: 9 enunciados y 10 conjuntos de opciones en las oficiales. Formatos observados en opciones:

| Tema | Ejemplo observado | Decimales |
|---|---|---|
| Tasa real (tipo.10) | 1.94% / 1.92% / 2.02% / 1.97% | 2 |
| TIR (tipo.11) | 4.60% / 10.14% / 5.00% / 9.80% | 2 |
| Precio ajustado acción (tipo.16) | $18.10 / $19.00 / $19.05 / $20.00 | 2 |
| Interés abierto (tipo.19) | 5 / 20 / 40 / 10 contratos | 0 |
| Tasa de descuento CETE (tipo.23); precio dado $9.786 | 7.86% / 7.70% / 8.76% / 8.00% | 2 (dato a 3) |
| Precio limpio (tipo.24) | $98.56 / $97.81 / $98.71 / $100.00 | 2 |
| Rendimiento fondo (tipo.29, 30) | 12.6336% / 12.8841% / 13.0693% / 12.6688% | **4** (precios de entrada con **6** decimales) |

Es decir: el "4 decimales" del usuario coincide con los problemas de fondos de inversión (y con el cierre a 4 decimales de TIIE/FIX que menciona el manual local, `AMIB Data/AMIB_1_completo.md`). Los distractores numéricos incluyen siempre el valor "ingenuo" (el precio sucio $98.56 como opción en tipo.24, el precio sin ajuste $20.00 en tipo.16) y números redondos (5.00%, 8.00%, $19.00, $100.00).

### 4.6 Cómo se construyen los distractores (observado)
| Técnica | Ejemplos |
|---|---|
| Entidad intercambiada (autoridad/organismo) | tipo.02 (Banxico vs CNBV/Registro Nacional de Valores), tipo.32 (contralor vs accionistas vs BMV vs CNBV) |
| Misma estructura con un cuantificador cambiado | tipo.18 (máxima/mínima × período/año), tipo.07 (50%/75%) |
| Categoría del mismo conjunto | tipo.05 (nacionales / calificados / institucionales / sofisticados), tipo.06 (colegiada / individual / mancomunada / solidaria), tipo.20 (theta/delta/rho/vega) |
| Casi sinónimos / frase calcada con una palabra distinta | tipo.27 (ciencia vs conocimiento; tradición vs principios; CNBV), tipo.40 ("a través del sistema que establezca la Cámara" vs "mediante cualquier sistema") |
| Elementos intrusos plausibles | tipo.28 (virtud, libertad, dinamismo en lista de principios) |
| Dirección contraria del efecto | tipo.31 (baja/sube; sub/sobrevalúa) |
| Cálculo con error típico de método | tipo.10, 16, 23, 24 |
| Pregunta de mecánica operativa (nombres exactos de pantalla, estados) | tipo.41-44 (SENTRA: SA/CP/AP/SP, Libro electrónico, Estadístico); memorización pura |

---

## 5) Taxonomía de tipos de pregunta y de "trampas"

Ejemplos inventados, de estilo AMIB, con datos ficticios.

| # | Tipo | Descripción | Ejemplo original |
|---|---|---|---|
| T1 | Definición directa | Término ↔ concepto | "El instrumento que representa una parte alícuota de la deuda de una empresa se denomina:" a) acción. b) obligación. c) certificado bursátil fiduciario indizado. d) warrant. |
| T2 | Atribución a autoridad | Quién hace qué | "¿Cuál de las siguientes funciones corresponde a la CNBV?" a) emitir billetes. b) supervisar casas de bolsa. c) fijar la tasa objetivo. d) recibir depósitos del público. |
| T3 | EXCEPTO | Tres verdaderas, una falsa | "Son características del reporto, EXCEPTO:" a) opera a plazos cortos. b) incluye un premio. c) transfiere definitivamente la propiedad sin obligación de regreso. d) tiene un colateral. |
| T4 | Cuantificador alterado | Cifras/plazos/porcentajes de normas | "El plazo máximo para que el cliente objete su estado de cuenta es de:" 30, 45, 60, 90 días (ficticio). |
| T5 | Mismo esqueleto, una palabra cambia | Frases casi iguales | "La duración modificada mide la sensibilidad:" a) porcentual del precio ante un cambio en la tasa. b) absoluta del precio ante un cambio en la tasa. c) porcentual de la tasa ante un cambio en el precio. d) absoluta de la tasa ante un cambio en el precio. |
| T6 | Cálculo directo de una fórmula | Un paso, calculadora | "Un CETE de 91 días se adquiere a $9.8150. ¿Cuál es su tasa de rendimiento anualizada (base 360)?" (opciones a 2-4 decimales con errores de base 365 y de usar descuento en vez de rendimiento). |
| T7 | Cálculo multietapa | Interés + impuesto/comisión/ajuste | "Un fondo cobra 1.20% anual de comisión... ¿rendimiento neto en 182 días?" |
| T8 | Cálculo con dato inicial conocido | Precio sucio/limpio, premio de reporto, precio de futuro | "Un bono con cupón de 7% semestral... precio limpio si el sucio es $101.23 y han corrido 60 días." |
| T9 | Situación / mini caso | Cliente con perfil y se pide servicio o instrumento adecuado | "Un cliente no sofisticado solicita una recomendación personalizada de un fondo. ¿Qué servicio debe tener contratado?" |
| T10 | Mecánica operativa/sistemas | Nombres exactos de secciones | "En SENTRA Capitales, ¿en qué sección se consultan las posturas por valor?" |
| T11 | Interpretación | Qué ocurre si cambia X | "Si aumenta la volatilidad implícita, el precio de una opción europea: sube / baja / no cambia / depende del signo de delta." |
| T12 | Ética: dilema/principio | Identificar el principio rector | "Un asesor omite informar de una comisión: ¿qué principio infringe?" |

Trampas recurrentes: (a) entidad parecida (CNBV/Banxico/BMV/Indeval/Condusef), (b) mismo número con unidad errónea (días base 360/365; tasa nominal vs efectiva vs real), (c) opción "ingenua" pre-ajuste, (d) antónimos máximo/mínimo, (e) lista con un intruso plausible, (f) sinónimos que cambian el sujeto legal (individual/mancomunada), (g) opciones de una palabra del mismo conjunto cerrado.

---

## 6) Reglas concretas para el generador de preguntas

**Aviso:** las proporciones salen de 44 muestras oficiales y de la tabla oficial de áreas. Son una hipótesis de trabajo, no la distribución verdadera del examen.

### 6.1 Cuotas por área (examen de 210)
Usar la tabla oficial de §2: Ética 20, Servicios 20, Normativo 25, Mat. Fin. 25, Capitales 25, Deuda 25, Fondos 20, Derivados/Riesgos 25, Análisis 25. En simulacro "corto" mantener proporciones.

### 6.2 Mezcla de formato (objetivo global)
| Formato | Objetivo | Nota |
|---|---|---|
| Directa/definición | 60-65% | Muestra: 73% |
| EXCEPTO/NO | 10% (por área: Servicios y Normativo 15-20%; Ética 5-10%; Cálculo 0%) | Muestra: 9%; las 3 de Servicios se concentran allí |
| Cálculo | 15-20% global (Mat. Fin. 80%, Deuda 30%, Fondos 25%, Derivados 25%, Capitales 20%, Análisis/Normativo/Ética/Servicios 0-5%) | Muestra: 18%; un preparador dice hasta ~30 de 210 (≈14%) |
| Caso/situación (2-4 oraciones, perfil de cliente) | 8-12% global (Servicios 35%, Normativo 20%, Ética 25%, Derivados/Fondos 10%, resto 5%) | **Sin evidencia oficial de proporción**; la muestra tiene 0 casos largos. Marcar como supuesto |
| "Todas/Ninguna de las anteriores" | 0% | 0/75 en la muestra |

### 6.3 Niveles de dificultad (1–5)
| Nivel | Definición | Ejemplo de patrón |
|---|---|---|
| 1 | Recordar un término o dato (opción de 1-3 palabras) | T1, T10 |
| 2 | Recordar atribución o regla con distractores de otro conjunto temático | T2, T4 |
| 3 | Discriminar entre opciones del mismo conjunto o con un cuantificador cambiado; EXCEPTO | T3, T5 |
| 4 | Cálculo de un paso con 1-2 errores típicos como distractores; o situación breve con aplicación | T6, T9, T11 |
| 5 | Multietapa (T7, T8) o situación + cálculo/regla; distractores pasan cada paso intermedio | T7, T8 |
Distribución sugerida del banco: 15% N1, 25% N2, 25% N3, 20% N4, 15% N5. Es un diseño propio, no hay dato AMIB.

### 6.4 Recetas de distractores
1. Teórico: tomar la clave y generar 3 mutaciones: (i) cambiar la entidad, (ii) cambiar un cuantificador/plazo, (iii) invertir el sentido (máximo/mínimo, sube/baja), (iv) añadir un elemento ajeno plausible. Máximo 1 mutación por distractor para que sea creíble, mínimo 2 estrategias distintas por pregunta.
2. Opciones de conjunto cerrado: los 3 distractores salen del mismo conjunto (p. ej. tipos de poder: individual/mancomunada/...).
3. Cálculo: cada distractor = resultado de un error nominal etiquetado en el generador: base 365 vs 360, no anualizar, descuento vs rendimiento, precio sucio vs limpio, ignorar el dividendo en acciones, capitalización simple vs compuesta, usar tasa nominal en vez de real, signo del flujo. Una de las 4 puede ser un número redondo cercano (5.00%, $19.00) solo si no revela la respuesta.
4. Distancia numérica: los distractores deben estar dentro de ±1-3% relativo de la clave (en la muestra 1.94 vs 1.92/1.97/2.02), nunca de magnitud absurda.
5. Prohibido: "todas las anteriores", opciones obviamente absurdas, pistas gramaticales (género/número que descarte opciones), clave siempre la más larga.
6. Equilibrio de longitud: la clave debe ser la más larga en ≈25% de las preguntas, no más; igualar longitud de opciones ±20%.

### 6.5 Posición de la clave
Distribución uniforme (25% por posición) en cada lote de 20+ y en el banco global; sin más de 2 claves iguales consecutivas en un simulacro. No replicar el 40% en A de la muestra.

### 6.6 Formato numérico
- Opciones numéricas ordenadas de forma ascendente o con el orden aleatorio, nunca sistemáticamente la clave en el mismo lugar.
- Mismo número de decimales en las 4 opciones. Convención por tema, basada en lo observado: tasas y rendimientos % a 2 decimales; **rendimiento de fondos de inversión a 4 decimales**, precios por acción de fondo en el enunciado a 6 decimales; precios de bonos/acciones a 2 decimales; precio de CETES en enunciado a 3-6 decimales (el material local usa $9.881978); TIIE/FIX a 4 decimales; contratos enteros.
- Separador decimal punto, miles con coma, símbolo "$" y "%" pegado al número (como en la muestra). Tolerancia de corrección: igualdad exacta al formato mostrado, porque la opción ya es de selección múltiple.
- Cada pregunta de cálculo guarda procedimiento y teclas HP 17bII+ en la explicación (el material local `AMIB_1_completo.md` documenta fórmulas como PRECIO.DSCTO, BONO, PRECIO.FUTURO, DELTA).

### 6.7 Redacción
Enunciado mediana ≈ 18 palabras, máx ≈ 55 salvo caso. Terminar con ":" o "?", o completar con "...". Opciones en minúscula con punto final si son frases (como en la muestra); nombres propios y siglas con mayúscula inicial. Marcar EXCEPTO en mayúsculas.

---

## 7) Incertidumbres y qué no se pudo verificar

1. **Ninguna página fue leída directamente** (WebFetch con error DNS en todos los dominios). Todo §2-§3 viene de resúmenes de búsqueda y debe confirmarse abriendo las URLs.
2. **Cuota de 4h18m** (dato del usuario): las fuentes dicen "~4 horas"; la página de la Serie 210 puede traer el tiempo exacto.
3. **Calculadora permitida**: solo hay un blog de proveedor (Bursatron). No se halló la regla oficial en el manual (9.1/9.2), ni si en línea hay calculadora en pantalla.
4. **Taxonomía de Bloom, IRT, método de escalamiento 200-1100, reintentos, materiales prohibidos presenciales**: sin evidencia pública hallada.
5. **Proporción real de EXCEPTO y casos**: solo hay 44 muestras (muestra de AMIB, probablemente seleccionada para ilustrar). Pueden diferir del examen real. Los casos largos pueden existir sin aparecer en la muestra.
6. **Claves de 6 preguntas oficiales** con conflicto (negritas de letra vs texto): confirmar manualmente (tipo.01, 04, 10, 17, 22, 32).
7. **Experiencia de examinados** (Reddit/Rankia foros): no se encontraron reportes sobre dificultad ni decimales.
8. Documentos de Scribd/Course Hero/Studocu solo se mencionan como existentes; no se abrieron ni descargaron ni copiaron.
9. Versión vigente del manual de políticas (4.0 vs 4.3 vs 4.6) incierta.
10. Los 31 reactivos de `etica-ensayo.json` NO son oficiales de examen (derivan del manual EBSPMV); su longitud mayor y su falta de negativas no representa a AMIB.
