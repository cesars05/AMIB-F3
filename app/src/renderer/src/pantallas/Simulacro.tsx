import { useCallback, useEffect, useRef, useState } from 'react'
import { crearAzar } from '@core/barajar'
import { AREAS, PUNTAJE_APROBATORIO, type AreaId } from '@core/examen'
import { calificar, minutosSimulacro, PREGUNTAS_RAPIDO, type Calificacion, type Simulacro as SimulacroArmado, type TipoSimulacro } from '@core/simulacro'
import { useApp, useAtajos, type Destino } from '../estado'
import { BarraProgreso, Cargando } from '../componentes/Comunes'
import { Inline } from '../componentes/Inline'
import { PreguntaVista } from '../componentes/Pregunta'
import type { Item } from '../lib/tipos'
import { LETRAS, mensajeError, NOMBRE_AREA, NOMBRE_CORTO, nuevaSesionId, pluralizar, porcentaje, reloj } from '../lib/formato'

type Fase = 'menu' | 'previo' | 'examen' | 'resultado'

const TIPOS: { v: TipoSimulacro; titulo: string; descripcion: (area: AreaId) => string }[] = [
  { v: 'integral', titulo: 'Integral', descripcion: () => '210 preguntas, 4 h 18 min. La distribución oficial de las 9 áreas.' },
  { v: 'modulo', titulo: 'Por módulo', descripcion: (a) => `Un área (${AREAS.find((x) => x.id === a)!.preguntas} preguntas) con tiempo proporcional: ${minutosSimulacro('modulo', a)} min.` },
  { v: 'modular-extraordinario', titulo: 'Modular extraordinario', descripcion: () => `Las 4 áreas obligatorias (95 preguntas), ${minutosSimulacro('modular-extraordinario')} min.` },
  { v: 'rapido', titulo: 'Rápido', descripcion: () => `${PREGUNTAS_RAPIDO} preguntas repartidas según los pesos oficiales, ${minutosSimulacro('rapido')} min.` }
]

const NOMBRE_TIPO: Record<TipoSimulacro, string> = { integral: 'integral', modulo: 'por módulo', 'modular-extraordinario': 'modular extraordinario', rapido: 'rápido' }

export function Simulacro({ destino }: { destino: Extract<Destino, { p: 'simulacro' }> }) {
  const { resumen, bloquear, recargar, ir } = useApp()
  const [tipo, setTipo] = useState<TipoSimulacro>(destino.tipo ?? 'rapido')
  const [areaModulo, setAreaModulo] = useState<AreaId>(destino.area ?? 'etica')
  const [fase, setFase] = useState<Fase>('menu')
  const [sim, setSim] = useState<SimulacroArmado | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const [idx, setIdx] = useState(0)
  const [resp, setResp] = useState<Record<string, number | null>>({})
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
  const [tiempos, setTiempos] = useState<Record<string, number>>({})
  const [restante, setRestante] = useState(0)
  const [confirmando, setConfirmando] = useState(false)
  const [cal, setCal] = useState<Calificacion | null>(null)
  const [usadoMs, setUsadoMs] = useState(0)
  const fin = useRef(0)
  const inicioMs = useRef(0)
  const tPreg = useRef(0)
  const idxRef = useRef(0)
  const tiemposRef = useRef<Record<string, number>>({})
  const finalizado = useRef(false)
  const sesionId = useRef(nuevaSesionId('simulacro'))

  // Mientras dura el examen, la navegación del encabezado queda bloqueada.
  useEffect(() => {
    bloquear(fase === 'examen')
    return () => bloquear(false)
  }, [fase, bloquear])

  async function preparar() {
    setCargando(true)
    setError(null)
    try {
      const s = await window.amib.estudio.simulacro({ tipo, ...(tipo === 'modulo' ? { area: areaModulo } : {}) })
      if (s.preguntas.length === 0) {
        setError('No hay preguntas validadas para armar este simulacro todavía. Agrega contenido o prueba otro tipo.')
        return
      }
      const ps = await window.amib.contenido.preguntas(s.preguntas.map((p) => p.id))
      const porId = new Map(ps.map((p) => [p.id, p]))
      const nuevos = s.preguntas.flatMap((pr) => {
        const p = porId.get(pr.id)
        return p ? [{ pregunta: p, presentacion: pr }] : []
      })
      setSim(s)
      setItems(nuevos)
      if (Object.keys(s.faltantes).length > 0) setFase('previo')
      else comenzar(s)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  function comenzar(s: SimulacroArmado) {
    sesionId.current = nuevaSesionId('simulacro')
    finalizado.current = false
    inicioMs.current = Date.now()
    fin.current = inicioMs.current + s.tiempoMin * 60000
    tPreg.current = Date.now()
    idxRef.current = 0
    tiemposRef.current = {}
    setTiempos({})
    setIdx(0)
    setResp({})
    setMarcadas(new Set())
    setConfirmando(false)
    setRestante(s.tiempoMin * 60)
    setCal(null)
    setFase('examen')
    void window.amib.sesiones.registrar({ id: sesionId.current, modo: 'simulacro', inicio: new Date().toISOString(), configuracion: { tipo: s.tipo, area: s.area, preguntas: s.preguntas.length, tiempoMin: s.tiempoMin } }).catch(() => undefined)
  }

  /** Suma al tiempo de la pregunta visible lo transcurrido desde que se mostró. */
  const acumular = useCallback(() => {
    const it = items[idxRef.current]
    if (!it) return
    const ahora = Date.now()
    tiemposRef.current = { ...tiemposRef.current, [it.pregunta.id]: (tiemposRef.current[it.pregunta.id] ?? 0) + (ahora - tPreg.current) }
    tPreg.current = ahora
    setTiempos(tiemposRef.current)
  }, [items])

  const ir_a = useCallback(
    (n: number) => {
      if (n < 0 || n >= items.length) return
      acumular()
      idxRef.current = n
      setIdx(n)
    },
    [acumular, items.length]
  )

  const finalizar = useCallback(async () => {
    if (!sim || finalizado.current) return
    finalizado.current = true
    acumular()
    setConfirmando(false)
    setCargando(true)
    try {
      const respuestas = items.map((it) => ({ preguntaId: it.pregunta.id, posicion: resp[it.pregunta.id] ?? null, tiempoMs: tiemposRef.current[it.pregunta.id] ?? 0 }))
      const c = calificar({ preguntas: sim.preguntas }, respuestas, { azar: crearAzar((Date.now() >>> 0) ^ 0x9e3779b9) })
      const contestadas = items.filter((it) => resp[it.pregunta.id] !== null && resp[it.pregunta.id] !== undefined)
      if (contestadas.length > 0) {
        await window.amib.intentos.registrar(
          contestadas.map((it) => ({ preguntaId: it.pregunta.id, respuesta: it.presentacion.permutacion[resp[it.pregunta.id]!]!, tiempoMs: Math.max(0, Math.round(tiemposRef.current[it.pregunta.id] ?? 0)), modo: 'simulacro' as const, sesionId: sesionId.current }))
        )
      }
      const usado = Date.now() - inicioMs.current
      setUsadoMs(usado)
      setCal(c)
      setFase('resultado')
      await window.amib.sesiones.registrar({
        id: sesionId.current,
        modo: 'simulacro',
        inicio: new Date(inicioMs.current).toISOString(),
        fin: new Date().toISOString(),
        configuracion: { tipo: sim.tipo, area: sim.area, preguntas: sim.preguntas.length, tiempoMin: sim.tiempoMin },
        resultado: { correctas: c.correctas, total: c.total, puntajeEstimado: c.puntajeEstimado, completo: c.completo, aprobado: c.dictamen?.aprobado, probabilidadAprobar: c.probabilidadAprobar }
      })
      await recargar()
    } catch (e) {
      setError(mensajeError(e))
      finalizado.current = false
    } finally {
      setCargando(false)
    }
  }, [sim, items, resp, acumular, recargar])

  // Cuenta regresiva.
  useEffect(() => {
    if (fase !== 'examen') return
    const id = setInterval(() => {
      const r = Math.max(0, Math.round((fin.current - Date.now()) / 1000))
      setRestante(r)
      if (r <= 0) void finalizar()
    }, 1000)
    return () => clearInterval(id)
  }, [fase, finalizar])

  useAtajos(
    (e) => {
      if (fase !== 'examen') return
      if (confirmando) {
        if (e.key === 'Escape') setConfirmando(false)
        return
      }
      const it = items[idx]
      if (!it) return
      const k = 'abcd'.indexOf(e.key.toLowerCase())
      if (e.key === 'ArrowRight') ir_a(idx + 1)
      else if (e.key === 'ArrowLeft') ir_a(idx - 1)
      else if (e.key.toLowerCase() === 'm') alternarMarca(it.pregunta.id)
      else if (k >= 0 && e.key.length === 1) setResp((r) => ({ ...r, [it.pregunta.id]: k }))
    },
    fase === 'examen'
  )

  function alternarMarca(id: string) {
    setMarcadas((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  if (!resumen) return <Cargando />

  // ─── Menú ───────────────────────────────────────────────────────────────────
  if (fase === 'menu') {
    const validadas = resumen.preguntas.porEstado['validada'] ?? 0
    return (
      <div className="col-lectura">
        <div className="entrar">
          <h1 className="titulo-pantalla">Simulacro</h1>
          <p className="subtitulo">Como el examen real: cronómetro, preguntas marcables y ninguna retroalimentación hasta el final.</p>
        </div>
        <div className="tipos-sim entrar" role="group" aria-label="Tipo de simulacro">
          {TIPOS.map((t) => (
            <button key={t.v} className="tipo-sim" aria-pressed={tipo === t.v} onClick={() => setTipo(t.v)} data-tipo={t.v}>
              <strong>{t.titulo}</strong>
              <small>{t.descripcion(areaModulo)}</small>
            </button>
          ))}
        </div>
        {tipo === 'modulo' && (
          <label className="campo entrar" style={{ maxWidth: 420 }}>
            <span>Área del módulo</span>
            <select value={areaModulo} onChange={(e) => setAreaModulo(e.target.value as AreaId)}>
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {NOMBRE_AREA[a.id]}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="aviso-caja">
          El banco validado tiene {pluralizar(validadas, 'pregunta', 'preguntas')}. Si no alcanza para el tipo elegido, el simulacro se arma con lo disponible y te aviso cuántas faltan por área. Los puntajes son <span className="estimado">estimados</span>: AMIB no publica la conversión oficial.
        </div>
        {error && (
          <div className="error-caja" role="alert">
            {error}
          </div>
        )}
        <div>
          <button className="btn acento" onClick={() => void preparar()} disabled={cargando} data-testid="simulacro-iniciar">
            {cargando ? 'Armando' : 'Iniciar simulacro'}
          </button>
        </div>
      </div>
    )
  }

  // ─── Aviso de banco insuficiente ────────────────────────────────────────────
  if (fase === 'previo' && sim) {
    const faltan = Object.entries(sim.faltantes) as [AreaId, number][]
    return (
      <div className="col-lectura entrar">
        <h1 className="titulo-pantalla">El banco validado no alcanza</h1>
        <div className="aviso-caja" role="alert" data-testid="aviso-faltantes">
          Este simulacro {NOMBRE_TIPO[sim.tipo]} quedó con {pluralizar(items.length, 'pregunta', 'preguntas')}. Faltan {pluralizar(faltan.reduce((s, [, n]) => s + n, 0), 'pregunta', 'preguntas')} validadas respecto a la distribución oficial. Un resultado con menos preguntas es menos representativo.
        </div>
        <div className="panel">
          <table className="tabla">
            <thead>
              <tr>
                <th>Área</th>
                <th className="num">Incluidas</th>
                <th className="num">Faltan</th>
              </tr>
            </thead>
            <tbody>
              {faltan.map(([a, n]) => (
                <tr key={a}>
                  <td>{NOMBRE_AREA[a]}</td>
                  <td className="num">{sim.porArea[a] ?? 0}</td>
                  <td className="num">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="fila">
          <button className="btn acento" onClick={() => comenzar(sim)} data-testid="simulacro-continuar">
            Continuar con {items.length} preguntas ({sim.tiempoMin} min)
          </button>
          <button className="btn" onClick={() => setFase('menu')}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // ─── Examen ─────────────────────────────────────────────────────────────────
  if (fase === 'examen' && sim) {
    const it = items[idx]!
    const sinResponder = items.filter((x) => resp[x.pregunta.id] === null || resp[x.pregunta.id] === undefined).length
    const poco = restante <= 300
    return (
      <div className="col-lectura" style={{ maxWidth: 1180 }} data-testid="simulacro-examen">
        <div className="examen-barra">
          <strong>
            Simulacro {NOMBRE_TIPO[sim.tipo]}: pregunta {idx + 1} de {items.length}
          </strong>
          <span className={`cronometro${poco ? ' lento' : ''}`} role="timer" aria-label={`Tiempo restante ${reloj(restante)}`}>
            {reloj(restante)}
          </span>
          <button className="btn acento pequeno" onClick={() => setConfirmando(true)} data-testid="simulacro-terminar">
            Terminar simulacro
          </button>
        </div>
        <BarraProgreso valor={(items.length - sinResponder) / items.length} etiqueta="Preguntas respondidas" />
        {confirmando && (
          <div className="panel entrar" role="alertdialog" aria-labelledby="conf-t" style={{ borderColor: 'var(--aviso)' }}>
            <h2 id="conf-t">¿Terminar el simulacro?</h2>
            <p style={{ margin: '0 0 12px' }}>
              Tienes {pluralizar(sinResponder, 'pregunta sin responder', 'preguntas sin responder')} y {pluralizar(marcadas.size, 'marcada', 'marcadas')} para revisar. Al terminar verás tu reporte y no podrás cambiar respuestas.
            </p>
            <div className="fila">
              <button className="btn acento" onClick={() => void finalizar()} disabled={cargando} data-testid="simulacro-confirmar">
                {cargando ? 'Calificando' : 'Sí, terminar y calificar'}
              </button>
              <button className="btn" onClick={() => setConfirmando(false)}>
                Seguir respondiendo
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="error-caja" role="alert">
            {error}
          </div>
        )}
        <div className="examen-cuerpo">
          <article className="panel" key={it.pregunta.id}>
            <PreguntaVista pregunta={it.pregunta} presentacion={it.presentacion} elegida={resp[it.pregunta.id] ?? null} revelar={false} onElegir={(p) => setResp((r) => ({ ...r, [it.pregunta.id]: p }))} meta={`${NOMBRE_CORTO[it.pregunta.area]}`} />
            <div className="navegar" style={{ marginTop: 16 }}>
              <button className="btn" onClick={() => ir_a(idx - 1)} disabled={idx === 0}>
                Anterior
              </button>
              <button className="btn discreto" aria-pressed={marcadas.has(it.pregunta.id)} onClick={() => alternarMarca(it.pregunta.id)}>
                {marcadas.has(it.pregunta.id) ? 'Quitar marca' : 'Marcar para revisar (M)'}
              </button>
              <button className="btn primario" onClick={() => ir_a(idx + 1)} disabled={idx === items.length - 1} data-testid="simulacro-siguiente">
                Siguiente
              </button>
            </div>
          </article>
          <aside className="panel" aria-label="Navegador de preguntas">
            <p className="etiqueta" style={{ marginTop: 0 }}>
              Preguntas
            </p>
            <div className="navegador">
              {items.map((x, i) => (
                <button
                  key={x.pregunta.id}
                  className={`${resp[x.pregunta.id] !== null && resp[x.pregunta.id] !== undefined ? 'contestada' : ''} ${i === idx ? 'actual' : ''} ${marcadas.has(x.pregunta.id) ? 'marcada' : ''}`}
                  onClick={() => ir_a(i)}
                  aria-label={`Pregunta ${i + 1}${resp[x.pregunta.id] !== null && resp[x.pregunta.id] !== undefined ? ', respondida' : ', sin responder'}${marcadas.has(x.pregunta.id) ? ', marcada' : ''}`}
                  aria-current={i === idx ? 'true' : undefined}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <p className="chico tenue" style={{ marginBottom: 0 }}>
              Gris: respondida. Punto: marcada. Teclas: A a D responden, M marca, flechas navegan.
            </p>
          </aside>
        </div>
      </div>
    )
  }

  // ─── Resultado ──────────────────────────────────────────────────────────────
  if (fase === 'resultado' && sim && cal) {
    const faltantesTotal = Object.values(sim.faltantes).reduce((s, n) => s + (n ?? 0), 0)
    const obligatorias = cal.porArea.filter((a) => AREAS.find((x) => x.id === a.area)!.obligatoria)
    const oblReprobadas = obligatorias.filter((a) => !a.aprobada)
    const d = cal.dictamen
    return (
      <div className="col-lectura" style={{ maxWidth: 1040 }} data-testid="simulacro-resultado">
        <div className="entrar">
          <h1 className="titulo-pantalla">Reporte del simulacro {NOMBRE_TIPO[sim.tipo]}</h1>
          <p className="subtitulo">
            Tiempo usado: {reloj(usadoMs / 1000)} de {sim.tiempoMin} min. Respondiste {pluralizar(items.length - cal.porArea.reduce((s, a) => s + a.sinResponder, 0), 'pregunta', 'preguntas')} de {items.length}.
          </p>
        </div>
        {faltantesTotal > 0 && (
          <div className="aviso-caja" role="alert">
            El banco validado no alcanzó: faltaron {pluralizar(faltantesTotal, 'pregunta', 'preguntas')} respecto a la distribución oficial. Este reporte es menos representativo que uno completo.
          </div>
        )}

        <div className={`veredicto entrar ${d ? (d.aprobado ? 'aprueba' : 'reprueba') : ''}`}>
          <span className="estimado">estimado</span>
          {d ? (
            <>
              <h2>{d.aprobado ? 'Con este desempeño aprobarías el examen' : 'Con este desempeño no aprobarías el examen'}</h2>
              <p style={{ margin: 0 }}>
                Regla 1, promedio general de {PUNTAJE_APROBATORIO} o más: <b>{d.promedio} puntos</b> {d.promedio >= PUNTAJE_APROBATORIO ? '(cumple)' : '(no cumple)'}.
              </p>
              <p style={{ margin: 0 }}>
                Regla 2, {PUNTAJE_APROBATORIO} o más en cada área obligatoria: {oblReprobadas.length === 0 ? <b>cumple en las 4</b> : <b>no cumple en {oblReprobadas.map((a) => NOMBRE_CORTO[a.area]).join(', ')}</b>}.
              </p>
              {oblReprobadas.length > 0 && <p style={{ margin: 0 }}>Un área obligatoria por debajo de {PUNTAJE_APROBATORIO} te llevaría al examen modular extraordinario.</p>}
              {cal.probabilidadAprobar !== undefined && (
                <p style={{ margin: 0 }}>
                  Probabilidad de aprobar el examen real si rindes así: <b>{porcentaje(cal.probabilidadAprobar)}</b> (simulación Monte Carlo).
                </p>
              )}
            </>
          ) : (
            <>
              <h2>Sin dictamen global</h2>
              <p style={{ margin: 0 }}>
                Este simulacro cubre {cal.porArea.length} de las 9 áreas. El dictamen por las dos reglas del examen necesita las 9 áreas.
                {obligatorias.length > 0 && ` En las áreas obligatorias incluidas: ${obligatorias.filter((a) => a.aprobada).length} de ${obligatorias.length} llegan a ${PUNTAJE_APROBATORIO} puntos estimados.`}
              </p>
            </>
          )}
          <p className="chico tenue" style={{ margin: 0 }}>
            Los puntajes están en la escala de 200 a 1100 y son estimados: AMIB no publica la conversión oficial de aciertos a puntos.
          </p>
        </div>

        <div className="panel entrar">
          <h2>Resultado por área</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th>Área</th>
                  <th className="num">Aciertos</th>
                  <th className="num">Sin responder</th>
                  <th className="num">Tiempo prom.</th>
                  <th className="num">Puntaje (estimado)</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cal.porArea.map((a) => {
                  const obl = AREAS.find((x) => x.id === a.area)!.obligatoria
                  return (
                    <tr key={a.area}>
                      <td>
                        {NOMBRE_AREA[a.area]} {obl && <span className="insignia obl">Obligatoria</span>}
                      </td>
                      <td className="num">
                        {a.correctas} / {a.total}
                      </td>
                      <td className="num">{a.sinResponder}</td>
                      <td className="num">{a.tiempoPromedioS.toFixed(0)} s</td>
                      <td className="num">{a.puntajeEstimado}</td>
                      <td className={a.aprobada ? 'bien' : 'revisar'}>{a.aprobada ? 'En meta' : obl ? 'En riesgo' : 'Por reforzar'}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    <b>Total</b>
                  </td>
                  <td className="num">
                    <b>
                      {cal.correctas} / {cal.total}
                    </b>
                  </td>
                  <td />
                  <td />
                  <td className="num">{cal.puntajeEstimado ?? 'no aplica'}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="rejilla entrar">
          <h2 style={{ margin: 0, fontSize: 18 }}>Revisión de respuestas</h2>
          {items.map((it, i) => {
            const pos = resp[it.pregunta.id] ?? null
            const ok = pos === it.presentacion.clave
            return (
              <details key={it.pregunta.id} className="revision-item">
                <summary>
                  <span>{i + 1}.</span>
                  <span>
                    <Inline texto={it.pregunta.enunciado.length > 140 ? `${it.pregunta.enunciado.slice(0, 140)}...` : it.pregunta.enunciado} />
                  </span>
                  <span style={{ fontWeight: 700, color: ok ? 'var(--ok)' : 'var(--mal)' }}>{pos === null ? 'Sin responder' : ok ? 'Bien' : `Tu respuesta ${LETRAS[pos]})`}</span>
                </summary>
                <div>
                  <PreguntaVista pregunta={it.pregunta} presentacion={it.presentacion} elegida={pos} revelar mostrarPatron={false} />
                </div>
              </details>
            )
          })}
        </div>

        <div className="fila">
          <button className="btn primario" onClick={() => setFase('menu')}>
            Otro simulacro
          </button>
          <button className="btn" onClick={() => ir({ p: 'diagnostico' })}>
            Ver diagnóstico
          </button>
          <button className="btn" onClick={() => ir({ p: 'inicio' })}>
            Inicio
          </button>
        </div>
      </div>
    )
  }

  return <Cargando />
}
