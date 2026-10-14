# Herramientas de desarrollo (skills, agentes y reglas)

Este documento lista lo que está instalado en `.claude/` para trabajar en AMIB-F3 (app de escritorio Electron + React + TypeScript para estudiar el examen AMIB, interfaz en español), de dónde viene cada pieza, para qué sirve aquí y cuándo usarla.

Todo vive dentro del proyecto (`.claude/`), no en `~/.claude/`, así que viaja con el repositorio.

## 1. Skills de diseño (Emil Kowalski)

Origen: <https://github.com/emilkowalski/skills>. Instaladas en `.claude/skills/<nombre>/SKILL.md` (más archivos de apoyo como `RECIPES.md`, `AUDIT.md`, etc.). Se revisó su contenido: son solo texto de guía (sin comandos remotos ni scripts); los únicos enlaces son a documentación y librerías.

| Nombre | Para qué sirve en este proyecto | Cuándo usarla |
|---|---|---|
| `emil-design-eng` | Filosofía de pulido de UI: detalles invisibles, decisiones de componentes y animación. Base de criterio visual. | Al diseñar o revisar cualquier pantalla/componente. |
| `apple-design` | Principios de diseño estilo Apple (jerarquía, tipografía, espaciado, claridad). | Al definir el look general de la app de estudio. |
| `prototype` | Genera varias versiones distintas de un componente con un selector visual para elegir. Solo se ejecuta si se invoca explícitamente. | Cuando haya duda entre varias opciones de UI (tarjeta de pregunta, dashboard de progreso). |
| `animate` | Guía y recetas para implementar animaciones (curvas, duraciones, tokens). | Al añadir transiciones (cambio de pregunta, feedback correcto/incorrecto). |
| `find-animation-opportunities` | Solo lectura: detecta dónde sí vale la pena animar y rechaza el resto. | Pasada de pulido cuando las pantallas ya funcionan. |
| `animation-vocabulary` | Vocabulario para describir movimiento con precisión. | Al pedir o discutir animaciones. |
| `review-animations` | Revisa código de animación contra un estándar alto. | Antes de dar por buena una animación o PR con motion. |
| `improve-animations` | Auditoría del movimiento de toda la app y planes de mejora ejecutables por otros agentes. Solo lectura. | Revisión global del movimiento (hito de pulido). |
| `animation-performance` | Rendimiento de animaciones (propiedades baratas, fps). | Si una animación se ve entrecortada. |
| `ask-sonner` | Guía de Sonner (toasts) con referencia de API. | Si se usan notificaciones toast (guardado, errores). |
| `break-ui` | Prueba una UI con datos extremos (textos largos, vacíos, números enormes) tras un interruptor "Demo / Peor caso". | Con tarjetas de preguntas con enunciados largos, listas vacías, etc. |
| `pick-ui-library` | Lista opinada de librerías de frontend por tarea. Solo se ejecuta si se invoca. | Antes de añadir una dependencia de UI (gráficas, virtualización, drag and drop). |

No instaladas a propósito: `mobile-native`, `animate-expo`, `write-swift` (no aplican a una app de escritorio Electron).

## 2. Agentes (Everything Claude Code)

Origen: carpeta local `ECC/` (v2.2.3), copiados de `ECC/agents/` a `.claude/agents/`.

| Agente | Modelo fijado | Herramientas | Para qué sirve aquí | Cuándo usarlo |
|---|---|---|---|---|
| `planner` | opus | Read, Grep, Glob | Plan de implementación de funciones complejas y refactors. | Antes de cada épica/funcionalidad grande. |
| `architect` | opus | Read, Grep, Glob | Decisiones de arquitectura (procesos main/renderer/preload de Electron, almacenamiento, estructura de datos). | Decisiones de diseño técnico. |
| `tdd-guide` | sonnet | Read, Write, Edit, Bash, Grep | Guía el flujo test primero (rojo, verde, refactor). | Lógica de negocio: repaso espaciado, puntuación, parseo del banco de preguntas. |
| `code-reviewer` | sonnet | Read, Grep, Glob, Bash | Revisión general de calidad tras escribir código. | Después de cada cambio relevante. |
| `typescript-reviewer` | sonnet | Read, Grep, Glob, Bash | Revisión de tipos, async y patrones de TS/JS. | Cambios en `.ts`/`.tsx`. |
| `react-reviewer` | sonnet | Read, Grep, Glob, Bash | Revisión de hooks, rendimiento de render y accesibilidad en React. | Cambios en componentes `.tsx`. |
| `security-reviewer` | sonnet | Read, Grep, Glob, Bash | Seguridad (en Electron: `contextIsolation`, IPC, `nodeIntegration`, rutas de archivos, XSS). | Al tocar IPC, preload, lectura de archivos o contenido HTML. |
| `e2e-runner` | sonnet | Read, Write, Edit, Bash, Grep, Glob | Pruebas end-to-end y manejo de tests inestables. | Cuando exista Playwright (ver sección 5). |
| `build-error-resolver` | sonnet | Read, Write, Edit, Bash, Grep, Glob | Arregla errores de compilación/tipos con diffs mínimos. | Cuando falle `build` o `tsc`. |

Todos tienen frontmatter válido (`name`, `description`, `tools`, `model`). Los `model:` vienen fijados desde ECC (`opus` en planner y architect, `sonnet` en el resto); se dejaron tal cual.

## 3. Skills de ECC

Copiadas de `ECC/skills/` a `.claude/skills/`.

| Skill | Para qué sirve aquí | Cuándo usarla |
|---|---|---|
| `tdd-workflow` | Flujo TDD completo con cobertura 80%+. | Implementar lógica con pruebas primero. |
| `e2e-testing` | Patrones de Playwright (Page Object, CI, tests inestables). | Al montar las pruebas E2E de Electron. |
| `frontend-a11y` | Accesibilidad: HTML semántico, ARIA, teclado, foco. | Al construir formularios, tarjetas de pregunta y navegación por teclado. |
| `verification-loop` | Verificación en seis fases: build, tipos, lint, tests, seguridad, revisión del diff. | Antes de dar una tarea por terminada o hacer commit. |
| `frontend-patterns` | Patrones de React, estado, rendimiento. | Al estructurar componentes y estado. |

## 4. Reglas (ECC)

Copiadas de `ECC/rules/{common,typescript,web,react}` a `.claude/rules/ecc/`.

| Carpeta | Contenido | Carga |
|---|---|---|
| `rules/ecc/common/` | Estilo de código, tests, seguridad, git, rendimiento, patrones, revisión, flujo de desarrollo, hooks, agentes. | Siempre (sin `paths`), unos 19 KB de contexto por sesión. |
| `rules/ecc/typescript/` | Reglas específicas de TS. | Solo al tocar `*.ts`, `*.tsx`, `*.js`, `*.jsx`. |
| `rules/ecc/web/` | Reglas web/frontend (calidad de diseño, rendimiento, seguridad, tests). | Según `paths` de cada archivo. |
| `rules/ecc/react/` | Hooks, patrones, seguridad y tests de React. | Según `paths` de cada archivo. |

## 5. Cómo se instalaron (comandos exactos)

Desde la raíz del repositorio (`/home/user/AMIB-F3`):

```bash
# Skills de Emil Kowalski (alcance proyecto, copia en lugar de enlace simbólico)
npx -y skills@latest add emilkowalski/skills -a claude-code --copy -y \
  -s apple-design -s emil-design-eng -s prototype -s animate \
  -s find-animation-opportunities -s animation-vocabulary -s review-animations \
  -s improve-animations -s animation-performance -s ask-sonner -s break-ui \
  -s pick-ui-library

# Agentes de ECC
mkdir -p .claude/agents
for a in planner architect tdd-guide code-reviewer typescript-reviewer react-reviewer \
         security-reviewer e2e-runner build-error-resolver; do
  cp ECC/agents/$a.md .claude/agents/
done

# Skills de ECC
for s in tdd-workflow e2e-testing frontend-a11y verification-loop frontend-patterns; do
  cp -r ECC/skills/$s .claude/skills/
done

# Reglas de ECC
mkdir -p .claude/rules/ecc
for r in common typescript web react; do
  cp -r ECC/rules/$r .claude/rules/ecc/
done
```

El comando de `skills` también crea `skills-lock.json` en la raíz (fuente y hash de cada skill instalada); se conserva porque es lo que permite actualizar.

## 6. Cómo actualizar

- Skills de Emil Kowalski: `npx -y skills@latest update` (o `update <nombre>`) desde la raíz; usa `skills-lock.json`. Para restaurarlas en otra máquina: `npx skills@latest experimental_install`. Para ver lo instalado: `npx skills@latest list`.
- Piezas de ECC: son copias manuales. Para actualizar, actualizar primero la carpeta `ECC/` (nueva versión del repositorio original) y volver a ejecutar los bucles `cp` de la sección 5. Revisar `git diff` antes de aceptar, porque se perderían los ajustes locales listados abajo.

## 7. Advertencias

- `.claude/rules/ecc/common/agents.md`: se quitó el prefijo `ecc:` de los nombres de agentes (en una instalación manual se invocan con el nombre simple). Menciona agentes que no se instalaron (`refactor-cleaner`, `doc-updater`, `rust-reviewer`, `harmonyos-app-resolver`); ignorarlos. Es el único archivo de ECC modificado.
- `e2e-runner` prefiere "Vercel Agent Browser" (`npm install -g agent-browser`), que no está instalado; usar la ruta de Playwright. `react-reviewer` y `typescript-reviewer` mencionan comandos de ECC (`/react-review`, `/react-build`, `/react-test`, `/plan`, `/verify`) que no existen aquí; invocar los agentes por nombre.
- `typescript-reviewer` menciona la skill `coding-standards`, que no se instaló.
- `rules/ecc/react/testing.md` tiene un enlace relativo roto a `e2e-testing` (cosmético).
- `frontend-a11y` y `frontend-patterns` hablan también de Next.js; en Electron + React las partes de servidor/rutas no aplican.
- `rules/ecc/common/git-workflow.md` y `hooks.md` hablan de ajustes en `~/.claude/settings.json` propios de ECC; no se aplican automáticamente.
- Las reglas de `common/` se cargan siempre y consumen contexto; si molestan, añadirles `paths` o quitar las que no se usen.
- Las skills se ejecutan con los permisos completos del agente: revisarlas tras cada actualización.
- Las carpetas `ECC/` y `graphify/` permanecen en el repositorio solo como fuente de consulta/copia y están excluidas del build (no deben entrar en `tsconfig`, el bundler ni `electron-builder`).

## 8. Herramientas planificadas (aún no instaladas)

| Herramienta | Etapa | Notas |
|---|---|---|
| Playwright | E0 | Pruebas E2E de la app Electron; habilita `e2e-runner` y `e2e-testing`. |
| OmniRoute | E2 | Se ejecutará en el PC del usuario (no en el repositorio). |
| MCP de diagramas | E2 | Por evaluar qué servidor concreto. |
| Graphify | Pospuesto | La carpeta `graphify/` queda en el repo como fuente; no se instala por ahora. |
