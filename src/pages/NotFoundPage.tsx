import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo size="lg" />
      <p className="mt-10 font-display text-6xl font-bold text-carbon-200">404</p>
      <h1 className="mt-3 text-2xl">Esta página no existe</h1>
      <p className="mt-2 max-w-sm text-sm text-carbon-500">
        Es posible que el enlace esté mal escrito o que la hoja de vida ya no sea pública.
      </p>
      <Link to="/" className="btn-primary btn-md mt-7">
        Volver al inicio
      </Link>
    </div>
  )
}

/**
 * Versión para dentro de la app, donde ya hay barra lateral y logo. La página completa se usa
 * en lo público, que no tiene marco alrededor.
 */
export function NotFoundInApp() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-carbon-200 px-6 py-20 text-center">
      <p className="font-display text-5xl font-bold text-carbon-200">404</p>
      <h1 className="mt-3 text-xl">Esta página no existe</h1>
      <p className="mt-2 max-w-sm text-sm text-carbon-500">
        Es posible que el enlace esté mal escrito o que la sección haya cambiado de lugar.
      </p>
      <Link to="/app" className="btn-primary btn-md mt-6">
        Ir al tablero
      </Link>
    </div>
  )
}
