import { Link } from 'react-router'
import { cn } from '@/lib/cn'

/** Geometric "W" mark, shared with the favicon. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M7 10.5 10.6 22h2.2L16 13.4l3.2 8.6h2.2L25 10.5"
        fill="none"
        className="stroke-on-primary"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex min-h-11 items-center gap-2 rounded-lg', className)}
      aria-label="WorkIt, ir al inicio"
    >
      <LogoMark className="size-8" />
      <span className="font-display text-2xl font-bold tracking-wide uppercase">
        Work<span className="text-primary">It</span>
      </span>
    </Link>
  )
}
