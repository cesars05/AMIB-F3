import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AREAS, type AreaId } from '@core/examen'
import type { Confianza } from '@core/intentos'
import { RITMO_S } from '@core/intentos'
import type { FiltroSeleccion } from '@core/selector'
import { useApp, useAtajos, type Destino } from '../estado'
import { BarraProgreso, Cargando } from '../componentes/Comunes'
import { Inline } from '../componentes/Inline'
import { PreguntaVista } from '../componentes/Pregunta'
import type { Item } from '../lib/tipos'
import { etiquetaLegible, mensajeError, nuevaSesionId, NOMBRE_AREA, pluralizar, reloj } from '../lib/formato'

type Dificultad = '' | 'faciles' | 'medias' | 'dificiles'

interface Respuesta {
  pos: number
  confianza: Confianza
  correcta: boolean
  tiempoMs: number
}

function rangoDificultad(d: Dificultad): Pick<FiltroSeleccion, 'dificultadMin' | 'dificultadMax'> {
  if (d === 'faciles') return { dificultadMin: 1, dificultadMax: 2 }
  if (d === 'medias') return { dificultadMin: 3, dificultadMax: 3 }
  if (d === 'dificiles') return { dificultadMin: 4, dificultadMax: 5 }
  return {}
}

const CONFIANZAS: { v: Confianza; etiqueta: string; tecla: string }[] = [
  { v: 'seguro', etiqueta: 'Estoy seguro', tecla: '1' },
  { v: 'dude', etiqueta: 'Dudé', tecla: '2' },
  { v: 'adivine', etiqueta: 'Adiviné', tecla: '3' }
]

export function Practicar({ destino }: { destino: Extract<Destino, { p: 'practicar' }> }) {
  const { resumen, ajustes, guardarAjuste, recargar, ir } = useApp()
  const [area, setArea] = useState<AreaId | ''>(destino.filtro?.areas?.[0] ?? '')
  const [subtema, setSubtema] = useState(destino.filtro?.subtemas?.[0] ?? '')
  const [tipo, setTipo] = useState<'' | 'teoria' | 'calculo'>(destino.filtro?.tipo ?? '')
  const [dificultad, setDificultad] = useState<Dificultad>('')
  const [n, setN] = useState(destino.n ?? 10)
  const [cargando, setCargando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [items, setItems] = useState<Item[]>([])
  const [idx, setIdx] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [revelado, setRevelado] = useState(false)
  const [resp, setResp] = useState<Record<string, Respuesta>>({})
  const [reportadasAhora, setReportadasAhora] = useState<Set<string>>(new Set())
  const [segundos, setSegundos] = useState(0)
  const [terminada, setTerminada] = useState(false)
  const t0 = useRef(Date.now())
  const sesionId = useRef(nuevaSesionId('practica'))
  const inicio = useRef(new Date().toISOString())
  const filtroUsado = useRef<FiltroSeleccion | undefined>(undefined)

  const subtemas = useMemo(() => (area ? (resumen?.areas.find((a) => a.area === area)?.materias.flatMap((m) => m.subtemas) ?? []) : []), [resumen, area])
  const disponibles = area ? (resumen?.areas.find((a) => a.area === area)?.preguntasValidadas ?? 0) : (resumen?.preguntas.porEstado['validada'] ?? 0)

  const iniciar = useCallback(
    async (filtro: FiltroSeleccion, cuantas: number) => {
      setCargando(true)
      setError(null)
      setAviso(null)
      try {
        const sel = await window.amib.estudio.seleccionar({ filtro, n: cuantas })
        if (sel.ids.length === 0) {
          setAviso('No hay preguntas validadas con esos filtros todavía. Prueba quitar el subtema o la dificultad, o elegir otra área.')
          return
        }
        const ps = await window.amib.contenido.preguntas(sel.ids)
        const porId = new Map(ps.map((p) => [p.id, p]))
        const nuevos: Item[] = sel.presentacion.flatMap((pr) => {
          const p = porId.get(pr.id)
          return p ? [{ pregunta: p, presentacion: pr }] : []
        })
        filtroUsado.current = filtro
        sesionId.current = nuevaSesionId('practica')
        inicio.current = new Date().toISOString()
        setItems(nuevos)
        setIdx(0)
        setSel(null)
        setRevelado(false)
        setResp({})
        setTerminada(false)
        setReportadasAhora(new Set())
        t0.current = Date.now()
        setSegundos(0)
        if (sel.faltan > 0) setAviso(`Solo hay ${pluralizar(nuevos.length, 'pregunta', 'preguntas')} para este filtro (pediste ${cuantas}).`)
        void window.amib.sesiones.registrar({ id: sesionId.current, modo: 'practica', inicio: inicio.current, configuracion: { filtro, n: cuantas } }).catch(() => undefined)
      } catch (e) {
        setError(mensajeError(e))
      } finally {
        setCargando(false)
      }
    },
    []
  )

  const filtroActual = (): FiltroSeleccion => ({
    ...(area ? { areas: [area] } : {}),
    ...(subtema ? { subtemas: [subtema] } : {}),
    ...(tipo ? { tipo } : {}),
    ...rangoDificultad(dificultad)
  })

  // Entrada desde el plan o el diagnóstico: arranca sola.
  const autoHecho = useRef(false)
  useEffect(() => {
    if (destino.auto && !autoHecho.current) {
      autoHecho.current = true
      void iniciar(destino.filtro ?? {}, destino.n ?? 10)
    }
  }, [destino, iniciar])

  // Cronómetro de la pregunta en curso.
  const enCurso = items.length > 0 && !terminada
  useEffect(() => {
    if (!enCurso || revelado) return
    const id = setInterval(() => setSegundos(Math.floor((Date.now() - t0.current) / 1000)), 500)
    return () => clearInterval(id)
  }, [enCurso, revelado, idx])

  const item = items[idx]

  const enviar = useCallback(
    (confianza: Confianza) => {
      if (!item || sel === null || revelado) return
      const tiempoMs = Date.now() - t0.current
      const correcta = sel === item.presentacion.clave
      setResp((r) => ({ ...r, [item.pregunta.id]: { pos: sel, confianza, correcta, tiempoMs } }))
      setRevelado(true)
      setSegundos(Math.floor(tiempoMs / 1000))
      window.amib.intentos.registrar([{ preguntaId: item.pregunta.id, respuesta: item.presentacion.permutacion[sel]!, tiempoMs, confianza, modo: 'practica', sesionId: sesionId.current }]).catch((e) => setError(mensajeError(e)))
    },
    [item, sel, revelado]
  )

  const siguiente = useCallback(() => {
    if (idx < items.length - 1) {
      setIdx(idx + 1)
      setSel(null)
      setRevelado(false)
      t0.current = Date.now()
      setSegundos(0)
    } else {
      setTerminada(true)
      const aciertos = Object.values(resp).filter((r) => r.correcta).length
      void window.amib.sesiones.registrar({ id: sesionId.current, modo: 'practica', inicio: inicio.current, fin: new Date().toISOString(), configuracion: { filtro: filtroUsado.current }, resultado: { aciertos, total: items.length } }).catch(() => undefined)
      void recargar()
    }
  }, [idx, items.length, resp, recargar])

  async function reportar() {
    if (!item || !ajustes) return
    const id = item.pregunta.id
    try {
      await guardarAjuste({ clave: 'reportadas', valor: [...new Set([...ajustes.reportadas, id])] })
      setReportadasAhora((s) => new Set(s).add(id))
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  useAtajos(
    (e) => {
      if (!enCurso || !item) return
      const k = 'abcd'.indexOf(e.key.toLowerCase())
      if (!revelado) {
        if (k >= 0 && e.key.length === 1) setSel(k)
        else if (sel !== null && ['1', '2', '3'].includes(e.key)) enviar(CONFIANZAS[Number(e.key) - 1]!.v)
        else if (sel !== null && e.key === 'Enter') enviar('seguro')
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') siguiente()
    },
    true
  )

  if (!resumen || !ajustes) return <Cargando />

  // ─── Resultado de la sesión ─────────────────────────────────────────────────
  if (terminada) {
    const lista = items.map((it) => ({ it, r: resp[it.pregunta.id] })).filter((x): x is { it: Item; r: Respuesta } => !!x.r)
    const aciertos = lista.filter((x) => x.r.correcta).length
    const prom = lista.length ? lista.reduce((s, x) => s + x.r.tiempoMs, 0) / lista.length / 1000 : 0
    const adivinadas = lista.filter((x) => x.r.correcta && x.r.confianza === 'adivine').length
    const seguroFallo = lista.filter((x) => !x.r.correcta && x.r.confianza === 'seguro').length
    const fallos = lista.filter((x) => !x.r.correcta)
    const patrones = new Map<string, number>()
    for (const { it, r } of fallos) {
      const e = it.pregunta.opciones[it.presentacion.permutacion[r.pos]!]?.etiquetaError
      if (e) patrones.set(e, (patrones.get(e) ?? 0) + 1)
    }
    return (
      <div className="col-lectura entrar" data-testid="practica-resultado">
        <div>
          <h1 className="titulo-pantalla">Sesión terminada</h1>
          <p className="subtitulo">Tus respuestas ya están en tu perfil.</p>
        </div>
        <div className="panel rejilla">
          <div className="grande">
            {aciertos} / {lista.length}
          </div>
          <p style={{ margin: 0 }}>
            Tiempo promedio: <b>{prom.toFixed(0)} s</b> por pregunta (el examen da {RITMO_S} s).{' '}
            {adivinadas > 0 && `${pluralizar(adivinadas, 'acierto fue adivinado', 'aciertos fueron adivinados')} y no cuenta${adivinadas === 1 ? '' : 'n'} como dominio. `}
            {seguroFallo > 0 && `Fallaste ${pluralizar(seguroFallo, 'pregunta', 'preguntas')} estando seguro: son las más importantes de repasar.`}
          </p>
          {patrones.size > 0 && (
            <p style={{ margin: 0 }}>
              Patrones de error de esta sesión:{' '}
              {[...patrones.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([e, c]) => `${etiquetaLegible(e)} (${c})`)
                .join(', ')}
              .
            </p>
          )}
        </div>
        {fallos.length > 0 && (
          <div className="rejilla">
            <h2 style={{ margin: 0, fontSize: 18 }}>Para repasar</h2>
            {fallos.map(({ it, r }) => (
              <div key={it.pregunta.id} className="panel">
                <PreguntaVista pregunta={it.pregunta} presentacion={it.presentacion} elegida={r.pos} revelar mostrarPatron={false} />
              </div>
            ))}
          </div>
        )}
        <div className="fila">
          <button className="btn primario" onClick={() => void iniciar(filtroUsado.current ?? {}, items.length)}>
            Otra sesión igual
          </button>
          <button
            className="btn"
            onClick={() => {
              setItems([])
              setTerminada(false)
            }}
          >
            Cambiar filtros
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

  // ─── Sesión en curso ────────────────────────────────────────────────────────
  if (item) {
    const r = resp[item.pregunta.id]
    const reportada = reportadasAhora.has(item.pregunta.id)
    return (
      <div className="col-lectura" data-testid="practica-sesion">
        <div className="fila entre">
          <div>
            <h1 className="titulo-pantalla" style={{ fontSize: 22 }}>
              Pregunta {idx + 1} de {items.length}
            </h1>
          </div>
          <span className={`cronometro${segundos > RITMO_S ? ' lento' : ''}`} aria-label={`Tiempo en esta pregunta: ${reloj(segundos)}`}>
            {reloj(segundos)} <span className="tenue chico">de {RITMO_S} s sugeridos</span>
          </span>
        </div>
        <BarraProgreso valor={(idx + (revelado ? 1 : 0)) / items.length} etiqueta="Avance de la sesión" />
        {aviso && <div className="aviso-caja">{aviso}</div>}
        {error && (
          <div className="error-caja" role="alert">
            {error}
          </div>
        )}
        <article className="panel entrar" key={item.pregunta.id}>
          <PreguntaVista pregunta={item.pregunta} presentacion={item.presentacion} elegida={revelado ? (r?.pos ?? null) : sel} revelar={revelado} onElegir={(p) => setSel(p)} />
        </article>
        {!revelado && (
          <div className="confianza" role="group" aria-label="¿Qué tan seguro estás?">
            <span className="etiqueta">Confirma con tu nivel de seguridad</span>
            {CONFIANZAS.map((c) => (
              <button key={c.v} className="btn" disabled={sel === null} onClick={() => enviar(c.v)} data-confianza={c.v}>
                <kbd>{c.tecla}</kbd>
                {c.etiqueta}
              </button>
            ))}
            <span className="contador">Elige con A a D. Enter confirma como seguro.</span>
          </div>
        )}
        {revelado && (
          <div className="navegar">
            <button className="btn discreto" onClick={() => void reportar()} disabled={reportada}>
              {reportada ? 'Reportada: no volverá a salir' : 'Reportar pregunta'}
            </button>
            <button className="btn primario" onClick={siguiente} data-testid="practica-siguiente">
              {idx < items.length - 1 ? 'Siguiente pregunta' : 'Ver resultado'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Configuración ──────────────────────────────────────────────────────────
  return (
    <div className="col-lectura">
      <div className="entrar">
        <h1 className="titulo-pantalla">Practicar</h1>
        <p className="subtitulo">Elige qué quieres trabajar. El sistema mezcla lo que más te falla, lo que toca repasar y lo que aún no has visto.</p>
      </div>
      <form
        className="panel rejilla entrar"
        onSubmit={(e) => {
          e.preventDefault()
          void iniciar(filtroActual(), n)
        }}
      >
        <div className="filtros">
          <label className="campo">
            <span>Área</span>
            <select
              value={area}
              onChange={(e) => {
                setArea(e.target.value as AreaId | '')
                setSubtema('')
              }}
              data-testid="filtro-area"
            >
              <option value="">Todas las áreas</option>
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {NOMBRE_AREA[a.id]}
                  {a.obligatoria ? ' (obligatoria)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Subtema</span>
            <select value={subtema} onChange={(e) => setSubtema(e.target.value)} disabled={!area}>
              <option value="">{area ? 'Todos los subtemas' : 'Elige un área primero'}</option>
              {subtemas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Tipo</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as '' | 'teoria' | 'calculo')}>
              <option value="">Teoría y cálculo</option>
              <option value="teoria">Solo teoría</option>
              <option value="calculo">Solo cálculo (4 decimales)</option>
            </select>
          </label>
          <label className="campo">
            <span>Dificultad</span>
            <select value={dificultad} onChange={(e) => setDificultad(e.target.value as Dificultad)}>
              <option value="">Cualquiera</option>
              <option value="faciles">Fácil (1 y 2)</option>
              <option value="medias">Media (3)</option>
              <option value="dificiles">Difícil (4 y 5)</option>
            </select>
          </label>
          <label className="campo">
            <span>Número de preguntas</span>
            <input type="number" min={1} max={100} value={n} onChange={(e) => setN(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} data-testid="filtro-n" />
          </label>
        </div>
        <p className="chico tenue" style={{ margin: 0 }}>
          {area ? `Hay ${pluralizar(disponibles, 'pregunta validada', 'preguntas validadas')} en esta área.` : `Hay ${pluralizar(disponibles, 'pregunta validada', 'preguntas validadas')} en total.`} Atajos durante la sesión: A a D para responder y 1 a 3 para tu nivel de seguridad.
        </p>
        {aviso && (
          <div className="aviso-caja" role="status">
            {aviso}
          </div>
        )}
        {error && (
          <div className="error-caja" role="alert">
            {error}
          </div>
        )}
        <div>
          <button className="btn acento" type="submit" disabled={cargando} data-testid="practica-empezar">
            {cargando ? 'Preparando' : 'Empezar'}
          </button>
        </div>
      </form>
    </div>
  )
}
