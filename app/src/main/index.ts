import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, ipcMain, shell, session } from 'electron'
import { abrirBaseDeDatos } from './db'
import type { InfoApp } from '../preload/api'

const __dirname = dirname(fileURLToPath(import.meta.url))

let db: ReturnType<typeof abrirBaseDeDatos> | undefined

function crearVentana(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0b0d10',
    title: 'AMIB F3',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })
  win.once('ready-to-show', () => win.show())

  // Seguridad: no se navega fuera de la app; los enlaces externos se abren en el navegador.
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://') && !url.startsWith(process.env['ELECTRON_RENDERER_URL'] ?? '\0')) e.preventDefault()
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else void win.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, _permiso, cb) => cb(false))
  db = abrirBaseDeDatos(join(app.getPath('userData'), 'amib.db'))

  ipcMain.handle('app:info', (): InfoApp => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    node: process.versions.node,
    esquemaDb: Number((db!.prepare('PRAGMA user_version').get() as { user_version: number }).user_version)
  }))

  crearVentana()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  db?.close()
  if (process.platform !== 'darwin') app.quit()
})
