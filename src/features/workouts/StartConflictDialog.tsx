import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import type { useStartWorkout } from './useStartWorkout'

/** Shown when the user starts a session while another one is still in progress. */
export function StartConflictDialog({ starter }: { starter: ReturnType<typeof useStartWorkout> }) {
  const { conflict, busy, continueActive, discardAndStart, cancel } = starter
  return (
    <Dialog
      open={conflict !== null}
      onClose={cancel}
      title="Tienes un entrenamiento en curso"
      description={
        conflict && (
          <>
            «{conflict.active.routineName}» sigue abierto. Puedes continuarlo o descartarlo para empezar{' '}
            {conflict.routine ? `«${conflict.routine.name}»` : 'uno nuevo'}. Si lo descartas, se perderán sus series.
          </>
        )
      }
      actions={
        <>
          <Button variant="ghost" onClick={discardAndStart} loading={busy}>
            Descartar y empezar
          </Button>
          <Button onClick={continueActive}>Continuar el que está en curso</Button>
        </>
      }
    />
  )
}
