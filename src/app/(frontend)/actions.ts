'use server'

import config from '@payload-config'
import { appAuth } from '@/lib/app-auth'
import { getEarliestScheduleDate, isBusinessDate } from '@/lib/scheduling'
import { getPayload } from 'payload'

type ActionResult = {
  ok: boolean
  error?: string
  reset?: 'request' | 'session'
  user?: { id: string; name: string; email: string }
  request?: Record<string, unknown>
}

type MunicipalityResult = {
  ok: boolean
  name?: string
  error?: string
}

const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const MAX_PHOTOS_TOTAL_SIZE = 25 * 1024 * 1024

const text = (form: FormData, key: string) => String(form.get(key) || '').trim()

export async function resolveMunicipalityCode(value: string): Promise<MunicipalityResult> {
  const code = value.replace(/\D/g, '')
  if (code.length !== 7) return { ok: false, error: 'Código de município inválido.' }

  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${code}`,
      { next: { revalidate: 60 * 60 * 24 * 30 } },
    )
    if (!response.ok) return { ok: false, error: 'Município não encontrado.' }

    const municipality = await response.json() as { nome?: unknown }
    if (typeof municipality.nome !== 'string' || !municipality.nome.trim()) {
      return { ok: false, error: 'Município não encontrado.' }
    }
    return { ok: true, name: municipality.nome.trim() }
  } catch {
    return { ok: false, error: 'Não foi possível consultar o município agora.' }
  }
}

export async function authenticate(form: FormData): Promise<ActionResult> {
  const mode = text(form, 'mode')
  const email = text(form, 'email').toLowerCase()
  const password = text(form, 'password')
  const name = text(form, 'name')

  if (!email || password.length < 6 || (mode === 'signup' && !name)) {
    return { ok: false, error: 'Preencha os campos corretamente. A senha deve ter 6 caracteres.' }
  }

  try {
    const payload = await getPayload({ config })
    if (mode === 'signup') {
      await payload.create({
        collection: 'users',
        data: { email, password, name, phone: text(form, 'phone') },
        overrideAccess: false,
      })
    }
    const result = await payload.login({ collection: 'users', data: { email, password } })
    if (!result.token || !result.user) return { ok: false, error: 'Não foi possível iniciar sua sessão.' }
    await appAuth.setSession(result.token)
    return {
      ok: true,
      user: { id: String(result.user.id), name: String(result.user.name || name), email },
    }
  } catch {
    return { ok: false, error: mode === 'signup' ? 'Este e-mail já está em uso.' : 'E-mail ou senha incorretos.' }
  }
}

export async function logout() {
  await appAuth.clearSession()
  return { ok: true }
}

export async function createServiceRequest(form: FormData): Promise<ActionResult> {
  const user = await appAuth.currentUser()
  if (!user) {
    await appAuth.clearSession()
    return { ok: false, reset: 'session' }
  }

  const required = ['category', 'description', 'whatsapp', 'street', 'number', 'district', 'city', 'postalCode', 'scheduledFor']
  if (required.some((field) => !text(form, field))) {
    return { ok: false, error: 'Preencha todos os campos obrigatórios.' }
  }

  const whatsapp = text(form, 'whatsapp').replace(/\D/g, '')
  if (whatsapp.length < 10 || whatsapp.length > 13) {
    return { ok: false, error: 'Informe um número de WhatsApp válido, incluindo o DDD.' }
  }

  const files = form.getAll('photos').filter((item): item is File => item instanceof File && item.size > 0)
  if (files.length !== 5) return { ok: false, error: 'Adicione exatamente 5 fotos do problema.' }
  if (files.some((file) => file.size > MAX_PHOTO_SIZE)) {
    return { ok: false, error: 'Cada foto deve ter no máximo 5 MB.' }
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_PHOTOS_TOTAL_SIZE) {
    return { ok: false, error: 'O conjunto das fotos deve ter no máximo 25 MB.' }
  }

  const scheduledFor = text(form, 'scheduledFor')
  const scheduledDate = scheduledFor.slice(0, 10)
  if (!isBusinessDate(scheduledDate) || scheduledDate < getEarliestScheduleDate()) {
    return { ok: false, error: 'Escolha uma data válida respeitando o prazo mínimo de dias úteis.' }
  }

  try {
    const payload = await getPayload({ config })
    const photoIds: string[] = []
    for (const file of files) {
      const uploaded = await payload.create({
        collection: 'request-files',
        data: {
          alt: `Foto do chamado de ${String(user.name || user.email || 'cliente')}`,
          owner: user.id,
        },
        file: {
          data: Buffer.from(await file.arrayBuffer()),
          mimetype: file.type,
          name: file.name,
          size: file.size,
        },
        user,
        overrideAccess: false,
      })
      photoIds.push(String(uploaded.id))
    }

    const request = await payload.create({
      collection: 'service-requests',
      data: {
        protocol: `CH-${Date.now().toString(36).toUpperCase()}`,
        customer: user.id,
        category: text(form, 'category') as 'computer' | 'network' | 'maintenance' | 'peripherals' | 'other',
        description: text(form, 'description'),
        whatsapp,
        deviceModel: text(form, 'deviceModel'),
        operatingSystem: text(form, 'operatingSystem'),
        photos: photoIds,
        address: {
          street: text(form, 'street'),
          number: text(form, 'number'),
          district: text(form, 'district'),
          city: text(form, 'city'),
          postalCode: text(form, 'postalCode'),
          complement: text(form, 'complement'),
        },
        scheduledFor: new Date(`${scheduledFor}T12:00:00-03:00`).toISOString(),
        status: 'received',
      },
      user,
      overrideAccess: false,
    })
    return {
      ok: true,
      request: {
        id: String(request.id),
        protocol: String(request.protocol),
        category: request.category,
        description: request.description,
        whatsapp: request.whatsapp,
        scheduledFor: request.scheduledFor,
        status: request.status,
        createdAt: request.createdAt,
      },
    }
  } catch {
    return { ok: false, reset: 'request' }
  }
}
