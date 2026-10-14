# Núcleo de estudio (app/src/core)

Lógica pura en TypeScript, sin Electron, React ni entrada y salida. Todo es determinista: el tiempo llega como `ahora: Date` y el azar como `Azar` (de `barajar.ts`). La memoria del estudiante se reduce a una lista de `Intento`, de la que se derivan todos los demás módulos.

## Módulos

1. `intentos.ts`: tipo `Intento` (pregunta, área, subtema, objetivo, tipo, dificultad, acierto, tiempo, confianza, modo, sesión, fecha ISO, etiqueta de error y bandera opcional `conPistas`), constantes de tiempo (ritmo de 74 s) y la semana ISO.
2. `dominio.ts`: cinco niveles (sin ver, visto, familiar, competente, dominado), estimación Beta y estado por subtema.
3. `perfil.ts`: agregado para el Inicio a partir de intentos y un resumen ligero de la taxonomía.
4. `leitner.ts`: cajas 1 a 5 con intervalos de 1, 2, 4, 8 y 16 días, para preguntas y tarjetas.
5. `selector.ts`: selección de n preguntas con mezcla de débiles, vencidas y no vistas, y orden de opciones con la clave equilibrada.
6. `simulacro.ts`: armado y calificación de simulacros y probabilidad de aprobar por Monte Carlo.
7. `plan.ts`: configuración del arranque, plan del día, repaso rápido y repaso completo.
8. `muestreo.ts`: utilidades de azar reproducible (mezcla, muestreo ponderado sin reemplazo, binomial).

## Reglas de dominio

1. Visto: cualquier intento en el subtema.
2. Familiar: una sesión de lección, mini examen o práctica con al menos 4 preguntas de dificultad 3 o menos y 80% de aciertos.
3. Competente: otra sesión, al menos 2 días después de la familiar, con al menos 4 preguntas de dificultad 3 o más y 80% de aciertos; si el subtema tiene preguntas de cálculo, la sesión debe incluir cálculo.
4. Dominado: otra sesión, al menos 7 días después de la competente, con al menos 4 preguntas de dificultad 4 o más, 80% de aciertos, promedio de 74 s o menos y sin pistas.
5. Un acierto con confianza "adivine" no cuenta como acierto para subir de nivel (en la estimación Beta vale 0.5).
6. Decaimiento: más de 21 días sin intentos baja un nivel; la última sesión con menos de 50% de aciertos (con al menos 3 preguntas) baja otro nivel. Nunca se baja de "visto".
7. Dominio estimado: media posterior Beta(1, 1) con pesos de recencia de vida media 14 días y banda de credibilidad de 80% por aproximación normal.

## Selector

1. Filtra por área, subtema, tipo, dificultad y estado (por omisión solo validadas; nunca retiradas ni sin clave).
2. Clasifica cada pregunta: vencida (Leitner), débil (última respuesta fallada o subtema con dominio menor a 0.7), no vista u otra.
3. Reparte n con la mezcla 50%, 25%, 25% (método del mayor resto) y rellena con las demás clases si una no alcanza.
4. Prefiere lo no visto en los últimos 3 días y la dificultad propia del nivel (sin ver y visto: 1 a 3; familiar: 2 a 4; competente: 3 a 5; dominado: 4 a 5). Si el conjunto se agota, relaja primero la dificultad y después la recencia.
5. Las áreas obligatorias pesan 1.5 veces en el muestreo.
6. Devuelve la permutación de opciones de cada pregunta con la posición de la clave equilibrada.

## Simulacros

1. Integral: distribución oficial (210 preguntas, 258 min), solo validadas y no extra; si falta banco se arma lo posible y se reporta `faltantes` por área.
2. Módulo: un área con sus preguntas oficiales y tiempo proporcional (preguntas por 258/210, redondeado).
3. Modular extraordinario: las 4 áreas obligatorias (95 preguntas, 117 min).
4. Rápido: 40 preguntas repartidas según los pesos oficiales, 49 min.
5. Calificación: aciertos por área y tiempo; puntaje y dictamen estimados solo si están las 9 áreas.
6. Probabilidad de aprobar: Monte Carlo con una binomial por área y las dos reglas (promedio ponderado de 600 o más y 600 o más en cada obligatoria). Los puntajes son estimados porque la conversión oficial no es pública.

## Plan

1. Valores por omisión: intensivo 150 min por 6 días, ligero 50 min por 5 días.
2. El plan del día respeta el presupuesto de minutos y ordena: lección guiada, repaso rápido, práctica dirigida y, al final, el simulacro cuando corresponde.
3. La lección es de la materia obligatoria más débil que aún no esté familiar; el empate se resuelve con el orden del manual. Sin evidencia suficiente (menos de 5 intentos) se usa la autoevaluación.
4. Simulacro por módulo el último día de estudio de cada semana; en los últimos 10 días, un integral cada tres días. Si el integral no cabe en el presupuesto se sustituye por el modular extraordinario o el rápido.
5. El día del examen no hay actividades; la víspera solo hay un repaso ligero.
6. El repaso completo ordena por área del manual (ética, servicios, normativo, matemáticas, capitales, deuda, fondos, derivados, análisis) y luego por `orden`.
