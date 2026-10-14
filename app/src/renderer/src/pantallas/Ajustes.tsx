import { useEffect, useState } from 'react'
import { AREAS, type AreaId } from '@core/examen'
import { DEFAULTS_MODO, type Autoevaluacion } from '@core/plan'
import { useApp } from '../estado'
import { SelectorModo, useFormularioPlan } from './Onboarding'
import { mensajeError, NOMBRE_CORTO } from '../lib/formato'
import type { InfoApp, LetraId, ResultadoRespaldo, TemaId } from '../../../preload/api'

const TEMAS: { id: TemaId; nombre: string; texto: string }[] = [
  { id: 'claro', nombre: 'Claro', texto: 'Blanco y sobrio, estilo semanario económico. Es el tema por omisión.' },
  { id: 'terminal', nombre: 'Terminal', texto: 'Oscuro, denso y con tipografía de datos, como una terminal financiera.' },
  { id: 'editorial', nombre: 'Editorial', texto: 'Papel cálido y títulos con serifa, como la portada de un periódico.' },
  { id: 'enfoque', nombre: 'Enfoque', texto: 'Oscuro, de esquinas suaves y pocas distracciones.' }
]
const LETRAS_OP: { id: LetraId; nombre: string; estilo: string }[] = [
  { id: 'arial', nombre: 'Arial', estilo: 'Arial, Helvetica, sans-serif' },
  { id: 'calibri', nombre: 'Calibri', estilo: "Calibri, Carlito, 'Segoe UI', Arial, sans-serif" },
  { id: 'segoe', nombre: 'Segoe UI', estilo: "'Segoe UI', system-ui, Arial, sans-serif" }
]
const OPCIONES_AUTO: { v: Autoevaluacion; etiqueta: string }[] = [
  { v: 'domino', etiqueta: 'La domino' },
  { v: 'mas-o-menos', etiqueta: 'Más o menos' },
  { v: 'nunca', etiqueta: 'No la he visto' }
]

export function Ajustes() {
  const { ajustes, resumen, guardarAjuste, recargar } = useApp()
  const [info, setInfo] = useState<InfoApp | null>(null)
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [respaldo, setRespaldo] = useState<ResultadoRespaldo | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const f = useFormularioPlan({
    fecha: ajustes?.fechaExamen ?? '',
    modo: ajustes?.modo ?? 'intensivo',
    minutos: ajustes?.minutosDia ?? DEFAULTS_MODO.intensivo.minutosDia,
    dias: ajustes?.diasActivos ?? [1, 2, 3, 4, 5]
  })
  useEffect(() => {
    window.amib.info().then(setInfo).catch(() => setInfo(null))
  }, [])
  if (!ajustes || !resumen) return null

  const intentar = async (accion: () => Promise<void>, exito: string) => {
    try {
      await accion()
      setEstado({ tipo: 'ok', texto: exito })
    } catch (e) {
      setEstado({ tipo: 'error', texto: mensajeError(e) })
    }
  }

  const guardarPlan = () =>
    intentar(async () => {
      await guardarAjuste({ clave: 'fechaExamen', valor: f.fecha })
      await guardarAjuste({ clave: 'modo', valor: f.modo })
      await guardarAjuste({ clave: 'minutosDia', valor: f.minutos })
      await guardarAjuste({ clave: 'diasSemana', valor: f.diasSemana })
      await guardarAjuste({ clave: 'diasActivos', valor: f.modo === 'personalizado' ? f.dias : null })
    }, 'Plan guardado. La sesión de hoy se recalculó.')

  const cambiarAuto = (area: AreaId, v: Autoevaluacion) => void intentar(() => guardarAjuste({ clave: 'autoevaluacion', valor: { ...ajustes.autoevaluacion, [area]: v } }), 'Autoevaluación guardada.')

  async function exportar() {
    setOcupado(true)
    try {
      setRespaldo(await window.amib.respaldo.exportar())
    } catch (e) {
      setRespaldo({ ok: false, error: mensajeError(e) })
    } finally {
      setOcupado(false)
    }
  }
  async function importar() {
    setOcupado(true)
    try {
      const r = await window.amib.respaldo.importar()
      setRespaldo(r)
      if (r.ok) {
        // El progreso cambió por completo: se vuelve a leer todo desde el proceso principal.
        await recargar()
      }
    } catch (e) {
      setRespaldo({ ok: false, error: mensajeError(e) })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="col-lectura">
      <div className="entrar">
        <h1 className="titulo-pantalla">Ajustes</h1>
        <p className="subtitulo">Apariencia, plan de estudio y respaldo de tu progreso.</p>
      </div>
      {estado && (
        <div className={estado.tipo === 'ok' ? 'aviso-caja' : 'error-caja'} role={estado.tipo === 'ok' ? 'status' : 'alert'}>
          {estado.texto}
        </div>
      )}

      <section className="panel rejilla entrar" aria-labelledby="aj-apariencia">
        <h2 id="aj-apariencia">Apariencia</h2>
        <div>
          <p className="etiqueta">Tema</p>
          <div className="temas" role="radiogroup" aria-label="Tema">
            {TEMAS.map((t) => (
              <button key={t.id} className="tema-op" role="radio" aria-checked={ajustes.tema === t.id} onClick={() => void intentar(() => guardarAjuste({ clave: 'tema', valor: t.id }), `Tema ${t.nombre} aplicado.`)} data-tema-opcion={t.id}>
                <span className="muestra" data-tema={t.id} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <strong>{t.nombre}</strong>
                <small className="tenue">{t.texto}</small>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="etiqueta">Letra</p>
          <div className="grupo-botones" role="radiogroup" aria-label="Letra">
            {LETRAS_OP.map((l) => (
              <button key={l.id} className="btn" role="radio" aria-checked={ajustes.letra === l.id} style={{ fontFamily: l.estilo }} onClick={() => void intentar(() => guardarAjuste({ clave: 'letra', valor: l.id }), `Letra ${l.nombre} aplicada.`)} data-letra-opcion={l.id}>
                {l.nombre}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel rejilla entrar" aria-labelledby="aj-plan">
        <h2 id="aj-plan">Examen y plan de estudio</h2>
        <label className="campo" style={{ maxWidth: 260 }}>
          <span>Fecha del examen</span>
          <input type="date" value={f.fecha} onChange={(e) => f.setFecha(e.target.value)} data-testid="ajustes-fecha" />
        </label>
        {f.fecha && !f.fechaValida && <p className="aviso-caja">La fecha debe ser posterior a hoy.</p>}
        <SelectorModo f={f} />
        <div>
          <button className="btn primario" onClick={() => void guardarPlan()} disabled={!f.valido}>
            Guardar plan
          </button>
        </div>
      </section>

      <section className="panel entrar" aria-labelledby="aj-auto">
        <h2 id="aj-auto">Autoevaluación por área</h2>
        <p className="sub">Se usa mientras no hay suficientes respuestas reales en un área.</p>
        {AREAS.map((a) => (
          <div key={a.id} className="auto-fila">
            <span>{NOMBRE_CORTO[a.id]}</span>
            <div className="grupo-botones" role="radiogroup" aria-label={`Autoevaluación de ${NOMBRE_CORTO[a.id]}`}>
              {OPCIONES_AUTO.map((o) => (
                <button key={o.v} className="btn pequeno" role="radio" aria-checked={(ajustes.autoevaluacion[a.id] ?? 'mas-o-menos') === o.v} onClick={() => cambiarAuto(a.id, o.v)}>
                  {o.etiqueta}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="panel rejilla entrar" aria-labelledby="aj-ia">
        <h2 id="aj-ia">Modo con IA</h2>
        <div className="interruptor">
          <button role="switch" aria-checked={false} aria-labelledby="ia-etq" disabled title="Próximamente, requiere OmniRoute" />
          <span id="ia-etq">
            Modo con IA <span className="insignia pronto">Próximamente</span>
          </span>
        </div>
        <p className="chico tenue" style={{ margin: 0 }}>
          Próximamente, requiere OmniRoute. Mientras tanto la app funciona completa sin internet.
        </p>
      </section>

      <section className="panel rejilla entrar" aria-labelledby="aj-respaldo">
        <h2 id="aj-respaldo">Respaldo del progreso</h2>
        <p className="chico tenue" style={{ margin: 0 }}>
          Exporta tus respuestas, notas y ajustes a un archivo JSON. Al importar, el progreso actual se reemplaza por el del archivo, previa confirmación.
        </p>
        <div className="fila">
          <button className="btn" onClick={() => void exportar()} disabled={ocupado} data-testid="respaldo-exportar">
            Exportar respaldo
          </button>
          <button className="btn" onClick={() => void importar()} disabled={ocupado} data-testid="respaldo-importar">
            Importar respaldo
          </button>
        </div>
        {respaldo && !respaldo.cancelado && (
          <div className={respaldo.ok ? 'aviso-caja' : 'error-caja'} role={respaldo.ok ? 'status' : 'alert'}>
            {respaldo.ok ? `Respaldo guardado en ${respaldo.ruta ?? 'el archivo elegido'} (${respaldo.intentos ?? 0} respuestas).` : (respaldo.error ?? 'No se pudo completar la operación.')}
          </div>
        )}
      </section>

      <section className="panel entrar" aria-labelledby="aj-acerca">
        <h2 id="aj-acerca">Contenido y versión</h2>
        <div className="recuerda">
          <div>
            <span>Lecciones cargadas</span>
            <b>{resumen.lecciones.length}</b>
          </div>
          <div>
            <span>Preguntas validadas</span>
            <b>
              {resumen.preguntas.porEstado['validada'] ?? 0} de {resumen.preguntas.total}
            </b>
          </div>
          <div>
            <span>Archivos u elementos omitidos por error</span>
            <b>{resumen.errores}</b>
          </div>
          <div>
            <span>Versión</span>
            <b>{info ? `${info.version}, base de datos esquema ${info.esquemaDb}, Electron ${info.electron}` : 'Leyendo'}</b>
          </div>
        </div>
        {resumen.erroresMuestra.length > 0 && (
          <details style={{ marginTop: 10 }}>
            <summary>Ver los primeros errores de contenido</summary>
            <ul className="chico">
              {resumen.erroresMuestra.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  )
}
