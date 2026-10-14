/** Registro de los canales IPC (ADR-002). Cada entrada se valida con Zod antes de llegar a los servicios. */
import { readFileSync, statSync, writeFileSync } from 'node:fs'

/** Tamaño máximo de un respaldo importado (50 MB). */
const MAX_RESPALDO_BYTES = 50 * 1024 * 1024
import type { z } from 'zod'
import type { InfoApp, ResultadoRespaldo } from '../preload/api'
import {
  EsquemaGuardarAjuste,
  EsquemaLeccionId,
  EsquemaNotaGuardar,
  EsquemaNotaObtener,
  EsquemaPreguntaIds,
  EsquemaRegistrarIntentos,
  EsquemaRespaldo,
  EsquemaSeleccionar,
  EsquemaSesion,
  EsquemaSimulacro,
  EsquemaVacio,
  remitenteConfiable
} from './ipc-esquemas'
import type { Servicios } from './servicios'

export interface EventoIpc {
  senderFrame?: { url: string } | null
  sender?: unknown
}
export interface IpcLike {
  handle(canal: string, fn: (evento: EventoIpc, ...args: unknown[]) => unknown): void
}
/** Diálogos del sistema (inyectados para poder probar el flujo sin Electron). */
export interface Dialogos {
  guardar(evento: EventoIpc, nombreSugerido: string): Promise<string | null>
  abrir(evento: EventoIpc): Promise<string | null>
  confirmarReemplazo(evento: EventoIpc): Promise<boolean>
}
export interface ContextoIpc {
  servicios: Servicios
  info: () => InfoApp
  dialogos: Dialogos
  urlDev?: string
}

export const CANALES = [
  'app:info',
  'contenido:resumen',
  'contenido:leccion',
  'contenido:preguntas',
  'estudio:seleccionar',
  'estudio:simulacro',
  'intentos:registrar',
  'perfil:obtener',
  'plan:hoy',
  'ajustes:obtener',
  'ajustes:guardar',
  'notas:obtener',
  'notas:guardar',
  'sesiones:registrar',
  'respaldo:exportar',
  'respaldo:importar'
] as const

function mensaje(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export function registrarIpc(ipc: IpcLike, ctx: ContextoIpc): void {
  const { servicios: s } = ctx

  /** Canal con entrada validada. Si la validación falla se rechaza con un mensaje claro. */
  function canal<E extends z.ZodType>(nombre: (typeof CANALES)[number], esquema: E, fn: (entrada: z.output<E>, ev: EventoIpc) => unknown): void {
    ipc.handle(nombre, (ev, ...args) => {
      const url = ev.senderFrame?.url ?? ''
      if (!remitenteConfiable(url, ctx.urlDev)) throw new Error(`Remitente no autorizado para ${nombre}`)
      const r = esquema.safeParse(args[0])
      if (!r.success) throw new Error(`Entrada inválida en ${nombre}: ${r.error.issues[0]?.path.join('.') ?? ''} ${r.error.issues[0]?.message ?? ''}`.trim())
      return fn(r.data, ev)
    })
  }

  canal('app:info', EsquemaVacio, () => ctx.info())
  canal('contenido:resumen', EsquemaVacio, () => s.resumen())
  canal('contenido:leccion', EsquemaLeccionId, (id) => s.leccion(id))
  canal('contenido:preguntas', EsquemaPreguntaIds, (ids) => s.preguntas(ids))
  canal('estudio:seleccionar', EsquemaSeleccionar, (e) => s.seleccionar(e))
  canal('estudio:simulacro', EsquemaSimulacro, (e) => s.simulacro(e))
  canal('intentos:registrar', EsquemaRegistrarIntentos, (lista) => s.registrarIntentos(lista))
  canal('perfil:obtener', EsquemaVacio, () => s.perfil())
  canal('plan:hoy', EsquemaVacio, () => s.planHoy())
  canal('ajustes:obtener', EsquemaVacio, () => s.ajustes())
  canal('ajustes:guardar', EsquemaGuardarAjuste, (a) => s.guardarAjuste(a as Parameters<Servicios['guardarAjuste']>[0]))
  canal('notas:obtener', EsquemaNotaObtener, (e) => s.nota(e.leccionId, e.laminaId))
  canal('notas:guardar', EsquemaNotaGuardar, (e) => {
    s.guardarNota(e.leccionId, e.laminaId, e.texto)
    return { ok: true }
  })
  canal('sesiones:registrar', EsquemaSesion, (e) => {
    s.registrarSesion(e)
    return { ok: true }
  })

  canal('respaldo:exportar', EsquemaVacio, async (_e, ev): Promise<ResultadoRespaldo> => {
    const fecha = new Date().toISOString().slice(0, 10)
    const ruta = await ctx.dialogos.guardar(ev, `amib-f3-respaldo-${fecha}.json`)
    if (!ruta) return { ok: false, cancelado: true }
    try {
      const datos = s.exportar()
      writeFileSync(ruta, JSON.stringify(datos, null, 2), 'utf8')
      return { ok: true, ruta, intentos: datos.intentos.length }
    } catch (e) {
      return { ok: false, error: mensaje(e) }
    }
  })
  canal('respaldo:importar', EsquemaVacio, async (_e, ev): Promise<ResultadoRespaldo> => {
    const ruta = await ctx.dialogos.abrir(ev)
    if (!ruta) return { ok: false, cancelado: true }
    try {
      if (statSync(ruta).size > MAX_RESPALDO_BYTES) throw new Error('El respaldo excede el tamaño máximo de 50 MB.')
      const crudo = JSON.parse(readFileSync(ruta, 'utf8')) as unknown
      // Se valida antes de pedir confirmación: un archivo ajeno no llega a borrar nada.
      EsquemaRespaldo.parse(crudo)
      if (!(await ctx.dialogos.confirmarReemplazo(ev))) return { ok: false, cancelado: true }
      const r = s.importar(crudo)
      return { ok: true, ruta, intentos: r.intentos }
    } catch (e) {
      return { ok: false, error: `No se pudo importar el respaldo: ${mensaje(e)}` }
    }
  })
}
