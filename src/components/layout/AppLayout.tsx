import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  Car,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  Store,
  Users,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { useAuth } from '@/features/auth/AuthContext'
import { useDashboard } from '@/features/vehicles/hooks'
import { useUnreadCount } from '@/features/notifications/hooks'

const baseLinks = [
  { to: '/app', label: 'Tablero', icon: LayoutDashboard, end: true },
  { to: '/app/garaje', label: 'Mis vehículos', icon: Car },
  { to: '/app/talleres', label: 'Talleres', icon: Wrench },
  { to: '/app/perfil', label: 'Mi perfil', icon: User },
]

/**
 * Las secciones del negocio solo aparecen cuando la cuenta ya es aliado. Quien no lo es llega
 * a /app/aliado desde el directorio, donde la pantalla ofrece activarlo.
 */
function navLinks(isPartner: boolean) {
  if (!isPartner) return baseLinks
  return [
    ...baseLinks.slice(0, 3),
    { to: '/app/aliado', label: 'Mi negocio', icon: Store },
    { to: '/app/crm', label: 'Clientes', icon: Users },
    { to: '/app/crm/campanas', label: 'Campañas', icon: Megaphone },
    ...baseLinks.slice(3),
  ]
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: dashboard } = useDashboard()

  const links = navLinks(!!user?.roles.includes('Partner'))
  const { data: unread = 0 } = useUnreadCount()

  // Cerrar el menú al tocar un enlace: dejarlo abierto tapa la pantalla a la que se acaba de llegar.
  const closeMenu = () => setMenuOpen(false)

  const pending = (dashboard?.expiredCount ?? 0) + (dashboard?.criticalCount ?? 0)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-carbon-50">
      {/* --- Barra lateral (escritorio) --- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-carbon-950 px-4 py-6 lg:flex">
        <Link to="/app" className="px-2">
          <Logo variant="light" />
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')}
            >
              <Icon className="size-[18px]" />
              {label}
            </NavLink>
          ))}

          <Link to="/app/vehiculos/nuevo" className="btn-primary btn-md mt-4">
            <Plus className="size-4" />
            Agregar vehículo
          </Link>
        </nav>

        <NavLink
          to="/app/avisos"
          className={({ isActive }) => cn('nav-item mt-2', isActive && 'nav-item-active')}
        >
          <span className="relative flex size-[18px] items-center justify-center">
            <Bell className="size-[18px]" />
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[0.6rem] font-bold text-white">
                {unread}
              </span>
            )}
          </span>
          Avisos
        </NavLink>

        <div className="mt-6 rounded-2xl bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white">
              {initials(user?.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
              <p className="truncate text-xs text-carbon-400">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-carbon-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* --- Barra superior (móvil) --- */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-carbon-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/app">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell unread={unread} pending={pending} />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Menú"
            className="flex size-9 items-center justify-center rounded-xl text-carbon-600 transition hover:bg-carbon-50"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="fixed inset-x-0 top-[57px] z-30 border-b border-carbon-100 bg-white px-4 py-3 shadow-float lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeMenu}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-carbon-600',
                    isActive && 'bg-brand-50 text-brand-700',
                  )
                }
              >
                <Icon className="size-[18px]" />
                {label}
              </NavLink>
            ))}
            <NavLink
              to="/app/avisos"
              onClick={closeMenu}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-carbon-600',
                  isActive && 'bg-brand-50 text-brand-700',
                )
              }
            >
              <Bell className="size-[18px]" />
              Avisos
              {unread > 0 && (
                <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[0.65rem] font-bold text-white">
                  {unread}
                </span>
              )}
            </NavLink>

            <Link to="/app/vehiculos/nuevo" onClick={closeMenu} className="btn-primary btn-md mt-2">
              <Plus className="size-4" />
              Agregar vehículo
            </Link>
            <button type="button" onClick={handleLogout} className="btn-ghost btn-md mt-1">
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </div>
        </nav>
      )}

      <main className="lg:pl-64">
        <div className="container-app py-6 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

/**
 * Campanita de la barra móvil. Muestra los avisos sin leer, y si no hay, cae al número de
 * pendientes del garaje: la barra móvil no tiene espacio para dos indicadores.
 */
function NotificationBell({ unread, pending }: { unread: number; pending: number }) {
  const count = unread || pending
  const isNotification = unread > 0

  return (
    <Link
      to={isNotification ? '/app/avisos' : '/app'}
      aria-label={isNotification ? 'Avisos' : 'Pendientes'}
      className="relative mr-1 flex size-9 items-center justify-center rounded-xl text-carbon-500 transition hover:bg-carbon-50"
    >
      <Bell className="size-5" />
      {count > 0 && (
        <span
          className={cn(
            'absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-bold text-white',
            isNotification ? 'bg-brand-600' : 'bg-danger-500',
          )}
        >
          {count}
        </span>
      )}
    </Link>
  )
}
