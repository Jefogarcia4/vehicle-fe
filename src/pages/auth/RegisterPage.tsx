import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  fullName: z.string().min(3, 'Escribe tu nombre completo.'),
  email: z.email('Escribe un correo válido.'),
  password: z.string().min(6, 'Mínimo 6 caracteres.'),
  phone: z.string().optional(),
  city: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    try {
      await signUp(values)
      // Recién creada la cuenta el garaje está vacío: se entra directo a registrar el primer vehículo.
      navigate('/app/vehiculos/nuevo', { replace: true })
    } catch (err) {
      setError(apiError(err, 'No pudimos crear la cuenta.'))
    }
  })

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/">
            <Logo size="lg" />
          </Link>

          <h1 className="mt-10 text-3xl">Crea tu cuenta</h1>
          <p className="mt-2 text-sm text-carbon-500">Gratis, y puedes registrar todos los vehículos que quieras.</p>

          {error && (
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <Field label="Nombre completo" error={errors.fullName?.message} required>
              <Input placeholder="Jefferson García" error={!!errors.fullName} {...register('fullName')} />
            </Field>

            <Field label="Correo" error={errors.email?.message} required>
              <Input
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                error={!!errors.email}
                {...register('email')}
              />
            </Field>

            <Field label="Contraseña" error={errors.password?.message} required>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                error={!!errors.password}
                {...register('password')}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Celular" error={errors.phone?.message}>
                <Input placeholder="300 000 0000" {...register('phone')} />
              </Field>
              <Field label="Ciudad" error={errors.city?.message}>
                <Input placeholder="Bogotá" {...register('city')} />
              </Field>
            </div>

            <Button type="submit" size="lg" block loading={isSubmitting}>
              Crear cuenta
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-carbon-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/ingresar" className="font-semibold text-brand-600 hover:text-brand-700">
              Ingresar
            </Link>
          </p>
        </div>
      </div>

      <AuthAside />
    </div>
  )
}
