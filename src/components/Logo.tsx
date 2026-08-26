import { cn } from '@/lib/cn'
import logoLockup from '@/assets/logo.png'
import logoMark from '@/assets/logo-mark.png'

type Size = 'sm' | 'md' | 'lg'

interface Props {
  className?: string
  /** En superficies oscuras el texto va en blanco. */
  variant?: 'dark' | 'light'
  /** sm para barras compactas, md para navegación, lg para pantallas de entrada. */
  size?: Size
  showWordmark?: boolean
}

/**
 * Marca de Rueda Al Día: la rueda de fibra de carbono con el calendario y el visto bueno.
 *
 * Sobre fondo claro se usa el logo completo tal cual llegó del diseño. Sobre fondo oscuro
 * no sirve: el "AL DÍA" está en fibra de carbono y desaparece contra el negro. Ahí se
 * combina el isotipo con el nombre escrito en texto, que sí se puede aclarar.
 */

/** El logo completo lleva el nombre dentro, así que necesita más alto que el isotipo solo. */
const lockupHeight: Record<Size, string> = {
  sm: 'h-9',
  md: 'h-12',
  lg: 'h-20',
}

const markHeight: Record<Size, string> = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-14',
}

const wordmarkText: Record<Size, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
}

export function Logo({ className, variant = 'dark', size = 'md', showWordmark = true }: Props) {
  const onDark = variant === 'light'

  if (!showWordmark) {
    return (
      <img src={logoMark} alt="Rueda Al Día" className={cn(markHeight[size], 'w-auto', className)} />
    )
  }

  if (!onDark) {
    return (
      <img
        src={logoLockup}
        alt="Rueda Al Día"
        className={cn(lockupHeight[size], 'w-auto', className)}
      />
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img src={logoMark} alt="" aria-hidden="true" className={cn(markHeight[size], 'w-auto')} />
      <span
        className={cn(
          'font-display font-bold uppercase leading-none tracking-tight',
          wordmarkText[size],
        )}
      >
        <span className="text-brand-400">Rueda</span>
        <span className="text-white"> Al Día</span>
      </span>
    </span>
  )
}
