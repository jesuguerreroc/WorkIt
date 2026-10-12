import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

/** Offline notice and "new version available" prompt (the app never reloads by itself). */
export function AppStatus() {
  const online = useOnline()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      {!online && (
        <p role="status" className="pointer-events-auto flex items-center gap-2 rounded-full bg-warning px-4 py-2 text-sm font-semibold text-canvas shadow-lg">
          <WifiOff className="size-4" aria-hidden="true" />
          Sin conexión. Tus series se guardan en el dispositivo y se sincronizarán al volver.
        </p>
      )}
      {needRefresh && (
        <div role="status" className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border-strong bg-surface-2 p-3 pl-4 text-sm shadow-xl">
          <RefreshCw className="size-4 text-primary" aria-hidden="true" />
          Hay una nueva versión de WorkIt.
          <Button size="md" onClick={() => void updateServiceWorker(true)}>
            Actualizar
          </Button>
          <button type="button" onClick={() => setNeedRefresh(false)} className="min-h-11 px-2 text-muted hover:text-fg">
            Luego
          </button>
        </div>
      )}
    </div>
  )
}
