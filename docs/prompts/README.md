# Plantillas de instrucciones para agentes

1. `autor-lecciones.txt`: instrucciones para el agente (Opus) que redacta las lecciones y las preguntas de un área. Contiene tres marcadores que se sustituyen: `{{AREA}}`, `{{ARCHIVO}}` y `{{ASIGNACION}}`.
2. `asignaciones-por-area.py`: ejemplos de asignación usados en la v1 (Ética, Mercado de Capitales, Derivados y Riesgos). Para un área nueva se agrega una entrada con el capítulo del manual y los subtemas del temario.
3. Uso: generar el texto con el script y pasar al agente la instrucción "lee el archivo de instrucciones y síguelo". Después se valida con `npx tsx tools/validar-lecciones.ts` y `npm run validate:content` antes de hacer commit.
4. La referencia de calidad son las lecciones de Títulos de Deuda (`content/lecciones/deuda/`).
