import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',          // ← client reste à la racine, pas besoin de changer
  server: {
    host: true,       // ← OBLIGATOIRE sinon Docker ne peut pas accéder
    port: 5173,
    strictPort: true,
  }
})