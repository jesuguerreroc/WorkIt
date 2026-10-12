import { useEffect, useState } from 'react'
import { Dumbbell, ImageOff, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ExerciseImageProps {
  images: string[]
  alt: string
  /** Alternate the start/end frames to show the movement (detail view). */
  animated?: boolean
  /** "cover" crops to fill the box (cards); "contain" shows the whole photo (detail). */
  fit?: 'cover' | 'contain'
  className?: string
}

const FRAME_MS = 1000

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Demonstration image with a fixed 3:2 box (the source images are 850×567), so
 * cards never jump while loading. Falls back to a neutral placeholder when the
 * exercise has no images or they fail to load.
 */
export function ExerciseImage({ images, alt, animated = false, fit = animated ? 'contain' : 'cover', className }: ExerciseImageProps) {
  const [frame, setFrame] = useState(0)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(() => animated && !prefersReducedMotion())
  const canAnimate = animated && images.length > 1 && !failed

  useEffect(() => {
    if (!canAnimate || !playing) return
    const id = setInterval(() => setFrame((f) => (f + 1) % images.length), FRAME_MS)
    return () => clearInterval(id)
  }, [canAnimate, playing, images.length])

  const box = cn('relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-white', className)

  if (images.length === 0 || failed) {
    return (
      <div className={cn(box, 'flex flex-col items-center justify-center gap-2 bg-surface-2 text-subtle')}>
        {failed ? <ImageOff className="size-8" aria-hidden="true" /> : <Dumbbell className="size-8" aria-hidden="true" />}
        <span className="text-xs">{failed ? 'Imagen no disponible' : 'Sin imagen'}</span>
        <span className="sr-only">{alt}</span>
      </div>
    )
  }

  return (
    <div className={box}>
      {/* All frames are mounted so switching is instant; only the current one is visible. */}
      {(animated ? images : images.slice(0, 1)).map((src, index) => (
        <img
          key={src}
          src={src}
          alt={index === 0 ? alt : ''}
          aria-hidden={index === 0 ? undefined : true}
          loading="lazy"
          decoding="async"
          width={850}
          height={567}
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 size-full transition-opacity duration-200',
            fit === 'cover' ? 'object-cover' : 'object-contain',
            index === frame ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
      {canAnimate && (
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pausar demostración' : 'Reproducir demostración'}
          aria-pressed={playing}
          className="absolute right-2 bottom-2 flex size-11 items-center justify-center rounded-full bg-canvas/80 text-fg backdrop-blur hover:bg-canvas"
        >
          {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
        </button>
      )}
    </div>
  )
}
