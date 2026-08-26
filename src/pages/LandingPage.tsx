import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CircleDollarSign,
  Fuel,
  Gauge,
  QrCode,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { HealthRing } from '@/components/ui/indicators'
import { useAuth } from '@/features/auth/AuthContext'

const features = [
  {
    icon: CalendarClock,
    title: 'Nunca más un SOAT vencido',
    description:
      'SOAT, tecnomecánica, póliza e impuesto con alertas escalonadas. Guarda la foto del documento para tenerlo a mano en un retén.',
  },
  {
    icon: Wrench,
    title: 'Plan de mantenimiento que se adelanta',
    description:
      'Cada vehículo arranca con los intervalos del fabricante. La app avisa por kilometraje o por tiempo, lo que ocurra primero.',
  },
  {
    icon: Gauge,
    title: 'Proyección con tu uso real',
    description:
      'Aprende cuántos kilómetros haces al día y traduce “faltan 800 km” a “te llega en tres semanas”.',
  },
  {
    icon: Fuel,
    title: 'Rendimiento tanqueada a tanqueada',
    description:
      'Calcula km por galón entre tanques llenos. Si el consumo se dispara, lo ves antes de que el motor lo grite.',
  },
  {
    icon: CircleDollarSign,
    title: 'Cuánto te cuesta de verdad',
    description:
      'Combustible, taller, peajes, seguros y multas en un solo consolidado: gasto mensual y costo por kilómetro.',
  },
  {
    icon: QrCode,
    title: 'Hoja de vida para venderlo mejor',
    description:
      'Comparte un enlace con todo el historial de mantenimiento, sin tus datos personales. Un carro con historial vale más.',
  },
]

const steps = [
  { title: 'Registra tu vehículo', description: 'Placa, marca, modelo y kilometraje actual. Menos de un minuto.' },
  { title: 'Carga lo que ya tienes', description: 'SOAT, tecnomecánica y el último cambio de aceite. Con eso basta para empezar.' },
  { title: 'Deja que te avise', description: 'La app calcula todo lo demás y te dice qué sigue y cuándo.' },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* ---------------------------------------------------------------- barra */}
      <header className="sticky top-0 z-40 border-b border-carbon-100 bg-white/85 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-carbon-600 md:flex">
            <a href="#funciones" className="transition hover:text-brand-600">Funciones</a>
            <a href="#como-funciona" className="transition hover:text-brand-600">Cómo funciona</a>
            <a href="#hoja-de-vida" className="transition hover:text-brand-600">Hoja de vida</a>
            <Link to="/aliados" className="transition hover:text-brand-600">Aliados</Link>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/app" className="btn-primary btn-md">
                Ir a mi garaje
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link to="/ingresar" className="btn-ghost btn-md hidden sm:inline-flex">Ingresar</Link>
                <Link to="/registro" className="btn-primary btn-md">Crear cuenta</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-carbon-950 text-white">
        <div className="grid-noise absolute inset-0 opacity-70" />
        <div
          className="absolute -right-32 -top-32 size-[34rem] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a90b0b 0%, transparent 65%)' }}
        />

        <div className="container-app relative grid gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="chip bg-white/10 text-brand-200 ring-white/15">
              <ShieldCheck className="size-3.5" />
              La hoja de vida digital de tu vehículo
            </span>

            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Tu vehículo,
              <br />
              <span className="text-brand-400">en línea y al día.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg text-carbon-300">
              Mantenimientos, documentos, llantas, tanqueadas y gastos de todos tus vehículos en un solo
              lugar. Rueda Al Día te avisa antes de que algo se venza y te muestra cuánto te cuesta de verdad
              tener el carro.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={isAuthenticated ? '/app' : '/registro'} className="btn-primary btn-lg">
                {isAuthenticated ? 'Ir a mi garaje' : 'Empezar gratis'}
                <ArrowRight className="size-4" />
              </Link>
              <a href="#funciones" className="btn btn-lg bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15">
                Ver qué incluye
              </a>
            </div>

            <p className="mt-5 flex items-center gap-2 text-sm text-carbon-400">
              <Users className="size-4" />
              Un solo usuario, todos los vehículos de la familia.
            </p>
          </motion.div>

          {/* Vista previa del tablero: lo que el usuario verá al entrar. */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="relative"
          >
            <div className="rounded-4xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur">
              <div className="rounded-3xl bg-white p-5 shadow-float">
                <div className="flex items-center gap-4">
                  <HealthRing score={64} size={76} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-carbon-400">Mi garaje</p>
                    <p className="font-display text-lg font-semibold text-carbon-900">2 vehículos · 3 pendientes</p>
                    <p className="text-sm text-carbon-500">Gasto del mes: $ 366.950</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    { tone: 'bg-danger-500', title: 'Revisión tecnicomecánica', sub: 'Venció hace 6 días' },
                    { tone: 'bg-danger-400', title: 'Cambio de aceite y filtro', sub: 'Pasado por 300 km' },
                    { tone: 'bg-warn-500', title: 'SOAT', sub: 'Vence en 18 días' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3 rounded-2xl bg-carbon-50 px-3.5 py-3">
                      <span className={`size-2.5 shrink-0 rounded-full ${item.tone}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-carbon-800">{item.title}</p>
                        <p className="text-xs text-carbon-500">{item.sub}</p>
                      </div>
                      <BellRing className="size-4 shrink-0 text-carbon-300" />
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
                  {[
                    { label: 'Rendimiento', value: '51,5' },
                    { label: 'Costo / km', value: '$ 359' },
                    { label: 'Kilometraje', value: '47.800' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-carbon-50 px-2 py-3">
                      <p className="font-display text-base font-semibold text-carbon-900">{stat.value}</p>
                      <p className="text-[0.65rem] font-medium uppercase tracking-wide text-carbon-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- funciones */}
      <section id="funciones" className="container-app py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip-brand">Todo el mantenimiento en un solo lugar</span>
          <h2 className="mt-4 text-3xl sm:text-4xl">Deja de adivinar cuándo toca</h2>
          <p className="mt-3 text-carbon-500">
            La carpeta de facturas en la guantera y el recordatorio en el celular no alcanzan. Rueda Al Día
            conecta kilometraje, fechas y gastos para decirte exactamente qué sigue.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="card card-pad transition hover:-translate-y-1 hover:shadow-float"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-carbon-500">{description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- cómo funciona */}
      <section id="como-funciona" className="bg-carbon-50 py-20 lg:py-28">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl">Empiezas en un minuto</h2>
            <p className="mt-3 text-carbon-500">
              No tienes que digitar años de historia. Con el kilometraje de hoy la app ya sabe qué se viene.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="card card-pad">
                <span className="flex size-9 items-center justify-center rounded-xl bg-carbon-900 font-display text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg">{step.title}</h3>
                <p className="mt-2 text-sm text-carbon-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- hoja de vida */}
      <section id="hoja-de-vida" className="container-app py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="chip-brand">
              <QrCode className="size-3.5" />
              Hoja de vida pública
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl">El historial que sube el precio de tu carro</h2>
            <p className="mt-4 text-carbon-500">
              Cuando vayas a vender, activa la hoja de vida pública y comparte el enlace. El comprador ve
              cada servicio, con qué kilometraje se hizo y en qué taller, además del estado de los
              documentos. Sin tus datos personales y sin lo que pagaste.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-carbon-600">
              {[
                'Historial completo de mantenimientos verificable',
                'Estado de SOAT y tecnomecánica al día de hoy',
                'Kilómetros por año, para demostrar el uso real',
                'La placa se muestra parcialmente oculta',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-4xl bg-carbon-950 p-8 text-white">
            <div className="grid-noise rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">Hoja de vida</p>
              <p className="mt-1 font-display text-2xl font-semibold">Mazda CX-30 2022</p>
              <p className="text-sm text-carbon-400">Placa ABC**3 · 47.800 km</p>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { value: '3', label: 'Servicios' },
                  { value: '7.900', label: 'Km / año' },
                  { value: '100%', label: 'Docs al día' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/5 px-2 py-3">
                    <p className="font-display text-lg font-semibold text-white">{stat.value}</p>
                    <p className="text-[0.65rem] uppercase tracking-wide text-carbon-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {[
                  { date: 'Abr 2026', title: 'Cambio de aceite y filtros', km: '42.500 km' },
                  { date: 'Nov 2025', title: 'Pastillas de freno delanteras', km: '38.200 km' },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-carbon-400">{item.date}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-brand-300">{item.km}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- cierre */}
      <section className="container-app pb-24">
        <div className="rounded-4xl bg-brand-600 px-8 py-14 text-center text-white shadow-brand">
          <h2 className="text-3xl text-white sm:text-4xl">Tu carro te lo agradece</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Registra tu primer vehículo hoy y deja de cargar la carpeta de facturas en la guantera.
          </p>
          <Link
            to={isAuthenticated ? '/app' : '/registro'}
            className="btn btn-lg mt-7 bg-white text-brand-700 hover:bg-brand-50"
          >
            {isAuthenticated ? 'Ir a mi garaje' : 'Crear mi cuenta gratis'}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-carbon-100 py-8">
        <div className="container-app flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <div className="text-center sm:text-right">
            <p className="text-sm text-carbon-400">
              © {new Date().getFullYear()} Rueda Al Día · Hecho para que tu vehículo dure más.
            </p>
            <p className="mt-1 text-sm text-carbon-500">
              ¿Tienes un taller?{' '}
              <Link to="/registro-aliado" className="font-semibold text-brand-600 hover:text-brand-700">
                Publícalo gratis en el directorio
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
