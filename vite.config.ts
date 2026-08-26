import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** API publicada en Azure. Es contra la que trabaja el front por defecto. */
const API_PUBLICADA = 'https://ruedaaldiaapi-ejcdg4fgf0c2e3fy.centralus-01.azurewebsites.net'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Para trabajar contra la API local basta con un .env.local:
  //   VITE_PROXY_TARGET=http://localhost:5080
  const target = env.VITE_PROXY_TARGET || API_PUBLICADA

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        // En desarrollo todo pasa por el proxy: el navegador ve un solo origen, así que
        // no hay CORS de por medio ni hace falta tocar la configuración de la API.
        '/api': { target, changeOrigin: true, secure: true },
        '/uploads': { target, changeOrigin: true, secure: true },
      },
    },
  }
})
