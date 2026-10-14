/**
 * `npm run content:build`: regenera `content/` a partir de `AMIB Data/`.
 * Salida determinista (JSON con sangría de 2 espacios, orden de claves del esquema) salvo `generado` (fecha del día).
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { construirContenido } from './construir'
import { resumenTaxonomia } from './parse-temario'
import { bandaDe } from './vincular-manual'
import { CARPETA_MANUAL, RAIZ } from './rutas'

const generado = new Date().toISOString().slice(0, 10)
const r = await construirContenido(RAIZ, generado)

// El manual se regenera completo: si cambia un título, el archivo viejo no debe quedar huérfano.
rmSync(join(RAIZ, CARPETA_MANUAL), { recursive: true, force: true })
let markdown = 0
for (const [ruta, datos] of r.salidas) {
  const destino = join(RAIZ, ruta)
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(destino, typeof datos === 'string' ? datos : JSON.stringify(datos, null, 2) + '\n', 'utf8')
  if (typeof datos === 'string') markdown++
  else console.info(`escrito ${ruta}`)
}
console.info(`escritos ${markdown} archivos de sección en ${CARPETA_MANUAL}/`)

const t = resumenTaxonomia(r.taxonomia)
console.info('\nTaxonomía (objetivos por área):')
for (const a of t.porArea) console.info(`  ${a.area.padEnd(12)} ${a.temas} temas, ${String(a.subtemas).padStart(2)} subtemas, ${String(a.objetivos).padStart(3)} objetivos (${a.calculo} de cálculo)`)
console.info(`  ${'TOTAL'.padEnd(12)} ${t.total.temas} temas, ${t.total.subtemas} subtemas, ${t.total.objetivos} objetivos (${t.total.calculo} de cálculo)`)

const conflictos = r.preguntasTipo.preguntas.filter((p) => p.notas.some((n) => n.startsWith('conflicto de clave'))).map((p) => p.id)
console.info(`\nPreguntas Tipo: ${r.preguntasTipo.preguntas.length} (conflictos letra/texto: ${conflictos.join(', ') || 'ninguno'})`)
console.info(`Ensayo de Ética: ${r.ensayoEtica.preguntas.length}`)

const porCap = new Map<number, number>()
for (const s of r.indiceManual.secciones) porCap.set(s.capitulo, (porCap.get(s.capitulo) ?? 0) + 1)
const bandas = { alta: 0, media: 0, baja: 0 }
for (const v of r.vinculos) bandas[bandaDe(v.confianza)]++
const secs = r.indiceManual.secciones
console.info(`\nManual (AMIB_1): ${secs.length} secciones (${[...porCap].map(([c, n]) => `c${c}=${n}`).join(' ')})`)
console.info(`  vínculo con el temario: alta=${bandas.alta} media=${bandas.media} baja(sin vínculo)=${bandas.baja}`)
console.info(`  exclusivas Fig. 3: ${secs.filter((s) => s.exclusivoFig3).length} (parciales: ${secs.filter((s) => s.fig3Parcial).length}); numeración dudosa: ${secs.filter((s) => s.correccionNumero === 'dudosa').length}`)
console.info(`  objetivos del temario marcados exclusivoFig3: ${r.taxonomia.areas.flatMap((a) => a.temas.flatMap((t) => t.subtemas.flatMap((s) => s.objetivos))).filter((o) => o.exclusivoFig3).length}`)
console.info(`Repasos del manual: ${r.repasosManual.preguntas.length} preguntas (${r.resumenRepasos.map((x) => `c${x.capitulo}=${x.parseadas}/${x.parseadas + x.omitidas}`).join(' ')})`)
