import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  },
  server: {
    port: 5173,
    allowedHosts: ['cathey-unslippered-jon.ngrok-free.dev'],
    proxy: {
      '/api': { target: 'http://localhost:5002', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5002', changeOrigin: true },
    }
  }
})