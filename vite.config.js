import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/players': 'http://localhost:8080',
      '/orders': 'http://localhost:8080',
      '/quotes': 'http://localhost:8080',
      '/users': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
    },
  },
})
