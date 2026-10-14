import { AREAS, META_ACIERTOS_OBLIGATORIA } from '@core/examen'
import { RITMO_S } from '@core/intentos'
import type { PerfilArea } from '@core/perfil'
import { NOMBRE_CORTO } from '../lib/formato'

const META = META_ACIERTOS_OBLIGATORIA * 100

/** Dominio por área contra la meta de 75 %. Las obligatorias llevan un punto. Sin intentos, la barra queda como fantasma. */
export function GraficaDominio({ areas, vacia }: { areas: PerfilArea[]; vacia: boolean }) {
  const W = 560
  const fila = 26
  const arriba = 22
  const izq = 196
  const ancho = W - izq - 64
  const x = (v: number) => izq + (v / 100) * ancho
  const alto = arriba + AREAS.length * fila + 22
  const resumen = areas.map((a) => `${NOMBRE_CORTO[a.area]} ${a.intentos ? Math.round(a.dominio * 100) + ' %' : 'sin datos'}`).join(', ')
  return (
    <svg className="svg-graf" viewBox={`0 0 ${W} ${alto}`} role="img" aria-label={`Dominio por área frente a la meta de ${META} %. ${resumen}`}>
      <line className="meta-linea" x1={x(META)} x2={x(META)} y1={arriba - 6} y2={alto - 20} />
      <text className="meta-txt" x={x(META)} y={arriba - 9} textAnchor="middle">
        meta {META} %
      </text>
      {AREAS.map((a, i) => {
        const p = areas.find((z) => z.area === a.id)
        const y = arriba + i * fila
        const sinDatos = !p || p.intentos === 0
        const v = sinDatos ? 0 : p.dominio * 100
        const clase = v >= META ? 'b-ok' : a.obligatoria && v < 60 ? 'b-riesgo' : 'b-prog'
        return (
          <g key={a.id}>
            <text className="etq" x={izq - 8} y={y + 13} textAnchor="end">
              {NOMBRE_CORTO[a.id]}
              {a.obligatoria ? ' ●' : ''}
            </text>
            <rect className="fondo-barra" x={izq} y={y + 3} width={ancho} height={14} />
            {sinDatos ? <rect className="b-fantasma" x={izq + 0.5} y={y + 3.5} width={ancho * (vacia ? 0.45 + ((i * 7) % 5) * 0.08 : 0.3)} height={13} /> : <rect className={clase} x={izq} y={y + 3} width={(v / 100) * ancho} height={14} />}
            <text x={sinDatos ? izq + 8 : x(v) + 6} y={y + 14}>
              {sinDatos ? 'sin datos' : `${Math.round(v)} %`}
            </text>
          </g>
        )
      })}
      {[0, 25, 50, 75, 100].map((t) => (
        <text key={t} x={x(t)} y={alto - 5} textAnchor="middle">
          {t}
        </text>
      ))}
    </svg>
  )
}

/** Tiempo promedio por pregunta frente al ritmo del examen (74 s). */
export function GraficaTiempo({ areas, vacia }: { areas: PerfilArea[]; vacia: boolean }) {
  const W = 440
  const izq = 150
  const maxT = Math.max(140, ...areas.map((a) => (a.tiempoPromedioS ?? 0) * 1.1))
  const ancho = W - izq - 56
  const x = (v: number) => izq + (v / maxT) * ancho
  const alto = 14 + AREAS.length * 22 + 26
  const resumen = areas.map((a) => `${NOMBRE_CORTO[a.area]} ${a.tiempoPromedioS === null ? 'sin datos' : Math.round(a.tiempoPromedioS) + ' s'}`).join(', ')
  return (
    <svg className="svg-graf" viewBox={`0 0 ${W} ${alto}`} role="img" aria-label={`Segundos promedio por pregunta por área frente al ritmo de ${RITMO_S} s. ${resumen}`}>
      {AREAS.map((a, i) => {
        const p = areas.find((z) => z.area === a.id)
        const t = p?.tiempoPromedioS ?? null
        const y = 14 + i * 22
        return (
          <g key={a.id}>
            <text className="etq" x={izq - 8} y={y + 11} textAnchor="end">
              {NOMBRE_CORTO[a.id].split(' ')[0]}
              {a.id === 'analisis' ? ' E/F/T' : ''}
            </text>
            {t === null ? (
              <>
                <rect className="b-fantasma" x={izq + 0.5} y={y + 2.5} width={vacia ? 120 + ((i * 11) % 4) * 18 : 80} height={11} />
                <text x={izq + 8} y={y + 12}>
                  sin datos
                </text>
              </>
            ) : (
              <>
                <rect className={t > RITMO_S ? 'b-riesgo' : 'b-tiempo'} x={izq} y={y + 2} width={(t / maxT) * ancho} height={12} />
                <text x={x(t) + 5} y={y + 12}>
                  {Math.round(t)} s
                </text>
              </>
            )}
          </g>
        )
      })}
      <line className="tiempo-meta" x1={x(RITMO_S)} x2={x(RITMO_S)} y1={8} y2={alto - 20} />
      <text className="tiempo-txt" x={x(RITMO_S)} y={alto - 6} textAnchor="middle">
        {RITMO_S} s por pregunta en el examen
      </text>
    </svg>
  )
}
