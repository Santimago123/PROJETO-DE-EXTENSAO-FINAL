'use server'

import config from '@payload-config'
import { operatorAuth } from '@/lib/app-auth'
import { getPayload } from 'payload'
import {
  operatorStatuses,
  type OperatorActionState,
  type OperatorStatus,
} from './operator-action-state'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function operatorLogin(
  _previous: OperatorActionState,
  formData: FormData,
): Promise<OperatorActionState> {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') || '')

  if (!emailPattern.test(email) || email.length > 254) {
    return { status: 'error', message: 'Informe um e-mail válido.' }
  }
  if (password.length < 6 || password.length > 128) {
    return { status: 'error', message: 'Informe sua senha de acesso.' }
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.login({
      collection: 'operators',
      data: { email, password },
    })

    if (!result.token || !result.user) {
      return { status: 'error', message: 'Não foi possível iniciar sua sessão.' }
    }

    await operatorAuth.setSession(result.token)
    return { status: 'success', message: 'Acesso autorizado.' }
  } catch {
    return { status: 'error', message: 'E-mail ou senha incorretos.' }
  }
}

export async function operatorLogout(): Promise<OperatorActionState> {
  await operatorAuth.clearSession()
  return { status: 'success', message: 'Sessão encerrada.' }
}

export async function updateRequestStatus(
  requestId: string,
  nextStatus: string,
): Promise<OperatorActionState> {
  const operator = await operatorAuth.currentUser()
  if (!operator) {
    await operatorAuth.clearSession()
    return { status: 'error', message: 'Sua sessão expirou. Entre novamente.' }
  }

  const id = requestId.trim()
  if (!id || id.length > 200) {
    return { status: 'error', message: 'Chamado inválido.' }
  }
  if (!operatorStatuses.includes(nextStatus as OperatorStatus)) {
    return { status: 'error', message: 'Selecione um status válido.' }
  }

  try {
    const payload = await getPayload({ config })
    await payload.update({
      collection: 'service-requests',
      id,
      data: { status: nextStatus as OperatorStatus },
      user: operator,
      overrideAccess: false,
    })
    return { status: 'success', message: 'Status atualizado com sucesso.' }
  } catch {
    return { status: 'error', message: 'Não foi possível atualizar o chamado.' }
  }
}
