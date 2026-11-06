import config from '@payload-config'
import { appAuth } from '@/lib/app-auth'
import { getPayload } from 'payload'
import { SupportApp } from './support-app'

export default async function HomePage() {
  const user = await appAuth.currentUser()
  let requests: Record<string, unknown>[] = []

  if (user) {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'service-requests',
      sort: '-createdAt',
      limit: 20,
      user,
      overrideAccess: false,
    })
    requests = result.docs as unknown as Record<string, unknown>[]
  }

  return (
    <SupportApp
      initialUser={user ? {
        id: String(user.id),
        name: String(user.name || 'Cliente'),
        email: String(user.email || ''),
      } : null}
      initialRequests={requests}
    />
  )
}
