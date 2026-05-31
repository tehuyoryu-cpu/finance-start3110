import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      // Yahoo Finance v8（株価・チャート）
      '/proxy/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/yahoo/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      },
      // rss2json（RSSフィード変換）
      '/proxy/rss2json': {
        target: 'https://api.rss2json.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/rss2json/, ''),
      },
      // 日本語RSSソース群
      '/proxy/itmedia': {
        target: 'https://rss.itmedia.co.jp',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/itmedia/, ''),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      },
      '/proxy/gigazine': {
        target: 'https://gigazine.net',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/gigazine/, ''),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      },
      '/proxy/techcrunch': {
        target: 'https://techcrunch.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/techcrunch/, ''),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      },
      '/proxy/theverge': {
        target: 'https://www.theverge.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/theverge/, ''),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      },
      '/proxy/reuters': {
        target: 'https://feeds.reuters.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/reuters/, ''),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      },
    },
  },
})
