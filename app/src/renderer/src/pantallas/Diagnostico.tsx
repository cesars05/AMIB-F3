import { useState } from 'react'
import { AREAS, META_ACIERTOS_OBLIGATORIA, type AreaId } from '@core/examen'
import { NIVELES } from '@core/dominio'
import { useApp } from '../estado'
import { EstadoVacio, Insignia, Obligatoria } from '../componentes/Comunes'
import { ETIQUETA_NIVEL, etiquetaLegible, NOMBRE_AREA, pluralizar, porcentaje } from '../lib/formato'

export function Diagnostico() {
  const { resumen, perfil, ir } = useApp()
  const [seleccion, setSeleccion] = useState<string | null>(null)
  if (!resumen || !perfil) return null

  const sinDatos = perfil.intentosTotales === 0
  const sub = seleccion ? perfil.subtemas[seleccion] : undefined
  const areaDe = (id: string): AreaId | undefined => resumen.areas.find((a) => a.materias.some((m) => m.subtemas.some((s) => s.id === id)))?.area
  const practicar = (area: AreaId, subtemaId?: string) => ir({ p: 'practicar', filtro: { areas: [area], ...(subtemaId ? { subtemas: [subtemaId] } : {}) }, n: 10, auto: true })

  const areasDebiles = perfil.areas
    .filter((a) => a.intentos > 0 && a.dominio < META_ACIERTOS_OBLIGATORIA)
    .sort((x, y) => Number(y.obligatoria) - Number(x.obligatoria) || x.dominio - y.dominio)
    .slice(0, 5)
  const maxPatron = Math.max(1, ...perfil.patronesError.map((p) => p.n))

  return (
    <>
      <div className="entrar">
        <h1 className="titulo-pantalla">Diagnóstico</h1>
        <p className="subtitulo">Qué te falla y por qué: área, subtema, tipo de pregunta y patrón de error. Se calcula con todas tus respuestas, dando más peso a las recientes.</p>
      </div>

      {sinDatos && (
        <EstadoVacio icono="lupa" titulo="Todavía no hay respuestas para diagnosticar" texto="El mapa muestra todos los subtemas como Sin ver. Cuando practiques o completes una lección, cada subtema tomará su nivel.">
          <div className="fila" style={{ justifyContent: 'center' }}>
            <button className="btn primario" onClick={() => ir({ p: 'practicar' })}>
              Practicar
            </button>
            <button className="btn" onClick={() => ir({ p: 'lecciones' })}>
              Ver lecciones
            </button>
          </div>
        </EstadoVacio>
      )}

      <div className="diag-grid">
        <section className="panel rejilla entrar" aria-label="Mapa de dominio por subtema">
          <div>
            <h2>Mapa de dominio por subtema</h2>
            <p className="sub">Cinco niveles exigentes: un solo acierto nunca da Dominado. Toca un subtema para ver el detalle.</p>
            <div className="leyenda-niveles" aria-label="Leyenda de niveles">
              {NIVELES.map((n, i) => (
                <span key={n}>
                  <i style={{ background: `var(--nivel-${i})` }} />
                  {ETIQUETA_NIVEL[n]}
                </span>
              ))}
            </div>
          </div>
          {resumen.areas.map((a) => {
            const pa = perfil.areas.find((x) => x.area === a.area)
            const subtemas = a.materias.flatMap((m) => m.subtemas)
            if (subtemas.length === 0) return null
            return (
              <div key={a.area} className="mapa-area">
                <header>
                  <h3>{NOMBRE_AREA[a.area]}</h3>
                  {AREAS.find((x) => x.id === a.area)!.obligatoria && <Obligatoria />}
                  <span className="chico tenue">{pa && pa.intentos > 0 ? `Dominio ${porcentaje(pa.dominio)}, ${pluralizar(pa.intentos, 'respuesta', 'respuestas')}` : 'Sin respuestas'}</span>
                </header>
                <div className="celdas">
                  {subtemas.map((s) => {
                    const e = perfil.subtemas[s.id]
                    const nivel = e?.nivel ?? 'sin-ver'
                    return (
                      <button key={s.id} className="celda" data-nivel={nivel} aria-pressed={seleccion === s.id} onClick={() => setSeleccion(seleccion === s.id ? null : s.id)} aria-label={`${s.nombre}: ${ETIQUETA_NIVEL[nivel]}${e && e.intentos ? `, ${e.aciertos} aciertos en ${e.intentos} respuestas` : ''}`}>
                        <span>{s.nombre}</span>
                        <small>{e && e.intentos > 0 ? `${ETIQUETA_NIVEL[nivel]}, ${e.aciertos}/${e.intentos}` : ETIQUETA_NIVEL[nivel]}</small>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {resumen.areas.every((a) => a.materias.length === 0) && <p className="tenue">No se cargó la taxonomía del temario.</p>}
        </section>

        <div className="rejilla">
          <section className="panel entrar" aria-label="Detalle del subtema">
            <h2>Detalle</h2>
            {sub && seleccion ? (
              <div className="rejilla" style={{ gap: 10 }}>
                <div>
                  <strong>{sub.nombre}</strong>
                  <div className="fila" style={{ marginTop: 4 }}>
                    <Insignia nivel={sub.nivel} />
                    <span className="chico tenue">{NOMBRE_AREA[sub.area]}</span>
                  </div>
                </div>
                <div className="recuerda">
                  <div>
                    <span>Aciertos</span>
                    <b>
                      {sub.aciertos} de {sub.intentos}
                    </b>
                  </div>
                  <div>
                    <span>Dominio estimado</span>
                    <b>
                      {porcentaje(sub.dominio)} (banda {porcentaje(sub.banda[0])} a {porcentaje(sub.banda[1])})
                    </b>
                  </div>
                  <div>
                    <span>Tiempo promedio</span>
                    <b>{sub.tiempoPromedioMs === null ? 'Sin datos' : `${(sub.tiempoPromedioMs / 1000).toFixed(0)} s`}</b>
                  </div>
                  <div>
                    <span>Objetivos vistos</span>
                    <b>
                      {sub.objetivosVistos} de {sub.objetivosTotal}
                    </b>
                  </div>
                  <div>
                    <span>Aciertos adivinados</span>
                    <b>{sub.adivinadas}</b>
                  </div>
                  <div>
                    <span>Errores frecuentes</span>
                    <b>{sub.erroresFrecuentes.length ? sub.erroresFrecuentes.map((e) => `${etiquetaLegible(e.etiqueta)} (${e.n})`).join(', ') : 'Ninguno'}</b>
                  </div>
                </div>
                <div>
                  <button className="btn primario" onClick={() => practicar(sub.area, seleccion)}>
                    Practicar esto
                  </button>
                </div>
              </div>
            ) : seleccion && areaDe(seleccion) ? (
              <div className="rejilla" style={{ gap: 10 }}>
                <p style={{ margin: 0 }}>Este subtema todavía no tiene respuestas: está Sin ver.</p>
                <div>
                  <button className="btn primario" onClick={() => practicar(areaDe(seleccion)!, seleccion)}>
                    Practicar esto
                  </button>
                </div>
              </div>
            ) : (
              <p className="tenue" style={{ margin: 0 }}>
                Selecciona un subtema del mapa para ver sus aciertos, su tiempo y sus errores frecuentes.
              </p>
            )}
          </section>

          <section className="panel entrar" aria-label="Temas débiles">
            <h2>Temas débiles</h2>
            <p className="sub">Subtemas con al menos 5 respuestas y dominio bajo 60 %, y áreas por debajo de la meta.</p>
            {perfil.debiles.length === 0 && areasDebiles.length === 0 ? (
              <p className="tenue" style={{ margin: 0 }}>
                Sin temas débiles detectados todavía.
              </p>
            ) : (
              <ul className="lista-simple">
                {perfil.debiles.slice(0, 6).map((id) => {
                  const s = perfil.subtemas[id]!
                  return (
                    <li key={id}>
                      <span>
                        <b>{s.nombre}</b>
                        <br />
                        <span className="chico tenue">
                          {NOMBRE_AREA[s.area]}, dominio {porcentaje(s.dominio)}
                        </span>
                      </span>
                      <button className="btn pequeno" onClick={() => practicar(s.area, id)}>
                        Practicar esto
                      </button>
                    </li>
                  )
                })}
                {areasDebiles.map((a) => (
                  <li key={a.area}>
                    <span>
                      <b>{NOMBRE_AREA[a.area]}</b> {a.obligatoria && <Obligatoria />}
                      <br />
                      <span className="chico tenue">Dominio {porcentaje(a.dominio)}, meta {porcentaje(META_ACIERTOS_OBLIGATORIA)}</span>
                    </span>
                    <button className="btn pequeno" onClick={() => practicar(a.area)}>
                      Practicar esto
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="dos-col">
        <section className="panel entrar" aria-label="Teoría contra cálculo">
          <h2>Teoría contra cálculo</h2>
          <p className="sub">Porcentaje de aciertos por área, separando preguntas conceptuales de numéricas.</p>
          <ul className="lista-simple">
            {AREAS.map((a) => {
              const t = perfil.tipoPorArea[a.id]
              const fila = (c: { intentos: number; aciertos: number }, nombre: string, clase: string) => (
                <div className="barra-dividida" key={nombre}>
                  <span className="chico">
                    {nombre}: {c.intentos ? `${porcentaje(c.aciertos / c.intentos)} (${c.aciertos}/${c.intentos})` : 'sin datos'}
                  </span>
                  <div className="pista">
                    <b className={clase} style={{ transform: `scaleX(${c.intentos ? c.aciertos / c.intentos : 0})` }} />
                  </div>
                </div>
              )
              return (
                <li key={a.id} style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)' }}>
                  <span>{NOMBRE_AREA[a.id]}</span>
                  <div className="rejilla" style={{ gap: 6 }}>
                    {fila(t.teoria, 'Teoría', 'teoria')}
                    {fila(t.calculo, 'Cálculo', 'calculo')}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="panel entrar" aria-label="Patrones de error">
          <h2>Patrones de error más frecuentes</h2>
          <p className="sub">Cada distractor representa una confusión típica. Aquí ves cuáles eliges más seguido.</p>
          {perfil.patronesError.length === 0 ? (
            <EstadoVacio icono="lupa" titulo="Sin patrones todavía" texto="Cuando falles preguntas con distractores etiquetados, verás aquí la confusión de fondo." />
          ) : (
            <ul className="lista-simple">
              {perfil.patronesError.map((p) => (
                <li key={p.etiqueta}>
                  <span>
                    {etiquetaLegible(p.etiqueta)}
                    <span className="mini-barra" aria-hidden="true">
                      <b style={{ transform: `scaleX(${p.n / maxPatron})` }} />
                    </span>
                  </span>
                  <b>{p.n} {p.n === 1 ? 'vez' : 'veces'}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
