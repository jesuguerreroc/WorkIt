import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children?: ReactNode
  /** Footer actions. */
  actions?: ReactNode
  /** "sheet" docks to the bottom on mobile (for long pickers). */
  variant?: 'dialog' | 'sheet'
  className?: string
}

/**
 * Modal built on the native <dialog>: the browser provides focus trapping,
 * Escape to close and the inert background. Focus returns to the opener on close.
 */
export function Dialog({ open, onClose, title, description, children, actions, variant = 'dialog', className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // Click on the backdrop (the dialog element itself, outside the panel) closes it.
      onClick={(event) => event.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      className={cn(
        'm-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-3xl glass-strong border border-border-strong p-0 text-fg shadow-2xl',
        'backdrop:bg-black/60 backdrop:backdrop-blur-md',
        variant === 'sheet' &&
          'max-sm:mb-0 max-sm:h-[92dvh] max-sm:max-h-[92dvh] max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none sm:max-w-2xl',
        className,
      )}
    >
      {open && (
        <div className={cn('flex max-h-[inherit] flex-col', variant === 'sheet' && 'max-sm:h-full')}>
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 id="dialog-title" className="text-lg leading-snug font-semibold">
                {title}
              </h2>
              {description && <div className="mt-1 text-sm text-muted">{description}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
          {actions && (
            <footer className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
              {actions}
            </footer>
          )}
        </div>
      )}
    </dialog>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  tone?: 'danger' | 'primary'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      actions={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} loading={busy} variant={tone === 'danger' ? 'danger' : 'primary'}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
