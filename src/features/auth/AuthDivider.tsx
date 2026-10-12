/** "o" separator between social sign-in and the email form. */
export function AuthDivider({ label = 'o con tu correo' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-border-strong" aria-hidden="true" />
      <span aria-hidden="true">{label}</span>
      <span className="h-px flex-1 bg-border-strong" aria-hidden="true" />
    </div>
  )
}
