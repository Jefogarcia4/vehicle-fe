import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, ArrowRight, BellRing, Search, Store, Wrench } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/form'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { vehicleTypeLabels } from '@/lib/labels'
import { useAuth } from '@/features/auth/AuthContext'
import { CategoryPicker } from '@/features/partners/CategoryPicker'
import type { VehicleType } from '@/lib/types'

const schema = z.object({
  businessName: z.string().min(3, 'Escribe el nombre del establecimiento.'),
  fullName: z.string().min(3, 'Escribe tu nombre completo.'),
  email: z.email('Escribe un correo válido.'),
  password: z.string().min(6, 'Mínimo 6 caracteres.'),
  phone: z.string().optional(),
  department: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const highlights = [
  { icon: BellRing, text: 'Te presentamos justo cuando a alguien se le está venciendo lo que tú resuelves.' },
  { icon: Search, text: 'Apareces en el directorio filtrado por servicio, ciudad y tipo de vehículo.' },
  { icon: Wrench, text: 'Tus clientes te guardan en su libreta y registran ahí cada servicio que les haces.' },
  { icon: Store, text: 'Publicar tu negocio es gratis. Puedes pausarlo cuando quieras.' },
]

/** Registro de un aliado que todavía no tiene cuenta: abre la cuenta y el perfil de una vez. */
export default function PartnerRegisterPage() {
  const { registerPartner } = useAuth()
  const navigate = useNavigate()

  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const toggleType = (type: VehicleType) =>
    setVehicleTypes((current) =>
      current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    )

  const onSubmit = handleSubmit(async (values) => {
    setError('')

    if (categoryIds.length === 0) {
      setError('Selecciona al menos una categoría de servicio.')
      return
    }

    try {
      await registerPartner({ ...values, categoryIds, vehicleTypes })
      navigate('/app/aliado', { replace: true })
    } catch (err) {
      setError(apiError(err, 'No pudimos crear el perfil del negocio.'))
    }
  })

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_24rem]">
      <div className="px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-xl">
          <Link to="/">
            <Logo size="lg" />
          </Link>

          <h1 className="mt-10 text-3xl">Publica tu negocio</h1>
          <p className="mt-2 text-sm text-carbon-500">
            Talleres, montallantas, lubricentros, CDA y todo lo que un vehículo necesita. Es gratis.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
            {/* --- El negocio --- */}
            <section className="space-y-4">
              <h2 className="text-base">Tu negocio</h2>

              <Field label="Nombre del establecimiento" error={errors.businessName?.message} required>
                <Input
                  placeholder="Frenos del Norte"
                  error={!!errors.businessName}
                  {...register('businessName')}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Departamento" error={errors.department?.message}>
                  <Input placeholder="Cundinamarca" {...register('department')} />
                </Field>
                <Field label="Ciudad" error={errors.city?.message}>
                  <Input placeholder="Bogotá" {...register('city')} />
                </Field>
              </div>

              <Field label="Dirección" error={errors.address?.message}>
                <Input placeholder="Calle 170 #20-30" {...register('address')} />
              </Field>
            </section>

            {/* --- Qué resuelve --- */}
            <section>
              <h2 className="text-base">¿Qué servicios prestas?</h2>
              <p className="mb-3 mt-1 text-sm text-carbon-500">
                De esto depende a quién te recomendamos: si marcas frenos, apareces cuando a alguien
                se le está venciendo el servicio de frenos.
              </p>
              <CategoryPicker value={categoryIds} onChange={setCategoryIds} />
            </section>

            {/* --- A quién atiende --- */}
            <section>
              <h2 className="text-base">¿Qué vehículos atiendes?</h2>
              <p className="mb-3 mt-1 text-sm text-carbon-500">
                Si no marcas ninguno entendemos que atiendes todos.
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(vehicleTypeLabels) as VehicleType[]).map((type) => {
                  const active = vehicleTypes.includes(type)
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      aria-pressed={active}
                      className={cn('chip-base', active ? 'chip-brand' : 'chip-neutral')}
                    >
                      {vehicleTypeLabels[type]}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* --- La cuenta --- */}
            <section className="space-y-4 border-t border-carbon-100 pt-6">
              <h2 className="text-base">Tu cuenta</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre del responsable" error={errors.fullName?.message} required>
                  <Input placeholder="Ana Ruiz" error={!!errors.fullName} {...register('fullName')} />
                </Field>
                <Field label="Celular" error={errors.phone?.message}>
                  <Input placeholder="300 000 0000" {...register('phone')} />
                </Field>
              </div>

              <Field label="Correo" error={errors.email?.message} required>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="contacto@tunegocio.com"
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
            </section>

            <Button type="submit" size="lg" block loading={isSubmitting}>
              Publicar mi negocio
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-carbon-500">
            ¿Ya tienes cuenta de Rueda Al Día?{' '}
            <Link to="/app/aliado" className="font-semibold text-brand-600 hover:text-brand-700">
              Conviértela en aliado
            </Link>
          </p>
        </div>
      </div>

      {/* --- Por qué vale la pena --- */}
      <aside className="relative hidden overflow-hidden bg-carbon-950 lg:block">
        <div className="grid-noise absolute inset-0 opacity-70" />
        <div
          className="absolute -left-24 top-1/3 size-[30rem] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a90b0b 0%, transparent 65%)' }}
        />

        <div className="relative flex h-full flex-col justify-center px-10 py-16 text-white">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            Que te encuentren
            <br />
            <span className="text-brand-400">en el momento justo.</span>
          </h2>

          <ul className="mt-10 space-y-5">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-300">
                  <Icon className="size-[18px]" />
                </span>
                <p className="pt-1.5 text-sm text-carbon-300">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
