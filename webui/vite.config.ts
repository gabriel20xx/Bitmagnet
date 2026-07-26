import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'

// Real installed versions (not the package.json semver range) of the frontend dependencies
// worth showing on the admin page's tech stack section - resolved once here at build/dev
// time so the displayed versions can never drift from what's actually bundled.
const FRONTEND_TECH_STACK_PACKAGES = [
  { name: 'React', pkg: 'react' },
  { name: 'React Router', pkg: 'react-router' },
  { name: 'Apollo Client', pkg: '@apollo/client' },
  { name: 'GraphQL', pkg: 'graphql' },
  { name: 'Tailwind CSS', pkg: 'tailwindcss' },
  { name: 'Vite', pkg: 'vite' },
  { name: 'i18next', pkg: 'i18next' },
]

function readInstalledVersion(pkg: string): string | null {
  try {
    const pkgJsonPath = path.resolve(__dirname, 'node_modules', pkg, 'package.json')
    const parsed = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')) as { version?: string }
    return parsed.version ?? null
  } catch {
    return null
  }
}

const frontendTechStack = FRONTEND_TECH_STACK_PACKAGES.flatMap(({ name, pkg }) => {
  const version = readInstalledVersion(pkg)
  return version ? [{ name, version }] : []
})

// https://vite.dev/config/
export default defineConfig({
  base: '/webui/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __FRONTEND_TECH_STACK__: JSON.stringify(frontendTechStack),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: 'localhost',
    port: 3334,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/lib/test/setup.ts'],
    globals: true,
  },
})
