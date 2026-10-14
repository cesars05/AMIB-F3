import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { parsearManual, quitarMarcadorFig3, TEMAS_POR_CAPITULO, type ManualParseado, type SeccionManual } from './parse-manual'
import { DOC_MANUAL_AMIB, RAIZ } from './rutas'

// ─── Fixture mínima: reproduce las rarezas del OCR en pocas líneas ───────────

const MD_MINI = `# AMIB 1

<!-- page 1 -->
CONTENIDO
1.1.1. Esto es el índice y no cuenta

<!-- page 5 -->
## Capítulo 6. TÍTULOS DE DEUDA =

6.14. ELEMENTOS BÁSICOS.

#### 6.1.1. Identificar el concepto de mercado de deuda.

Definición uno. Aquí se menciona 6.1.9 Identificar algo en mitad de la línea.

<!-- page 6 -->
Más cuerpo.

6,1.2. Identificar las características del mercado de deuda.

Cuerpo dos con $10.50 y 5.72%.

#### 5.1.3. identificar el concepto de una tasa de referencia (INFORMACIÓN FIGURA 3)*

Cuerpo tres.

#### 6.1.4. Calcular el precio limpio de un bono de tasa fija con una frase larga que sigue

en la siguiente línea del encabezado.

Cuerpo cuatro.

6.2. CARACTERÍSTICAS DE LOS TÍTULOS DE DEUDA. (INFORMACIÓN FIGURA 3)*

#### 6.2.1. Identificar las características de los títulos gubernamentales

Cuerpo cinco.

Identificar el perfil de un participante en una opción. (INFORMACIÓN FIGURA 3)*

<!-- page 7 -->
6.3. REPASO DEL CAPÍTULO

1.
¿Qué es un reporto?
a) Un contrato
b) Un préstamo
c) Una subasta
d) Un bono

<!-- page 8 -->
## Capítulo 10. FORMULARIO

Fórmulas de la calculadora.
`

describe('parsearManual (fixture mínima)', () => {
  let m: ManualParseado
  beforeAll(() => {
    m = parsearManual(MD_MINI)
  })

  it('ignora el índice anterior al primer capítulo y separa los capítulos', () => {
    expect(m.capitulos.map((c) => c.numero)).toEqual([6, 10])
  })

  it('el capítulo 10 (formulario) es una sola sección con todo el texto', () => {
    const f = m.capitulos[1]!.secciones
    expect(f).toHaveLength(1)
    expect(f[0]).toMatchObject({ numero: '10', origen: 'capitulo', paginas: { inicio: 8, fin: 8 } })
    expect(f[0]!.texto).toContain('Fórmulas de la calculadora')
  })

  it('detecta los encabezados #### y la línea suelta con numeración, pero no una mención a mitad de línea', () => {
    const s = m.capitulos[0]!.secciones
    expect(s.map((x) => x.numero)).toEqual(['6.1.1', '6.1.2', '6.1.3', '6.1.4', '6.2.1'])
    expect(s.map((x) => x.origen)).toEqual(['encabezado', 'recuperado', 'encabezado', 'encabezado', 'encabezado'])
    expect(s[0]!.texto).toContain('6.1.9 Identificar algo en mitad de la línea')
  })

  it('conserva el número impreso y clasifica la corrección', () => {
    const s = m.capitulos[0]!.secciones
    expect(s[1]).toMatchObject({ numeroOriginal: '6,1.2', numero: '6.1.2', correccion: 'formato' })
    expect(s[2]).toMatchObject({ numeroOriginal: '5.1.3', numero: '6.1.3', correccion: 'formato' })
    expect(s[0]).toMatchObject({ numeroOriginal: '6.1.1', correccion: 'ninguna' })
  })

  it('el cuerpo se corta en el siguiente encabezado o tema y las páginas son las de los marcadores', () => {
    const s = m.capitulos[0]!.secciones
    expect(s[0]!.paginas).toEqual({ inicio: 5, fin: 6 })
    expect(s[0]!.texto.startsWith('Definición uno.')).toBe(true)
    expect(s[0]!.texto).not.toContain('6,1.2')
    expect(s[3]!.texto).toBe('Cuerpo cuatro.')
    expect(s[3]!.texto).not.toContain('CARACTERÍSTICAS')
  })

  it('une el encabezado que continúa en el párrafo siguiente (en minúscula)', () => {
    expect(m.capitulos[0]!.secciones[3]!.titulo).toBe('Calcular el precio limpio de un bono de tasa fija con una frase larga que sigue en la siguiente línea del encabezado.')
  })

  it('Fig. 3: marcador en el encabezado de la sección, en el del tema, y parcial en el cuerpo', () => {
    const s = m.capitulos[0]!.secciones
    expect(s.map((x) => x.exclusivoFig3)).toEqual([false, false, true, false, true])
    expect(s[2]!.titulo).not.toMatch(/FIGURA/i)
    // 6.2.1 es exclusiva por el tema; la línea del cuerpo no la vuelve "parcial".
    expect(s[4]).toMatchObject({ exclusivoFig3: true, fig3Parcial: false })
    expect(s.every((x) => !/INFORMACI/i.test(x.titulo))).toBe(true)
  })

  it('el repaso no entra en el cuerpo de la última sección y se entrega aparte con su página', () => {
    const c = m.capitulos[0]!
    expect(c.secciones[4]!.texto).not.toContain('reporto')
    expect(c.repaso?.titulo).toBe('REPASO DEL CAPÍTULO')
    expect(c.repaso?.lineas[0]).toEqual({ texto: '1.', pagina: 7 })
    expect(c.repaso?.lineas.map((l) => l.texto)).toContain('a) Un contrato')
  })
})

describe('quitarMarcadorFig3', () => {
  it('quita el marcador con sus variantes de OCR', () => {
    expect(quitarMarcadorFig3('Notas (INFORMACIÓN FIGURA 3)*')).toEqual({ texto: 'Notas', marcado: true })
    expect(quitarMarcadorFig3('Componentes. [INFORMACIÓN FIGURA 3)"')).toEqual({ texto: 'Componentes.', marcado: true })
    expect(quitarMarcadorFig3('Sin marcador')).toEqual({ texto: 'Sin marcador', marcado: false })
  })
})

// ─── Numeración: casos reales de OCR ─────────────────────────────────────────

const numerar = (md: string) => parsearManual(md).capitulos.flatMap((c) => c.secciones.map((s) => [s.numeroOriginal, s.numero, s.correccion] as const))
const cap = (n: number, cuerpo: string) => `<!-- page 1 -->\n## Capítulo ${n}. X\n\n${cuerpo}\n`

describe('normalización de la numeración', () => {
  it('1.14.4 → 1.1.4 cuando la secuencia lo respalda (no es 1.4.4: vendría 1.2.x después)', () => {
    const md = cap(1, '#### 1.1.2. Conceptos básicos\n\n#### 1.14.4. Importancia y utilidad de la Ética.\n\n#### 1.4.5. Características de los principios.\n\n#### 1.2.2. Identificar la importancia del capital humano.')
    expect(numerar(md).map((x) => x[1])).toEqual(['1.1.2', '1.1.4', '1.1.5', '1.2.2'])
  })

  it('3.0.4 → 3.9.4 y 3.42.3 → 3.12.3 (dígito corregido con vecinos coherentes)', () => {
    const md = cap(3, '#### 3.9.3. Identificar los requisitos de inscripción de valores.\n\n#### 3.0.4. Señalar las causas de cancelación del registro.\n\n#### 3.9.5. Distinguir requisitos de cancelación.\n\n#### 3.12.2. Reconocer el objetivo de las políticas.\n\n#### 3.42.3. identificar las obligaciones de los promotores.\n\n#### 3.13.1. Diferenciar la manipulación de mercado.')
    const n = numerar(md)
    expect(n.map((x) => x[1])).toEqual(['3.9.3', '3.9.4', '3.9.5', '3.12.2', '3.12.3', '3.13.1'])
    expect(n[1]![2]).toBe('secuencia')
    expect(n[4]![2]).toBe('secuencia')
  })

  it('el dígito del capítulo sale del encabezado ## y no del OCR (84.1.7, 92.5.8, 2.10.13 en el cap. 3)', () => {
    expect(numerar(cap(4, '#### 4.1.6. Calcular el rendimiento efectivo.\n\n#### 84.1.7. Calcular rendimientos a tasa real.\n\n#### 4.1.8. Interpretar la estructura de tasas.')).map((x) => x.slice(1))).toEqual([
      ['4.1.6', 'ninguna'],
      ['4.1.7', 'formato'],
      ['4.1.8', 'ninguna']
    ])
    expect(numerar(cap(3, '#### 3.10.12. Reconocer las actividades de las Contrapartes.\n\n#### 2.10.13. Reconocer los servicios de las contrapartes.'))[1]).toEqual(['2.10.13', '3.10.13', 'formato'])
  })

  it('letras que parecen dígitos (B.3.8 = 8.3.8) y comas como separador solo se aceptan en líneas sueltas del capítulo', () => {
    const md = cap(8, '#### 8.3.7. Identificar la liquidación extraordinaria.\n\nB.3.8. Identificar cómo funciona la red de seguridad de Asigna. (INFORMACIÓN FIGURA 3)*\n\n#### 8.3.9. Identificar el fondo de compensación.\n\n3,5.1. Identificar un concepto de otro capítulo cualquiera.')
    const m = parsearManual(md)
    const s = m.capitulos[0]!.secciones
    expect(s.map((x) => x.numero)).toEqual(['8.3.7', '8.3.8', '8.3.9'])
    expect(s[1]).toMatchObject({ numeroOriginal: 'B.3.8', correccion: 'formato', exclusivoFig3: true, origen: 'recuperado' })
    // "3,5.1." empieza con otro capítulo: no es un encabezado de este capítulo, queda en el cuerpo.
    expect(s[2]!.texto).toContain('3,5.1. Identificar')
  })

  it('un número repetido o desordenado nunca produce dos secciones con el mismo número y se marca dudosa', () => {
    const md = cap(8, '#### 8.6.9. Identificar el bull spread.\n\n#### 8.6.10. Identificar butterfly, straddle y strangle.\n\n#### 8.6.10. Identificar la formación de Ratio Spread Call y Put.')
    const n = numerar(md)
    expect(n.map((x) => x[1])).toEqual(['8.6.9', '8.6.10', '8.6.11'])
    expect(n[2]![2]).toBe('dudosa')
  })

  it('una línea suelta con numeración fuera de secuencia y sin verbo se descarta; con verbo se conserva', () => {
    const md = cap(5, '#### 5.3.1. Calcular el rendimiento efectivo de una acción.\n\n5.1.4. Texto de tabla sin verbo alguno aquí\n\n#### 5.3.2. Definir el concepto de Cruce.')
    expect(numerar(md).map((x) => x[1])).toEqual(['5.3.1', '5.3.2'])
  })
})

// ─── El manual real ──────────────────────────────────────────────────────────

describe('parsearManual (AMIB_1_completo.md real)', () => {
  let m: ManualParseado
  let secciones: SeccionManual[]
  beforeAll(() => {
    m = parsearManual(readFileSync(join(RAIZ, DOC_MANUAL_AMIB), 'utf8'))
    secciones = m.capitulos.flatMap((c) => c.secciones)
  }, 60_000)
  const sec = (numero: string) => secciones.find((s) => s.numero === numero)

  it('tiene 10 capítulos, en orden, con título canónico', () => {
    expect(m.capitulos.map((c) => c.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(m.capitulos[5]!.titulo).toBe('Títulos de Deuda')
    expect(m.capitulos[9]!.titulo).toBe('Formulario')
  })

  it('secciones por capítulo (351 con #### + 61 recuperadas + el formulario)', () => {
    expect(m.capitulos.map((c) => c.secciones.length)).toEqual([20, 28, 74, 41, 39, 32, 41, 77, 60, 1])
    expect(secciones).toHaveLength(413)
    expect(secciones.filter((s) => s.origen === 'encabezado')).toHaveLength(351)
    expect(secciones.filter((s) => s.origen === 'recuperado')).toHaveLength(61)
  })

  it('el número normalizado es único por capítulo y está dentro del rango de temas', () => {
    const vistos = new Set<string>()
    for (const s of secciones.filter((x) => x.origen !== 'capitulo')) {
      expect(vistos.has(s.numero), `número repetido ${s.numero}`).toBe(false)
      vistos.add(s.numero)
      const [c, t, n] = s.numero.split('.').map(Number) as [number, number, number]
      expect(c).toBe(s.capitulo)
      expect(t).toBeGreaterThanOrEqual(1)
      expect(t).toBeLessThanOrEqual(TEMAS_POR_CAPITULO[c]!)
      expect(n).toBeGreaterThanOrEqual(1)
    }
  })

  it('dentro de cada capítulo los números crecen, salvo las lecturas dudosas', () => {
    for (const c of m.capitulos) {
      const firmes = c.secciones.filter((s) => s.correccion !== 'dudosa' && s.origen !== 'capitulo')
      for (let i = 1; i < firmes.length; i++) {
        const [, t0, n0] = firmes[i - 1]!.numero.split('.').map(Number) as [number, number, number]
        const [, t1, n1] = firmes[i]!.numero.split('.').map(Number) as [number, number, number]
        expect(t1 > t0 || (t1 === t0 && n1 > n0), `${firmes[i - 1]!.numero} → ${firmes[i]!.numero}`).toBe(true)
      }
    }
  })

  it('las páginas son monótonas: inicio ≤ fin y nunca retroceden respecto de la sección anterior', () => {
    let previa = 0
    for (const s of secciones) {
      expect(s.paginas.inicio).toBeLessThanOrEqual(s.paginas.fin)
      expect(s.paginas.inicio).toBeGreaterThanOrEqual(previa)
      previa = s.paginas.inicio
    }
    expect(secciones[0]!.paginas.inicio).toBe(5)
    // La página 360 es un marcador sin texto: la última con contenido es la 359.
    expect(secciones.at(-1)!.paginas.fin).toBe(359)
  })

  it('casi todas las secciones traen cuerpo (solo 3.6.5 "cuenta global" es casi vacía)', () => {
    expect(secciones.filter((s) => s.texto.length < 30).map((s) => s.numero)).toEqual(['3.6.5'])
  })

  it('6.1.1 "Identificar el concepto de mercado de deuda" y su cuerpo', () => {
    const s = sec('6.1.1')!
    expect(s.titulo).toBe('Identificar el concepto de mercado de deuda.')
    expect(s.paginas).toEqual({ inicio: 183, fin: 183 })
    expect(s.texto.startsWith('Definición El Mercado de Títulos de Deuda')).toBe(true)
    expect(s.texto).not.toContain('Identificar las características del mercado de deuda')
  })

  it('recupera encabezados perdidos: 6.1.14 (proveedor de precios), 6.2.3 y 3.5.1', () => {
    expect(sec('6.2.3')).toMatchObject({ origen: 'recuperado', numeroOriginal: '6.2.3' })
    expect(sec('3.5.1')).toMatchObject({ origen: 'recuperado', numeroOriginal: '3,5.1' })
    expect(secciones.some((s) => s.capitulo === 6 && /proveedor de precios/i.test(s.titulo))).toBe(true)
  })

  it('numeración rota conocida: 1.14.4 → 1.1.4 (dudosa), 3.0.4 → 3.9.4, 84.1.7 → 4.1.7, 9.2.41 → 9.2.11', () => {
    expect(secciones.find((s) => s.numeroOriginal === '1.14.4')).toMatchObject({ numero: '1.1.4', correccion: 'dudosa' })
    expect(secciones.find((s) => s.numeroOriginal === '3.0.4')).toMatchObject({ numero: '3.9.4', correccion: 'secuencia' })
    expect(secciones.find((s) => s.numeroOriginal === '84.1.7')).toMatchObject({ numero: '4.1.7', correccion: 'formato' })
    expect(secciones.find((s) => s.numeroOriginal === '9.2.41')).toMatchObject({ numero: '9.2.11', correccion: 'secuencia' })
  })

  it('Fig. 3: temas completos (3.15, 8.8, 8.11, 9.4, 9.6) y secciones marcadas (9.2.x, 8.3.8)', () => {
    const fig3 = secciones.filter((s) => s.exclusivoFig3).map((s) => s.numero)
    expect(fig3).toHaveLength(27)
    for (const n of ['3.15.1', '3.15.4', '8.8.1', '8.8.2', '8.11.1', '8.11.3', '9.4.1', '9.4.5', '9.6.2', '9.6.7', '8.3.8', '9.2.9', '9.2.10', '9.2.11', '9.2.13', '9.2.14', '9.2.15', '9.2.16']) {
      expect(fig3, n).toContain(n)
    }
    // El alcance del tema termina en el siguiente tema: 9.5 (estados financieros) y 9.7 (técnico) no son exclusivas, ni 9.2.12.
    expect(fig3.some((n) => /^9\.(5|7|8)\./.test(n))).toBe(false)
    expect(fig3).not.toContain('9.2.12')
    expect(fig3).not.toContain('8.9.1')
  })

  it('Fig. 3 parcial: subtemas sueltos dentro de 8.3.6 (liquidación diaria; impresa "8.3.65") y 8.6.2', () => {
    expect(secciones.filter((s) => s.fig3Parcial).map((s) => s.numero)).toEqual(['8.3.6', '8.6.2'])
    expect(sec('8.3.6')!.exclusivoFig3).toBe(false)
    expect(sec('8.3.6')!.texto).toContain('Calcular el monto de la liquidación diaria')
  })

  it('el marcador de Fig. 3 no queda en los títulos', () => {
    expect(secciones.some((s) => /INFORMACI.N FIGURA/i.test(s.titulo))).toBe(false)
  })

  it('cada capítulo con repaso lo entrega aparte (1–9) y el formulario no tiene', () => {
    expect(m.capitulos.map((c) => c.repaso !== null)).toEqual([true, true, true, true, true, true, true, true, true, false])
    expect(m.capitulos[5]!.repaso!.titulo).toBe('REPASO DEL CAPÍTULO')
    // El repaso del cap. 1 abre en la página 25 del PDF.
    expect(m.capitulos[0]!.repaso!.paginas.inicio).toBe(25)
  })

  it('el formulario trae su texto completo (pp. 349–359)', () => {
    const f = secciones.at(-1)!
    expect(f).toMatchObject({ capitulo: 10, numero: '10', origen: 'capitulo', paginas: { inicio: 349, fin: 359 } })
    expect(f.texto).toContain('GUÍA PARA FÓRMULAS CALCULADORA HP')
  })

  it('es determinista', () => {
    const otra = parsearManual(readFileSync(join(RAIZ, DOC_MANUAL_AMIB), 'utf8'))
    expect(JSON.stringify(otra)).toBe(JSON.stringify(m))
  }, 60_000)
})
