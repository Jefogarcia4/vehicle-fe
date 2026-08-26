import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea, Toggle } from '@/components/ui/form'
import { apiError } from '@/lib/api'
import { useSaveCustomer } from './hooks'
import type { Customer } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  /** Cliente a editar. Sin él, el formulario crea uno nuevo. */
  customer?: Customer
  onSaved?: (customer: Customer) => void
}

const empty = {
  fullName: '',
  email: '',
  phone: '',
  documentId: '',
  city: '',
  address: '',
  notes: '',
  lastVisitDate: '',
}

/** Alta y edición de un cliente. */
export function CustomerFormModal({ open, onClose, customer, onSaved }: Props) {
  const save = useSaveCustomer()
  const [error, setError] = useState('')

  const [form, setForm] = useState(() =>
    customer
      ? {
          fullName: customer.fullName,
          email: customer.email ?? '',
          phone: customer.phone ?? '',
          documentId: customer.documentId ?? '',
          city: customer.city ?? '',
          address: customer.address ?? '',
          notes: customer.notes ?? '',
          lastVisitDate: customer.lastVisitDate ?? '',
        }
      : empty,
  )
  const [acceptsMarketing, setAcceptsMarketing] = useState(customer?.acceptsMarketing ?? true)

  const submit = async () => {
    setError('')

    if (form.fullName.trim().length < 3) {
      setError('Escribe el nombre del cliente.')
      return
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError('Necesitas al menos un correo o un celular para poder contactarlo.')
      return
    }

    try {
      const saved = await save.mutateAsync({
        id: customer?.id,
        payload: {
          fullName: form.fullName.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          documentId: form.documentId.trim() || null,
          city: form.city.trim() || null,
          address: form.address.trim() || null,
          notes: form.notes.trim() || null,
          lastVisitDate: form.lastVisitDate || null,
          acceptsMarketing,
          isActive: customer?.isActive ?? true,
        },
      })
      onSaved?.(saved)
      onClose()
    } catch (err) {
      setError(apiError(err, 'No pudimos guardar el cliente.'))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? 'Editar cliente' : 'Nuevo cliente'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      {error && <p className="field-error mb-3">{error}</p>}

      <div className="space-y-4">
        <Field label="Nombre completo" required>
          <Input
            placeholder="Carlos Medina"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correo" hint="Para enviarle campañas por correo.">
            <Input
              type="email"
              placeholder="carlos@ejemplo.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Celular" hint="También se usa para WhatsApp.">
            <Input
              placeholder="300 000 0000"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Documento o NIT">
            <Input
              value={form.documentId}
              onChange={(event) => setForm({ ...form, documentId: event.target.value })}
            />
          </Field>
          <Field label="Ciudad">
            <Input
              placeholder="Bogotá"
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Dirección">
            <Input
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </Field>
          <Field label="Última visita">
            <Input
              type="date"
              value={form.lastVisitDate}
              onChange={(event) => setForm({ ...form, lastVisitDate: event.target.value })}
            />
          </Field>
        </div>

        <Field label="Notas">
          <Textarea
            rows={2}
            placeholder="Prefiere que lo llamen en la mañana. Siempre pide repuesto original."
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </Field>

        {/* El consentimiento no es un campo más: sin él el cliente no entra a ninguna campaña. */}
        <div className="rounded-2xl bg-carbon-50 p-4">
          <Toggle
            checked={acceptsMarketing}
            onChange={setAcceptsMarketing}
            label="Autorizó recibir recordatorios y promociones"
            description="Márcalo solo si el cliente realmente lo aceptó. Sin esto no entra a ninguna campaña."
          />
          {customer?.isUnsubscribed && (
            <p className="mt-3 flex items-start gap-2 text-xs text-danger-700">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              Este cliente se dio de baja por su cuenta. Volver a marcar la casilla no lo reactiva:
              solo él puede hacerlo.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
