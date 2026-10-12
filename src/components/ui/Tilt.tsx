import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface TiltProps {
  children: ReactNode
  className?: string
  /** Classes for the rotating inner surface. */
  surfaceClassName?: string
}

/**
 * Follows the pointer with a subtle 3D tilt and exposes --px/--py (-0.5..0.5)
 * so children can add parallax (.parallax-near / .parallax-far).
 * Only active for fine pointers with hover and without reduced motion; otherwise static.
 */
export function Tilt({ children, className, surfaceClassName }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const query = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    if (!query.matches) return

    let frame = 0
    const set = (x: number, y: number) => {
      element.style.setProperty('--px', x.toFixed(3))
      element.style.setProperty('--py', y.toFixed(3))
    }
    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => set(x, y))
    }
    const onLeave = () => {
      cancelAnimationFrame(frame)
      set(0, 0)
    }

    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div ref={ref} className={cn('group/tilt [perspective:1200px]', className)}>
      <div className={cn('tilt-surface h-full', surfaceClassName)}>{children}</div>
    </div>
  )
}
