import { AREAS } from '@core/examen'
import type { Nivel } from '@core/dominio'
import { useApp } from '../estado'
import { EstadoVacio, Insignia, Obligatoria } from '../componentes/Comunes'
import { NOMBRE_AREA, pluralizar } from '../lib/formato'
import type { LeccionMeta } from '../../../preload/api'

export function Lecciones() {
  const { resumen, perfil, ajustes, ir } = useApp()
  if (!resumen || !perfil || !ajustes) return null

  const nivelDe = (l: LeccionMeta): Nivel => {
    const n = l.subtemaId ? perfil.subtemas[l.subtemaId]?.nivel : undefined
    if (n && n !== 'sin-ver') return n
    return ajustes.leccionesVistas.includes(l.id) ? 'visto' : 'sin-ver'
  }
  const hay = resumen.lecciones.length > 0

  return (
    <>
      <div className="entrar">
        <h1 className="titulo-pantalla">Lecciones</h1>
        <p className="subtitulo">Cada lección sigue el orden del manual: explicación por partes, puntos clave, práctica guiada y mini examen. El nivel se gana con el tiempo, no con un solo acierto.</p>
      </div>
      {!hay && <EstadoVacio icono="libro" titulo="Todavía no hay lecciones cargadas" texto="Las lecciones guiadas se agregan en la carpeta content/lecciones. Mientras tanto, puedes practicar con las preguntas oficiales y de repaso." />}
      {AREAS.map((a) => {
        const lista = resumen.lecciones.filter((l) => l.area === a.id).sort((x, y) => x.orden - y.orden)
        if (hay && lista.length === 0 && resumen.lecciones.length > 0) {
          return (
            <section key={a.id} className="area-bloque entrar">
              <header>
                <h2>{NOMBRE_AREA[a.id]}</h2>
                {a.obligatoria && <Obligatoria />}
              </header>
              <div className="proximamente">Lecciones de esta área en preparación.</div>
            </section>
          )
        }
        if (lista.length === 0) return null
        return (
          <section key={a.id} className="area-bloque entrar" aria-label={NOMBRE_AREA[a.id]}>
            <header>
              <h2>{NOMBRE_AREA[a.id]}</h2>
              {a.obligatoria && <Obligatoria />}
              <span className="tenue chico">{pluralizar(lista.length, 'lección', 'lecciones')}</span>
            </header>
            {lista.map((l, i) => (
              <button key={l.id} className="leccion-fila" onClick={() => ir({ p: 'leccion', id: l.id })} data-leccion={l.id}>
                <span className="num">{i + 1}</span>
                <span>
                  <strong>{l.titulo}</strong>
                  <small>
                    {l.materia}, {l.duracionMin} min, {pluralizar(l.laminas, 'lámina', 'láminas')}
                  </small>
                </span>
                <Insignia nivel={nivelDe(l)} />
              </button>
            ))}
          </section>
        )
      })}
    </>
  )
}
