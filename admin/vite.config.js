import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    allowedHosts: "all",
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
})
