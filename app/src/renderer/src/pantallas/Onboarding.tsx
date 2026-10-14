import { useState } from 'react'
import { AREAS, type AreaId } from '@core/examen'
import { DEFAULTS_MODO, type Autoevaluacion, type ModoPlan } from '@core/plan'
import { useApp } from '../estado'
import { mensajeError, NOMBRE_CORTO } from '../lib/formato'

const DIAS = [
  { n: 1, etiqueta: 'Lunes' },
  { n: 2, etiqueta: 'Martes' },
  { n: 3, etiqueta: 'Miércoles' },
  { n: 4, etiqueta: 'Jueves' },
  { n: 5, etiqueta: 'Viernes' },
  { n: 6, etiqueta: 'Sábado' },
  { n: 0, etiqueta: 'Domingo' }
]
const OPCIONES_AUTO: { v: Autoevaluacion; etiqueta: string }[] = [
  { v: 'domino', etiqueta: 'La domino' },
  { v: 'mas-o-menos', etiqueta: 'Más o menos' },
  { v: 'nunca', etiqueta: 'No la he visto' }
]

function hoyIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Edita los ajustes de plan (fecha, modo, minutos y días). Se reutiliza en Ajustes. */
export function useFormularioPlan(inicial: { fecha: string; modo: ModoPlan; minutos: number; dias: number[] }) {
  const [fecha, setFecha] = useState(inicial.fecha)
  const [modo, setModo] = useState<ModoPlan>(inicial.modo)
  const [minutos, setMinutos] = useState(inicial.minutos)
  const [dias, setDias] = useState<number[]>(inicial.dias)
  const elegirModo = (m: ModoPlan) => {
    setModo(m)
    if (m !== 'personalizado') setMinutos(DEFAULTS_MODO[m].minutosDia)
  }
  const alternarDia = (n: number) => setDias((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n]))
  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha > hoyIso()
  const diasSemana = modo === 'personalizado' ? dias.length : DEFAULTS_MODO[modo].diasSemana
  const valido = fechaValida && (modo !== 'personalizado' || (dias.length >= 1 && minutos >= 10 && minutos <= 600))
  return { fecha, setFecha, modo, elegirModo, minutos, setMinutos, dias, alternarDia, fechaValida, diasSemana, valido }
}

export function SelectorModo({ f }: { f: ReturnType<typeof useFormularioPlan> }) {
  return (
    <>
      <div className="modos" role="radiogroup" aria-label="Modo de estudio">
        {(
          [
            { m: 'intensivo', t: 'Intensivo', d: `${DEFAULTS_MODO.intensivo.minutosDia} min al día, ${DEFAULTS_MODO.intensivo.diasSemana} días por semana` },
            { m: 'ligero', t: 'Ligero', d: `${DEFAULTS_MODO.ligero.minutosDia} min al día, ${DEFAULTS_MODO.ligero.diasSemana} días por semana` },
            { m: 'personalizado', t: 'Personalizado', d: 'Tú eliges los minutos y los días' }
          ] as const
        ).map((o) => (
          <button key={o.m} type="button" role="radio" aria-checked={f.modo === o.m} className="modo-op" onClick={() => f.elegirModo(o.m)}>
            <strong>{o.t}</strong>
            <small>{o.d}</small>
          </button>
        ))}
      </div>
      {f.modo === 'personalizado' && (
        <div className="rejilla entrar">
          <label className="campo" style={{ maxWidth: 220 }}>
            <span>Minutos por día</span>
            <input type="number" min={10} max={600} step={5} value={f.minutos} onChange={(e) => f.setMinutos(Number(e.target.value))} />
          </label>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="etiqueta" style={{ marginBottom: 6 }}>
              Días de estudio
            </legend>
            <div className="dias">
              {DIAS.map((d) => (
                <button key={d.n} type="button" className="btn pequeno" aria-pressed={f.dias.includes(d.n)} style={f.dias.includes(d.n) ? { background: 'var(--primario)', color: 'var(--sobre-primario)', borderColor: 'var(--primario)' } : undefined} onClick={() => f.alternarDia(d.n)}>
                  {d.etiqueta}
                </button>
              ))}
            </div>
          </fieldset>
          {f.dias.length === 0 && <p className="aviso-caja">Elige al menos un día de estudio.</p>}
        </div>
      )}
    </>
  )
}

export function Onboarding() {
  const { guardarAjuste, ir, recargar, ajustes } = useApp()
  const [paso, setPaso] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const f = useFormularioPlan({ fecha: ajustes?.fechaExamen ?? '', modo: 'intensivo', minutos: DEFAULTS_MODO.intensivo.minutosDia, dias: [1, 2, 3, 4, 5] })
  const [auto, setAuto] = useState<Partial<Record<AreaId, Autoevaluacion>>>({})

  async function terminar(omitir: boolean) {
    setGuardando(true)
    setError(null)
    try {
      if (!omitir) {
        await guardarAjuste({ clave: 'fechaExamen', valor: f.fecha })
        await guardarAjuste({ clave: 'modo', valor: f.modo })
        await guardarAjuste({ clave: 'minutosDia', valor: f.minutos })
        await guardarAjuste({ clave: 'diasSemana', valor: f.diasSemana })
        await guardarAjuste({ clave: 'diasActivos', valor: f.modo === 'personalizado' ? f.dias : null })
        await guardarAjuste({ clave: 'autoevaluacion', valor: Object.fromEntries(AREAS.map((a) => [a.id, auto[a.id] ?? 'mas-o-menos'])) as Partial<Record<AreaId, Autoevaluacion>> })
      }
      await guardarAjuste({ clave: 'onboardingCompleto', valor: true })
      await recargar()
      ir({ p: 'inicio' })
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  const pasos = ['Fecha del examen', 'Modo de estudio', 'Autoevaluación']
  return (
    <div className="onb entrar" data-testid="onboarding">
      <div>
        <p className="etiqueta">Bienvenido, Cesar. Paso {paso + 1} de 3</p>
        <h1 className="titulo-pantalla">{paso === 0 ? '¿Cuándo presentas el examen?' : paso === 1 ? '¿Cuánto tiempo puedes estudiar?' : '¿Cómo te sientes en cada área?'}</h1>
        <p className="subtitulo">
          {paso === 0 && 'Con la fecha calculo cuántos días te quedan y reparto simulacros y repasos hasta el examen.'}
          {paso === 1 && 'Elige una intensidad. Puedes cambiarla después en Ajustes.'}
          {paso === 2 && 'Es un punto de partida: en cuanto respondas preguntas, mis cálculos usan tus resultados reales.'}
        </p>
      </div>
      <ol className="riel" style={{ listStyle: 'none', padding: 0, margin: 0 }} aria-label="Pasos del arranque">
        {pasos.map((p, i) => (
          <li key={p} className="etapa" aria-current={i === paso ? 'step' : undefined}>
            <i>
              <b style={{ transform: `scaleX(${i <= paso ? 1 : 0})` }} />
            </i>
            <span>
              {i + 1}. {p}
            </span>
          </li>
        ))}
      </ol>

      {paso === 0 && (
        <div className="panel rejilla">
          <label className="campo" style={{ maxWidth: 260 }}>
            <span>Fecha del examen</span>
            <input type="date" value={f.fecha} min={hoyIso()} onChange={(e) => f.setFecha(e.target.value)} aria-describedby="ayuda-fecha" data-testid="fecha-examen" />
          </label>
          <p id="ayuda-fecha" className="chico tenue" style={{ margin: 0 }}>
            {f.fecha && !f.fechaValida ? 'La fecha debe ser posterior a hoy.' : 'Usa la fecha de tu cita en AMIB.'}
          </p>
        </div>
      )}

      {paso === 1 && (
        <div className="panel rejilla">
          <SelectorModo f={f} />
        </div>
      )}

      {paso === 2 && (
        <div className="panel">
          {AREAS.map((a) => (
            <div key={a.id} className="auto-fila">
              <span>
                {NOMBRE_CORTO[a.id]} {a.obligatoria && <span className="insignia obl">Obligatoria</span>}
              </span>
              <div className="grupo-botones" role="radiogroup" aria-label={`Autoevaluación de ${NOMBRE_CORTO[a.id]}`}>
                {OPCIONES_AUTO.map((o) => (
                  <button key={o.v} type="button" role="radio" aria-checked={(auto[a.id] ?? 'mas-o-menos') === o.v} className="btn pequeno" onClick={() => setAuto((x) => ({ ...x, [a.id]: o.v }))}>
                    {o.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="error-caja" role="alert">
          {error}
        </div>
      )}
      <div className="navegar">
        <div className="fila">
          {paso > 0 && (
            <button className="btn" onClick={() => setPaso(paso - 1)}>
              Atrás
            </button>
          )}
          <button className="btn discreto" onClick={() => void terminar(true)} disabled={guardando}>
            Configurar después
          </button>
        </div>
        {paso < 2 ? (
          <button className="btn primario" onClick={() => setPaso(paso + 1)} disabled={paso === 0 ? !f.fechaValida : !f.valido} data-testid="onb-siguiente">
            Siguiente
          </button>
        ) : (
          <button className="btn acento" onClick={() => void terminar(false)} disabled={guardando || !f.valido} data-testid="onb-terminar">
            {guardando ? 'Guardando' : 'Empezar a estudiar'}
          </button>
        )}
      </div>
    </div>
  )
}
