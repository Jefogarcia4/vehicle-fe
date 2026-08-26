import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore } from '@/lib/api'
import type { AuthResponse, PartnerSignupPayload, RegisterPartnerPayload, User } from '@/lib/types'

interface AuthState {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  /** Registro de un aliado sin cuenta previa: crea la cuenta y el perfil del negocio. */
  registerPartner: (payload: RegisterPartnerPayload) => Promise<void>
  /** Convierte la cuenta en sesión en aliado. El token se renueva porque cambia el rol. */
  becomePartner: (payload: PartnerSignupPayload) => Promise<void>
  /** Cierra el perfil de aliado. También renueva el token, que ya no debe traer el rol. */
  leavePartner: () => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
  setUser: (user: User) => void
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  phone?: string
  city?: string
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // Sin token guardado no hay nada que validar: se arranca directamente sin sesión.
  const [loading, setLoading] = useState(() => !!tokenStore.get())

  // Al abrir la app se valida el token guardado: si ya no sirve, se limpia sin molestar al usuario.
  useEffect(() => {
    if (!tokenStore.get()) return

    api
      .get<User>('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const apply = useCallback((data: AuthResponse) => {
    tokenStore.set(data.token)
    setUser(data.user)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
      apply(data)
    },
    [apply],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { data } = await api.post<AuthResponse>('/auth/register', payload)
      apply(data)
    },
    [apply],
  )

  const registerPartner = useCallback(
    async (payload: RegisterPartnerPayload) => {
      const { data } = await api.post<AuthResponse>('/auth/register-partner', payload)
      apply(data)
    },
    [apply],
  )

  // El token que tiene el navegador todavía no trae el rol Partner, así que se reemplaza por
  // el que devuelve la API: sin eso el panel del negocio quedaría fuera de alcance.
  const becomePartner = useCallback(
    async (payload: PartnerSignupPayload) => {
      const { data } = await api.post<AuthResponse>('/auth/become-partner', payload)
      apply(data)
    },
    [apply],
  )

  const leavePartner = useCallback(async () => {
    const { data } = await api.delete<AuthResponse>('/auth/partner')
    apply(data)
  }, [apply])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const { data } = await api.get<User>('/auth/me')
    setUser(data)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      registerPartner,
      becomePartner,
      leavePartner,
      logout,
      refresh,
      setUser,
    }),
    [user, loading, login, register, registerPartner, becomePartner, leavePartner, logout, refresh],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthState {
  const context = use(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return context
}
