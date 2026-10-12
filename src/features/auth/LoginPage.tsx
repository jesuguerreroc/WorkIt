import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Alert } from '@/components/ui/Alert'
import { FormErrorSummary } from '@/components/ui/FormErrorSummary'
import { useValidatedForm } from '@/hooks/useValidatedForm'
import { getAuthErrorMessage, signIn } from '@/services/authService'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './authContext'
import { AuthDivider } from './AuthDivider'
import { GoogleSignInButton } from './GoogleSignInButton'
import { validateLogin } from './validation'

const FIELDS = ['email', 'password'] as const

export function LoginPage() {
  const [submitError, setSubmitError] = useState<string>()
  const { redirectError } = useAuth()
  const errorMessage = submitError ?? redirectError
  const { field, handleSubmit, submitting, summaryRef, summaryErrors } = useValidatedForm(
    { email: '', password: '' },
    validateLogin,
    FIELDS,
  )

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(undefined)
    try {
      await signIn({ email: values.email.trim(), password: values.password })
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error))
    }
  })

  return (
    <AuthLayout
      title="Hola de nuevo"
      description="Inicia sesión para continuar con tu entrenamiento."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-primary underline-offset-4 hover:underline">
            Crea una gratis
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <GoogleSignInButton onError={setSubmitError} disabled={submitting} />
        <AuthDivider />
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormErrorSummary ref={summaryRef} errors={summaryErrors} />
          {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

          <TextField
            label="Correo electrónico"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            {...field('email')}
          />
          <div className="flex flex-col gap-2">
            <TextField label="Contraseña" type="password" autoComplete="current-password" {...field('password')} />
            <Link
              to="/recuperar"
              className="self-end py-2 text-sm font-medium text-muted underline-offset-4 hover:text-fg hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" size="lg" loading={submitting}>
            Iniciar sesión
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
