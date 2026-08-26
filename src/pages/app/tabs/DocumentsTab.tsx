import { useRef, useState } from 'react'
import { FileText, Loader2, Paperclip, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { apiError, assetUrl, uploadFile } from '@/lib/api'
import { cn } from '@/lib/cn'
import { addMonthsIso, date as formatDate, money, relativeDays, todayIso } from '@/lib/format'
import { documentTypeLabels, toOptions } from '@/lib/labels'
import {
  useDeleteDocument,
  useDocuments,
  useRenewDocument,
  useSaveDocument,
} from '@/features/records/hooks'
import type { DocumentType, VehicleDetail, VehicleDocument } from '@/lib/types'

/** Vigencia típica de cada documento: precarga la fecha de vencimiento al elegir el tipo. */
const defaultMonths: Partial<Record<DocumentType, number>> = {
  Soat: 12,
  TechnicalInspection: 12,
  InsurancePolicy: 12,
  VehicleTax: 12,
  DriverLicense: 120,
  GasCertificate: 12,
  SafetyKit: 12,
}

export function DocumentsTab({ vehicle }: { vehicle: VehicleDetail }) {
  const { data, isLoading } = useDocuments(vehicle.id)
  const save = useSaveDocument(vehicle.id)
  const renew = useRenewDocument(vehicle.id)
  const remove = useDeleteDocument(vehicle.id)

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit' | 'renew'>('create')
  const [current, setCurrent] = useState<VehicleDocument | null>(null)
  const [toDelete, setToDelete] = useState<VehicleDocument | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    type: 'Soat' as DocumentType,
    name: '',
    number: '',
    issuer: '',
    issueDate: todayIso(),
    expiryDate: addMonthsIso(todayIso(), 12),
    cost: '',
    fileUrl: '' as string | null,
    notes: '',
    remindDaysBefore: '30',
  })

  const openNew = () => {
    setMode('create')
    setCurrent(null)
    setForm({
      type: 'Soat',
      name: '',
      number: '',
      issuer: '',
      issueDate: todayIso(),
      expiryDate: addMonthsIso(todayIso(), 12),
      cost: '',
      fileUrl: '',
      notes: '',
      remindDaysBefore: '30',
    })
    setError('')
    setOpen(true)
  }

  const openEdit = (document: VehicleDocument) => {
    setMode('edit')
    setCurrent(document)
    setForm({
      type: document.type,
      name: document.name,
      number: document.number ?? '',
      issuer: document.issuer ?? '',
      issueDate: document.issueDate ?? todayIso(),
      expiryDate: document.expiryDate,
      cost: document.cost?.toString() ?? '',
      fileUrl: document.fileUrl ?? '',
      notes: document.notes ?? '',
      remindDaysBefore: String(document.remindDaysBefore),
    })
    setError('')
    setOpen(true)
  }

  const openRenew = (document: VehicleDocument) => {
    setMode('renew')
    setCurrent(document)
    const issue = todayIso()
    setForm({
      type: document.type,
      name: document.name,
      number: '',
      issuer: document.issuer ?? '',
      issueDate: issue,
      expiryDate: addMonthsIso(issue, defaultMonths[document.type] ?? 12),
      cost: '',
      fileUrl: '',
      notes: '',
      remindDaysBefore: String(document.remindDaysBefore),
    })
    setError('')
    setOpen(true)
  }

  const handleType = (type: DocumentType) => {
    const months = defaultMonths[type]
    setForm((previous) => ({
      ...previous,
      type,
      expiryDate: months ? addMonthsIso(previous.issueDate || todayIso(), months) : previous.expiryDate,
    }))
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      setForm((previous) => ({ ...previous, fileUrl: '' }))
      const url = await uploadFile(file, 'documents')
      setForm((previous) => ({ ...previous, fileUrl: url }))
    } catch (err) {
      setError(apiError(err, 'No pudimos subir el archivo.'))
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    setError('')

    if (!form.expiryDate) {
      setError('La fecha de vencimiento es obligatoria.')
      return
    }

    const payload = {
      type: form.type,
      name: form.name || null,
      number: form.number || null,
      issuer: form.issuer || null,
      issueDate: form.issueDate || null,
      expiryDate: form.expiryDate,
      cost: form.cost ? Number(form.cost) : null,
      fileUrl: form.fileUrl || null,
      notes: form.notes || null,
      remindDaysBefore: Number(form.remindDaysBefore) || 30,
    }

    try {
      if (mode === 'renew' && current) {
        await renew.mutateAsync({ id: current.id, payload })
      } else {
        await save.mutateAsync({ id: mode === 'edit' ? current?.id : undefined, payload })
      }
      setOpen(false)
    } catch (err) {
      setError(apiError(err))
    }
  }

  if (isLoading) return <Loading />

  const documents = data ?? []

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Documentos</h2>
          <p className="text-sm text-carbon-500">SOAT, tecnomecánica, póliza, impuesto y licencia.</p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={openNew}>
          Agregar documento
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-6" />}
          title="Sin documentos cargados"
          description="Registra el SOAT y la tecnomecánica para que te avisemos antes de que se venzan."
          action={
            <Button icon={<Plus className="size-4" />} onClick={openNew}>
              Agregar documento
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((document) => {
            const expired = document.daysToExpire < 0
            const soon = !expired && document.daysToExpire <= document.remindDaysBefore

            return (
              <article
                key={document.id}
                className={cn(
                  'card card-pad flex flex-col',
                  expired && 'ring-danger-200',
                  soon && 'ring-warn-200',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => openEdit(document)} className="min-w-0 flex-1 text-left">
                    <h3 className="truncate text-base">{document.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-carbon-500">
                      {document.issuer ?? documentTypeLabels[document.type]}
                      {document.number ? ` · ${document.number}` : ''}
                    </p>
                  </button>

                  <span className={expired ? 'chip-danger' : soon ? 'chip-warn' : 'chip-ok'}>
                    {expired ? 'Vencido' : soon ? 'Por vencer' : 'Vigente'}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-carbon-50 px-3.5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-carbon-400">Vence</p>
                  <p className="mt-0.5 font-display text-lg font-semibold text-carbon-900">
                    {formatDate(document.expiryDate)}
                  </p>
                  <p className={cn('text-xs font-medium', expired ? 'text-danger-600' : 'text-carbon-500')}>
                    {relativeDays(document.daysToExpire)}
                  </p>
                </div>

                {document.cost != null && (
                  <p className="mt-3 text-xs text-carbon-500">Costó {money(document.cost)}</p>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-carbon-100 pt-3">
                  <Button
                    size="sm"
                    variant="soft"
                    icon={<RefreshCw className="size-3.5" />}
                    onClick={() => openRenew(document)}
                  >
                    Renovar
                  </Button>

                  {document.fileUrl && (
                    <a
                      href={assetUrl(document.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost btn-sm"
                    >
                      <Paperclip className="size-3.5" />
                      Ver
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setToDelete(document)}
                    aria-label="Eliminar"
                    className="ml-auto rounded-lg p-2 text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === 'renew' ? 'Renovar documento' : mode === 'edit' ? 'Editar documento' : 'Nuevo documento'}
        description={
          mode === 'renew'
            ? 'El documento anterior se archiva y queda en el historial del vehículo.'
            : 'Guarda la vigencia y, si quieres, una foto del documento.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} loading={save.isPending || renew.isPending}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <p className="rounded-xl bg-danger-50 px-4 py-2.5 text-sm text-danger-700">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" required>
              <Select
                options={toOptions(documentTypeLabels)}
                value={form.type}
                disabled={mode === 'renew'}
                onChange={(event) => handleType(event.target.value as DocumentType)}
              />
            </Field>

            <Field label="Entidad" hint="Aseguradora o CDA.">
              <Input
                placeholder="Seguros Bolívar"
                value={form.issuer}
                onChange={(event) => setForm({ ...form, issuer: event.target.value })}
              />
            </Field>

            <Field label="Número">
              <Input
                placeholder="Número de póliza o certificado"
                value={form.number}
                onChange={(event) => setForm({ ...form, number: event.target.value })}
              />
            </Field>

            <Field label="Costo">
              <Input
                type="number"
                suffix="COP"
                value={form.cost}
                onChange={(event) => setForm({ ...form, cost: event.target.value })}
              />
            </Field>

            <Field label="Fecha de expedición">
              <Input
                type="date"
                value={form.issueDate}
                onChange={(event) => setForm({ ...form, issueDate: event.target.value })}
              />
            </Field>

            <Field label="Fecha de vencimiento" required>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(event) => setForm({ ...form, expiryDate: event.target.value })}
              />
            </Field>

            <Field label="Avisar con" hint="Días de anticipación.">
              <Input
                type="number"
                suffix="días"
                value={form.remindDaysBefore}
                onChange={(event) => setForm({ ...form, remindDaysBefore: event.target.value })}
              />
            </Field>

            <Field label="Archivo" hint="Foto o PDF del documento.">
              <input
                ref={fileInput}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="ghost"
                block
                onClick={() => fileInput.current?.click()}
                icon={uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
              >
                {form.fileUrl ? 'Archivo cargado' : 'Subir archivo'}
              </Button>
            </Field>
          </div>

          <Field label="Notas">
            <Textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar documento"
        message={`Se borrará "${toDelete?.name}" y sus alertas.`}
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
