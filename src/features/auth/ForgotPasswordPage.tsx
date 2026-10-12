import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Alert } from '@/components/ui/Alert'
import { useValidatedForm } from '@/hooks/useValidatedForm'
import { getAuthErrorMessage, sendPasswordReset } from '@/services/authService'
import { AuthLayout } from './AuthLayout'
import { validateReset } from './validation'

const FIELDS = ['email'] as const

export function ForgotPasswordPage() {
  const [result, setResult] = useState<{ tone: 'success' | 'error'; message: string }>()
  const { field, handleSubmit, submitting } = useValidatedForm({ email: '' }, validateReset, FIELDS)

  const onSubmit = handleSubmit(async (values) => {
    setResult(undefined)
    try {
      await sendPasswordReset(values.email.trim())
      // Same wording whether or not the account exists, to avoid revealing registered emails.
      setResult({
        tone: 'success',
        message: 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.',
      })
    } catch (error) {
      setResult({ tone: 'error', message: getAuthErrorMessage(error) })
    }
  })

  return (
    <AuthLayout
      title="Recupera tu acceso"
      description="Te enviaremos un enlace para crear una nueva contraseña."
      footer={
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a iniciar sesión
        </Link>
      }
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {result && <Alert tone={result.tone}>{result.message}</Alert>}

        <TextField
          label="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          {...field('email')}
        />

        <Button type="submit" size="lg" loading={submitting}>
          Enviar enlace
        </Button>
      </form>
    </AuthLayout>
  )
}
