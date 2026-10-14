/**
 * `npm run content:build`: regenera `content/` a partir de `AMIB Data/`.
 * Salida determinista (JSON con sangría de 2 espacios, orden de claves del esquema) salvo `generado` (fecha del día).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { construirContenido } from './construir'
import { resumenTaxonomia } from './parse-temario'
import { RAIZ } from './rutas'

const generado = new Date().toISOString().slice(0, 10)
const r = await construirContenido(RAIZ, generado)

for (const [ruta, datos] of r.salidas) {
  const destino = join(RAIZ, ruta)
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(destino, JSON.stringify(datos, null, 2) + '\n', 'utf8')
  console.info(`escrito ${ruta}`)
}

const t = resumenTaxonomia(r.taxonomia)
console.info('\nTaxonomía (objetivos por área):')
for (const a of t.porArea) console.info(`  ${a.area.padEnd(12)} ${a.temas} temas, ${String(a.subtemas).padStart(2)} subtemas, ${String(a.objetivos).padStart(3)} objetivos (${a.calculo} de cálculo)`)
console.info(`  ${'TOTAL'.padEnd(12)} ${t.total.temas} temas, ${t.total.subtemas} subtemas, ${t.total.objetivos} objetivos (${t.total.calculo} de cálculo)`)

const conflictos = r.preguntasTipo.preguntas.filter((p) => p.notas.some((n) => n.startsWith('conflicto de clave'))).map((p) => p.id)
console.info(`\nPreguntas Tipo: ${r.preguntasTipo.preguntas.length} (conflictos letra/texto: ${conflictos.join(', ') || 'ninguno'})`)
console.info(`Ensayo de Ética: ${r.ensayoEtica.preguntas.length}`)
