import { Outlet, ScrollRestoration } from 'react-router'
import { AppStatus } from './AppStatus'

export function RootLayout() {
  return (
    <>
      <AppStatus />
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
