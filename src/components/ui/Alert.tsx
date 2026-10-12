import type { ReactNode } from 'react'
import { CircleAlert, Info, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'info' | 'error' | 'success'

const tones: Record<Tone, { box: string; icon: typeof Info }> = {
  info: { box: 'border-border-strong bg-surface-2 text-fg', icon: Info },
  error: { box: 'border-danger/40 bg-danger-soft text-fg', icon: CircleAlert },
  success: { box: 'border-primary/40 bg-primary-soft text-fg', icon: CircleCheck },
}

interface AlertProps {
  tone?: Tone
  title?: string
  children: ReactNode
  className?: string
}

/** Inline status message. Errors are announced assertively, the rest politely. */
export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const { box, icon: Icon } = tones[tone]
  const iconColor = tone === 'error' ? 'text-danger' : tone === 'success' ? 'text-primary' : 'text-muted'

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-4 text-sm', box, className)}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', iconColor)} aria-hidden="true" />
      <div className="flex flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-muted">{children}</div>
      </div>
    </div>
  )
}
