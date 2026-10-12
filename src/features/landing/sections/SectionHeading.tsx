import type { ReactNode } from 'react'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'

interface SectionHeadingProps {
  id: string
  eyebrow: string
  title: string
  children?: ReactNode
  className?: string
}

export function SectionHeading({ id, eyebrow, title, children, className }: SectionHeadingProps) {
  return (
    <Reveal className={cn('max-w-2xl', className)}>
      <p className="text-sm font-semibold tracking-widest text-primary uppercase">{eyebrow}</p>
      <h2
        id={id}
        className="mt-3 font-display text-4xl leading-[0.95] font-bold tracking-tight text-balance uppercase sm:text-5xl"
      >
        {title}
      </h2>
      {children && <div className="mt-4 text-lg text-muted">{children}</div>}
    </Reveal>
  )
}
