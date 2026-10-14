import { useEffect, useState } from 'react'
import { AREAS, DURACION_MINUTOS, META_ACIERTOS_OBLIGATORIA, TOTAL_PREGUNTAS } from '@core/examen'
import type { InfoApp } from '../../preload/api'

export function App() {
  const [info, setInfo] = useState<InfoApp | null>(null)
  useEffect(() => {
    window.amib.info().then(setInfo).catch(() => setInfo(null))
  }, [])

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-borde bg-panel px-5 py-2 font-mono text-xs">
        <span className="font-semibold tracking-widest text-ambar">AMIB F3 · TERMINAL DE ESTUDIO</span>
        <span className="text-tenue" data-testid="estado-db">
          {info ? `v${info.version} · DB esquema ${info.esquemaDb} · Electron ${info.electron}` : 'conectando…'}
        </span>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-semibold">Asesor en Estrategias de Inversión · Serie 210</h1>
        <p className="mt-1 text-sm text-tenue">
          {TOTAL_PREGUNTAS} preguntas · {Math.floor(DURACION_MINUTOS / 60)} h {DURACION_MINUTOS % 60} min · aprobatorio 600
          (escala 200–1100) · meta por área obligatoria {Math.round(META_ACIERTOS_OBLIGATORIA * 100)}%
        </p>

        <table className="mt-6 w-full max-w-4xl border-collapse font-mono text-sm" data-testid="tabla-areas">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wider text-tenue">
              <th className="py-2 pr-4">Área</th>
              <th className="py-2 pr-4 text-right">Preguntas</th>
              <th className="py-2 pr-4 text-right">Peso</th>
              <th className="py-2">Obligatoria</th>
            </tr>
          </thead>
          <tbody>
            {AREAS.map((a) => (
              <tr key={a.id} className="border-b border-borde/60">
                <td className="py-2 pr-4 font-sans">{a.nombre}</td>
                <td className="py-2 pr-4 text-right">{a.preguntas}</td>
                <td className="py-2 pr-4 text-right">{((a.preguntas / TOTAL_PREGUNTAS) * 100).toFixed(2)}%</td>
                <td className="py-2">{a.obligatoria ? <span className="text-naranja">● Sí</span> : <span className="text-tenue">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-8 text-xs text-tenue">Etapa E0 · esqueleto listo. Las pantallas de estudio llegan en E1.</p>
      </main>
    </div>
  )
}
