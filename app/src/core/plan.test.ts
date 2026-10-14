import { describe, expect, it } from 'vitest'
import { crearConfig, diasDeEstudio, diasParaExamen, dominioParaPlan, planDeHoy, repasoCompleto, repasoRapido, type ConfigPlan, type LeccionDisponible } from './plan'
import { calcularPerfil, type ResumenTaxonomia } from './perfil'
import { AREAS } from './examen'
import type { Intento } from './intentos'

const tax: ResumenTaxonomia = { areas: AREAS.map((a) => ({ area: a.id, obligatoria: a.obligatoria, subtemas: [{ id: `${a.id}.s`, nombre: a.id, objetivos: 2 }] })) }
const lecciones: LeccionDisponible[] = AREAS.flatMap((a) => [
  { id: `${a.id}-1`, area: a.id, orden: 1, duracionMin: 40, subtemaId: `${a.id}.s` },
  { id: `${a.id}-2`, area: a.id, orden: 2, duracionMin: 30 }
])
// 2026-10-14 es miércoles. 12:00 UTC = 06:00 en México.
const hoy = (d: number) => new Date(Date.UTC(2026, 9, d, 18))
const vacioPerfil = (ahora = hoy(14)) => calcularPerfil({ intentos: [], taxonomia: tax, ahora })
const cfg = (extra: Partial<ConfigPlan> = {}) => crearConfig({ fechaExamen: '2026-12-15', modo: 'intensivo', ...extra })
const intentosArea = (area: (typeof AREAS)[number]['id'], aciertos: number, total: number): Intento[] =>
  Array.from({ length: total }, (_, k) => ({ preguntaId: `${area}${k}`, area, subtemaId: `${area}.s`, tipo: 'teoria', correcta: k < aciertos, tiempoMs: 1, modo: 'practica', sesionId: area, fecha: hoy(13).toISOString() }))

describe('configuración', () => {
  it('defaults: intensivo 150 min por 6 días, ligero 50 por 5', () => {
    expect(cfg()).toMatchObject({ minutosDia: 150, diasSemana: 6 })
    expect(crearConfig({ fechaExamen: '2026-12-15', modo: 'ligero' })).toMatchObject({ minutosDia: 50, diasSemana: 5 })
    expect(crearConfig({ fechaExamen: '2026-12-15', modo: 'personalizado', minutosDia: 90, diasSemana: 3 })).toMatchObject({ minutosDia: 90, diasSemana: 3 })
    expect(crearConfig({ fechaExamen: '2026-12-15' }).modo).toBe('intensivo')
  })
  it('días de estudio', () => {
    expect(diasDeEstudio({ diasSemana: 6 })).toEqual([1, 2, 3, 4, 5, 6])
    expect(diasDeEstudio({ diasSemana: 3 })).toEqual([1, 3, 5])
    expect(diasDeEstudio({ diasSemana: 99 })).toHaveLength(7)
    expect(diasDeEstudio({ diasSemana: 3, diasActivos: [0, 2, 6] })).toEqual([2, 6, 0])
  })
  it('días para el examen con zona de México', () => {
    expect(diasParaExamen('2026-10-15', new Date(Date.UTC(2026, 9, 14, 5)))).toBe(2)
    expect(diasParaExamen('2026-10-15', new Date(Date.UTC(2026, 9, 14, 7)))).toBe(1)
    expect(() => diasParaExamen('xx', hoy(1))).toThrow(RangeError)
  })
})

describe('planDeHoy', () => {
  const total = (p: ReturnType<typeof planDeHoy>) => p.actividades.reduce((s, a) => s + a.minutos, 0)

  it('arranca con la lección del área obligatoria más débil, en orden del manual si hay empate', () => {
    const p = planDeHoy({ config: cfg(), perfil: vacioPerfil(), lecciones, ahora: hoy(14) })
    expect(p.esDiaDeEstudio).toBe(true)
    expect(p.actividades[0]).toMatchObject({ tipo: 'leccion', area: 'etica', leccionId: 'etica-1' })
    expect(p.totalMin).toBe(total(p))
    expect(p.totalMin).toBeLessThanOrEqual(150)
    expect(p.actividades.at(-1)!.tipo).toBe('practica')
  })
  it('la autoevaluación reordena la prioridad', () => {
    const c = cfg({ autoevaluacion: { etica: 'domino', deuda: 'nunca' } })
    const p = planDeHoy({ config: c, perfil: vacioPerfil(), lecciones, ahora: hoy(14) })
    expect(p.actividades[0]).toMatchObject({ area: 'deuda' })
    expect(dominioParaPlan(vacioPerfil(), 'etica', c.autoevaluacion)).toBe(0.7)
  })
  it('con evidencia real manda el dominio observado', () => {
    const perfil = calcularPerfil({ intentos: [...intentosArea('etica', 9, 10), ...intentosArea('derivados', 2, 10)], taxonomia: tax, ahora: hoy(14) })
    const p = planDeHoy({ config: cfg(), perfil, lecciones, ahora: hoy(14) })
    expect(p.actividades[0]).toMatchObject({ area: 'derivados' })
  })
  it('salta lecciones ya familiares y pasa a la siguiente', () => {
    const p = planDeHoy({ config: cfg(), perfil: vacioPerfil(), lecciones, ahora: hoy(14), leccionesVistas: ['etica-1', 'etica-2'] })
    expect(p.actividades[0]).toMatchObject({ area: 'capitales' })
  })
  it('lección familiar por nivel de subtema', () => {
    const intentos = intentosArea('etica', 5, 5).map((i) => ({ ...i, modo: 'mini' as const }))
    const perfil = calcularPerfil({ intentos, taxonomia: tax, ahora: hoy(14) })
    const p = planDeHoy({ config: cfg(), perfil, lecciones, ahora: hoy(14) })
    const ids = p.actividades.filter((a) => a.tipo === 'leccion').map((a) => a.leccionId)
    expect(ids).not.toContain('etica-1')
    expect(ids).toContain('capitales-1')
  })
  it('incluye repaso rápido si hay vencidas y respeta el presupuesto ligero', () => {
    const p = planDeHoy({ config: cfg({ modo: 'ligero', minutosDia: 50, diasSemana: 5 }), perfil: vacioPerfil(), lecciones, ahora: hoy(14), vencidas: 30 })
    expect(p.actividades.map((a) => a.tipo)).toEqual(['leccion', 'repaso-rapido'])
    expect(p.totalMin).toBeLessThanOrEqual(50)
  })
  it('sin lecciones pendientes ni cupo, solo práctica', () => {
    const p = planDeHoy({ config: cfg(), perfil: vacioPerfil(), lecciones: [], ahora: hoy(14) })
    expect(p.actividades).toHaveLength(1)
    expect(p.actividades[0]).toMatchObject({ tipo: 'practica', area: 'etica', minutos: 150, preguntas: 100 })
  })
  it('una lección que no cabe en el presupuesto se omite', () => {
    const largas = lecciones.map((l) => ({ ...l, duracionMin: 200 }))
    const p = planDeHoy({ config: cfg(), perfil: vacioPerfil(), lecciones: largas, ahora: hoy(14) })
    expect(p.actividades.map((a) => a.tipo)).toEqual(['practica'])
  })
  it('día de descanso, examen hoy y examen pasado', () => {
    // 2026-10-18 es domingo, fuera de los 6 días.
    const d = planDeHoy({ config: cfg(), perfil: vacioPerfil(), lecciones, ahora: hoy(18) })
    expect(d).toMatchObject({ esDiaDeEstudio: false, actividades: [] })
    expect(planDeHoy({ config: cfg({ fechaExamen: '2026-10-14' }), perfil: vacioPerfil(), lecciones, ahora: hoy(14) }).esDiaDeEstudio).toBe(false)
    expect(planDeHoy({ config: cfg({ fechaExamen: '2026-10-01' }), perfil: vacioPerfil(), lecciones, ahora: hoy(14) }).nota).toMatch(/pasó/)
  })
  it('la víspera solo trae un repaso ligero, incluso en día de descanso', () => {
    const p = planDeHoy({ config: cfg({ fechaExamen: '2026-10-19' }), perfil: vacioPerfil(), lecciones, ahora: hoy(18) })
    expect(p.actividades).toEqual([expect.objectContaining({ tipo: 'repaso-rapido', minutos: 20 })])
    expect(planDeHoy({ config: cfg({ fechaExamen: '2026-10-19', minutosDia: 10 }), perfil: vacioPerfil(), lecciones, ahora: hoy(18) }).totalMin).toBe(10)
  })
  it('simulacro por módulo semanal el último día de estudio, sobre el área obligatoria más débil', () => {
    // 2026-10-17 es sábado, último día del patrón de 6 días.
    const p = planDeHoy({ config: cfg(), perfil: vacioPerfil(), lecciones, ahora: hoy(17), vencidas: 10 })
    const sim = p.actividades.find((a) => a.tipo === 'simulacro')!
    expect(sim).toMatchObject({ simulacro: 'modulo', area: 'etica', minutos: 25 })
    expect(p.actividades.some((a) => a.tipo === 'leccion')).toBe(false)
    expect(p.actividades.at(-1)).toBe(sim)
    expect(p.totalMin).toBeLessThanOrEqual(150)
  })
  it('en los últimos 10 días hay simulacro integral cada tres días si cabe', () => {
    const c = cfg({ fechaExamen: '2026-10-24', minutosDia: 300 })
    const p = planDeHoy({ config: c, perfil: vacioPerfil(), lecciones, ahora: hoy(14) })
    expect(p.actividades.find((a) => a.tipo === 'simulacro')).toMatchObject({ simulacro: 'integral', minutos: 258 })
    expect(p.totalMin).toBeLessThanOrEqual(300)
    const sin = planDeHoy({ config: c, perfil: vacioPerfil(), lecciones, ahora: hoy(15) })
    expect(sin.actividades.some((a) => a.tipo === 'simulacro')).toBe(false)
  })
  it('si el integral no cabe se sustituye por uno más corto y se indica', () => {
    const p = planDeHoy({ config: cfg({ fechaExamen: '2026-10-24' }), perfil: vacioPerfil(), lecciones, ahora: hoy(14) })
    expect(p.actividades.find((a) => a.tipo === 'simulacro')).toMatchObject({ simulacro: 'modular-extraordinario', sustituyeA: 'integral', minutos: 117 })
    const ligero = planDeHoy({ config: cfg({ fechaExamen: '2026-10-24', minutosDia: 50 }), perfil: vacioPerfil(), lecciones, ahora: hoy(14) })
    expect(ligero.actividades.find((a) => a.tipo === 'simulacro')).toMatchObject({ simulacro: 'rapido', sustituyeA: 'integral' })
    const nada = planDeHoy({ config: cfg({ fechaExamen: '2026-10-24', minutosDia: 20 }), perfil: vacioPerfil(), lecciones, ahora: hoy(14) })
    expect(nada.actividades.some((a) => a.tipo === 'simulacro')).toBe(false)
  })
  it('el módulo semanal cae al rápido y luego a nada si no cabe', () => {
    const c = cfg({ minutosDia: 40, diasSemana: 6 })
    const p = planDeHoy({ config: c, perfil: vacioPerfil(), lecciones, ahora: hoy(17) })
    expect(p.actividades.find((a) => a.tipo === 'simulacro')).toMatchObject({ simulacro: 'modulo' })
    const corto = planDeHoy({ config: cfg({ minutosDia: 20 }), perfil: vacioPerfil(), lecciones, ahora: hoy(17) })
    expect(corto.actividades.some((a) => a.tipo === 'simulacro')).toBe(false)
  })
})

describe('repasos', () => {
  it('repasoRapido prioriza vencidas, débiles y obligatorias', () => {
    const perfil = calcularPerfil({ intentos: [...intentosArea('deuda', 1, 8), ...intentosArea('fondos', 8, 8)], taxonomia: tax, ahora: hoy(14) })
    const tarjetas = [
      { id: 't1', area: 'fondos' as const, subtemaId: 'fondos.s' },
      { id: 't2', area: 'deuda' as const, subtemaId: 'deuda.s', peso: 0.9 },
      { id: 't3', area: 'servicios' as const },
      { id: 't4', area: 'etica' as const },
      { id: 't5', area: 'fondos' as const }
    ]
    const r = repasoRapido({ perfil, tarjetas, vencidas: ['t3'], n: 3 })
    expect(r.tarjetas.map((t) => t.id)).toEqual(['t3', 't2', 't4'])
    expect(r.minutos).toBe(10)
    expect(r.preguntasControl).toBe(3)
    expect(repasoRapido({ perfil, tarjetas, vencidas: [], n: 0 }).tarjetas).toEqual([])
  })
  it('repasoRapido escala minutos y preguntas de control', () => {
    const tarjetas = Array.from({ length: 40 }, (_, k) => ({ id: `t${k}`, area: 'etica' as const }))
    expect(repasoRapido({ perfil: vacioPerfil(), tarjetas, vencidas: [], n: 40 })).toMatchObject({ minutos: 20, preguntasControl: 5 })
    expect(repasoRapido({ perfil: vacioPerfil(), tarjetas, vencidas: [], n: 10 })).toMatchObject({ minutos: 10, preguntasControl: 4 })
  })
  it('repasoCompleto sigue el orden del manual y luego orden', () => {
    const l = [
      { area: 'analisis' as const, orden: 1, id: 'a1' },
      { area: 'deuda' as const, orden: 2, id: 'd2' },
      { area: 'deuda' as const, orden: 1, id: 'd1' },
      { area: 'etica' as const, orden: 5, id: 'e5' },
      { area: 'fondos' as const, orden: 1, id: 'f1' }
    ]
    expect(repasoCompleto(l).map((x) => x.id)).toEqual(['e5', 'd1', 'd2', 'f1', 'a1'])
    expect(repasoCompleto(l, { obligatoriasPrimero: true }).map((x) => x.id)).toEqual(['e5', 'd1', 'd2', 'f1', 'a1'])
    expect(repasoCompleto([{ area: 'servicios' as const, orden: 1 }, { area: 'deuda' as const, orden: 1 }, { area: 'deuda' as const, orden: 1 }], { obligatoriasPrimero: true }).map((x) => x.area)).toEqual(['deuda', 'deuda', 'servicios'])
  })
})
