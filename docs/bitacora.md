# Bitácora

Formato: fecha · etapa · qué se hizo · qué funcionó · qué no · atajos y lecciones.

## 2026-10-14 · Planeación
- **Hecho:**
  - Material inventariado.
  - Plan maestro escrito, criticado por un agente Opus independiente, corregido y aprobado (`docs/plan-maestro.md`).
- **Hallazgos clave:**
  - Las claves de `Preguntas Tipo.docx` tienen 7 conflictos entre la letra y el texto en negritas.
  - Los repasos no traen clave.
  - El temario tiene ~540 objetivos, no ~600.
  - No existe un banco de preguntas gratuito oficial.
- **Atajo:** clonar el repo en el scratchpad (`git clone --depth 1`) para explorar sin tocar la rama de trabajo.

## 2026-10-14 · E0 Fundaciones
- **Hecho:**
  - Spike de base de datos (ADR-001: `node:sqlite` en Electron 44).
  - Esqueleto de Electron + React + TS con electron-vite y su base de seguridad.
  - Módulo `core/examen.ts` (estructura oficial, escala estimada, reglas de aprobación) con 9 pruebas.
  - E2E con Playwright sobre el Electron real.
  - Empaquetado validado (`app.asar` solo lleva `out/`).
  - CI con instalador de Windows y hook de inicio de sesión.
  - Skills de Emil Kowalski y agentes, skills y reglas de ECC (ver `docs/herramientas.md`).
- **Funcionó:**
  - Un agente Sonnet en paralelo instaló y revisó las skills mientras se armaba la app.
  - `npx skills add … -a claude-code --copy -y -s <skill>` instala solo las skills elegidas, dentro del proyecto.
- **No funcionó:**
  - `npm install` con vitest 4 + vite 7 dio el error `edgesOut`. Se resolvió con vitest 3.2.
  - Las capturas en xvfb salieron con artefactos porque la pantalla virtual era pequeña.
- **Pendiente para Cesar:** descargar el instalador desde Actions y confirmar que abre en Windows.
