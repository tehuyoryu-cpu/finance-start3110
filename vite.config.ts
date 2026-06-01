import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      // Yahoo Finance（株価・チャート）
      '/proxy/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/yahoo/, ''),
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      },
      // DeepL Web 内部API
      '/proxy/deepl': {
        target: 'https://www2.deepl.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/deepl/, ''),
        headers: {
          'Origin': 'https://www.deepl.com',
          'Referer': 'https://www.deepl.com/translator',
        },
      },
      // Google 翻訳
      '/proxy/gtrans': {
        target: 'https://translate.googleapis.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/gtrans/, ''),
      },
    },
  },
})
