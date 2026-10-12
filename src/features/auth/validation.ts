export type FieldErrors<K extends string> = Partial<Record<K, string>>

export const PASSWORD_MIN_LENGTH = 8

// Pragmatic check: one "@", no spaces, a dot in the domain. The auth provider
// performs the authoritative validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | undefined {
  const email = value.trim()
  if (!email) return 'Introduce tu correo electrónico.'
  if (!EMAIL_PATTERN.test(email)) return 'Introduce un correo válido, por ejemplo nombre@correo.com.'
  return undefined
}

export function validateNewPassword(value: string): string | undefined {
  if (!value) return 'Crea una contraseña.'
  if (value.length < PASSWORD_MIN_LENGTH)
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
  if (!/[A-Za-zÀ-ÿ]/.test(value) || !/\d/.test(value))
    return 'Incluye al menos una letra y un número.'
  return undefined
}

export type LoginFields = 'email' | 'password'
export type RegisterFields = 'email' | 'password' | 'confirmPassword'
export type ResetFields = 'email'

export function validateLogin(values: Record<LoginFields, string>): FieldErrors<LoginFields> {
  return compact({
    email: validateEmail(values.email),
    // Existing passwords are only checked for presence: rules may have changed since signup.
    password: values.password ? undefined : 'Introduce tu contraseña.',
  })
}

export function validateRegister(values: Record<RegisterFields, string>): FieldErrors<RegisterFields> {
  return compact({
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    confirmPassword: !values.confirmPassword
      ? 'Repite la contraseña.'
      : values.confirmPassword !== values.password
        ? 'Las contraseñas no coinciden.'
        : undefined,
  })
}

export function validateReset(values: Record<ResetFields, string>): FieldErrors<ResetFields> {
  return compact({ email: validateEmail(values.email) })
}

function compact<K extends string>(errors: Record<K, string | undefined>): FieldErrors<K> {
  const result: FieldErrors<K> = {}
  for (const key of Object.keys(errors) as K[]) {
    if (errors[key]) result[key] = errors[key]
  }
  return result
}
