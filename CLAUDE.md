# AMIB-F3: instrucciones para Claude

App de escritorio (Electron + React + TypeScript) para estudiar el examen **AMIB Figura 3 · Asesor en Estrategias de Inversión (Serie 210)**. Usuario único: Cesar. Interfaz y documentación en **español**.

**Antes de trabajar, lee:**
0. `docs/traspaso-de-sesion.md`: estado actual, decisiones de Cesar y pendientes (se actualiza en cada hito; mantenlo al día).
1. `docs/plan-maestro.md`: el plan aprobado, con etapas, decisiones y alcance.
2. `docs/mapa-del-repo.md`: qué hay en cada archivo y carpeta y sus trampas.
3. `docs/bitacora.md`: qué se hizo, qué funcionó y qué no.
4. La sección **Lecciones** de este archivo.

## Protocolo: pensar antes de hacer
Para cada entregable relevante (pantalla, parser, motor, lote de preguntas, guía):
1. **Propósito.** Qué problema de estudio resuelve y cómo se mide.
2. **Proceso.** Pasos, datos, herramientas y riesgos.
3. **Output.** Qué se entrega exactamente.
4. **Presentación.** ¿Es la mejor forma? Compara 2–3 alternativas. Lo visible para Cesar se prototipa y él elige.
5. **Decisión.** Si es estructural, escribe un ADR en `docs/decisiones/`.
6. **Verificación.** Pruebas y revisión independiente (agentes `code-reviewer` / `security-reviewer`).

Las tareas medianas o grandes llevan ficha en `docs/fichas/`. Al cerrar una tarea, actualiza `docs/bitacora.md` y, si aplica, `docs/mapa-del-repo.md` y las Lecciones.

## Modelos
- **Opus:** arquitectura, motor de diagnóstico, redacción de preguntas difíciles y guías, revisiones críticas.
- **Sonnet:** código, parsers, pantallas, pruebas.
- **Haiku:** tareas masivas mecánicas (etiquetar, primera validación, limpieza de OCR con control de cifras).

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run dev` | App en modo desarrollo |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run typecheck` | Tipos (proceso principal, renderer y `tools/`) |
| `npm run content:build` | Regenera `content/` desde `AMIB Data/` con los parsers de `tools/` |
| `npm run validate:content` | Valida `content/` con los esquemas Zod y resume por área/estado/fuente |
| `npm run e2e:linux` | E2E con Electron real bajo xvfb (nube/CI). Captura en `test-results/` |
| `npm run e2e` | E2E en Windows o Mac |
| `npm run dist:win` | Instalador de Windows (se compila en GitHub Actions, no en la nube Linux) |

## Convenciones
- La lógica pura va en `app/src/core/`, sin dependencias de Electron ni de React, con TDD y cobertura ≥80%.
- El renderer nunca toca Node ni la base de datos. Todo pasa por `window.amib` (preload), y la entrada IPC se valida con Zod.
- **Seguridad Electron obligatoria:** `contextIsolation`, `sandbox`, sin `nodeIntegration`, CSP estricta, navegación bloqueada, Markdown sanitizado.
- El contenido (taxonomía, preguntas, guías) vive en `content/` como datos versionados. Las preguntas tienen ID estable y nunca se borran: se **retiran**.
- Base de datos: `node:sqlite` (ver ADR-001). Las migraciones solo se agregan; nunca se editan las publicadas.
- `ECC/` y `graphify/` son fuentes de herramientas: no se compilan, no se modifican y no se indexan.
- Temas intercambiables (Terminal, Editorial, Enfoque, Claro) y tipografía elegible (Arial, Calibri, Segoe UI): los componentes usan solo tokens, nunca colores literales.
- La app abre en **Inicio** (hub de secciones), nunca directo en un examen.
- Dominio exigente: 5 niveles (Sin ver, Visto, Familiar, Competente, Dominado); acertar una vez nunca da "Dominado".
- Opciones siempre barajadas con `core/barajar.ts` (posición de la clave equilibrada). Fórmulas en dos pasos: símbolos con leyenda → valores → resultado.
- Los puntajes en escala 200–1100 son **estimados**, porque la conversión oficial no es pública. Muéstralo siempre así.

## Estilo de redacción del contenido (regla de Cesar)
Todo texto visible para Cesar (lecciones, láminas, preguntas, explicaciones, guías exportadas y textos de la interfaz) sigue un **estilo serio, educativo y académico**:
- **Prohibido:** guion largo (—), guion medio (–) usado como separador o viñeta, guion (-) como viñeta, punto medio o viñeta suelta (·, •) como separador, el símbolo °, y el asterisco (*).
- **Permitido:** oraciones completas, dos puntos, comas, punto y coma, paréntesis, listas numeradas (1., 2.) y tablas. Para separar elementos breves se usan comas o dos puntos.
- Los rangos numéricos se escriben con palabras ("de 20 a 25 preguntas") o con "a". Las flechas de proceso (→) se permiten solo en diagramas de secuencia.
- Un validador de contenido debe rechazar esos caracteres en `content/` (pendiente de implementar en `tools/validar.ts`).

## Antes de preguntarle a Cesar
Toda duda de contenido (claves, cifras, plazos, definiciones) se resuelve primero en `AMIB Data/AMIB_1_completo.md` (base principal); después en el manual 2023 y en las notas de Cesar. Solo si ninguna fuente lo resuelve, se le pregunta, indicando qué se consultó.

## Lecciones
- `Preguntas Tipo.docx`: la clave es el **texto** de la opción en negritas. En 6 preguntas (1, 4, 10, 17, 22, 32) la **letra** en negritas no coincide con ese texto. Manda el texto.
- Convenciones de cálculo del examen (de las preguntas oficiales): año de 360 días, interés simple, tasas del periodo, rendimientos de fondos sin anualizar.
- **Los problemas numéricos del examen en línea muestran 4 decimales** (indicación de Cesar). Las plantillas de cálculo calculan con precisión completa y formatean la clave y los distractores a 4 decimales (p. ej. `7.7040%`). Los distractores deben salir de errores de método reales (360/365, descuento/rendimiento, periodo/anual), nunca de un redondeo distinto, y no puede haber dos opciones iguales a 4 decimales. Las preguntas oficiales de ejemplo traen 2 decimales: se conservan tal cual.
- Los repasos de los manuales **no traen clave**. Hay que resolverlos y validarlos.
- `AMIB_1_completo.md` es OCR: numeración y cifras pueden estar mal. Toda limpieza debe conservar las cifras (verifícalo con un diff).
- El preload con `sandbox: true` debe compilarse a **CommonJS** (`index.cjs`). El proceso principal es ESM y define `__dirname` con `import.meta.url`.
- En xvfb, si la ventana es más grande que la pantalla virtual, salen artefactos en las capturas. Usa `-screen 0 1920x1080x24`.
- `npm install` falló con `edgesOut` (bug de npm con conflicto de peers) al combinar vitest 4 con vite 7. Por eso se usa vitest 3.2.
- React y Zod son `devDependencies`: el renderer los empaqueta, así que `app.asar` solo lleva `out/`.
