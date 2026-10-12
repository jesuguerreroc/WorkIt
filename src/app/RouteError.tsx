import { isRouteErrorResponse, useRouteError } from 'react-router'
import { StatusScreen } from '@/pages/NotFoundPage'

/** Catches render/loader errors so a failure never leaves a blank screen. */
export function RouteError() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <StatusScreen code="404" title="Página no encontrada" text="La dirección no existe o se ha movido." />
  }

  if (import.meta.env.DEV) console.error(error)

  return (
    <StatusScreen
      code="Ups"
      title="Algo ha fallado"
      text="Se produjo un error inesperado. Recarga la página o vuelve al inicio."
    />
  )
}
