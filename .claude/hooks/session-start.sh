#!/usr/bin/env bash
# Prepara el entorno al iniciar una sesión de Claude Code en la nube:
# instala dependencias si faltan. No corre en la PC de Cesar (solo cuando CLAUDE_CODE_REMOTE=true).
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm ci --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1
fi
echo "AMIB-F3 listo: lee CLAUDE.md (protocolo y lecciones) y docs/mapa-del-repo.md antes de trabajar."
