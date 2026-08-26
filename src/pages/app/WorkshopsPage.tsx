import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, MapPin, NotebookPen, Phone, Star, Store, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Textarea, Toggle } from '@/components/ui/form'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { date as formatDate, money } from '@/lib/format'
import {
  useDeleteWorkshop,
  useSaveWorkshopNotes,
  useSetWorkshopSharing,
  useWorkshops,
} from '@/features/records/hooks'
import type { Workshop } from '@/lib/types'

/**
 * Talleres del usuario. Es una lista de aliados guardados del directorio, no una libreta que se
 * escriba a mano: la ficha del negocio la mantiene el propio aliado y aquí solo se guarda la
 * experiencia de cada usuario con él.
 */
export default function WorkshopsPage() {
  const { data, isLoading } = useWorkshops()
  const saveNotes = useSaveWorkshopNotes()
  const remove = useDeleteWorkshop()
  const sharing = useSetWorkshopSharing()

  const [editing, setEditing] = useState<Workshop | null>(null)
  const [toDelete, setToDelete] = useState<Workshop | null>(null)

  if (isLoading) return <Loading />

  const workshops = data ?? []

  const toggleFavorite = (workshop: Workshop) =>
    saveNotes.mutate({
      id: workshop.id,
      payload: {
        rating: workshop.rating,
        notes: workshop.notes,
        isFavorite: !workshop.isFavorite,
      },
    })

  return (
    <>
      <PageHeader
        title="Mis talleres"
        subtitle="Los aliados que guardaste, con el historial de lo que has gastado en cada uno."
        actions={
          <Link to="/aliados" className="btn-primary btn-md">
            <Store className="size-4" />
            Explorar aliados
          </Link>
        }
      />

      {workshops.length === 0 ? (
        <EmptyState
          icon={<Store className="size-6" />}
          title="Todavía no has guardado talleres"
          description="Busca en el directorio de aliados el taller al que llevas tu vehículo y guárdalo aquí. Después podrás asociarle cada servicio y marcarlo como favorito."
          action={
            <Link to="/aliados" className="btn-primary btn-md">
              <Store className="size-4" />
              Explorar aliados
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workshops.map((workshop) => (
            <article key={workshop.id} className="card card-pad flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {workshop.partnerSlug ? (
                      <Link
                        to={`/aliados/${workshop.partnerSlug}`}
                        className="truncate font-display text-base font-semibold text-carbon-900 transition hover:text-brand-600"
                      >
                        {workshop.name}
                      </Link>
                    ) : (
                      <h3 className="truncate text-base">{workshop.name}</h3>
                    )}
                    {workshop.isVerified && (
                      <span title="Aliado verificado">
                        <BadgeCheck className="size-4 shrink-0 text-brand-600" />
                      </span>
                    )}
                  </div>
                  {workshop.specialty && (
                    <p className="mt-0.5 truncate text-xs text-carbon-500">{workshop.specialty}</p>
                  )}
                </div>

                {/* Marcar favorito es la acción principal de esta pantalla: va directo en la tarjeta. */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(workshop)}
                  disabled={saveNotes.isPending}
                  aria-pressed={workshop.isFavorite}
                  aria-label={workshop.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                  title={workshop.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-xl transition',
                    workshop.isFavorite
                      ? 'bg-warn-50 text-warn-500 hover:bg-warn-100'
                      : 'text-carbon-300 hover:bg-carbon-50 hover:text-warn-500',
                  )}
                >
                  <Star className={cn('size-5', workshop.isFavorite && 'fill-current')} />
                </button>
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-carbon-600">
                {workshop.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="size-3.5 shrink-0 text-carbon-400" />
                    <a href={`tel:${workshop.phone}`} className="hover:text-brand-600">
                      {workshop.phone}
                    </a>
                  </p>
                )}
                {(workshop.address || workshop.city) && (
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-carbon-400" />
                    <span className="min-w-0">
                      {[workshop.address, workshop.city].filter(Boolean).join(', ')}
                    </span>
                  </p>
                )}
              </div>

              <div
                className={cn(
                  'mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-carbon-50 px-3.5 py-3 text-center',
                  workshop.visitCount === 0 && 'opacity-60',
                )}
              >
                <div>
                  <p className="font-display text-base font-semibold text-carbon-900">{workshop.visitCount}</p>
                  <p className="text-[0.65rem] uppercase tracking-wide text-carbon-400">Servicios</p>
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-carbon-900">
                    {money(workshop.totalSpent)}
                  </p>
                  <p className="text-[0.65rem] uppercase tracking-wide text-carbon-400">Invertido</p>
                </div>
              </div>

              {/* Solo tiene sentido con un aliado detrás: es a él a quien se le autoriza escribir. */}
              {workshop.partnerId && (
                <div className="mt-3 rounded-2xl bg-carbon-50 p-3">
                  <Toggle
                    checked={workshop.shareWithPartner}
                    disabled={sharing.isPending}
                    onChange={(share) => sharing.mutate({ id: workshop.id, share })}
                    label="Permitirle escribirme"
                    description={
                      workshop.shareWithPartner
                        ? 'Guarda tus datos y te avisa cuando algo esté por vencerse.'
                        : 'Actívalo para recibir recordatorios de este taller.'
                    }
                  />
                </div>
              )}

              {workshop.notes && (
                <p className="mt-3 line-clamp-2 text-xs text-carbon-500">{workshop.notes}</p>
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs text-carbon-400">
                  {workshop.lastVisit ? `Última visita: ${formatDate(workshop.lastVisit)}` : 'Sin visitas aún'}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  {workshop.rating != null && (
                    <span className="chip-warn mr-1">
                      <Star className="size-3 fill-current" />
                      {workshop.rating}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(workshop)}
                    aria-label="Mis notas"
                    title="Calificación y notas"
                    className="rounded-lg p-1.5 text-carbon-400 transition hover:bg-carbon-50 hover:text-brand-600"
                  >
                    <NotebookPen className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(workshop)}
                    aria-label="Quitar de mis talleres"
                    className="rounded-lg p-1.5 text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <NotesModal
          workshop={editing}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            await saveNotes.mutateAsync({ id: editing.id, payload })
            setEditing(null)
          }}
          saving={saveNotes.isPending}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Quitar taller"
        message={`Se quitará "${toDelete?.name}" de tus talleres. Los servicios ya registrados se conservan.`}
        confirmLabel="Quitar"
        loading={remove.isPending}
        onConfirm={async () => {
          if (toDelete) await remove.mutateAsync(toDelete.id)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}

interface NotesModalProps {
  workshop: Workshop
  onClose: () => void
  onSave: (payload: { rating: number | null; isFavorite: boolean; notes: string | null }) => Promise<void>
  saving: boolean
}

/**
 * Lo que el usuario aporta sobre un taller: qué tal le fue y qué quiere recordar. El nombre y el
 * contacto vienen del perfil del aliado, así que se muestran pero no se editan.
 */
function NotesModal({ workshop, onClose, onSave, saving }: NotesModalProps) {
  const [rating, setRating] = useState(workshop.rating?.toString() ?? '')
  const [isFavorite, setIsFavorite] = useState(workshop.isFavorite)
  const [notes, setNotes] = useState(workshop.notes ?? '')
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    try {
      await onSave({
        rating: rating ? Number(rating) : null,
        isFavorite,
        notes: notes.trim() || null,
      })
    } catch (err) {
      setError(apiError(err, 'No pudimos guardar tus notas.'))
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={workshop.name}
      description="Tu experiencia con este taller. Solo la ves tú."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-xl bg-danger-50 px-4 py-2.5 text-sm text-danger-700">{error}</p>}

        <Field label="Calificación" hint="De 1 a 5. Déjalo vacío si aún no lo has calificado.">
          <Input
            type="number"
            min={1}
            max={5}
            placeholder="4"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
          />
        </Field>

        <div className="rounded-2xl bg-carbon-50 px-4 py-3.5">
          <Toggle
            checked={isFavorite}
            onChange={setIsFavorite}
            label="Marcar como favorito"
            description="Aparece de primero al registrar un servicio."
          />
        </div>

        <Field label="Notas">
          <Textarea
            placeholder="Con quién preguntar, horarios, precios de referencia..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>

        {workshop.partnerSlug && (
          <p className="text-xs text-carbon-400">
            Los datos de contacto los mantiene el taller en{' '}
            <Link
              to={`/aliados/${workshop.partnerSlug}`}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              su ficha
            </Link>
            , así que siempre ves los actuales.
          </p>
        )}
      </div>
    </Modal>
  )
}
