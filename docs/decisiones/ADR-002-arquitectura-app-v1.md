# ADR-002: Arquitectura de la app v1 (contenido, IPC y persistencia)

- **Estado:** aceptada (v1, 2026-10-14)
- **Contexto:**
  1. La v1 debe funcionar sin internet, con el contenido de `content/` y el progreso local.
  2. La interfaz no puede tocar Node ni la base de datos (seguridad de Electron, ADR-001).

## 1. Contenido
1. `content/` se empaqueta como **recurso externo** (`electron-builder` `extraResources` hacia `resources/content`). En desarrollo se lee desde la raíz del repositorio.
2. El proceso principal lo carga una sola vez al arrancar, lo valida con los esquemas Zod (`contenido.ts`, `leccion.ts`) y lo mantiene en memoria. Si un archivo no es válido, se omite y se registra el error. La app no se cae.
3. Las secciones del manual (`content/manual/**`) no se envían completas a la interfaz. Se envían por demanda (por id) para la explicación ampliada.

## 2. Canales IPC
Son de solicitud y respuesta, con `ipcMain.handle` en el proceso principal y `contextBridge` en el preload. Cada entrada se valida con Zod.

| Canal | Entrada | Salida |
|---|---|---|
| `app:info` | ninguna | versión y esquema de la base de datos |
| `contenido:resumen` | ninguna | áreas, materias, subtemas, número de objetivos, lecciones (metadatos) y conteo de preguntas por estado |
| `contenido:leccion` | id | la lección completa |
| `contenido:preguntas` | lista de ids | preguntas (con su clave; la app es de un solo usuario y local) |
| `estudio:seleccionar` | filtros y n | ids y permutaciones (selector del motor) |
| `estudio:simulacro` | tipo y área | simulacro armado |
| `intentos:registrar` | intento | ok |
| `perfil:obtener` | ninguna | perfil agregado (motor) |
| `plan:hoy` | ninguna | actividades del día |
| `ajustes:obtener` / `ajustes:guardar` | clave y valor | ajustes (tema, letra, fecha de examen, modo de estudio, modo con IA) |
| `notas:obtener` / `notas:guardar` | lección y lámina | texto de la nota |

## 3. Persistencia (migración 2 de `node:sqlite`)
1. `ajustes(clave, valor)`.
2. `nota_lamina(leccion_id, lamina_id, texto, actualizado)`.
3. `sesion(id, modo, inicio, fin, configuracion_json, resultado_json)`.
4. `caja_leitner(item_id, tipo, caja, proxima)`.
5. La tabla `intento` (migración 1) se amplía con `area`, `subtema_id`, `tipo`, `dificultad`, `etiqueta_error` mediante una migración nueva, nunca editando la anterior.

## 4. Interfaz
1. Enrutamiento por estado (sin navegador de rutas): Inicio, Lección, Practicar, Diagnóstico, Simulacro, Ajustes, Onboarding.
2. Los temas (Claro por omisión, Terminal, Editorial, Enfoque) se implementan como conjuntos de variables CSS en `data-tema`. La letra (Arial, Calibri, Segoe UI) va en `data-letra`.
3. Las fórmulas se renderizan con KaTeX empaquetado localmente (sin CDN). El marcado en línea de las lecciones (`**`, `[[ ]]`, `\( \)`) lo interpreta un renderizador propio que produce elementos de React, nunca HTML crudo.

## Consecuencias
1. El contenido se puede actualizar reemplazando `resources/content` sin recompilar la app.
2. El motor (`app/src/core`) es puro y se reutiliza tanto en el proceso principal como en las pruebas.
