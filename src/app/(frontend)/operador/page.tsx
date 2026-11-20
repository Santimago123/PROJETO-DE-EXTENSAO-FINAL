import type { Metadata } from 'next'
import config from '@payload-config'
import { operatorAuth } from '@/lib/app-auth'
import type { RequestFile, ServiceRequest, User } from '@/payload-types'
import { getPayload } from 'payload'
import { OperatorDashboard } from './operator-dashboard'
import { OperatorLogin } from './operator-login'
import type {
  OperatorPhotoView,
  OperatorRequestView,
  OperatorStatus,
} from './operator-action-state'

export const metadata: Metadata = {
  title: 'Portal do operador | Resolver',
  description: 'Painel de atendimento para funcionários da Resolver.',
}

function populatedUser(value: ServiceRequest['customer']): User | null {
  return typeof value === 'object' && value !== null ? value : null
}

function populatedPhoto(value: string | RequestFile): RequestFile | null {
  return typeof value === 'object' && value !== null ? value : null
}

function toPhotoView(photo: RequestFile | null): OperatorPhotoView | null {
  if (!photo?.url) return null
  return {
    id: String(photo.id),
    alt: String(photo.alt || ''),
    url: photo.url,
    width: Number(photo.width) || 1200,
    height: Number(photo.height) || 900,
  }
}

function toRequestView(request: ServiceRequest): OperatorRequestView {
  const customer = populatedUser(request.customer)
  return {
    id: String(request.id),
    protocol: String(request.protocol),
    category: String(request.category),
    description: String(request.description),
    whatsapp: String(request.whatsapp || ''),
    deviceModel: String(request.deviceModel || ''),
    operatingSystem: String(request.operatingSystem || ''),
    scheduledFor: String(request.scheduledFor),
    createdAt: String(request.createdAt),
    status: request.status as OperatorStatus,
    customer: {
      name: String(customer?.name || 'Cliente'),
      email: String(customer?.email || ''),
      phone: String(customer?.phone || ''),
    },
    address: {
      street: String(request.address?.street || ''),
      number: String(request.address?.number || ''),
      district: String(request.address?.district || ''),
      city: String(request.address?.city || ''),
      postalCode: String(request.address?.postalCode || ''),
      complement: String(request.address?.complement || ''),
    },
    photos: (request.photos ?? [])
      .map(populatedPhoto)
      .map(toPhotoView)
      .filter((photo): photo is OperatorPhotoView => photo !== null),
  }
}

export default async function OperatorPage() {
  const operator = await operatorAuth.currentUser()
  if (!operator) return <OperatorLogin />

  let requests: OperatorRequestView[] = []
  let loadError: string | undefined

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'service-requests',
      depth: 2,
      limit: 100,
      sort: '-createdAt',
      user: operator,
      overrideAccess: false,
    })
    requests = result.docs.map(toRequestView)
  } catch {
    loadError = 'Tente atualizar a página em alguns instantes.'
  }

  return (
    <OperatorDashboard
      operatorName={String(operator.name || operator.email || 'Operador')}
      requests={requests}
      loadError={loadError}
    />
  )
}
