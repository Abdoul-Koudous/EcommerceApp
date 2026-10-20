import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react()],
    base: env.VITE_BASE || '/',
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
  };
})
