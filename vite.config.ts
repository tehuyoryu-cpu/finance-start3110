import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    proxy: {
      // siteruns23432 の ui.port = 7777
      '/api': {
        target: 'http://127.0.0.1:7777',
        changeOrigin: true,
      },
    },
  },
})
