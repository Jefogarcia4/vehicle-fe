import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loading } from '@/components/ui/feedback'
import { useAuth } from './AuthContext'

/** Deja pasar solo con sesión activa; si no, manda al login recordando a dónde iba. */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading label="Verificando sesión..." className="min-h-screen" />

  if (!isAuthenticated) {
    return <Navigate to="/ingresar" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
