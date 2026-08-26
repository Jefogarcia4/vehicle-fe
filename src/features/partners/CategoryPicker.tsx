import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Skeleton } from '@/components/ui/feedback'
import { CategoryIcon } from './CategoryIcon'
import { usePartnerCategories } from './hooks'

interface Props {
  value: string[]
  onChange: (ids: string[]) => void
  /** Cuántas categorías puede marcar. Más de un puñado deja de ser una especialidad. */
  max?: number
}

/**
 * Selector de categorías del aliado. Es la decisión más importante del registro: de esto
 * depende por qué alertas lo van a recomendar, así que cada opción muestra qué resuelve.
 */
export function CategoryPicker({ value, onChange, max = 6 }: Props) {
  const { data, isLoading } = usePartnerCategories()

  if (isLoading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    )
  }

  const categories = data ?? []
  const full = value.length >= max

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((current) => current !== id))
    else if (!full) onChange([...value, id])
  }

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {categories.map((category) => {
          const selected = value.includes(category.id)

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggle(category.id)}
              disabled={!selected && full}
              aria-pressed={selected}
              className={cn(
                'flex items-start gap-3 rounded-2xl px-3.5 py-3 text-left ring-1 transition',
                selected
                  ? 'bg-brand-50 ring-brand-300'
                  : 'bg-white ring-carbon-200 hover:ring-brand-200',
                !selected && full && 'cursor-not-allowed opacity-40 hover:ring-carbon-200',
              )}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-xl',
                  selected ? 'bg-brand-600 text-white' : 'bg-carbon-50 text-carbon-500',
                )}
              >
                {selected ? (
                  <Check className="size-[18px]" />
                ) : (
                  <CategoryIcon icon={category.icon} className="size-[18px]" />
                )}
              </span>

              <span className="min-w-0">
                <span
                  className={cn(
                    'block text-sm font-semibold',
                    selected ? 'text-brand-800' : 'text-carbon-800',
                  )}
                >
                  {category.name}
                </span>
                {category.description && (
                  <span className="mt-0.5 block text-xs leading-snug text-carbon-500">
                    {category.description}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-2 text-xs text-carbon-400">
        {value.length} de {max} seleccionadas.{' '}
        {full
          ? 'Quita una para elegir otra.'
          : 'Marca solo lo que realmente atiendes: es lo que dispara las recomendaciones.'}
      </p>
    </div>
  )
}
