import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    proxy: {
      // siteruns23432 のAPIサーバーにプロキシ（デフォルトポート3131）
      '/api': {
        target: 'http://localhost:3131',
        changeOrigin: true,
      },
    },
  },
})
