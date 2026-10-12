import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Alert } from '@/components/ui/Alert'
import { FormErrorSummary } from '@/components/ui/FormErrorSummary'
import { useValidatedForm } from '@/hooks/useValidatedForm'
import { getAuthErrorMessage, register } from '@/services/authService'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './authContext'
import { AuthDivider } from './AuthDivider'
import { GoogleSignInButton } from './GoogleSignInButton'
import { PASSWORD_MIN_LENGTH, validateRegister } from './validation'

const FIELDS = ['email', 'password', 'confirmPassword'] as const

export function RegisterPage() {
  const [submitError, setSubmitError] = useState<string>()
  const { redirectError } = useAuth()
  const errorMessage = submitError ?? redirectError
  const { field, handleSubmit, submitting, summaryRef, summaryErrors } = useValidatedForm(
    { email: '', password: '', confirmPassword: '' },
    validateRegister,
    FIELDS,
  )

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(undefined)
    try {
      await register({ email: values.email.trim(), password: values.password })
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error))
    }
  })

  return (
    <AuthLayout
      title="Crea tu cuenta"
      description="Empieza a organizar tus rutinas y a registrar tu progreso."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Inicia sesión
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
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            hint={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres, con al menos una letra y un número.`}
            {...field('password')}
          />
          <TextField
            label="Repite la contraseña"
            type="password"
            autoComplete="new-password"
            {...field('confirmPassword')}
          />

          <Button type="submit" size="lg" loading={submitting}>
            Crear cuenta
          </Button>
          <p className="text-center text-sm text-muted">
            Después podrás configurar tu objetivo, tu nivel y tus días de entrenamiento.
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}
