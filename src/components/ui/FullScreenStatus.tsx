import type { ReactNode } from 'react'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { LogoMark } from './Logo'

interface FullScreenStatusProps {
  variant: 'loading' | 'error'
  title: string
  children?: ReactNode
}

/** Whole-screen state for app boot (session check) and blocking errors. */
export function FullScreenStatus({ variant, title, children }: FullScreenStatusProps) {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center"
      aria-busy={variant === 'loading' || undefined}
    >
      <LogoMark className="size-12" />
      <div role={variant === 'error' ? 'alert' : 'status'} className="flex flex-col items-center gap-2">
        <p className="flex items-center gap-2 font-semibold">
          {variant === 'loading' ? (
            <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
          ) : (
            <CircleAlert className="size-5 text-danger" aria-hidden="true" />
          )}
          {title}
        </p>
        {children && <div className="max-w-sm text-muted">{children}</div>}
      </div>
    </main>
  )
}
