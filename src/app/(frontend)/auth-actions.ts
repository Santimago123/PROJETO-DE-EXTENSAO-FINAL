'use server'

import config from '@payload-config'
import { appAuth } from '@/lib/app-auth'
import { getPayload } from 'payload'

export type PasswordActionState = {
  status: 'idle' | 'error' | 'success'
  message: string
}

export const initialPasswordActionState: PasswordActionState = {
  status: 'idle',
  message: '',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function requestPasswordReset(
  _previous: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase()

  if (!emailPattern.test(email) || email.length > 254) {
    return { status: 'error', message: 'Informe um e-mail válido.' }
  }

  try {
    const payload = await getPayload({ config })
    await payload.forgotPassword({
      collection: 'users',
      data: { email },
      overrideAccess: true,
    })

    return {
      status: 'success',
      message: 'Se houver uma conta com esse e-mail, você receberá o link em alguns minutos.',
    }
  } catch (error) {
    console.error('Falha ao solicitar recuperação de senha:', error)
    return {
      status: 'success',
      message: 'Se houver uma conta com esse e-mail, você receberá o link em alguns minutos.',
    }
  }
}

export async function resetPassword(
  _previous: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const token = String(formData.get('token') || '')
  const password = String(formData.get('password') || '')
  const confirmation = String(formData.get('passwordConfirmation') || '')

  if (!token) {
    return { status: 'error', message: 'Este link de recuperação é inválido.' }
  }
  if (password.length < 8) {
    return { status: 'error', message: 'A nova senha deve ter pelo menos 8 caracteres.' }
  }
  if (password !== confirmation) {
    return { status: 'error', message: 'As senhas não coincidem.' }
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.resetPassword({
      collection: 'users',
      data: { password, token },
      overrideAccess: true,
    })

    if (!result.token) {
      return { status: 'error', message: 'Não foi possível iniciar sua sessão.' }
    }

    await appAuth.setSession(result.token)
    return { status: 'success', message: 'Senha atualizada com sucesso.' }
  } catch {
    return {
      status: 'error',
      message: 'Este link é inválido ou expirou. Solicite um novo link de recuperação.',
    }
  }
}
