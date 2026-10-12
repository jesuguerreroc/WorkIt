import { describe, expect, it } from 'vitest'
import { validateEmail, validateLogin, validateNewPassword, validateRegister, validateReset } from './validation'

describe('validateEmail', () => {
  it('requires a value', () => {
    expect(validateEmail('')).toBeDefined()
    expect(validateEmail('   ')).toBeDefined()
  })

  it('rejects malformed addresses', () => {
    for (const value of ['ana', 'ana@', 'ana@correo', '@correo.com', 'ana maria@correo.com']) {
      expect(validateEmail(value), value).toBeDefined()
    }
  })

  it('accepts valid addresses and ignores surrounding spaces', () => {
    expect(validateEmail('ana@correo.com')).toBeUndefined()
    expect(validateEmail('  ana.lopez+gym@correo.es ')).toBeUndefined()
  })
})

describe('validateNewPassword', () => {
  it('enforces minimum length', () => {
    expect(validateNewPassword('abc12')).toMatch(/8 caracteres/)
  })

  it('requires letters and numbers', () => {
    expect(validateNewPassword('abcdefgh')).toBeDefined()
    expect(validateNewPassword('12345678')).toBeDefined()
  })

  it('accepts accented letters', () => {
    expect(validateNewPassword('fuerzaé12')).toBeUndefined()
  })
})

describe('form validators', () => {
  it('login only checks password presence', () => {
    expect(validateLogin({ email: 'ana@correo.com', password: 'x' })).toEqual({})
    expect(validateLogin({ email: '', password: '' })).toHaveProperty('password')
  })

  it('register detects mismatched confirmation', () => {
    const errors = validateRegister({
      email: 'ana@correo.com',
      password: 'Fuerza2026',
      confirmPassword: 'Fuerza2025',
    })
    expect(Object.keys(errors)).toEqual(['confirmPassword'])
  })

  it('register returns no errors for valid input', () => {
    expect(
      validateRegister({ email: 'ana@correo.com', password: 'Fuerza2026', confirmPassword: 'Fuerza2026' }),
    ).toEqual({})
  })

  it('reset validates the email', () => {
    expect(validateReset({ email: 'nope' })).toHaveProperty('email')
  })
})
