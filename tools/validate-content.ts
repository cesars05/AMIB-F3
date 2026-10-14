/** `npm run validate:content`: valida todo `content/**\/*.json` con los esquemas de `core/contenido`. Sale con 1 si hay errores. */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { CONTENIDO, RAIZ } from './rutas'
import { validarContenido, type ArchivoContenido } from './validar'

function jsonDe(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre)
    if (statSync(ruta).isDirectory()) return jsonDe(ruta)
    return ruta.endsWith('.json') ? [ruta] : []
  })
}

const archivos: ArchivoContenido[] = []
const errores: string[] = []
for (const ruta of jsonDe(CONTENIDO).sort()) {
  const rel = relative(RAIZ, ruta).split(sep).join('/')
  try {
    archivos.push({ ruta: rel, datos: JSON.parse(readFileSync(ruta, 'utf8')) as unknown })
  } catch (e) {
    errores.push(`${rel}: JSON ilegible (${e instanceof Error ? e.message : String(e)})`)
  }
}

const r = validarContenido(archivos)
errores.push(...r.errores)

const fila = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join('  ')
console.info(`Archivos: ${r.resumen.archivos}`)
if (r.resumen.taxonomia) console.info(`Taxonomía: ${r.resumen.taxonomia.temas} temas, ${r.resumen.taxonomia.subtemas} subtemas, ${r.resumen.taxonomia.objetivos} objetivos`)
console.info(`Preguntas: ${r.resumen.preguntas}`)
console.info(`  por área:   ${fila(r.resumen.porArea)}`)
console.info(`  por estado: ${fila(r.resumen.porEstado)}`)
console.info(`  por fuente: ${fila(r.resumen.porFuente)}`)

if (errores.length > 0) {
  console.error(`\n${errores.length} error(es):`)
  for (const e of errores) console.error(`  - ${e}`)
  process.exit(1)
}
console.info('\nContenido válido.')
