import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/form'
import { apiError } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthContext'
import { AuthAside } from './AuthAside'

const schema = z.object({
  email: z.email('Escribe un correo válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    try {
      await login(values.email, values.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(apiError(err, 'No pudimos iniciar sesión.'))
    }
  })

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/">
            <Logo size="lg" />
          </Link>

          <h1 className="mt-10 text-3xl">Hola de nuevo</h1>
          <p className="mt-2 text-sm text-carbon-500">Entra para ver cómo va tu garaje.</p>

          {error && (
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <Field label="Correo" error={errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                error={!!errors.email}
                {...register('email')}
              />
            </Field>

            <Field label="Contraseña" error={errors.password?.message}>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••"
                error={!!errors.password}
                {...register('password')}
              />
            </Field>

            <Button type="submit" size="lg" block loading={isSubmitting}>
              Entrar
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-carbon-500">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold text-brand-600 hover:text-brand-700">
              Crear una
            </Link>
          </p>

          <div className="mt-8 rounded-2xl bg-carbon-50 px-4 py-3 text-xs text-carbon-500">
            <p className="font-semibold text-carbon-700">Cuenta de demostración</p>
            <p className="mt-0.5">demo@ruedaaldia.co · demo123</p>
          </div>
        </div>
      </div>

      <AuthAside />
    </div>
  )
}
