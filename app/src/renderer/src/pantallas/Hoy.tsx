import { useApp, type Destino } from '../estado'
import { EstadoVacio } from '../componentes/Comunes'
import { NOMBRE_AREA } from '../lib/formato'
import type { Actividad } from '@core/plan'

const ROTULO: Record<Actividad['tipo'], string> = {
  leccion: 'Lección guiada',
  'repaso-rapido': 'Repaso rápido',
  practica: 'Práctica dirigida',
  simulacro: 'Simulacro'
}

const NOMBRE_SIM = { integral: 'integral', modulo: 'por módulo', 'modular-extraordinario': 'modular extraordinario', rapido: 'rápido' } as const

export function HoyPantalla() {
  const { plan, ajustes, resumen, ir } = useApp()
  if (!ajustes || !resumen) return null

  function destinoDe(a: Actividad): Destino {
    switch (a.tipo) {
      case 'leccion':
        return { p: 'leccion', id: a.leccionId! }
      case 'repaso-rapido':
        return { p: 'practicar', n: Math.min(30, Math.max(5, Math.round((a.minutos * 60) / 90))), auto: true }
      case 'practica':
        return { p: 'practicar', filtro: a.area ? { areas: [a.area] } : undefined, n: Math.min(60, Math.max(5, a.preguntas ?? 20)), auto: true }
      case 'simulacro':
        return { p: 'simulacro', tipo: a.simulacro, area: a.area }
    }
  }
  const tituloDe = (a: Actividad) => {
    if (a.tipo === 'leccion') return resumen.lecciones.find((l) => l.id === a.leccionId)?.titulo ?? 'Lección guiada'
    if (a.tipo === 'simulacro' && a.simulacro) return `Simulacro ${NOMBRE_SIM[a.simulacro]}${a.sustituyeA ? `, en lugar del ${NOMBRE_SIM[a.sustituyeA]}` : ''}`
    return a.titulo
  }

  return (
    <>
      <div className="entrar">
        <h1 className="titulo-pantalla">Sesión de hoy</h1>
        <p className="subtitulo">{plan && plan.esDiaDeEstudio ? `${plan.totalMin} de ${plan.presupuestoMin} min planeados. ${plan.diasParaExamen} días para el examen.` : (plan?.nota ?? 'Define la fecha de tu examen para generar el plan.')}</p>
      </div>
      {!ajustes.fechaExamen && (
        <EstadoVacio icono="grafica" titulo="Aún no hay plan" texto="Con la fecha del examen y tu modo de estudio armo la sesión de cada día.">
          <button className="btn primario" onClick={() => ir({ p: 'ajustes' })}>
            Definir la fecha en Ajustes
          </button>
        </EstadoVacio>
      )}
      {plan && plan.esDiaDeEstudio && (
        <div className="actividades entrar" role="list">
          {plan.actividades.map((a, i) => (
            <div key={i} className="actividad" role="listitem">
              <span className="min">{a.minutos} min</span>
              <div>
                <h3>{tituloDe(a)}</h3>
                <p>
                  {ROTULO[a.tipo]}
                  {a.area ? `, ${NOMBRE_AREA[a.area]}` : ''}
                  {a.preguntas ? `, unas ${a.preguntas} preguntas` : ''}
                </p>
              </div>
              <button className="btn primario" onClick={() => ir(destinoDe(a))} data-actividad={a.tipo}>
                Empezar
              </button>
            </div>
          ))}
          {plan.actividades.length === 0 && <p className="tenue">No hay actividades para hoy.</p>}
        </div>
      )}
      {plan && plan.nota && plan.esDiaDeEstudio && <p className="aviso-caja">{plan.nota}</p>}
      {plan && !plan.esDiaDeEstudio && ajustes.fechaExamen && (
        <div className="aviso-caja" role="status">
          {plan.nota ?? 'Hoy no hay actividades.'} Si quieres estudiar de todos modos, abre Practicar.
        </div>
      )}
    </>
  )
}
