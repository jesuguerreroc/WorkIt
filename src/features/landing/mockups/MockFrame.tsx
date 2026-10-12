import type { ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/cn'

interface MockFrameProps {
  /** Accessible description of what the illustration shows. */
  label: string
  variant?: 'phone' | 'panel'
  className?: string
  children: ReactNode
}

/**
 * Wraps an illustrative screen. Exposed as a single image to assistive tech,
 * non-interactive, and always tagged "Ejemplo" so sample data is never read as real results.
 *
 * Sets `data-visible` once on screen; children animate with `group-data-[visible=true]/frame:*`.
 * Positioning belongs to the caller's wrapper: never pass `absolute`/`fixed` here.
 */
export function MockFrame({ label, variant = 'phone', className, children }: MockFrameProps) {
  const [ref, inView] = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-visible={inView}
      className={cn(
        'group/frame pointer-events-none relative shrink-0 overflow-hidden border border-border-strong bg-canvas shadow-2xl shadow-black/60 select-none',
        variant === 'phone' ? 'aspect-[9/17] w-72 rounded-[2.25rem] p-2.5' : 'rounded-2xl',
        className,
      )}
    >
      <div
        className={cn(
          'relative h-full overflow-hidden bg-surface',
          variant === 'phone' ? 'rounded-[1.75rem]' : 'rounded-[calc(1rem-1px)]',
        )}
      >
        {children}
        <span className="absolute top-3 right-3 rounded-full border border-border-strong bg-canvas/80 px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
          Ejemplo
        </span>
      </div>
    </div>
  )
}
