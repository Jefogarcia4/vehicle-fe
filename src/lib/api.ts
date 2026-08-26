import axios, { type AxiosError } from 'axios'

const TOKEN_KEY = 'vehicleid.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/**
 * Origen de la API.
 * - Producción: VITE_API_URL.
 * - Desarrollo: vacío, para que /api y /uploads pasen por el proxy de Vite.
 */
export const apiOrigin = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export const api = axios.create({
  baseURL: `${apiOrigin}/api`,
  headers: { 'Content-Type': 'application/json' },
})

/** Convierte una ruta relativa de la API en URL absoluta cuando hace falta. */
export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  return `${apiOrigin}${path}`
}

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    // Sesión vencida: se limpia el token para que el guard de rutas mande al login.
    if (error.response?.status === 401) tokenStore.clear()
    return Promise.reject(error)
  },
)

/**
 * Mensaje legible de un error de la API.
 *
 * Manda lo que responda la API, que siempre viene como `{ message }`. Si no hay cuerpo —un 404
 * de ruta que no existe, o un fallo de red— se usa el respaldo de quien llama: el texto de axios
 * ("Request failed with status code 404") no le dice nada a quien está en la pantalla.
 */
export function apiError(error: unknown, fallback = 'Algo salió mal. Intenta de nuevo.'): string {
  const axiosError = error as AxiosError<{ message?: string }>
  return axiosError?.response?.data?.message ?? fallback
}

/** Sube un archivo y devuelve su ruta pública. */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const { data } = await api.post<{ url: string }>(`/files?folder=${folder}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return data.url
}
