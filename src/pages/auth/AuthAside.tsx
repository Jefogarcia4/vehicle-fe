import { CalendarClock, Fuel, QrCode, Wrench } from 'lucide-react'

const highlights = [
  { icon: CalendarClock, text: 'Alertas de SOAT, tecnomecánica e impuesto antes de que se venzan.' },
  { icon: Wrench, text: 'Plan de mantenimiento por kilometraje y por tiempo, listo desde el día uno.' },
  { icon: Fuel, text: 'Rendimiento real y costo por kilómetro de cada vehículo.' },
  { icon: QrCode, text: 'Hoja de vida compartible para cuando decidas venderlo.' },
]

/** Panel lateral de las pantallas de acceso: recuerda qué gana el usuario al entrar. */
export function AuthAside() {
  return (
    <aside className="relative hidden overflow-hidden bg-carbon-950 lg:block">
      <div className="grid-noise absolute inset-0 opacity-70" />
      <div
        className="absolute -left-24 top-1/3 size-[30rem] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #a90b0b 0%, transparent 65%)' }}
      />

      <div className="relative flex h-full flex-col justify-center px-14 py-16 text-white">
        <h2 className="font-display text-4xl font-bold leading-tight text-white">
          Todo lo de tu vehículo,
          <br />
          <span className="text-brand-400">en un solo lugar.</span>
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
  )
}
