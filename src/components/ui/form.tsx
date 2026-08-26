import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

interface FieldProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}

/** Envoltura común: etiqueta, ayuda y mensaje de error debajo del control. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-danger-500"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-carbon-400">{hint}</p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  /** Texto fijo a la derecha del control, p. ej. la unidad ("km", "gal"). */
  suffix?: string
}

export function Input({ className, error, suffix, ...props }: InputProps) {
  if (!suffix) return <input className={cn('input', error && 'input-error', className)} {...props} />

  return (
    <div className="relative">
      <input className={cn('input pr-12', error && 'input-error', className)} {...props} />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-carbon-400">
        {suffix}
      </span>
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export function Select({ className, error, options, placeholder, ...props }: SelectProps) {
  return (
    <select className={cn('input appearance-none pr-9', error && 'input-error', className)} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function Textarea({
  className,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={cn('input min-h-24 resize-y', error && 'input-error', className)} {...props} />
}

interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 text-left disabled:opacity-50"
    >
      <span
        className={cn(
          'mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'bg-brand-600' : 'bg-carbon-200',
        )}
      >
        <span
          className={cn(
            'size-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </span>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium text-carbon-800">{label}</span>}
          {description && <span className="block text-xs text-carbon-500">{description}</span>}
        </span>
      )}
    </button>
  )
}
