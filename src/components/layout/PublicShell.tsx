import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/features/auth/AuthContext'

/**
 * Barra y pie de las pantallas abiertas al público (directorio y ficha de aliado). El landing
 * trae los suyos porque su barra es parte del diseño de la portada.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-carbon-50">
      <header className="sticky top-0 z-40 border-b border-carbon-100 bg-white/85 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-carbon-600 md:flex">
            <Link to="/aliados" className="transition hover:text-brand-600">
              Directorio
            </Link>
            <Link to="/registro-aliado" className="transition hover:text-brand-600">
              Registrar mi negocio
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/app" className="btn-primary btn-md">
                Mi garaje
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link to="/ingresar" className="btn-ghost btn-md hidden sm:inline-flex">
                  Ingresar
                </Link>
                <Link to="/registro" className="btn-primary btn-md">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-carbon-100 bg-white py-8">
        <div className="container-app flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-carbon-400">
            ¿Tienes un taller?{' '}
            <Link to="/registro-aliado" className="font-semibold text-brand-600 hover:text-brand-700">
              Publícalo gratis
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
