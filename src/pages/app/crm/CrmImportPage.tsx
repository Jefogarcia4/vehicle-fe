import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Textarea, Toggle } from '@/components/ui/form'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useImportTemplate, usePreviewImport, useRunImport } from '@/features/crm/hooks'
import type { ImportPreview } from '@/lib/types'

/**
 * Carga masiva de clientes. Se hace en dos pasos a propósito: primero se muestra qué haría el
 * archivo, y solo entonces se confirma. Descubrir los errores después de escribir en la base
 * obligaría a limpiar a mano.
 */
export default function CrmImportPage() {
  const navigate = useNavigate()
  const { data: template } = useImportTemplate()
  const preview = usePreviewImport()
  const run = useRunImport()

  const [csv, setCsv] = useState('')
  const [assumeConsent, setAssumeConsent] = useState(false)
  const [result, setResult] = useState<ImportPreview | null>(null)
  const [error, setError] = useState('')

  const readFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setResult(null)
    setCsv(await file.text())
  }

  const analyze = async () => {
    setError('')
    try {
      setResult(await preview.mutateAsync(csv))
    } catch (err) {
      setResult(null)
      setError(apiError(err, 'No pudimos leer el archivo.'))
    }
  }

  const confirm = async () => {
    setError('')
    try {
      const done = await run.mutateAsync({ csv, assumeConsent })
      navigate(
        `/app/crm?importado=${done.created + done.updated}`,
        { replace: true },
      )
    } catch (err) {
      setError(apiError(err, 'No pudimos importar el archivo.'))
    }
  }

  return (
    <>
      <PageHeader
        title="Importar clientes"
        backTo="/app/crm"
        backLabel="Clientes"
        subtitle="Trae la base que ya tienes en Excel. Se detectan los repetidos por correo o celular."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <section className="card card-pad">
            <h2 className="text-base">1. Carga el archivo</h2>
            <p className="mt-1 text-sm text-carbon-500">
              Un CSV con una fila de encabezados. Puedes pegarlo directamente si prefieres.
            </p>

            <label className="btn-ghost btn-md mt-4">
              <Upload className="size-4" />
              Escoger archivo CSV
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(event) => readFile(event.target.files?.[0])}
              />
            </label>

            <Field className="mt-4" label="O pega el contenido">
              <Textarea
                rows={8}
                className="font-mono text-xs"
                placeholder={template ?? 'nombre,correo,celular,placa,soat...'}
                value={csv}
                onChange={(event) => {
                  setCsv(event.target.value)
                  setResult(null)
                }}
              />
            </Field>

            <div className="mt-4 rounded-2xl bg-carbon-50 p-4">
              <Toggle
                checked={assumeConsent}
                onChange={setAssumeConsent}
                label="Todos autorizaron recibir promociones"
                description="Úsalo solo si de verdad tienes ese consentimiento. La columna del archivo manda sobre esto."
              />
            </div>

            <Button
              className="mt-4"
              block
              disabled={csv.trim().length === 0}
              loading={preview.isPending}
              onClick={analyze}
            >
              Revisar archivo
            </Button>
          </section>

          {result && <PreviewResult preview={result} />}

          {result && result.totalRows > result.invalid && (
            <div className="card card-pad">
              <h2 className="text-base">2. Confirma</h2>
              <p className="mt-1 text-sm text-carbon-500">
                Se crearán {result.newCustomers} clientes y se completarán {result.updatedCustomers}.
                {result.invalid > 0 && ` Las ${result.invalid} filas con error se omiten.`}
              </p>
              <Button className="mt-4" block loading={run.isPending} onClick={confirm}>
                Importar {result.totalRows - result.invalid} filas
              </Button>
            </div>
          )}
        </div>

        {/* --- Formato --- */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <section className="card card-pad">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <FileSpreadsheet className="size-[18px]" />
              </span>
              <h3 className="text-base">Formato</h3>
            </div>

            <p className="mt-3 text-sm text-carbon-500">
              Solo el nombre es obligatorio, más un correo o un celular. El resto de columnas son
              opcionales y se reconocen por su nombre, en español o inglés.
            </p>

            <ul className="mt-3 space-y-1 text-xs text-carbon-600">
              {[
                'nombre · obligatorio',
                'correo, celular · al menos uno',
                'documento, ciudad, direccion',
                'placa, tipo, marca, modelo, anio',
                'kilometraje',
                'soat, tecnomecanica · fechas',
                'acepta · si / no',
              ].map((line) => (
                <li key={line} className="flex items-start gap-1.5">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-carbon-300" />
                  {line}
                </li>
              ))}
            </ul>

            <p className="mt-3 text-xs text-carbon-400">
              Un cliente con varios vehículos va en varias filas, repitiendo su correo o celular.
            </p>

            {template && (
              <Button
                variant="ghost"
                size="sm"
                block
                className="mt-4"
                onClick={() => {
                  setCsv(template)
                  setResult(null)
                }}
              >
                Usar el ejemplo
              </Button>
            )}
          </section>
        </aside>
      </div>
    </>
  )
}

function PreviewResult({ preview }: { preview: ImportPreview }) {
  const errors = preview.rows.filter((row) => row.error)

  return (
    <section className="card card-pad">
      <h2 className="text-base">Esto es lo que haría</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Tally label="Clientes nuevos" value={preview.newCustomers} tone="ok" />
        <Tally label="Se completan" value={preview.updatedCustomers} tone="brand" />
        <Tally label="Filas con error" value={preview.invalid} tone={preview.invalid ? 'danger' : 'neutral'} />
      </div>

      {preview.unknownColumns.length > 0 && (
        <p className="mt-4 text-xs text-carbon-500">
          Columnas que no se reconocieron y se van a ignorar:{' '}
          <span className="font-medium">{preview.unknownColumns.join(', ')}</span>
        </p>
      )}

      {errors.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-danger-700">Filas que se van a omitir</p>
          <ul className="space-y-1 text-xs text-carbon-600">
            {errors.slice(0, 8).map((row) => (
              <li key={row.line} className="flex gap-2">
                <span className="shrink-0 font-mono text-carbon-400">línea {row.line}</span>
                <span>{row.error}</span>
              </li>
            ))}
            {errors.length > 8 && (
              <li className="text-carbon-400">y {errors.length - 8} más...</li>
            )}
          </ul>
        </div>
      )}

      <div className="scrollbar-thin mt-4 max-h-72 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-carbon-100">
              <th className="table-head">Cliente</th>
              <th className="table-head">Contacto</th>
              <th className="table-head">Placa</th>
              <th className="table-head">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-carbon-50">
            {preview.rows.slice(0, 40).map((row) => (
              <tr key={row.line} className={cn(row.error && 'opacity-50')}>
                <td className="table-cell">{row.fullName ?? '—'}</td>
                <td className="table-cell text-xs">
                  {[row.email, row.phone].filter(Boolean).join(' · ') || '—'}
                </td>
                <td className="table-cell font-mono text-xs">{row.plate ?? '—'}</td>
                <td className="table-cell">
                  <span
                    className={cn(
                      row.error ? 'chip-danger' : row.action === 'nuevo' ? 'chip-ok' : 'chip-brand',
                    )}
                  >
                    {row.error ? 'error' : row.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {preview.rows.length > 40 && (
          <p className="py-2 text-center text-xs text-carbon-400">
            Mostrando 40 de {preview.rows.length} filas.
          </p>
        )}
      </div>
    </section>
  )
}

function Tally({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'ok' | 'brand' | 'danger' | 'neutral'
}) {
  const tones = {
    ok: 'bg-ok-50 text-ok-700',
    brand: 'bg-brand-50 text-brand-700',
    danger: 'bg-danger-50 text-danger-700',
    neutral: 'bg-carbon-50 text-carbon-600',
  }

  return (
    <div className={cn('rounded-2xl px-4 py-3', tones[tone])}>
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium">
        {tone === 'ok' && value > 0 && <CheckCircle2 className="size-3.5" />}
        {label}
      </p>
    </div>
  )
}
