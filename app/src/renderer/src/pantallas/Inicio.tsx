import type { ReactNode } from 'react'
import { diasParaExamen } from '@core/plan'
import { META_ACIERTOS_OBLIGATORIA } from '@core/examen'
import { useApp, type Destino } from '../estado'
import { GraficaDominio, GraficaTiempo } from '../componentes/Graficas'
import { EstadoVacio } from '../componentes/Comunes'
import { ETIQUETA_NIVEL, NOMBRE_CORTO, etiquetaLegible, fechaLarga, pluralizar, porcentaje } from '../lib/formato'

interface Tarjeta {
  clave: string
  titulo: string
  texto: string
  destino?: Destino
  pronto?: boolean
  hoy?: boolean
}

function saludo(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export function Inicio() {
  const { ajustes, perfil, plan, resumen, ir } = useApp()
  if (!ajustes || !perfil || !resumen) return null

  const dias = ajustes.fechaExamen ? diasParaExamen(ajustes.fechaExamen, new Date()) : null
  const obligatorias = perfil.areas.filter((a) => a.obligatoria)
  const enMeta = obligatorias.filter((a) => a.intentos >= 5 && a.dominio >= META_ACIERTOS_OBLIGATORIA).length
  const sinDatos = perfil.intentosTotales === 0
  const prob = perfil.probabilidadAprobar
  const modoTxt = ajustes.modo === 'intensivo' ? 'intensivo' : ajustes.modo === 'ligero' ? 'ligero' : 'personalizado'

  const textoHoy = !ajustes.fechaExamen
    ? 'Define la fecha de tu examen para generar tu plan.'
    : !plan
      ? 'Sin plan disponible.'
      : plan.esDiaDeEstudio
        ? `${plan.totalMin} min en ${pluralizar(plan.actividades.length, 'actividad', 'actividades')}, según tu modo ${modoTxt}.`
        : (plan.nota ?? 'Hoy no hay actividades.')

  const tarjetas: Tarjeta[] = [
    { clave: 'hoy', titulo: 'Sesión de hoy', texto: textoHoy, destino: { p: 'hoy' }, hoy: true },
    { clave: 'practicar', titulo: 'Practicar', texto: 'Por área, subtema y tipo. Teoría o cálculo, con explicación al instante.', destino: { p: 'practicar' } },
    { clave: 'diagnostico', titulo: 'Diagnóstico', texto: 'Qué te falla y por qué: área, subtema y patrón de error.', destino: { p: 'diagnostico' } },
    { clave: 'simulacro', titulo: 'Simulacro', texto: 'Como el examen real, con reporte por área y dictamen estimado.', destino: { p: 'simulacro' } },
    { clave: 'lecciones', titulo: 'Guías y lecciones', texto: resumen.lecciones.length ? `${pluralizar(resumen.lecciones.length, 'lección guiada', 'lecciones guiadas')} en el orden del manual.` : 'Láminas con tus notas y mini examen. Las primeras lecciones están en preparación.', destino: { p: 'lecciones' } },
    { clave: 'tarjetas', titulo: 'Tarjetas', texto: 'Datos duros con repetición espaciada: plazos, montos y horarios.', pronto: true },
    { clave: 'videos', titulo: 'Videos', texto: 'Videos por tema, verificados, y los que tú agregues.', pronto: true },
    { clave: 'ajustes', titulo: 'Ajustes', texto: 'Fecha del examen, intensidad, tema, letra y respaldo.', destino: { p: 'ajustes' } }
  ]

  const conDatos = perfil.areas.filter((a) => a.intentos > 0)
  const masDebil = [...conDatos].sort((a, b) => a.dominio - b.dominio)[0]
  const patron = perfil.patronesError[0]
  const adivinadas = Object.values(perfil.subtemas).reduce((s, x) => s + x.adivinadas, 0)
  const dominados = perfil.dominados.map((id) => perfil.subtemas[id]?.nombre).filter(Boolean) as string[]
  const sinVer = perfil.cobertura.total - perfil.cobertura.vistos

  const filas: [string, ReactNode][] = [
    ['Área más débil', masDebil ? `${NOMBRE_CORTO[masDebil.area]}, ${porcentaje(masDebil.dominio)}` : 'Aún no hay respuestas'],
    ['Patrón de error', patron ? `${etiquetaLegible(patron.etiqueta)} (${patron.n} ${patron.n === 1 ? 'vez' : 'veces'})` : 'Ninguno registrado'],
    ['Sin ver todavía', `${sinVer} de ${perfil.cobertura.total} objetivos`],
    ['Dominas', dominados.length ? dominados.slice(0, 3).join(', ') : 'Todavía nada: Dominado exige tres sesiones separadas'],
    ['Acertaste adivinando', adivinadas ? `${pluralizar(adivinadas, 'pregunta', 'preguntas')}, vuelven en repaso` : 'Ninguna'],
    ['Repasos vencidos', perfil.vencidas ? pluralizar(perfil.vencidas, 'pregunta', 'preguntas') : 'Ninguno']
  ]

  return (
    <>
      <div className="entrar">
        <h1 className="titulo-pantalla">{saludo()}, Cesar</h1>
        <p className="subtitulo">
          {dias === null ? 'Aún no defines la fecha de tu examen.' : dias > 0 ? `Faltan ${dias} días para tu examen.` : dias === 0 ? 'Tu examen es hoy.' : 'La fecha del examen ya pasó.'} Tu plan y tu perfil se calculan en este equipo, sin internet.
        </p>
      </div>

      <section className="kpis entrar" aria-label="Indicadores">
        <div className="kpi">
          <span>Examen en</span>
          <strong>{dias === null ? 'Sin fecha' : dias >= 0 ? `${dias} días` : 'Ya pasó'}</strong>
          <small>{ajustes.fechaExamen ? `${fechaLarga(ajustes.fechaExamen)}, ${modoTxt}` : 'Defínela en Ajustes'}</small>
        </div>
        <div className="kpi">
          <span>Probabilidad de aprobar</span>
          <strong className="acento">{prob === null ? 'Sin datos' : porcentaje(prob)}</strong>
          <small>{prob === null ? 'Responde preguntas o haz tu autoevaluación' : perfil.fuenteProbabilidad === 'intentos' ? 'estimada con tus respuestas' : 'estimada con tu autoevaluación'}</small>
        </div>
        <div className="kpi">
          <span>Obligatorias en meta</span>
          <strong>{enMeta} / {obligatorias.length || 4}</strong>
          <small>meta {Math.round(META_ACIERTOS_OBLIGATORIA * 100)} % en cada una</small>
        </div>
        <div className="kpi">
          <span>Cobertura del temario</span>
          <strong>{porcentaje(perfil.cobertura.porcentaje)}</strong>
          <small>
            {perfil.cobertura.vistos} de {perfil.cobertura.total} objetivos vistos
          </small>
        </div>
      </section>

      <section className="secciones entrar" aria-label="Secciones">
        {tarjetas.map((t) => (
          <button key={t.clave} className={`seccion${t.hoy ? ' hoy' : ''}`} disabled={t.pronto} onClick={() => t.destino && ir(t.destino)} data-seccion={t.clave}>
            <strong>
              {t.titulo}
              {t.pronto && <span className="insignia pronto">Próximamente</span>}
            </strong>
            <small>{t.texto}</small>
          </button>
        ))}
      </section>

      <section className="graficas entrar" aria-label="Tu progreso">
        <div className="panel">
          <h2>Dominio por área</h2>
          <p className="sub">Aciertos ponderados por recencia. El punto marca las áreas obligatorias: necesitas {Math.round(META_ACIERTOS_OBLIGATORIA * 100)} % en cada una.</p>
          <div className={sinDatos ? 'grafica-vacia' : undefined}>
            <GraficaDominio areas={perfil.areas} vacia={sinDatos} />
            {sinDatos && (
              <div className="velo-vacio">
                <strong>Aún no hay datos de dominio</strong>
                <span>Responde tus primeras preguntas en Practicar o completa una lección y esta gráfica se llena sola.</span>
              </div>
            )}
          </div>
          <div className="leyenda">
            <span>
              <i style={{ background: 'var(--graf-ok)' }} />
              en meta
            </span>
            <span>
              <i style={{ background: 'var(--graf-prog)' }} />
              en progreso
            </span>
            <span>
              <i style={{ background: 'var(--graf-riesgo)' }} />
              obligatoria en riesgo
            </span>
          </div>
        </div>
        <div className="rejilla">
          <div className="panel">
            <h2>Tiempo por pregunta</h2>
            <p className="sub">Promedio por área. En rojo, más lento que el ritmo del examen.</p>
            <div className={sinDatos ? 'grafica-vacia' : undefined}>
              <GraficaTiempo areas={perfil.areas} vacia={sinDatos} />
              {sinDatos && (
                <div className="velo-vacio">
                  <strong>Sin tiempos todavía</strong>
                  <span>Se miden mientras practicas.</span>
                </div>
              )}
            </div>
          </div>
          <div className="panel">
            <h2>Lo que el sistema recuerda de ti</h2>
            {sinDatos ? (
              <EstadoVacio titulo="Todavía no te conozco" texto="Cuando respondas preguntas guardaré tus fallas, tus tiempos y lo que dominas, y lo verás aquí." icono="lupa" />
            ) : (
              <div className="recuerda">
                {filas.map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </div>
                ))}
              </div>
            )}
            {!sinDatos && perfil.areas.some((a) => a.intentos > 0) && (
              <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>
                Nivel de dominio por subtema: {ETIQUETA_NIVEL['sin-ver']}, {ETIQUETA_NIVEL.visto}, {ETIQUETA_NIVEL.familiar}, {ETIQUETA_NIVEL.competente} y {ETIQUETA_NIVEL.dominado}. Detalle en Diagnóstico.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
