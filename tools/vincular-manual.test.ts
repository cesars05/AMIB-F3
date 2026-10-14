import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Taxonomia } from '../app/src/core/contenido'
import { leerDocx } from './docx'
import { parsearManual, type SeccionManual } from './parse-manual'
import { parsearTemario } from './parse-temario'
import { DOC_MANUAL_AMIB, DOC_TEMARIO, RAIZ } from './rutas'
import { AREA_DE_CAPITULO, bandaDe, marcarExclusivoFig3, UMBRAL_ALTA, UMBRAL_VINCULO, vincularObjetivos, type Vinculo } from './vincular-manual'

// ─── Unitarias con una taxonomía chica ───────────────────────────────────────

const objetivo = (id: string, texto: string) => ({ id, texto, verbo: 'identificar', tipo: 'teoria' as const, exclusivoFig3: false })
const areaVacia = (area: string) => ({ area, temas: [{ id: `${area}.t`, nombre: 'Tema', subtemas: [{ id: `${area}.t.s`, nombre: 'Sub', objetivos: [objetivo(`${area}.t.s.o99`, 'Identificar un concepto cualquiera sin relación alguna')] }] }] })
const AREAS = ['etica', 'servicios', 'normativo', 'matematicas', 'capitales', 'deuda', 'fondos', 'derivados', 'analisis']
const taxMini = (deuda: ReturnType<typeof objetivo>[]): Taxonomia =>
  ({
    fuente: 'x',
    generado: 'y',
    areas: AREAS.map((a) => (a === 'deuda' ? { area: a, temas: [{ id: 'deuda.t', nombre: 'Tema', subtemas: [{ id: 'deuda.t.s', nombre: 'Sub', objetivos: deuda }] }] } : areaVacia(a)))
  }) as unknown as Taxonomia

const sec = (titulo: string, extra: Partial<SeccionManual> = {}): SeccionManual => ({
  capitulo: 6,
  numero: '6.1.1',
  numeroOriginal: '6.1.1',
  correccion: 'ninguna',
  titulo,
  origen: 'encabezado',
  paginas: { inicio: 1, fin: 1 },
  texto: '',
  exclusivoFig3: false,
  fig3Parcial: false,
  ...extra
})

describe('vincularObjetivos (taxonomía mínima)', () => {
  const tax = taxMini([
    objetivo('deuda.t.s.o01', 'Identificar las características del mercado de deuda.'),
    objetivo('deuda.t.s.o02', 'Reconocer el procedimiento para determinar la tasa de interés interbancaria de equilibrio (TIIE).'),
    objetivo('deuda.t.s.o03', 'Calcular el precio limpio, precio sucio y cupón de los instrumentos que cotizan a sobretasa.')
  ])

  it('elige el objetivo más parecido, con confianza alta si el texto es casi igual', () => {
    const [v] = vincularObjetivos([sec('Identificar las caracteristicas del mercado de deuda.')], tax)
    expect(v).toMatchObject({ objetivoId: 'deuda.t.s.o01', candidatoId: 'deuda.t.s.o01' })
    expect(v!.confianza).toBeGreaterThanOrEqual(UMBRAL_ALTA)
  })
  it('tolera un encabezado truncado y con errores de OCR', () => {
    const [v] = vincularObjetivos([sec('Recanocer el procedimiento para determinar la TIIE')], tax)
    expect(v!.objetivoId).toBe('deuda.t.s.o02')
  })
  it('deja objetivoId en null bajo el umbral pero conserva el candidato y el puntaje', () => {
    const [v] = vincularObjetivos([sec('Conceptos Básicos')], tax)
    expect(v!.confianza).toBeLessThan(UMBRAL_VINCULO)
    expect(v!.objetivoId).toBeNull()
    const [w] = vincularObjetivos([sec('Identificar el precio limpio de un cupón')], taxMini([objetivo('deuda.t.s.o03', 'Calcular el precio limpio, precio sucio y cupón de los instrumentos que cotizan a sobretasa.')]))
    expect(w!.candidatoId).toBe('deuda.t.s.o03')
  })
  it('solo compara contra objetivos del área del capítulo y el formulario no se vincula', () => {
    const [de6] = vincularObjetivos([sec('Identificar un concepto cualquiera sin relación alguna')], tax)
    expect(de6!.candidatoId).not.toBe('deuda.t.s.o99')
    const [de1] = vincularObjetivos([sec('Identificar un concepto cualquiera sin relación alguna', { capitulo: 1 })], tax)
    expect(de1).toMatchObject({ objetivoId: 'etica.t.s.o99' })
    const [f] = vincularObjetivos([sec('Formulario', { capitulo: 10, numero: '10' })], tax)
    expect(f).toMatchObject({ objetivoId: null, confianza: 0 })
  })
  it('es determinista y en empate gana el primero del temario', () => {
    const gemelos = taxMini([objetivo('deuda.t.s.o01', 'Identificar las operaciones en directo.'), objetivo('deuda.t.s.o02', 'Identificar las operaciones en directo.')])
    expect(vincularObjetivos([sec('Identificar las operaciones en directo.')], gemelos)[0]!.objetivoId).toBe('deuda.t.s.o01')
  })
})

describe('bandaDe', () => {
  it('alta ≥ 0.8, media entre el umbral de vínculo y 0.8, baja debajo', () => {
    expect([1, 0.8, 0.79, UMBRAL_VINCULO, UMBRAL_VINCULO - 0.01, 0].map(bandaDe)).toEqual(['alta', 'alta', 'media', 'media', 'baja', 'baja'])
  })
})

describe('marcarExclusivoFig3 (taxonomía mínima)', () => {
  const tax = taxMini([objetivo('deuda.t.s.o01', 'Identificar A'), objetivo('deuda.t.s.o02', 'Identificar B'), objetivo('deuda.t.s.o03', 'Identificar C')])
  const v = (objetivoId: string | null, confianza: number): Vinculo => ({ objetivoId, confianza, candidatoId: objetivoId ?? '', segundo: 0 })
  const ids = (t: Taxonomia) => t.areas.flatMap((a) => a.temas.flatMap((x) => x.subtemas.flatMap((s) => s.objetivos))).filter((o) => o.exclusivoFig3).map((o) => o.id)

  it('marca solo los objetivos vinculados a una sección exclusiva de Fig. 3, sin mutar la taxonomía original', () => {
    const r = marcarExclusivoFig3(tax, [sec('a', { exclusivoFig3: true }), sec('b'), sec('c', { exclusivoFig3: true })], [v('deuda.t.s.o01', 0.9), v('deuda.t.s.o02', 0.9), v(null, 0.3)])
    expect(ids(r)).toEqual(['deuda.t.s.o01'])
    expect(ids(tax)).toEqual([])
  })
  it('si dos secciones reclaman el mismo objetivo gana la de mayor confianza', () => {
    const a = marcarExclusivoFig3(tax, [sec('a', { exclusivoFig3: true }), sec('b')], [v('deuda.t.s.o01', 0.6), v('deuda.t.s.o01', 0.95)])
    expect(ids(a)).toEqual([])
    const b = marcarExclusivoFig3(tax, [sec('a', { exclusivoFig3: true }), sec('b')], [v('deuda.t.s.o01', 0.95), v('deuda.t.s.o01', 0.6)])
    expect(ids(b)).toEqual(['deuda.t.s.o01'])
  })
})

// ─── El manual y el temario reales ───────────────────────────────────────────

describe('vínculo del manual real con el temario real', () => {
  let tax: Taxonomia
  let secciones: SeccionManual[]
  let vinculos: Vinculo[]
  const textoDe = (id: string | null) => {
    for (const a of tax.areas) for (const t of a.temas) for (const s of t.subtemas) for (const o of s.objetivos) if (o.id === id) return o.texto
    return undefined
  }
  const vinculoDe = (numero: string) => vinculos[secciones.findIndex((s) => s.numero === numero)]!

  beforeAll(async () => {
    tax = parsearTemario(await leerDocx(readFileSync(join(RAIZ, DOC_TEMARIO))), DOC_TEMARIO, '2026-10-14')
    secciones = parsearManual(readFileSync(join(RAIZ, DOC_MANUAL_AMIB), 'utf8')).capitulos.flatMap((c) => c.secciones)
    vinculos = vincularObjetivos(secciones, tax)
  }, 60_000)

  it('devuelve un vínculo por sección, en el mismo orden', () => {
    expect(vinculos).toHaveLength(secciones.length)
  })

  it('6.1.2 (casi idéntico al temario) queda con confianza alta; 6.1.1 no existe en el temario: cae en "Elementos Básicos" con confianza media', () => {
    expect(textoDe(vinculoDe('6.1.2').objetivoId)).toBe('Identificar las características del mercado de deuda.')
    expect(vinculoDe('6.1.2').confianza).toBeGreaterThanOrEqual(UMBRAL_ALTA)
    const v = vinculoDe('6.1.1')
    expect(v.objetivoId).toContain('deuda.titulos-de-deuda-i.elementos-basicos.')
    expect(bandaDe(v.confianza)).toBe('media')
  })

  it('secciones conocidas llegan a su objetivo', () => {
    expect(textoDe(vinculoDe('6.4.1').objetivoId)).toMatch(/^Calcular el precio, tasa de rendimiento, tasa de descuento y plazo/)
    expect(textoDe(vinculoDe('6.3.7').objetivoId)).toMatch(/préstamo de valores/)
    expect(textoDe(vinculoDe('8.3.8').objetivoId)).toMatch(/red de seguridad de Asigna/)
    expect(textoDe(vinculoDe('2.4.1').objetivoId)).toMatch(/comisiones/)
    expect(textoDe(vinculoDe('9.2.13').objetivoId)).toMatch(/política monetaria/)
    expect(textoDe(vinculoDe('9.7.3').objetivoId)).toMatch(/Teoría de Dow/)
  })

  it('el objetivo vinculado siempre es del área del capítulo', () => {
    for (const [k, s] of secciones.entries()) {
      const id = vinculos[k]!.objetivoId
      if (!id) continue
      expect(id.startsWith(`${AREA_DE_CAPITULO[s.capitulo]}.`), `${s.numero} → ${id}`).toBe(true)
    }
  })

  it('bandas de confianza (alta / media / baja) y sin vínculo = baja', () => {
    const cuenta = { alta: 0, media: 0, baja: 0 }
    for (const v of vinculos) cuenta[bandaDe(v.confianza)]++
    expect(cuenta).toEqual({ alta: 323, media: 57, baja: 33 })
    expect(vinculos.filter((v) => v.objetivoId === null)).toHaveLength(33)
    // El formulario (cap. 10) no tiene área: sin vínculo.
    expect(vinculos.at(-1)).toMatchObject({ objetivoId: null, confianza: 0 })
  })

  it('Fig. 3: marca 25 objetivos del temario, entre ellos los de 9.4 y la red de seguridad de Asigna', () => {
    const r = marcarExclusivoFig3(tax, secciones, vinculos)
    const marcados = r.areas.flatMap((a) => a.temas.flatMap((t) => t.subtemas.flatMap((s) => s.objetivos))).filter((o) => o.exclusivoFig3)
    expect(marcados).toHaveLength(25)
    expect(marcados.some((o) => /red de seguridad de Asigna/.test(o.texto))).toBe(true)
    expect(marcados.some((o) => /ciclo económico/i.test(o.texto))).toBe(true)
    // La taxonomía sin marcar sigue en falso.
    expect(tax.areas.flatMap((a) => a.temas.flatMap((t) => t.subtemas.flatMap((s) => s.objetivos))).some((o) => o.exclusivoFig3)).toBe(false)
    // Un objetivo claramente no exclusivo sigue en falso.
    expect(marcados.some((o) => /mercado de deuda/.test(o.texto))).toBe(false)
  })

  it('es determinista', () => {
    expect(JSON.stringify(vincularObjetivos(secciones, tax))).toBe(JSON.stringify(vinculos))
  })
})
