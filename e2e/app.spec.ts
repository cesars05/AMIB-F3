import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron, expect, test } from '@playwright/test'

test('la app arranca, muestra las 9 áreas y conecta con la base de datos', async () => {
  const datos = mkdtempSync(join(tmpdir(), 'amib-e2e-'))
  const app = await electron.launch({
    args: ['.', `--user-data-dir=${datos}`, ...(process.platform === 'linux' ? ['--no-sandbox', '--disable-gpu'] : [])]
  })
  const win = await app.firstWindow()
  await expect(win.getByTestId('tabla-areas').locator('tbody tr')).toHaveCount(9)
  await expect(win.getByTestId('estado-db')).toContainText('DB esquema 1')

  // La interfaz no debe tener acceso a Node.
  expect(await win.evaluate(() => typeof (globalThis as { require?: unknown }).require)).toBe('undefined')

  // La ventana se muestra en 'ready-to-show'; sin esto, en CI sin pantalla la captura falla.
  await expect
    .poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isVisible() ?? false))
    .toBe(true)
  await win.screenshot({ path: 'test-results/e0-pantalla-inicial.png' })
  await app.close()
})
