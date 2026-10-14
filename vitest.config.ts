import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['app/src/**/*.test.ts', 'tools/**/*.test.ts'],
    environment: 'node',
    coverage: { include: ['app/src/core/**'], thresholds: { lines: 80, functions: 80, branches: 80 } }
  }
})
