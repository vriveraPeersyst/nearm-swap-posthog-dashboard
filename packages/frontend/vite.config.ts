import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '5b8b054d6f4e.ngrok-free.app'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/market-api': {
        target: 'https://near-mobile-production.aws.peersyst.tech',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/market-api/, '/api/market')
      }
    }
  }
})
