import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://<user>.github.io/gmltrack/
export default defineConfig({
  base: '/gmltrack/',
  plugins: [react()],
})
