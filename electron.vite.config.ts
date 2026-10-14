import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: { rollupOptions: { input: resolve(__dirname, 'app/src/main/index.ts') } },
    resolve: { alias: { '@core': resolve(__dirname, 'app/src/core') } }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    // Un preload con sandbox debe ser CommonJS.
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'app/src/preload/index.ts'),
        output: { format: 'cjs', entryFileNames: '[name].cjs' }
      }
    }
  },
  renderer: {
    // Sin datos en línea: la CSP solo admite fuentes de 'self' (las de KaTeX deben salir como archivos).
    build: { assetsInlineLimit: 0, rollupOptions: { input: resolve(__dirname, 'app/src/renderer/index.html') } },
    root: resolve(__dirname, 'app/src/renderer'),
    resolve: { alias: { '@core': resolve(__dirname, 'app/src/core') } },
    plugins: [react(), tailwindcss()]
  }
})
