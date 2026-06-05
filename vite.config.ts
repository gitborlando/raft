import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wyw from '@wyw-in-js/vite'

export default defineConfig({
  plugins: [react(), wyw()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    open: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4175,
    strictPort: true,
  },
})
