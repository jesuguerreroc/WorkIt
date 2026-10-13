import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { FullScreenStatus } from '@/components/ui/FullScreenStatus'
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PublicOnly, RequireAuth } from './guards'
import { RootLayout } from './RootLayout'
import { RouteError } from './RouteError'

// Private pages are code-split: they (and the Firestore SDK they use) only
// download after sign-in, so the public landing stays light.
const lazyPage = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => ({
  lazy: async () => ({ Component: (await load())[name] }),
})

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    // Shown on a first visit straight to a lazy page while its code downloads.
    HydrateFallback: () => <FullScreenStatus variant="loading" title="Cargando…" />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        element: <PublicOnly />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/registro', element: <RegisterPage /> },
        ],
      },
      // Reachable signed in or out (e.g. from another device).
      { path: '/recuperar', element: <ForgotPasswordPage /> },
      {
        path: '/app',
        element: <RequireAuth />,
        children: [
          // Full-screen pages, outside the app navigation (focus mode).
          { path: 'bienvenida', ...lazyPage(() => import('@/features/profile/OnboardingPage'), 'OnboardingPage') },
          { path: 'entrenar/:id', ...lazyPage(() => import('@/features/workouts/WorkoutPage'), 'WorkoutPage') },
          {
            path: 'entrenar/:id/resumen',
            ...lazyPage(() => import('@/features/workouts/WorkoutSummaryPage'), 'WorkoutSummaryPage'),
          },
          {
            element: <AppShell />,
            children: [
              { index: true, ...lazyPage(() => import('@/features/dashboard/DashboardPage'), 'DashboardPage') },
              { path: 'rutinas', ...lazyPage(() => import('@/features/routines/RoutinesPage'), 'RoutinesPage') },
              { path: 'rutinas/:id', ...lazyPage(() => import('@/features/routines/RoutineDetailPage'), 'RoutineDetailPage') },
              { path: 'rutinas/nueva', ...lazyPage(() => import('@/features/routines/RoutineEditorPage'), 'RoutineEditorPage') },
              { path: 'rutinas/:id/editar', ...lazyPage(() => import('@/features/routines/RoutineEditorPage'), 'RoutineEditorPage') },
              { path: 'ejercicios', ...lazyPage(() => import('@/features/exercises/ExerciseLibraryPage'), 'ExerciseLibraryPage') },
              {
                path: 'ejercicios/nuevo',
                ...lazyPage(() => import('@/features/exercises/CustomExerciseFormPage'), 'CustomExerciseFormPage'),
              },
              {
                path: 'ejercicios/propios/:id/editar',
                ...lazyPage(() => import('@/features/exercises/CustomExerciseFormPage'), 'CustomExerciseFormPage'),
              },
              {
                path: 'ejercicios/:source/:id',
                ...lazyPage(() => import('@/features/exercises/ExerciseDetailPage'), 'ExerciseDetailPage'),
              },
              { path: 'racha', ...lazyPage(() => import('@/features/streaks/StreakPage'), 'StreakPage') },
              { path: 'progreso', ...lazyPage(() => import('@/features/progress/ProgressPage'), 'ProgressPage') },
              { path: 'historial/:id', ...lazyPage(() => import('@/features/progress/WorkoutDetailPage'), 'WorkoutDetailPage') },
              { path: 'perfil', ...lazyPage(() => import('@/features/profile/ProfilePage'), 'ProfilePage') },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
