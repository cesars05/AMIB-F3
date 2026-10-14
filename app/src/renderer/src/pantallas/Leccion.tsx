import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { crearAzar } from '@core/barajar'
import type { Pregunta } from '@core/contenido'
import { evaluarNivel, NIVELES, type Nivel } from '@core/dominio'
import type { Intento } from '@core/intentos'
import type { Leccion } from '@core/leccion'
import { presentarPreguntas, type PreguntaPresentada } from '@core/selector'
import { useApp, useAtajos } from '../estado'
import { BloqueVista } from '../componentes/Bloques'
import { Cargando } from '../componentes/Comunes'
import { Inline } from '../componentes/Inline'
import { NotaLamina } from '../componentes/NotaLamina'
import { PreguntaVista } from '../componentes/Pregunta'
import type { Item } from '../lib/tipos'
import { ETIQUETA_NIVEL, etiquetaLegible, mensajeError, nuevaSesionId, NOMBRE_AREA } from '../lib/formato'


const ETAPAS = ['1. Explicación por partes', '2. Puntos clave', '3. Práctica guiada', '4. Mini examen']

const EXPLICACION_NIVEL: Record<Nivel, string> = {
  'sin-ver': 'Todavía no hay evidencia suficiente. Repite la lección.',
  visto: 'Te quedas en Visto. Repasa las láminas y vuelve a intentar el mini examen; estas preguntas regresan en tu repaso.',
  familiar: 'Subes a Familiar, no a Dominado. Para Competente necesitas acertar de nuevo en otra sesión, al menos 2 días después, con preguntas más difíciles.',
  competente: 'Ya eres Competente en este tema. Para Dominado necesitas otra sesión, al menos 7 días después, con preguntas de dificultad alta, buen ritmo y sin ayudas.',
  dominado: 'Dominado: el nivel más alto. Se mantiene si sigues repasando; con más de 21 días sin practicar baja un nivel.'
}

export function LeccionVisor({ id }: { id: string }) {
  const { ajustes, guardarAjuste, recargar, ir } = useApp()
  const [leccion, setLeccion] = useState<Leccion | null>(null)
  const [practica, setPractica] = useState<Item[]>([])
  const [mini, setMini] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)
  const [etapa, setEtapa] = useState(0)
  const [lamina, setLamina] = useState(0)
  const [vistas, setVistas] = useState<Set<number>>(new Set([0]))
  const sesionId = useRef(nuevaSesionId('leccion'))
  const inicio = useRef(new Date().toISOString())

  // Práctica
  const [pIdx, setPIdx] = useState(0)
  const [pResp, setPResp] = useState<Record<string, number>>({})
  const tPregunta = useRef(Date.now())

  // Mini examen
  const [mResp, setMResp] = useState<Record<string, number>>({})
  const [mTiempo, setMTiempo] = useState<Record<string, number>>({})
  const tMini = useRef(Date.now())
  const [resultado, setResultado] = useState<{ aciertos: number; nivel: Nivel; patrones: string[] } | null>(null)
  const [calificando, setCalificando] = useState(false)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const l = await window.amib.contenido.leccion(id)
        const todas = await window.amib.contenido.preguntas([...l.practica, ...l.miniExamen])
        const porId = new Map(todas.map((p) => [p.id, p]))
        const orden = [...l.practica, ...l.miniExamen].map((x) => porId.get(x)).filter((p): p is Pregunta => !!p)
        // Las opciones siempre se barajan con el motor, con la clave repartida entre a y d en toda la lección.
        const pres = presentarPreguntas(orden, crearAzar((Date.now() ^ (id.length * 2654435761)) >>> 0))
        const item = (pid: string): Item | null => {
          const p = porId.get(pid)
          const i = orden.findIndex((o) => o.id === pid)
          return p && i >= 0 ? { pregunta: p, presentacion: pres[i]! } : null
        }
        if (!vivo) return
        setLeccion(l)
        setPractica(l.practica.map(item).filter((x): x is Item => !!x))
        setMini(l.miniExamen.map(item).filter((x): x is Item => !!x))
        void window.amib.sesiones.registrar({ id: sesionId.current, modo: 'leccion', inicio: inicio.current, configuracion: { leccionId: l.id } }).catch(() => undefined)
      } catch (e) {
        if (vivo) setError(mensajeError(e))
      }
    })()
    return () => {
      vivo = false
    }
  }, [id])

  const total = leccion?.laminas.length ?? 0
  const irLamina = useCallback(
    (n: number) => {
      if (!leccion) return
      const v = Math.min(leccion.laminas.length - 1, Math.max(0, n))
      setLamina(v)
      setVistas((s) => new Set(s).add(v))
    },
    [leccion]
  )

  const responderPractica = useCallback(
    (pos: number) => {
      const it = practica[pIdx]
      if (!it || !leccion || pResp[it.pregunta.id] !== undefined) return
      setPResp((r) => ({ ...r, [it.pregunta.id]: pos }))
      window.amib.intentos
        .registrar([{ preguntaId: it.pregunta.id, respuesta: it.presentacion.permutacion[pos]!, tiempoMs: Date.now() - tPregunta.current, modo: 'leccion', sesionId: sesionId.current, subtemaId: leccion.subtemaId }])
        .catch((e) => setError(mensajeError(e)))
    },
    [practica, pIdx, pResp, leccion]
  )

  useAtajos(
    (e) => {
      if (etapa === 0) {
        if (e.key === 'ArrowRight') irLamina(lamina + 1)
        else if (e.key === 'ArrowLeft') irLamina(lamina - 1)
      } else if (etapa === 2) {
        const k = 'abcd'.indexOf(e.key.toLowerCase())
        if (k >= 0 && e.key.length === 1) responderPractica(k)
        else if ((e.key === 'Enter' || e.key === 'ArrowRight') && practica[pIdx] && pResp[practica[pIdx]!.pregunta.id] !== undefined && pIdx < practica.length - 1) siguientePractica()
      }
    },
    !!leccion
  )

  function siguientePractica() {
    setPIdx((i) => i + 1)
    tPregunta.current = Date.now()
  }

  function elegirMini(it: Item, pos: number) {
    if (resultado) return
    const id = it.pregunta.id
    setMResp((r) => ({ ...r, [id]: pos }))
    // Se guarda la marca de la primera respuesta: de ahí sale el tiempo por pregunta al calificar.
    setMTiempo((t) => (t[id] === undefined ? { ...t, [id]: Date.now() } : t))
  }

  async function calificar() {
    if (!leccion) return
    setCalificando(true)
    try {
      // Tiempo por pregunta: desde la respuesta anterior (o el inicio) hasta la primera vez que se respondió.
      const orden = [...mini].filter((it) => mTiempo[it.pregunta.id] !== undefined).sort((a, b) => mTiempo[a.pregunta.id]! - mTiempo[b.pregunta.id]!)
      let previo = tMini.current
      const dur: Record<string, number> = {}
      for (const it of orden) {
        dur[it.pregunta.id] = Math.max(1000, mTiempo[it.pregunta.id]! - previo)
        previo = mTiempo[it.pregunta.id]!
      }
      const entradas = mini.map((it) => ({ preguntaId: it.pregunta.id, respuesta: it.presentacion.permutacion[mResp[it.pregunta.id]!]!, tiempoMs: dur[it.pregunta.id] ?? 1000, modo: 'mini' as const, sesionId: sesionId.current, subtemaId: leccion.subtemaId }))
      await window.amib.intentos.registrar(entradas)
      const aciertos = mini.filter((it) => mResp[it.pregunta.id] === it.presentacion.clave).length
      const patrones = mini
        .map((it) => (mResp[it.pregunta.id] !== it.presentacion.clave ? it.pregunta.opciones[it.presentacion.permutacion[mResp[it.pregunta.id]!]!]?.etiquetaError : undefined))
        .filter((x): x is string => !!x)
      // Nivel resultante: el del subtema en el perfil; sin subtema, el que arrojan solo los intentos de esta sesión.
      let nivel: Nivel
      const perfil = await window.amib.perfil.obtener()
      if (leccion.subtemaId && perfil.subtemas[leccion.subtemaId]) nivel = perfil.subtemas[leccion.subtemaId]!.nivel
      else {
        const fecha = new Date().toISOString()
        const locales: Intento[] = mini.map((it) => ({
          preguntaId: it.pregunta.id,
          area: it.pregunta.area,
          tipo: it.pregunta.tipo,
          dificultad: it.pregunta.dificultad as Intento['dificultad'],
          correcta: mResp[it.pregunta.id] === it.presentacion.clave,
          tiempoMs: dur[it.pregunta.id] ?? 1000,
          modo: 'mini',
          sesionId: sesionId.current,
          fecha
        }))
        nivel = evaluarNivel(locales, new Date()).nivel
      }
      setResultado({ aciertos, nivel, patrones })
      if (mini.length > 0 && aciertos / mini.length >= 0.8 && ajustes && !ajustes.leccionesVistas.includes(leccion.id)) await guardarAjuste({ clave: 'leccionesVistas', valor: [...ajustes.leccionesVistas, leccion.id] })
      await window.amib.sesiones.registrar({ id: sesionId.current, modo: 'leccion', inicio: inicio.current, fin: new Date().toISOString(), configuracion: { leccionId: leccion.id }, resultado: { aciertos, total: mini.length, nivel } })
      await recargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCalificando(false)
    }
  }

  function repetir() {
    sesionId.current = nuevaSesionId('leccion')
    inicio.current = new Date().toISOString()
    setEtapa(0)
    setLamina(0)
    setVistas(new Set([0]))
    setPIdx(0)
    setPResp({})
    setMResp({})
    setMTiempo({})
    setResultado(null)
    tMini.current = Date.now()
  }

  const progreso = useMemo(
    () => [
      total ? vistas.size / total : 0,
      etapa >= 1 ? 1 : 0,
      practica.length ? Object.keys(pResp).length / practica.length : 0,
      resultado ? 1 : mini.length ? (Object.keys(mResp).length / mini.length) * 0.9 : 0
    ],
    [total, vistas, etapa, practica.length, pResp, mini.length, mResp, resultado]
  )

  if (error && !leccion)
    return (
      <div className="col-lectura">
        <div className="error-caja" role="alert">
          No se pudo abrir la lección: {error}
        </div>
        <div>
          <button className="btn" onClick={() => ir({ p: 'lecciones' })}>
            Volver a Lecciones
          </button>
        </div>
      </div>
    )
  if (!leccion) return <Cargando texto="Abriendo la lección" />

  const actual = leccion.laminas[lamina]!
  const itemP = practica[pIdx]
  const respP = itemP ? pResp[itemP.pregunta.id] : undefined
  const todasMini = mini.length > 0 && mini.every((it) => mResp[it.pregunta.id] !== undefined)

  return (
    <div className="col-lectura">
      <div className="entrar">
        <nav className="migas" aria-label="Ruta">
          <button className="btn pequeno discreto" onClick={() => ir({ p: 'lecciones' })}>
            Lecciones
          </button>{' '}
          / {NOMBRE_AREA[leccion.area]} / {leccion.materia}
        </nav>
        <h1 className="titulo-pantalla" style={{ marginTop: 8 }}>
          {leccion.titulo}
        </h1>
        <p className="subtitulo">
          Lección guiada, unos {leccion.duracionMin} min. {leccion.resumen}
        </p>
      </div>

      {error && (
        <div className="error-caja" role="alert">
          {error}
        </div>
      )}

      <nav className="riel" aria-label="Etapas de la lección">
        {ETAPAS.map((e, i) => (
          <button key={e} className="etapa" aria-current={i === etapa ? 'step' : undefined} onClick={() => setEtapa(i)} data-etapa={i}>
            <i>
              <b style={{ transform: `scaleX(${Math.min(1, progreso[i]!)})` }} />
            </i>
            <span>{e}</span>
          </button>
        ))}
      </nav>

      {etapa === 0 && (
        <>
          <article className="lamina" aria-label={`Lámina ${lamina + 1} de ${total}: ${actual.titulo}`}>
            <div className="lamina-cuerpo entrar" key={actual.id}>
              <h2>{actual.titulo}</h2>
              {actual.bloques.map((b, i) => (
                <BloqueVista key={i} bloque={b} />
              ))}
            </div>
            <div className="debajo">
              <NotaLamina key={`${leccion.id}/${actual.id}`} leccionId={leccion.id} laminaId={actual.id} />
              <section aria-label="Explicación ampliada">
                <h3>Explicación ampliada{actual.paginas.length ? `, Manual p. ${actual.paginas.join(' y ')}` : ''}</h3>
                <p>{actual.ampliada ? <Inline texto={actual.ampliada} /> : 'Esta lámina no tiene explicación ampliada.'}</p>
              </section>
            </div>
          </article>
          <div className="navegar">
            <button className="btn" onClick={() => irLamina(lamina - 1)} disabled={lamina === 0} data-prev>
              Anterior
            </button>
            <span className="contador">
              Lámina {lamina + 1} de {total}, usa las flechas
            </span>
            {lamina < total - 1 ? (
              <button className="btn primario" onClick={() => irLamina(lamina + 1)} data-next>
                Siguiente
              </button>
            ) : (
              <button className="btn primario" onClick={() => setEtapa(1)}>
                Ver puntos clave
              </button>
            )}
          </div>
        </>
      )}

      {etapa === 1 && (
        <>
          <article className="lamina">
            <div className="lamina-cuerpo entrar">
              <h2>Lo que tienes que saber</h2>
              <ol className="puntos">
                {leccion.puntosClave.map((p, i) => (
                  <li key={i} className="punto">
                    <span>
                      <Inline texto={p} />
                    </span>
                  </li>
                ))}
              </ol>
              <p className="contador">Estos puntos se vuelven tarjetas de repaso cuando estén disponibles.</p>
            </div>
          </article>
          <div className="navegar">
            <button className="btn" onClick={() => setEtapa(0)}>
              Volver a las láminas
            </button>
            <button className="btn primario" onClick={() => setEtapa(2)}>
              Practicar
            </button>
          </div>
        </>
      )}

      {etapa === 2 && (
        <>
          {!itemP ? (
            <div className="aviso-caja">Esta lección no tiene preguntas de práctica disponibles.</div>
          ) : (
            <article className="lamina">
              <div className="lamina-cuerpo entrar" key={itemP.pregunta.id}>
                <h2>
                  Práctica guiada, {pIdx + 1} de {practica.length}
                </h2>
                <PreguntaVista pregunta={itemP.pregunta} presentacion={itemP.presentacion} elegida={respP ?? null} revelar={respP !== undefined} onElegir={responderPractica} />
              </div>
            </article>
          )}
          <div className="navegar">
            <button className="btn" onClick={() => setEtapa(1)}>
              Puntos clave
            </button>
            {itemP && respP === undefined ? (
              <span className="contador">Responde con clic o con las teclas A a D</span>
            ) : pIdx < practica.length - 1 ? (
              <button className="btn primario" onClick={siguientePractica} data-practica-siguiente>
                Siguiente pregunta
              </button>
            ) : (
              <button
                className="btn acento"
                onClick={() => {
                  setEtapa(3)
                  tMini.current = Date.now()
                }}
              >
                Ir al mini examen
              </button>
            )}
          </div>
        </>
      )}

      {etapa === 3 && !resultado && (
        <>
          <article className="lamina">
            <div className="lamina-cuerpo">
              <h2>Mini examen, sin ayuda hasta el final</h2>
              {mini.length === 0 && <div className="aviso-caja">Esta lección no tiene preguntas de mini examen disponibles.</div>}
              {mini.map((it, i) => (
                <div key={it.pregunta.id}>
                  {i > 0 && <hr style={{ border: 0, borderTop: '1px solid var(--linea)', margin: '8px 0 16px' }} />}
                  <PreguntaVista pregunta={it.pregunta} presentacion={it.presentacion} elegida={mResp[it.pregunta.id] ?? null} revelar={false} onElegir={(pos) => elegirMini(it, pos)} meta={`Pregunta ${i + 1} de ${mini.length}`} />
                </div>
              ))}
            </div>
          </article>
          <div className="navegar">
            <span className="contador">
              {Object.keys(mResp).length} de {mini.length} respondidas
            </span>
            <button className="btn acento" disabled={!todasMini || calificando} onClick={() => void calificar()} data-testid="mini-terminar">
              {calificando ? 'Calificando' : 'Terminar y calificar'}
            </button>
          </div>
        </>
      )}

      {etapa === 3 && resultado && (
        <>
          <article className="lamina" data-testid="mini-resultado">
            <div className="lamina-cuerpo entrar">
              <h2>Resultado del mini examen</h2>
              <div className="grande">
                {resultado.aciertos} / {mini.length}
              </div>
              <table className="tabla">
                <tbody>
                  {mini.map((it, i) => {
                    const ok = mResp[it.pregunta.id] === it.presentacion.clave
                    return (
                      <tr key={it.pregunta.id}>
                        <td>
                          {i + 1}. <Inline texto={it.pregunta.enunciado} />
                        </td>
                        <td className={ok ? 'bien' : 'revisar'} style={{ textAlign: 'right' }}>
                          {ok ? 'Bien' : 'Revisar'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div>
                <p className="etiqueta" style={{ marginBottom: 6 }}>
                  Nivel de dominio resultante
                </p>
                <div className="niveles" aria-label={`Nivel resultante: ${ETIQUETA_NIVEL[resultado.nivel]}`}>
                  {NIVELES.map((n, i) => (
                    <span key={n} className={n === resultado.nivel ? 'actual' : i < NIVELES.indexOf(resultado.nivel) ? 'paso-previo' : ''}>
                      {ETIQUETA_NIVEL[n]}
                    </span>
                  ))}
                </div>
              </div>
              <p className="contador" style={{ fontSize: 14 }}>
                {EXPLICACION_NIVEL[resultado.nivel]}
                {resultado.patrones.length > 0 && ` Se guardó en tu perfil: ${[...new Set(resultado.patrones)].map(etiquetaLegible).join(', ')}. Esas preguntas vuelven mañana en tu repaso.`}
              </p>
              {mini
                .filter((it) => mResp[it.pregunta.id] !== it.presentacion.clave)
                .map((it) => (
                  <PreguntaVista key={it.pregunta.id} pregunta={it.pregunta} presentacion={it.presentacion} elegida={mResp[it.pregunta.id] ?? null} revelar mostrarPatron={false} />
                ))}
            </div>
          </article>
          <div className="navegar">
            <button className="btn" onClick={repetir}>
              Repetir lección
            </button>
            <div className="fila">
              <button className="btn" onClick={() => ir({ p: 'lecciones' })}>
                Volver a Lecciones
              </button>
              <button className="btn primario" onClick={() => ir({ p: 'diagnostico' })}>
                Ver mi diagnóstico
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
