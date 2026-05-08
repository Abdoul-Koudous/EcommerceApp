import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/admin/',   // ✅ Doit correspondre exactement au préfixe nginx
                     // Les assets seront générés comme /admin/assets/index.js
                     // Nginx retire /admin/ avant de passer au conteneur → /assets/index.js ✅
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    allowedHosts: "all"
  }
})
