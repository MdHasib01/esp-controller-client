import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Versions the service worker URL (/sw.js?v=...) per build, so a CDN
    // (Cloudflare caches /sw.js for hours) can't keep serving a stale copy.
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(Date.now().toString(36)),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
