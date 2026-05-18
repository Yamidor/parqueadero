import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import os from 'os'
import path from 'path'

export default defineConfig({
  plugins: [react(), basicSsl()],
  cacheDir: path.resolve(os.tmpdir(), 'parkpro-frontend-vite-cache'),
  server: {
    port: 5173,
    host: true,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
