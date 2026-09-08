import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/books': 'http://localhost:8080',
      '/book-copies': 'http://localhost:8080',
      '/genres': 'http://localhost:8080',
      '/authors': 'http://localhost:8080',
      '/publishers': 'http://localhost:8080',
      '/loans': 'http://localhost:8080',
      '/users': 'http://localhost:8080',
      '/admin': 'http://localhost:8080',
    },
  },
})
