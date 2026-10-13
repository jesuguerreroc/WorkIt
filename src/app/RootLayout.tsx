import { Outlet, ScrollRestoration } from 'react-router'
import { AppStatus } from './AppStatus'

export function RootLayout() {
  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <AppStatus />
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
