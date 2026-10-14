import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AreaId } from '@core/examen'
import type { PlanDia } from '@core/plan'
import type { FiltroSeleccion } from '@core/selector'
import type { TipoSimulacro } from '@core/simulacro'
import type { Ajustes, AjusteGuardar, PerfilApp, ResumenContenido } from '../../preload/api'
import { mensajeError } from './lib/formato'

export type Destino =
  | { p: 'inicio' }
  | { p: 'onboarding' }
  | { p: 'hoy' }
  | { p: 'lecciones' }
  | { p: 'leccion'; id: string }
  | { p: 'practicar'; filtro?: FiltroSeleccion; n?: number; auto?: boolean }
  | { p: 'diagnostico' }
  | { p: 'simulacro'; tipo?: TipoSimulacro; area?: AreaId }
  | { p: 'ajustes' }

export interface Datos {
  resumen: ResumenContenido | null
  ajustes: Ajustes | null
  perfil: PerfilApp | null
  plan: PlanDia | null
}

interface Contexto extends Datos {
  destino: Destino
  ir: (d: Destino) => void
  recargar: () => Promise<void>
  guardarAjuste: (a: AjusteGuardar) => Promise<void>
  /** Mientras es true (examen en curso) la navegación del encabezado queda deshabilitada. */
  bloqueado: boolean
  bloquear: (v: boolean) => void
  error: string | null
}

const Ctx = createContext<Contexto | null>(null)

export function useApp(): Contexto {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp fuera de AppProvider')
  return c
}

/** Aplica tema y letra al documento (variables CSS por data-tema y data-letra). */
export function aplicarApariencia(a: Pick<Ajustes, 'tema' | 'letra'>): void {
  document.documentElement.dataset['tema'] = a.tema
  document.documentElement.dataset['letra'] = a.letra
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<Datos>({ resumen: null, ajustes: null, perfil: null, plan: null })
  const [destino, setDestino] = useState<Destino>({ p: 'inicio' })
  const [bloqueado, bloquear] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    try {
      const ajustes = await window.amib.ajustes.obtener()
      aplicarApariencia(ajustes)
      const [resumen, perfil, plan] = await Promise.all([window.amib.contenido.resumen(), window.amib.perfil.obtener(), window.amib.plan.hoy()])
      setDatos({ ajustes, resumen, perfil, plan })
      setError(null)
    } catch (e) {
      setError(mensajeError(e))
    }
  }, [])

  const guardarAjuste = useCallback(async (a: AjusteGuardar) => {
    const ajustes = await window.amib.ajustes.guardar(a)
    aplicarApariencia(ajustes)
    setDatos((d) => ({ ...d, ajustes }))
    // Cambios que alteran el plan o el perfil exigen recalcular.
    if (a.clave !== 'tema' && a.clave !== 'letra') {
      const [perfil, plan] = await Promise.all([window.amib.perfil.obtener(), window.amib.plan.hoy()])
      setDatos((d) => ({ ...d, perfil, plan }))
    }
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  // Primer arranque: si no se completó el onboarding se abre antes que el Inicio.
  const [arrancado, setArrancado] = useState(false)
  useEffect(() => {
    if (datos.ajustes && !arrancado) {
      setArrancado(true)
      if (!datos.ajustes.onboardingCompleto) setDestino({ p: 'onboarding' })
    }
  }, [datos.ajustes, arrancado])

  const ir = useCallback((d: Destino) => setDestino(d), [])
  const valor = useMemo(() => ({ ...datos, destino, ir, recargar, guardarAjuste, bloqueado, bloquear, error }), [datos, destino, ir, recargar, guardarAjuste, bloqueado, error])
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

/** Atajos de teclado a nivel de ventana; se ignoran mientras el foco está en un campo de texto. */
export function useAtajos(manejador: (e: KeyboardEvent) => void, activo = true): void {
  useEffect(() => {
    if (!activo) return
    const f = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      // Enter o espacio sobre un botón ya lo activa el navegador: no se duplica la acción.
      if ((e.key === 'Enter' || e.key === ' ') && t && /^(BUTTON|A|SUMMARY)$/.test(t.tagName)) return
      manejador(e)
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [manejador, activo])
}
