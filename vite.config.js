import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const appConfig = JSON.parse(fs.readFileSync(path.resolve('app.config.json'), 'utf8'))
const entryPoint = appConfig.entryPoint === 'old' ? 'old' : 'vue'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      ...(entryPoint === 'vue'
        ? {
            '/old': {
              target: process.env.VITE_API_TARGET || 'http://localhost:3000',
              changeOrigin: true,
              secure: false,
            },
          }
        : {}),
      '/': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        bypass(req) {
          const url = req.url || ''
          if (url.startsWith('/api') || url.startsWith('/@') || url.startsWith('/src/')) return undefined
          if (entryPoint === 'vue') return req.url
          return url.startsWith('/old') ? req.url : undefined
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
