import { cpSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test'

/**
 * Recorrido de la app v1 con Electron real: onboarding, inicio, lección, práctica, simulacro, diagnóstico y ajustes.
 * Usa una copia del contenido real más una lección de prueba (AMIB_CONTENT_DIR), para ejercitar el visor de
 * lecciones aunque todavía no haya lecciones reales en content/lecciones.
 */
const RAIZ = join(import.meta.dirname, '..')
const CAPTURAS = join(RAIZ, 'test-results')
mkdirSync(CAPTURAS, { recursive: true })

const LECCION_ID = 'e2e.leccion-prueba'

function leccionDePrueba() {
  return {
    id: LECCION_ID,
    area: 'deuda',
    materia: 'Títulos de Deuda I',
    orden: 1,
    titulo: 'Lección de prueba: bono cupón cero',
    resumen: 'Recorre todos los tipos de bloque del visor.',
    duracionMin: 15,
    fuentes: [{ documento: 'AMIB Data/AMIB_1_completo.md', paginas: [190] }],
    laminas: [
      {
        id: 'que-es',
        titulo: '¿Qué es un CETE?',
        bloques: [
          { tipo: 'parrafo', texto: 'Los [[CETES]] son **bonos cupón cero** que se compran a descuento y pagan \\( VN = 10 \\) al vencimiento.' },
          { tipo: 'resumen', etiqueta: 'Resumen CETES', texto: 'Tu ganancia es la diferencia entre lo que pagas hoy y los $10 finales.' },
          { tipo: 'trampa', texto: 'La postura en CETES es por **tasa de descuento**, no por precio.' }
        ],
        ampliada: 'Los CETES son el ejemplo más claro de bono cupón cero en México.',
        paginas: [190]
      },
      {
        id: 'ficha',
        titulo: 'Ficha del instrumento',
        bloques: [
          { tipo: 'ficha', titulo: 'CETES', filas: [['Emisor', 'Gobierno Federal'], ['Valor nominal', '[[$10 pesos]]']] },
          { tipo: 'tabla', encabezados: ['Concepto', 'CETES', 'BONDES D'], filas: [['Valor nominal', '$10', '$100']], trampas: [[0, 2]] },
          { tipo: 'lista', items: ['Primero se convoca.', 'Después se reciben posturas.'] }
        ]
      },
      {
        id: 'formula',
        titulo: 'Fórmula en dos pasos',
        bloques: [
          {
            tipo: 'formula',
            logica: 'P = VN\\left(1 - TD\\cdot\\frac{t}{360}\\right)',
            leyenda: [['P', 'precio hoy'], ['TD', 'tasa de descuento anual']],
            valores: 'P = 10\\left(1 - 0.0452\\cdot\\frac{94}{360}\\right)',
            resultado: 'P = $9.8820'
          },
          { tipo: 'calculadora', funcion: 'PRECIO.DESCTO', entradas: [['VN', '10'], ['%TD', '4.52']], salida: ['$PR', '9.8820'] }
        ]
      },
      {
        id: 'subasta',
        titulo: 'La subasta semanal',
        bloques: [
          {
            tipo: 'pasos',
            pasos: [
              { titulo: 'Convocatoria', cuando: 'Semana anterior', texto: 'Banxico publica la convocatoria.' },
              { titulo: 'Posturas', cuando: 'Martes 11:00 h', texto: 'Se reciben posturas por monto y tasa.' }
            ]
          }
        ],
        ampliada: 'Trampa frecuente: tasa única contra tasa múltiple.'
      }
    ],
    puntosClave: ['Los CETES son cupón cero.', 'La postura es por tasa de descuento.', 'Se usa año de 360 días.'],
    practica: ['tipo.01', 'tipo.02', 'tipo.03'],
    miniExamen: ['tipo.04', 'tipo.05', 'tipo.06']
  }
}

function prepararContenido(): string {
  const dir = mkdtempSync(join(tmpdir(), 'amib-e2e-contenido-'))
  cpSync(join(RAIZ, 'content'), dir, { recursive: true })
  mkdirSync(join(dir, 'lecciones', 'deuda'), { recursive: true })
  writeFileSync(join(dir, 'lecciones', 'deuda', 'e2e-leccion-prueba.json'), JSON.stringify(leccionDePrueba()))
  return dir
}

async function lanzar(datos: string, contenido: string): Promise<{ app: ElectronApplication; win: Page; errores: string[] }> {
  const app = await electron.launch({
    args: ['.', `--user-data-dir=${datos}`, ...(process.platform === 'linux' ? ['--no-sandbox', '--disable-gpu'] : [])],
    env: { ...process.env, AMIB_CONTENT_DIR: contenido }
  })
  const win = await app.firstWindow()
  const errores: string[] = []
  win.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  win.on('console', (m) => {
    if (m.type() === 'error') errores.push(`console: ${m.text()}`)
  })
  // La ventana se muestra en 'ready-to-show'; sin esto, en CI sin pantalla la captura falla.
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isVisible() ?? false)).toBe(true)
  return { app, win, errores }
}

// Se espera a que terminen las animaciones de entrada (200 ms) para que la captura salga completa.
const captura = async (win: Page, nombre: string) => {
  await win.waitForTimeout(320)
  await win.screenshot({ path: join(CAPTURAS, `app-v1-${nombre}.png`) })
}
const irA = (win: Page, etiqueta: string) => win.getByRole('navigation', { name: 'Secciones' }).getByRole('button', { name: etiqueta, exact: true }).click()

function fechaEn(dias: number): string {
  const d = new Date(Date.now() + dias * 86400000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

test.describe.serial('app v1', () => {
  let app: ElectronApplication
  let win: Page
  let errores: string[]
  let datos: string
  let contenido: string

  test.beforeAll(async () => {
    datos = mkdtempSync(join(tmpdir(), 'amib-e2e-datos-'))
    contenido = prepararContenido()
    ;({ app, win, errores } = await lanzar(datos, contenido))
    await win.setViewportSize({ width: 1400, height: 900 }).catch(() => undefined)
  })
  test.afterAll(async () => {
    await app.close()
  })

  test('seguridad: la interfaz no tiene Node y solo expone window.amib', async () => {
    expect(await win.evaluate(() => typeof (globalThis as { require?: unknown }).require)).toBe('undefined')
    expect(await win.evaluate(() => typeof (globalThis as { process?: unknown }).process)).toBe('undefined')
    const claves = await win.evaluate(() => Object.keys((globalThis as unknown as { amib: object }).amib).sort())
    expect(claves).toEqual(['ajustes', 'contenido', 'estudio', 'info', 'intentos', 'notas', 'perfil', 'plan', 'respaldo', 'sesiones'])
  })

  test('onboarding: fecha, modo y autoevaluación llevan al inicio', async () => {
    await expect(win.getByTestId('onboarding')).toBeVisible()
    await captura(win, '01-onboarding-fecha')
    await win.getByTestId('fecha-examen').fill(fechaEn(45))
    await win.getByTestId('onb-siguiente').click()
    await expect(win.getByRole('radio', { name: /Intensivo/ })).toBeVisible()
    await captura(win, '02-onboarding-modo')
    await win.getByTestId('onb-siguiente').click()
    const etica = win.getByRole('radiogroup', { name: 'Autoevaluación de Ética' })
    await etica.getByRole('radio', { name: 'La domino' }).click()
    await win.getByRole('radiogroup', { name: 'Autoevaluación de Derivados y Riesgos' }).getByRole('radio', { name: 'No la he visto' }).click()
    await captura(win, '03-onboarding-autoevaluacion')
    await win.getByTestId('onb-terminar').click()
    await expect(win.getByRole('heading', { level: 1 })).toContainText(/Buen/)
  })

  test('inicio: indicadores, secciones y estados vacíos diseñados', async () => {
    // La zona del plan es la del centro de México: según la hora UTC del equipo, el conteo puede variar en un día.
    await expect(win.getByText(/Faltan 4[4-6] días/)).toBeVisible()
    await expect(win.getByText('Obligatorias en meta')).toBeVisible()
    await expect(win.getByText('Aún no hay datos de dominio')).toBeVisible()
    for (const s of ['hoy', 'practicar', 'diagnostico', 'simulacro', 'lecciones', 'tarjetas', 'videos', 'ajustes']) await expect(win.locator(`[data-seccion="${s}"]`)).toBeVisible()
    await expect(win.locator('[data-seccion="tarjetas"]')).toBeDisabled()
    await expect(win.locator('[data-seccion="videos"]')).toBeDisabled()
    // Con la autoevaluación ya hay una probabilidad estimada.
    await expect(win.getByText('estimada con tu autoevaluación')).toBeVisible()
    await captura(win, '04-inicio-claro-vacio')
  })

  test('sesión de hoy: lista las actividades del plan', async () => {
    await win.locator('[data-seccion="hoy"]').click()
    await expect(win.getByRole('heading', { name: 'Sesión de hoy', level: 1 })).toBeVisible()
    await expect(win.locator('.actividad').first()).toBeVisible()
    await captura(win, '05-sesion-de-hoy')
  })

  test('lecciones: la lista, el visor con los 4 pasos y el mini examen', async () => {
    await irA(win, 'Lecciones')
    const fila = win.locator(`[data-leccion="${LECCION_ID}"]`)
    await expect(fila).toBeVisible()
    await expect(fila).toContainText('Sin ver')
    await captura(win, '06-lecciones-lista')
    await fila.click()

    // Etapa 1: láminas con todos los bloques.
    await expect(win.getByRole('heading', { name: '¿Qué es un CETE?' })).toBeVisible()
    await expect(win.locator('.lamina .t', { hasText: 'CETES' })).toBeVisible()
    await expect(win.locator('.lamina .katex').first()).toBeVisible()
    await expect(win.getByText('Trampa de examen:')).toBeVisible()
    await captura(win, '07-leccion-lamina-1')

    // Nota por lámina: se guarda sola y se conserva al volver.
    await win.getByTestId('nota-texto').fill('Mi nota sobre CETES')
    await expect(win.getByTestId('nota-estado')).toHaveText('Guardado')
    // Las flechas no navegan mientras se escribe: hay que salir del campo de la nota.
    await win.getByTestId('nota-texto').blur()
    await win.keyboard.press('ArrowRight')
    await expect(win.getByRole('heading', { name: 'Ficha del instrumento' })).toBeVisible()
    await expect(win.locator('.ficha')).toBeVisible()
    await expect(win.locator('td.trampa')).toHaveCount(1)
    await captura(win, '08-leccion-lamina-ficha')
    await win.keyboard.press('ArrowRight')
    await expect(win.getByText('Paso 1: fórmula')).toBeVisible()
    await expect(win.getByText('Paso 2: con valores')).toBeVisible()
    await expect(win.locator('.fx .katex-display').first()).toBeVisible()
    await captura(win, '09-leccion-formula')
    await win.keyboard.press('ArrowRight')
    await expect(win.locator('.paso')).toHaveCount(2)
    await captura(win, '10-leccion-pasos')
    await win.keyboard.press('ArrowLeft')
    await win.keyboard.press('ArrowLeft')
    await win.keyboard.press('ArrowLeft')
    await expect(win.getByTestId('nota-texto')).toHaveValue('Mi nota sobre CETES')

    // Etapa 2: puntos clave.
    await win.locator('[data-etapa="1"]').click()
    await expect(win.getByRole('heading', { name: 'Lo que tienes que saber' })).toBeVisible()
    await expect(win.locator('.punto')).toHaveCount(3)
    await captura(win, '11-leccion-puntos-clave')

    // Etapa 3: práctica guiada con retroalimentación inmediata.
    await win.locator('[data-etapa="2"]').click()
    for (let i = 0; i < 3; i++) {
      await expect(win.getByRole('heading', { name: new RegExp(`Práctica guiada, ${i + 1} de 3`) })).toBeVisible()
      await win.keyboard.press('a')
      await expect(win.locator('.porque')).toBeVisible()
      if (i === 0) await captura(win, '12-leccion-practica-retro')
      if (i < 2) await win.getByTestId('practica-siguiente').or(win.locator('[data-practica-siguiente]')).click()
    }

    // Etapa 4: mini examen, calificación y nivel resultante.
    await win.getByRole('button', { name: /Ir al mini examen/ }).click()
    await expect(win.getByRole('heading', { name: /Mini examen/ })).toBeVisible()
    const preguntas = win.locator('.lamina .pregunta')
    await expect(preguntas).toHaveCount(3)
    await expect(win.getByTestId('mini-terminar')).toBeDisabled()
    for (let i = 0; i < 3; i++) await preguntas.nth(i).locator('.opcion').first().click()
    await captura(win, '13-leccion-mini-examen')
    await win.getByTestId('mini-terminar').click()
    await expect(win.getByTestId('mini-resultado')).toBeVisible()
    await expect(win.getByTestId('mini-resultado').locator('.grande')).toContainText('/ 3')
    await expect(win.locator('.niveles .actual')).toHaveCount(1)
    await captura(win, '14-leccion-resultado')
  })

  test('practicar: 3 preguntas con teclado, confianza y reporte', async () => {
    await irA(win, 'Practicar')
    await expect(win.getByRole('heading', { name: 'Practicar', level: 1 })).toBeVisible()
    await captura(win, '15-practicar-filtros')
    await win.getByTestId('filtro-n').fill('3')
    await win.getByTestId('practica-empezar').click()
    for (let i = 0; i < 3; i++) {
      await expect(win.getByRole('heading', { name: new RegExp(`Pregunta ${i + 1} de 3`) })).toBeVisible()
      await win.keyboard.press('b')
      await expect(win.locator('.opcion.elegida')).toHaveCount(1)
      await win.keyboard.press(i === 1 ? '3' : '1')
      await expect(win.locator('.porque')).toBeVisible()
      if (i === 0) {
        await captura(win, '16-practicar-retro')
        await win.getByRole('button', { name: 'Reportar pregunta' }).click()
        await expect(win.getByRole('button', { name: /Reportada/ })).toBeVisible()
      }
      await win.getByTestId('practica-siguiente').click()
    }
    await expect(win.getByTestId('practica-resultado')).toBeVisible()
    await captura(win, '17-practicar-resultado')
  })

  test('simulacro: el integral advierte que el banco no alcanza', async () => {
    await irA(win, 'Simulacro')
    await captura(win, '18-simulacro-menu')
    await win.locator('[data-tipo="integral"]').click()
    await win.getByTestId('simulacro-iniciar').click()
    await expect(win.getByTestId('aviso-faltantes')).toBeVisible()
    await captura(win, '19-simulacro-faltantes')
    await win.getByRole('button', { name: 'Cancelar' }).click()
  })

  test('simulacro rápido: inicia, se responde, se marca y se termina', async () => {
    await win.locator('[data-tipo="rapido"]').click()
    await win.getByTestId('simulacro-iniciar').click()
    await expect(win.getByTestId('simulacro-examen').or(win.getByTestId('aviso-faltantes'))).toBeVisible()
    if (await win.getByTestId('simulacro-continuar').isVisible()) await win.getByTestId('simulacro-continuar').click()
    await expect(win.getByTestId('simulacro-examen')).toBeVisible()
    // Sin retroalimentación durante el examen y con la navegación general bloqueada.
    await expect(win.getByRole('navigation', { name: 'Secciones' }).getByRole('button', { name: 'Inicio' })).toBeDisabled()
    await win.keyboard.press('a')
    await win.keyboard.press('m')
    await expect(win.locator('.porque')).toHaveCount(0)
    await win.keyboard.press('ArrowRight')
    await win.keyboard.press('c')
    await captura(win, '20-simulacro-examen')
    await win.getByTestId('simulacro-terminar').click()
    await captura(win, '21-simulacro-confirmar')
    await win.getByTestId('simulacro-confirmar').click()
    await expect(win.getByTestId('simulacro-resultado')).toBeVisible()
    await expect(win.getByTestId('simulacro-resultado').getByText('estimados', { exact: false }).first()).toBeVisible()
    await captura(win, '22-simulacro-resultado')
    await expect(win.getByRole('navigation', { name: 'Secciones' }).getByRole('button', { name: 'Inicio' })).toBeEnabled()
  })

  test('diagnóstico: mapa por subtema, teoría contra cálculo y patrones', async () => {
    await irA(win, 'Diagnóstico')
    await expect(win.getByRole('heading', { name: 'Mapa de dominio por subtema' })).toBeVisible()
    await expect(win.locator('.celda').first()).toBeVisible()
    await win.locator('.celda').first().click()
    await expect(win.getByRole('button', { name: 'Practicar esto' }).first()).toBeVisible()
    await expect(win.getByRole('heading', { name: 'Teoría contra cálculo' })).toBeVisible()
    await captura(win, '23-diagnostico')
  })

  test('inicio con datos y ajustes: el tema y la letra se aplican por variables', async () => {
    await irA(win, 'Inicio')
    await expect(win.getByText('Aún no hay datos de dominio')).toHaveCount(0)
    await expect(win.getByText('Lo que el sistema recuerda de ti')).toBeVisible()
    await captura(win, '24-inicio-con-datos')

    await irA(win, 'Ajustes')
    await expect(win.getByRole('heading', { name: 'Ajustes', level: 1 })).toBeVisible()
    await expect(win.getByRole('switch')).toBeDisabled()
    await expect(win.getByText('Próximamente, requiere OmniRoute')).toBeVisible()
    await captura(win, '25-ajustes')

    for (const [id, nombre] of [['terminal', 'Terminal'], ['editorial', 'Editorial'], ['enfoque', 'Enfoque'], ['claro', 'Claro']] as const) {
      await win.locator(`[data-tema-opcion="${id}"]`).click()
      await expect(win.locator('html')).toHaveAttribute('data-tema', id)
      await expect(win.getByRole('status').filter({ hasText: `Tema ${nombre} aplicado` })).toBeVisible()
      const fondo = await win.evaluate("getComputedStyle(document.body).backgroundColor")
      expect(fondo).toMatch(/^rgb/)
      await irA(win, 'Inicio')
      await expect(win.getByText('Lo que el sistema recuerda de ti')).toBeVisible()
      await captura(win, `26-inicio-${id}`)
      await irA(win, 'Ajustes')
    }
    await win.locator('[data-letra-opcion="calibri"]').click()
    await expect(win.locator('html')).toHaveAttribute('data-letra', 'calibri')
    await win.locator('[data-tema-opcion="terminal"]').click()
    await expect(win.locator('html')).toHaveAttribute('data-tema', 'terminal')
    await captura(win, '27-ajustes-terminal')
  })

  test('sin errores de consola durante todo el recorrido', () => {
    expect(errores).toEqual([])
  })

  test('el tema, la letra y el progreso persisten al reabrir la app', async () => {
    await app.close()
    ;({ app, win, errores } = await lanzar(datos, contenido))
    await expect(win.getByRole('heading', { level: 1 })).toContainText(/Buen/)
    await expect(win.locator('html')).toHaveAttribute('data-tema', 'terminal')
    await expect(win.locator('html')).toHaveAttribute('data-letra', 'calibri')
    await expect(win.getByText('Lo que el sistema recuerda de ti')).toBeVisible()
    await expect(win.getByTestId('onboarding')).toHaveCount(0)
    await captura(win, '28-reabrir-persistencia')
    expect(readdirSync(CAPTURAS).filter((n) => n.startsWith('app-v1-')).length).toBeGreaterThan(25)
  })
})

test('si existen lecciones reales en content/lecciones, la primera se abre sin errores', async () => {
  const reales = (() => {
    try {
      return readdirSync(join(RAIZ, 'content', 'lecciones'), { recursive: true, encoding: 'utf8' }).filter((n) => n.endsWith('.json'))
    } catch {
      return []
    }
  })()
  test.skip(reales.length === 0, 'No hay lecciones reales todavía en content/lecciones')
  const datos = mkdtempSync(join(tmpdir(), 'amib-e2e-datos-'))
  const { app, win, errores } = await lanzar(datos, join(RAIZ, 'content'))
  await win.getByRole('button', { name: 'Configurar después' }).click()
  await irA(win, 'Lecciones')
  await win.locator('[data-leccion]').first().click()
  await expect(win.locator('.lamina h2').first()).toBeVisible()
  await captura(win, '29-leccion-real')
  expect(errores).toEqual([])
  await app.close()
})
