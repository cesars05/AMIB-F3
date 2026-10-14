/**
 * Valida las lecciones (`content/lecciones/**`) y las preguntas generadas (`content/preguntas/generadas/**`):
 * esquema, regla de estilo, referencias a preguntas existentes, equilibrio de la posición de la clave
 * y opciones sin duplicados. Uso: `npx tsx tools/validar-lecciones.ts` (sale con 1 si hay errores).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ArchivoPreguntasSchema, type Pregunta } from '../app/src/core/contenido'
import { CARACTERES_PROHIBIDOS, LeccionSchema, violacionesDeEstilo, type Leccion } from '../app/src/core/leccion'

const RAIZ = join(import.meta.dirname, '..')

function archivosJson(dir: string): string[] {
  try {
    return readdirSync(dir).flatMap((n) => {
      const r = join(dir, n)
      return statSync(r).isDirectory() ? archivosJson(r) : n.endsWith('.json') ? [r] : []
    })
  } catch {
    return []
  }
}

export interface Reporte {
  errores: string[]
  avisos: string[]
  lecciones: number
  preguntasGeneradas: number
}

export function estiloPregunta(p: Pregunta): string[] {
  const textos = [p.enunciado, p.explicacion ?? '', ...p.opciones.flatMap((o) => [o.texto, o.porQueNo ?? ''])]
  return textos.filter((t) => CARACTERES_PROHIBIDOS.test(t.replace(/\*\*/g, '')))
}

export function validarLeccionesYGeneradas(lecciones: Leccion[], generadas: Pregunta[], todasLasIds: Set<string>): Reporte {
  const errores: string[] = []
  const avisos: string[] = []
  for (const l of lecciones) {
    for (const v of violacionesDeEstilo(l)) errores.push(`${l.id}: estilo prohibido en "${v.slice(0, 60)}"`)
    for (const id of [...l.practica, ...l.miniExamen, ...l.reto]) if (!todasLasIds.has(id)) errores.push(`${l.id}: pregunta inexistente ${id}`)
    const solapa = l.practica.filter((id) => l.miniExamen.includes(id))
    if (solapa.length) errores.push(`${l.id}: la práctica y el mini examen comparten ${solapa.join(', ')}`)
  }
  const posiciones = [0, 0, 0, 0]
  for (const p of generadas) {
    for (const v of estiloPregunta(p)) errores.push(`${p.id}: estilo prohibido en "${v.slice(0, 60)}"`)
    const textos = p.opciones.map((o) => o.texto.trim().toLowerCase())
    if (new Set(textos).size !== textos.length) errores.push(`${p.id}: opciones repetidas`)
    if (p.clave === null) errores.push(`${p.id}: pregunta generada sin clave`)
    else {
      posiciones[p.clave]!++
      if (!p.explicacion) errores.push(`${p.id}: falta explicación`)
      p.opciones.forEach((o, i) => {
        if (i !== p.clave && !o.porQueNo) errores.push(`${p.id}: la opción ${'abcd'[i]} no explica por qué es incorrecta`)
      })
      const larga = textos.reduce((m, t, i) => (t.length > textos[m]!.length ? i : m), 0)
      if (larga === p.clave && textos[larga]!.length > 1.6 * Math.max(...textos.filter((_, i) => i !== larga).map((t) => t.length))) {
        avisos.push(`${p.id}: la correcta es notablemente la opción más larga`)
      }
    }
    if (!p.cita) avisos.push(`${p.id}: sin cita al manual`)
  }
  const total = posiciones.reduce((a, b) => a + b, 0)
  if (total >= 20) {
    posiciones.forEach((n, i) => {
      const f = n / total
      if (f < 0.15 || f > 0.35) errores.push(`posición de clave desequilibrada: ${'abcd'[i]} = ${(f * 100).toFixed(0)} %`)
    })
  }
  return { errores, avisos, lecciones: lecciones.length, preguntasGeneradas: generadas.length }
}

function main(): void {
  const lecciones = archivosJson(join(RAIZ, 'content/lecciones')).map((f) => LeccionSchema.parse(JSON.parse(readFileSync(f, 'utf8'))))
  const archivosPreg = archivosJson(join(RAIZ, 'content/preguntas'))
  const todas = archivosPreg.flatMap((f) => ArchivoPreguntasSchema.parse(JSON.parse(readFileSync(f, 'utf8'))).preguntas)
  const generadas = todas.filter((p) => p.fuente === 'generada')
  const r = validarLeccionesYGeneradas(lecciones, generadas, new Set(todas.map((p) => p.id)))
  console.log(`Lecciones: ${r.lecciones}, preguntas generadas: ${r.preguntasGeneradas}`)
  r.avisos.forEach((a) => console.log('aviso:', a))
  r.errores.forEach((e) => console.error('ERROR:', e))
  if (r.errores.length) process.exit(1)
  console.log('Lecciones y preguntas generadas válidas.')
}

if (process.argv[1]?.endsWith('validar-lecciones.ts')) main()
