import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AtSign,
  BadgeCheck,
  BookmarkPlus,
  CalendarCheck,
  Check,
  ChevronLeft,
  Clock,
  Globe,
  MapPin,
  MessageCircle,
  Phone,
  ThumbsUp,
  Truck,
} from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import { Button } from '@/components/ui/Button'
import { ErrorState, Loading } from '@/components/ui/feedback'
import { apiError, assetUrl } from '@/lib/api'
import { date as formatDate } from '@/lib/format'
import { vehicleTypeLabels } from '@/lib/labels'
import { CategoryIcon } from '@/features/partners/CategoryIcon'
import { useAuth } from '@/features/auth/AuthContext'
import { usePublicPartner, useSavePartnerToDirectory } from '@/features/partners/hooks'

/** Ficha pública del aliado: lo que ve un conductor antes de decidir si lo llama. */
export default function PublicPartnerPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { isAuthenticated } = useAuth()
  const { data: partner, isLoading, error } = usePublicPartner(slug)
  const save = useSavePartnerToDirectory()
  const [saved, setSaved] = useState(false)

  if (isLoading) return <Loading label="Cargando aliado..." className="min-h-screen" />

  if (error || !partner) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-lg px-6 py-20">
          <ErrorState message={apiError(error, 'Este aliado no existe o ya no está publicado.')} />
          <div className="mt-6 text-center">
            <Link to="/aliados" className="btn-ghost btn-md">
              Ver el directorio
            </Link>
          </div>
        </div>
      </PublicShell>
    )
  }

  const logo = assetUrl(partner.logoUrl)
  const cover = assetUrl(partner.photoUrl)
  const whatsapp = partner.whatsappNumber?.replace(/\D/g, '')

  const links = [
    { url: partner.websiteUrl, icon: Globe, label: 'Sitio web' },
    { url: partner.instagramUrl, icon: AtSign, label: 'Instagram' },
    { url: partner.facebookUrl, icon: ThumbsUp, label: 'Facebook' },
  ].filter((link) => !!link.url)

  const handleSave = async () => {
    await save.mutateAsync(partner.id)
    setSaved(true)
  }

  return (
    <PublicShell>
      {/* --- Portada --- */}
      <div className="relative h-40 overflow-hidden bg-carbon-950 sm:h-56">
        {cover ? (
          <img src={cover} alt="" className="size-full object-cover opacity-70" />
        ) : (
          <>
            <div className="grid-noise absolute inset-0 opacity-60" />
            <div
              className="absolute -right-20 -top-24 size-[26rem] rounded-full opacity-40 blur-3xl"
              style={{ background: 'radial-gradient(circle, #a90b0b 0%, transparent 65%)' }}
            />
          </>
        )}
      </div>

      <div className="container-app pb-12">
        <Link
          to="/aliados"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-carbon-500 transition hover:text-brand-600"
        >
          <ChevronLeft className="size-4" />
          Directorio
        </Link>

        <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_20rem]">
          {/* --- Identidad y detalle --- */}
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white text-carbon-400 ring-1 ring-carbon-100 shadow-card">
                {logo ? (
                  <img src={logo} alt="" className="size-full object-cover" />
                ) : (
                  <span className="font-display text-2xl font-bold text-brand-600">
                    {partner.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl">{partner.name}</h1>
                  {partner.isVerified && (
                    <span className="chip-brand">
                      <BadgeCheck className="size-3.5" />
                      Verificado
                    </span>
                  )}
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-sm text-carbon-500">
                  <MapPin className="size-4" />
                  {partner.address ? `${partner.address}, ` : ''}
                  {partner.cities.join(' · ') || 'Sin ciudad registrada'}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {partner.categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/aliados?categoria=${category.slug}`}
                      className="chip-neutral transition hover:ring-brand-300"
                    >
                      <CategoryIcon icon={category.icon} className="size-3.5" />
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {partner.description && (
              <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-carbon-600">
                {partner.description}
              </p>
            )}

            {/* --- A quién atiende --- */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="card card-pad">
                <h3 className="text-sm">Vehículos que atiende</h3>
                <p className="mt-1.5 text-sm text-carbon-600">
                  {partner.vehicleTypes.length === 0
                    ? 'Todo tipo de vehículo.'
                    : partner.vehicleTypes.map((type) => vehicleTypeLabels[type]).join(', ')}
                </p>
              </div>

              <div className="card card-pad">
                <h3 className="text-sm">Marcas</h3>
                <p className="mt-1.5 text-sm text-carbon-600">
                  {partner.brands.length === 0 ? 'Todas las marcas.' : partner.brands.join(', ')}
                </p>
              </div>
            </div>

            {/* --- Sedes --- */}
            {partner.locations.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-base">Otras sedes</h3>
                <ul className="space-y-2">
                  {partner.locations.map((location, index) => (
                    <li key={index} className="card flex items-start gap-3 p-4">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-carbon-50 text-carbon-500">
                        <MapPin className="size-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-carbon-900">
                          {location.name ?? location.city ?? 'Sede'}
                        </p>
                        <p className="text-xs text-carbon-500">
                          {[location.address, location.city, location.department]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        {location.phone && (
                          <p className="mt-0.5 text-xs text-carbon-500">Tel. {location.phone}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-6 text-xs text-carbon-400">
              Aliado de Rueda Al Día desde {formatDate(partner.memberSinceUtc, 'MMMM yyyy')}.
            </p>
          </div>

          {/* --- Contacto --- */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="card card-pad">
              <h3 className="text-base">Contacto</h3>

              <div className="mt-4 space-y-2">
                {partner.phone && (
                  <a href={`tel:${partner.phone}`} className="btn-dark btn-md w-full">
                    <Phone className="size-4" />
                    {partner.phone}
                  </a>
                )}

                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost btn-md w-full"
                  >
                    <MessageCircle className="size-4" />
                    Escribir por WhatsApp
                  </a>
                )}

                {partner.acceptsAppointments && partner.appointmentUrl && (
                  <a
                    href={partner.appointmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary btn-md w-full"
                  >
                    <CalendarCheck className="size-4" />
                    Agendar cita
                  </a>
                )}
              </div>

              {(partner.scheduleNote || partner.offersHomeService) && (
                <div className="mt-4 space-y-2 border-t border-carbon-100 pt-4 text-sm text-carbon-600">
                  {partner.scheduleNote && (
                    <p className="flex items-start gap-2">
                      <Clock className="mt-0.5 size-4 shrink-0 text-carbon-400" />
                      {partner.scheduleNote}
                    </p>
                  )}
                  {partner.offersHomeService && (
                    <p className="flex items-start gap-2 text-ok-700">
                      <Truck className="mt-0.5 size-4 shrink-0" />
                      Atiende a domicilio o tiene servicio de grúa.
                    </p>
                  )}
                </div>
              )}

              {links.length > 0 && (
                <div className="mt-4 flex gap-2 border-t border-carbon-100 pt-4">
                  {links.map(({ url, icon: Icon, label }) => (
                    <a
                      key={label}
                      href={url!}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      title={label}
                      className="flex size-10 items-center justify-center rounded-xl bg-carbon-50 text-carbon-500 transition hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Icon className="size-[18px]" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* --- Guardar en la libreta del usuario --- */}
            <div className="card card-pad mt-3">
              {isAuthenticated ? (
                <>
                  <p className="text-sm text-carbon-600">
                    Guárdalo en tu directorio y podrás asociarle los servicios que te haga.
                  </p>
                  <Button
                    variant={saved ? 'soft' : 'ghost'}
                    block
                    className="mt-3"
                    loading={save.isPending}
                    disabled={saved}
                    onClick={handleSave}
                    icon={saved ? <Check className="size-4" /> : <BookmarkPlus className="size-4" />}
                  >
                    {saved ? 'Guardado en tus talleres' : 'Guardar en mis talleres'}
                  </Button>
                  {save.isError && (
                    <p className="field-error">{apiError(save.error, 'No pudimos guardarlo.')}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-carbon-600">
                    Con una cuenta de Rueda Al Día puedes guardar este taller y llevar el historial de
                    lo que te haga.
                  </p>
                  <Link to="/registro" className="btn-primary btn-md mt-3 w-full">
                    Crear cuenta gratis
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </PublicShell>
  )
}
