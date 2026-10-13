import { cn } from '@/lib/cn'

export type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'danger' | 'dangerGhost'
export type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,opacity] duration-150 ease-out ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:opacity-90',
  secondary:
    'border border-border-strong bg-surface-2 text-fg hover:border-control hover:bg-surface-3 active:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2 active:bg-surface-3',
  /** Dark button for use on primary-coloured surfaces. */
  inverse: 'bg-canvas text-fg hover:bg-surface-2 active:bg-surface-3',
  /** Destructive confirmations (delete, discard). */
  danger: 'bg-danger text-canvas hover:opacity-90 active:opacity-80',
  dangerGhost: 'text-danger hover:bg-danger-soft active:bg-danger-soft',
}

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-6 text-[0.9375rem]',
}

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}
