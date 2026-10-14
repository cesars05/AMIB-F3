import { useEffect, useRef } from 'react'
import { AppProvider, useApp, type Destino } from './estado'
import { Cargando } from './componentes/Comunes'
import { Ajustes } from './pantallas/Ajustes'
import { Diagnostico } from './pantallas/Diagnostico'
import { HoyPantalla } from './pantallas/Hoy'
import { Inicio } from './pantallas/Inicio'
import { LeccionVisor } from './pantallas/Leccion'
import { Lecciones } from './pantallas/Lecciones'
import { Onboarding } from './pantallas/Onboarding'
import { Practicar } from './pantallas/Practicar'
import { Simulacro } from './pantallas/Simulacro'

const NAV: { p: Destino['p']; etiqueta: string; destino: Destino }[] = [
  { p: 'inicio', etiqueta: 'Inicio', destino: { p: 'inicio' } },
  { p: 'lecciones', etiqueta: 'Lecciones', destino: { p: 'lecciones' } },
  { p: 'practicar', etiqueta: 'Practicar', destino: { p: 'practicar' } },
  { p: 'diagnostico', etiqueta: 'Diagnóstico', destino: { p: 'diagnostico' } },
  { p: 'simulacro', etiqueta: 'Simulacro', destino: { p: 'simulacro' } },
  { p: 'ajustes', etiqueta: 'Ajustes', destino: { p: 'ajustes' } }
]

function seccionActiva(p: Destino['p']): Destino['p'] {
  return p === 'leccion' ? 'lecciones' : p === 'hoy' ? 'inicio' : p
}

function Pantalla() {
  const { destino, ajustes, resumen, error } = useApp()
  if (error && !ajustes) {
    return (
      <div className="error-caja" role="alert">
        No se pudo cargar la aplicación: {error}
      </div>
    )
  }
  if (!ajustes || !resumen) return <Cargando texto="Cargando tu progreso" />
  switch (destino.p) {
    case 'onboarding':
      return <Onboarding />
    case 'inicio':
      return <Inicio />
    case 'hoy':
      return <HoyPantalla />
    case 'lecciones':
      return <Lecciones />
    case 'leccion':
      return <LeccionVisor key={destino.id} id={destino.id} />
    case 'practicar':
      return <Practicar key={JSON.stringify(destino)} destino={destino} />
    case 'diagnostico':
      return <Diagnostico />
    case 'simulacro':
      return <Simulacro key={`${destino.tipo ?? ''}${destino.area ?? ''}`} destino={destino} />
    case 'ajustes':
      return <Ajustes />
  }
}

function Estructura() {
  const { destino, ir, bloqueado } = useApp()
  const principal = useRef<HTMLElement>(null)
  // Al cambiar de pantalla el foco pasa al contenido: así el teclado y los lectores de pantalla no se pierden.
  useEffect(() => {
    principal.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [destino.p])
  const activa = seccionActiva(destino.p)
  return (
    <div className="app">
      <a className="saltar" href="#principal" onClick={(e) => (e.preventDefault(), principal.current?.focus())}>
        Saltar al contenido
      </a>
      <header className="cabecera">
        <div className="cabecera-in">
          <button className="marca" onClick={() => !bloqueado && ir({ p: 'inicio' })} aria-label="AMIB F3, ir al inicio" disabled={bloqueado}>
            AMIB <i>F3</i> Estudio
          </button>
          {destino.p !== 'onboarding' && (
            <nav className="nav" aria-label="Secciones">
              {NAV.map((n) => (
                <button key={n.p} onClick={() => ir(n.destino)} aria-current={activa === n.p ? 'page' : undefined} disabled={bloqueado}>
                  {n.etiqueta}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main id="principal" ref={principal} tabIndex={-1} className="principal" data-pantalla={destino.p}>
        <Pantalla />
      </main>
    </div>
  )
}

export function App() {
  return (
    <AppProvider>
      <Estructura />
    </AppProvider>
  )
}
