# Ficha: App v1 (pantallas, IPC y persistencia)

Fecha: 2026-10-14. Estado: implementada y verificada con pruebas unitarias y E2E. Contrato de arquitectura: `docs/decisiones/ADR-002-arquitectura-app-v1.md`.

## 1. Propósito
Entregar la primera versión funcional de la app de escritorio: un Inicio que funciona como hub, lecciones guiadas, práctica, diagnóstico, simulacros y ajustes, todo local y sin internet. Se mide por tres criterios: (1) cada pantalla se puede recorrer solo con el teclado, (2) todo dato mostrado sale del motor de estudio (`app/src/core`) y de la base de datos, y (3) el recorrido completo pasa el E2E con Electron real.

## 2. Arquitectura
### 2.1 Proceso principal (`app/src/main`)
1. `contenido-loader.ts`: lee `content/` (en desarrollo, la raíz del repositorio; empaquetado, `resources/content`) y valida con los esquemas Zod. Una pregunta o una lección inválida se omite y se registra el error; la taxonomía ausente no impide arrancar. Los ids repetidos se descartan. La variable `AMIB_CONTENT_DIR` solo se respeta fuera de producción (pruebas y desarrollo).
2. `db.ts`: la migración 1 no se tocó. La migración 2 agrega `ajustes`, `nota_lamina`, `sesion`, `caja_leitner` y siete columnas a `intento` (`area`, `subtema_id`, `objetivo_id`, `tipo`, `dificultad`, `etiqueta_error`, `con_pistas`).
3. `repositorio.ts`: consultas de intentos, ajustes, notas, sesiones, cajas de Leitner y respaldo.
4. `servicios.ts`: une contenido, base de datos y motor (selector, simulacro, perfil, plan, dominio y Leitner). No depende de Electron, por lo que se prueba con una base en memoria.
5. `ipc-esquemas.ts` e `ipc.ts`: esquemas Zod de cada canal y registro de los manejadores. Cada llamada verifica además que el remitente sea la propia página (`file://` o la URL de desarrollo).
6. `index.ts`: ventana segura (`contextIsolation`, `sandbox`, sin `nodeIntegration`, permisos denegados, navegación bloqueada salvo la URL actual, solicitudes de red filtradas) y diálogos del sistema para el respaldo.

### 2.2 Preload (`app/src/preload`)
`window.amib` expone únicamente los canales de la sección 3, con tipos en `api.d.ts`. No se entrega `ipcRenderer` ni ningún objeto de Node.

### 2.3 Interfaz (`app/src/renderer/src`)
1. Enrutamiento por estado (`estado.tsx`, tipo `Destino`), sin librería de rutas. Al cambiar de pantalla el foco pasa al contenido principal.
2. Tokens de diseño en `estilos/tokens.css`. Los cuatro temas son conjuntos de variables bajo `data-tema` y la letra va en `data-letra`. Ningún componente usa colores literales.
3. Marcado en línea (`lib/marcado.ts`): interpreta `**negrita**`, `[[término]]` y `\( TeX \)` a un árbol de nodos que se convierte en elementos de React. El único HTML que se inyecta es la salida de `katex.renderToString` (`componentes/Tex.tsx`, con `trust: false`).
4. KaTeX viene de npm y se empaqueta localmente; las fuentes salen como archivos (`assetsInlineLimit: 0`) para cumplir la CSP (`font-src 'self'`).
5. Movimiento: entradas de 200 ms con `transform` y `opacity`, pulsación con escala 0.97 y `prefers-reduced-motion` respetado.

## 3. Canales IPC
| Canal | Entrada | Salida |
|---|---|---|
| `app:info` | ninguna | versión, Electron, Node y esquema de la base |
| `contenido:resumen` | ninguna | áreas con materias y subtemas, lecciones (metadatos), conteo de preguntas por estado y tipo, errores de carga |
| `contenido:leccion` | id | lección completa |
| `contenido:preguntas` | lista de ids | preguntas con su clave (las reportadas se devuelven como `reportada`) |
| `estudio:seleccionar` | filtro y n | `Seleccion` del motor (ids, permutaciones, `faltan`, composición) |
| `estudio:simulacro` | tipo y área | `Simulacro` del motor (preguntas presentadas, `porArea`, `faltantes`, minutos) |
| `intentos:registrar` | lista de intentos | corrección calculada en el proceso principal |
| `perfil:obtener` | ninguna | perfil del motor más probabilidad de aprobar, fuente de esa probabilidad y teoría contra cálculo por área |
| `plan:hoy` | ninguna | plan del día o `null` si no hay fecha de examen |
| `ajustes:obtener` / `ajustes:guardar` | clave y valor | ajustes completos (lista blanca de claves, cada valor con su esquema) |
| `notas:obtener` / `notas:guardar` | lección y lámina (y texto) | texto de la nota |
| `sesiones:registrar` (adición) | id, modo, fechas, configuración y resultado | ok |
| `respaldo:exportar` / `respaldo:importar` (adición) | ninguna | resultado; el archivo y la confirmación pasan por diálogos del sistema |

Decisión de diseño: el renderer manda el índice original de la opción elegida y el proceso principal decide si es correcta. La interfaz nunca declara un acierto.

## 4. Pantallas
1. Onboarding (primer arranque): fecha del examen, modo (intensivo, ligero, personalizado con minutos y días) y autoevaluación por área, guardado en `ajustes`. Se puede omitir.
2. Inicio: indicadores (días al examen, probabilidad estimada de aprobar, obligatorias en meta, cobertura), ocho tarjetas de sección (Tarjetas y Videos como "próximamente"), gráfica de dominio por área contra la meta de 75 % con las obligatorias marcadas, tiempo por pregunta contra 74 s y "lo que el sistema recuerda de ti". Las gráficas son SVG con tokens y tienen estado vacío diseñado.
3. Sesión de hoy: actividades del plan con acceso directo (lección, repaso rápido, práctica dirigida, simulacro).
4. Lecciones: lista por área en el orden del manual con insignia de nivel. Visor con el flujo aprobado en el prototipo: riel de cuatro etapas; láminas con todos los tipos de bloque; notas por lámina con guardado automático y explicación ampliada; puntos clave; práctica guiada con retroalimentación inmediata, motivo de cada distractor y patrón de error; mini examen con calificación final y nivel resultante calculado por el motor de dominio. Flechas del teclado para las láminas, letras A a D para responder.
5. Practicar: filtros (área, subtema, teoría o cálculo, dificultad, número), sesión con cronómetro frente a 74 s, confirmación con nivel de seguridad (seguro, dudé, adiviné), retroalimentación, botón para reportar y resumen final.
6. Diagnóstico: mapa de dominio por subtema con los cinco niveles, detalle del subtema, temas débiles con "Practicar esto", teoría contra cálculo y patrones de error.
7. Simulacro: integral, por módulo, modular extraordinario y rápido. Aviso previo cuando el banco validado no alcanza (`faltantes`), examen con cuenta regresiva, marca para revisión, navegador de preguntas, navegación general bloqueada y ninguna retroalimentación hasta el final. Reporte por área con puntaje marcado como estimado, dictamen por las dos reglas del examen cuando están las nueve áreas y probabilidad de aprobar por Monte Carlo.
8. Ajustes: tema (Claro por omisión, Terminal, Editorial, Enfoque) y letra (Arial, Calibri, Segoe UI), fecha y modo, autoevaluación, modo con IA como interruptor deshabilitado ("próximamente, requiere OmniRoute"), respaldo en JSON y resumen del contenido cargado.

## 5. Decisiones
1. El reporte de una pregunta se guarda en el ajuste `reportadas`. El proceso principal la sirve con estado `reportada`, de modo que el selector y el armado de simulacros la excluyen sin modificar `content/`.
2. Las opciones se barajan siempre con `presentarPreguntas` del motor. En práctica y simulacro la presentación llega por IPC; en las lecciones se calcula en la interfaz con la misma función pura, repartiendo la clave entre a y d en toda la lección.
3. Una lección se marca como vista (`leccionesVistas`) con 80 % o más en el mini examen, el mismo umbral del nivel Familiar. El plan usa esa lista para no repetir lecciones.
4. La probabilidad de aprobar usa el dominio observado si hay al menos 5 intentos en el área y, si no, el supuesto de la autoevaluación. Con menos de 30 intentos se rotula "estimada con tu autoevaluación".
5. Los puntajes de 200 a 1100 se muestran siempre con la etiqueta "estimado" y la advertencia de que AMIB no publica la conversión.
6. Solo se importa un respaldo después de validarlo por completo y de confirmar el reemplazo. La importación corre en una transacción: si falla, no se pierde nada.
7. Tailwind se usa solo por su reinicio base. Los estilos son propios, con tokens, para poder cambiar de tema sin tocar componentes.
8. No se cargan tipografías web (la CSP y el trabajo sin internet lo impiden): cada letra usa una pila del sistema, con Carlito como respaldo de Calibri.

## 6. Pruebas
1. Unitarias (`npm test`): cargador de contenido (validación, omisión de errores, ids repetidos, raíz de recursos), esquemas IPC (entradas válidas e inválidas, lista blanca de ajustes, remitente), migración 2 (incluida la migración desde una base en versión 1), servicios con base en memoria (intentos, Leitner, selector, reportes, simulacro con faltantes, plan, respaldo de ida y vuelta, respaldo inválido) y registro de canales con diálogos simulados. El intérprete del marcado también tiene pruebas, entre ellas la de que el HTML crudo queda como texto.
2. E2E (`npm run e2e:linux`, Electron real bajo xvfb): seguridad del puente, onboarding, inicio con estados vacíos, sesión de hoy, lección completa con todos los bloques, notas persistentes, práctica de 3 preguntas, simulacro integral con aviso de faltantes, simulacro rápido de principio a fin, diagnóstico, cambio de tema y letra, ausencia de errores de consola y persistencia al reabrir. Usa una copia del contenido real más una lección de prueba (`AMIB_CONTENT_DIR`); si existen lecciones reales, abre además la primera.
3. Capturas en `test-results/app-v1-*.png`: una por pantalla y el Inicio en los cuatro temas (`app-v1-26-inicio-claro.png`, `app-v1-26-inicio-terminal.png`, `app-v1-26-inicio-editorial.png` y `app-v1-26-inicio-enfoque.png`).

## 7. Limitaciones conocidas
1. Las secciones del manual (`content/manual/**`) no se cargan ni se sirven por demanda: la explicación ampliada sale del campo `ampliada` de cada lámina.
2. El reto de "Dominado" (`reto` en la lección) no tiene pantalla todavía.
3. Tarjetas y Videos son tarjetas deshabilitadas. El repaso rápido del plan abre una práctica que prioriza lo vencido por Leitner.
4. Ninguna pregunta del banco actual trae `subtemaId`. Por eso el filtro por subtema de Practicar devuelve vacío y el mapa de Diagnóstico solo se llena con los intentos de lecciones (que aportan el subtema de la lección). El dominio por área sí funciona.
5. El diálogo de guardar y abrir archivos no se automatiza en el E2E; su flujo se prueba con diálogos simulados y la validación del archivo.
6. El instalador de Windows no se compiló aquí (se hace en GitHub Actions). La carpeta `content/` se empaqueta con `extraResources`, pero esa ruta de producción solo está cubierta por la prueba de `resolverRaizContenido`.
7. El tiempo por pregunta del mini examen se aproxima con el intervalo entre respuestas consecutivas.
8. El bundle del renderer pesa unos 1.3 MB sin comprimir (React, KaTeX y el motor); no se dividió en fragmentos.
9. El diseño visual es funcional y consistente, pero no es el diseño final (queda para la fase de diseño visual).

## 8. Supuestos y dudas
1. Se agregaron tres canales que el ADR-002 no lista (`sesiones:registrar`, `respaldo:exportar`, `respaldo:importar`). Propongo enmendar el ADR; el reporte de preguntas no requirió canal propio.
2. `intentos:registrar` recibe una lista (máximo 300) y devuelve la corrección, en lugar de recibir `correcta` desde la interfaz. Es más seguro, pero cambia la firma implícita del ADR.
3. La zona horaria del plan es la del centro de México (valor por omisión del motor). Si el equipo está en otra zona, el conteo de días puede diferir en uno.
4. Se agregó la ruta "hoy" (Sesión de hoy), que no figura en la lista de pantallas del ADR.
5. El símbolo "●" marca las áreas obligatorias en las gráficas, tal como en el prototipo aprobado. Si la regla de estilo lo considera una viñeta, se sustituye por la palabra "obligatoria".
6. Se quitaron las flechas de los botones de navegación (el prototipo las traía) para respetar la regla de estilo, que solo admite flechas en diagramas de secuencia.
7. Umbrales elegidos por mí: 80 % para marcar una lección como vista, 5 intentos por área para usar el dominio observado, 30 intentos para dejar de rotular la probabilidad como basada en la autoevaluación, y área "en riesgo" si una obligatoria queda bajo 60 % en la gráfica de dominio (el mismo criterio del prototipo).
8. Un simulacro rápido o integral con las nueve áreas, aunque incompleto por falta de banco, sí recibe dictamen global, con una advertencia visible. Podría preferirse no dictaminar cuando falte más de cierta proporción de preguntas.
9. Para la lección de prueba del E2E se usan preguntas oficiales de ejemplo (`tipo.01` a `tipo.06`); el archivo vive solo en un directorio temporal y no se agrega a `content/`.
10. No actualicé `docs/mapa-del-repo.md`, `docs/bitacora.md` ni `docs/traspaso-de-sesion.md` porque otros agentes los editan en paralelo; conviene que el agente principal los actualice.
