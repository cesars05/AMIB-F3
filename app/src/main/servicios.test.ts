import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { crearAzar } from '../core/barajar'
import { cargarContenido } from './contenido-loader'
import { abrirBaseDeDatos } from './db'
import { registrarIpc, type Dialogos, type EventoIpc, type IpcLike } from './ipc'
import { crearServicios } from './servicios'

const RAIZ = join(import.meta.dirname, '..', '..', '..', 'content')
const AHORA = new Date('2026-10-14T15:00:00Z')

function entorno() {
  const db = abrirBaseDeDatos(':memory:')
  const contenido = cargarContenido(RAIZ)
  let t = AHORA.getTime()
  const s = crearServicios({ db, contenido, ahora: () => new Date(t), azar: () => crearAzar(7) })
  return { db, contenido, s, avanzar: (ms: number) => (t += ms) }
}

describe('servicios', () => {
  it('resume el contenido con las 9 áreas y los conteos por estado', () => {
    const { s } = entorno()
    const r = s.resumen()
    expect(r.areas).toHaveLength(9)
    expect(r.totalObjetivos).toBeGreaterThan(400)
    expect(r.preguntas.porEstado['validada']).toBeGreaterThan(50)
  })

  it('registra intentos calculando la corrección en el proceso principal', () => {
    const { s } = entorno()
    const p = s.preguntas(['tipo.01'])[0]!
    const mala = (p.clave! + 1) % 4
    const r = s.registrarIntentos([
      { preguntaId: p.id, respuesta: p.clave!, tiempoMs: 4000, modo: 'practica', sesionId: 's1' },
      { preguntaId: p.id, respuesta: mala, tiempoMs: 9000, modo: 'practica', sesionId: 's1', confianza: 'dude' }
    ])
    expect(r.resultados.map((x) => x.correcta)).toEqual([true, false])
    const perfil = s.perfil()
    expect(perfil.intentosTotales).toBe(2)
    expect(perfil.areas.find((a) => a.area === p.area)!.intentos).toBe(2)
  })

  it('rechaza preguntas desconocidas sin dejar intentos a medias', () => {
    const { s } = entorno()
    expect(() =>
      s.registrarIntentos([
        { preguntaId: 'tipo.01', respuesta: 0, tiempoMs: 1, modo: 'practica', sesionId: 's1' },
        { preguntaId: 'no.existe', respuesta: 0, tiempoMs: 1, modo: 'practica', sesionId: 's1' }
      ])
    ).toThrow(/desconocida/)
    expect(s.perfil().intentosTotales).toBe(0)
  })

  it('el selector devuelve preguntas distintas con la clave dentro de rango y respeta el filtro', () => {
    const { s } = entorno()
    const sel = s.seleccionar({ n: 6, filtro: { areas: ['etica'] } })
    expect(sel.ids).toHaveLength(6)
    expect(new Set(sel.ids).size).toBe(6)
    const ps = s.preguntas(sel.ids)
    expect(ps.every((p) => p.area === 'etica')).toBe(true)
    for (const pr of sel.presentacion) expect(pr.clave).toBeGreaterThanOrEqual(0)
  })

  it('las preguntas reportadas salen de la práctica y de los simulacros', () => {
    const { s } = entorno()
    const antes = s.seleccionar({ n: 200, filtro: { areas: ['etica'] } }).ids
    const quitada = antes[0]!
    s.guardarAjuste({ clave: 'reportadas', valor: [quitada] })
    expect(s.seleccionar({ n: 200, filtro: { areas: ['etica'] } }).ids).not.toContain(quitada)
    expect(s.preguntas([quitada])[0]!.estado).toBe('reportada')
    expect(s.simulacro({ tipo: 'rapido' }).preguntas.map((p) => p.id)).not.toContain(quitada)
  })

  it('arma un simulacro rápido e informa faltantes si el banco no alcanza', () => {
    const { s } = entorno()
    const sim = s.simulacro({ tipo: 'rapido' })
    expect(sim.tiempoMin).toBe(49)
    expect(sim.preguntas.length).toBeLessThanOrEqual(40)
    const integral = s.simulacro({ tipo: 'integral' })
    expect(integral.preguntas.length).toBeLessThan(210)
    expect(Object.values(integral.faltantes).reduce((a, b) => a + (b ?? 0), 0)).toBe(210 - integral.preguntas.length)
  })

  it('el plan de hoy es nulo sin fecha de examen y devuelve actividades con ella', () => {
    const { s } = entorno()
    expect(s.planHoy()).toBeNull()
    s.guardarAjuste({ clave: 'fechaExamen', valor: '2026-11-29' })
    s.guardarAjuste({ clave: 'modo', valor: 'ligero' })
    s.guardarAjuste({ clave: 'minutosDia', valor: 60 })
    s.guardarAjuste({ clave: 'diasSemana', valor: 7 })
    const plan = s.planHoy()!
    expect(plan.diasParaExamen).toBe(46)
    expect(plan.esDiaDeEstudio).toBe(true)
    expect(plan.totalMin).toBeLessThanOrEqual(60)
  })

  it('la probabilidad de aprobar usa la autoevaluación cuando no hay intentos', () => {
    const { s } = entorno()
    expect(s.perfil().probabilidadAprobar).toBeNull()
    s.guardarAjuste({ clave: 'autoevaluacion', valor: { etica: 'domino', deuda: 'nunca' } })
    const p = s.perfil()
    expect(p.fuenteProbabilidad).toBe('autoevaluacion')
    expect(p.probabilidadAprobar).toBeGreaterThanOrEqual(0)
    expect(p.probabilidadAprobar).toBeLessThanOrEqual(1)
  })

  it('guarda y recupera notas por lámina y sesiones', () => {
    const { s, db } = entorno()
    expect(s.nota('l1', 'a')).toBe('')
    s.guardarNota('l1', 'a', 'mi nota')
    s.guardarNota('l1', 'a', 'mi nota editada')
    expect(s.nota('l1', 'a')).toBe('mi nota editada')
    s.registrarSesion({ id: 'x1', modo: 'simulacro', inicio: AHORA.toISOString() })
    s.registrarSesion({ id: 'x1', modo: 'simulacro', inicio: AHORA.toISOString(), fin: AHORA.toISOString(), resultado: { ok: 1 } })
    expect((db.prepare('SELECT COUNT(*) AS n FROM sesion').get() as { n: number }).n).toBe(1)
  })

  it('actualiza la caja de Leitner al registrar intentos', () => {
    const { s, db } = entorno()
    const p = s.preguntas(['tipo.01'])[0]!
    const reg = (r: number) => s.registrarIntentos([{ preguntaId: p.id, respuesta: r, tiempoMs: 1000, modo: 'practica', sesionId: 's1' }])
    reg(p.clave!)
    expect((db.prepare('SELECT caja FROM caja_leitner WHERE item_id = ?').get(p.id) as { caja: number }).caja).toBe(2)
    reg(p.clave!)
    expect((db.prepare('SELECT caja FROM caja_leitner WHERE item_id = ?').get(p.id) as { caja: number }).caja).toBe(3)
    reg((p.clave! + 1) % 4)
    expect((db.prepare('SELECT caja FROM caja_leitner WHERE item_id = ?').get(p.id) as { caja: number }).caja).toBe(1)
  })

  it('exporta e importa el progreso completo (ida y vuelta)', () => {
    const a = entorno()
    const p = a.s.preguntas(['tipo.02'])[0]!
    a.s.registrarIntentos([{ preguntaId: p.id, respuesta: p.clave!, tiempoMs: 3000, modo: 'practica', sesionId: 's9' }])
    a.s.guardarAjuste({ clave: 'tema', valor: 'editorial' })
    a.s.guardarNota('l1', 'a', 'nota')
    const datos = a.s.exportar()
    const b = entorno()
    expect(b.s.importar(JSON.parse(JSON.stringify(datos))).intentos).toBe(1)
    expect(b.s.perfil().intentosTotales).toBe(1)
    expect(b.s.ajustes().tema).toBe('editorial')
    expect(b.s.nota('l1', 'a')).toBe('nota')
  })

  it('un respaldo inválido no borra el progreso existente', () => {
    const { s } = entorno()
    s.guardarAjuste({ clave: 'tema', valor: 'terminal' })
    expect(() => s.importar({ formato: 'otro' })).toThrow()
    expect(s.ajustes().tema).toBe('terminal')
  })
})

describe('registro de canales IPC', () => {
  function montar(dialogos?: Partial<Dialogos>) {
    const { s } = entorno()
    const manejadores = new Map<string, (ev: EventoIpc, ...a: unknown[]) => unknown>()
    const ipc: IpcLike = { handle: (c, fn) => void manejadores.set(c, fn) }
    registrarIpc(ipc, {
      servicios: s,
      info: () => ({ version: '0', electron: '0', node: '0', esquemaDb: 2 }),
      dialogos: { guardar: async () => null, abrir: async () => null, confirmarReemplazo: async () => true, ...dialogos }
    })
    const ok: EventoIpc = { senderFrame: { url: 'file:///app/index.html' } }
    return { manejadores, ok, s }
  }

  it('registra todos los canales del ADR-002', () => {
    const { manejadores } = montar()
    for (const c of ['app:info', 'contenido:resumen', 'contenido:leccion', 'contenido:preguntas', 'estudio:seleccionar', 'estudio:simulacro', 'intentos:registrar', 'perfil:obtener', 'plan:hoy', 'ajustes:obtener', 'ajustes:guardar', 'notas:obtener', 'notas:guardar'])
      expect(manejadores.has(c)).toBe(true)
  })

  it('valida la entrada y el remitente', async () => {
    const { manejadores, ok } = montar()
    const h = manejadores.get('estudio:seleccionar')!
    await expect(Promise.resolve().then(() => h(ok, { n: -3 }))).rejects.toThrow(/Entrada inválida/)
    await expect(Promise.resolve().then(() => h({ senderFrame: { url: 'https://evil.example' } }, { n: 3 }))).rejects.toThrow(/Remitente/)
    await expect(Promise.resolve().then(() => h({ senderFrame: null }, { n: 3 }))).rejects.toThrow(/Remitente/)
    expect((h(ok, { n: 3 }) as { ids: string[] }).ids.length).toBe(3)
  })

  it('ajustes:guardar rechaza claves y valores inválidos', async () => {
    const { manejadores, ok } = montar()
    const h = manejadores.get('ajustes:guardar')!
    expect(() => h(ok, { clave: 'tema', valor: 'terminal' })).not.toThrow()
    expect(() => h(ok, { clave: 'tema', valor: 'rosa' })).toThrow()
    expect(() => h(ok, { clave: 'otra', valor: 1 })).toThrow()
  })

  it('exporta a un archivo y cancela sin escribir', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'amib-resp-'))
    try {
      const ruta = join(dir, 'r.json')
      const a = montar({ guardar: async () => ruta })
      const r = (await a.manejadores.get('respaldo:exportar')!(a.ok)) as { ok: boolean; ruta: string }
      expect(r.ok).toBe(true)
      expect(JSON.parse(readFileSync(ruta, 'utf8')).formato).toBe('amib-f3-respaldo')
      const b = montar()
      expect(await b.manejadores.get('respaldo:exportar')!(b.ok)).toEqual({ ok: false, cancelado: true })
      // Importar un archivo ajeno: error claro y sin confirmación.
      writeFileSync(join(dir, 'malo.json'), '{"hola":1}')
      let confirmo = false
      const c = montar({ abrir: async () => join(dir, 'malo.json'), confirmarReemplazo: async () => ((confirmo = true), true) })
      const ri = (await c.manejadores.get('respaldo:importar')!(c.ok)) as { ok: boolean; error?: string }
      expect(ri.ok).toBe(false)
      expect(ri.error).toContain('No se pudo importar')
      expect(confirmo).toBe(false)
      // Importar un respaldo válido.
      const d = montar({ abrir: async () => ruta })
      const rd = (await d.manejadores.get('respaldo:importar')!(d.ok)) as { ok: boolean }
      expect(rd.ok).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
