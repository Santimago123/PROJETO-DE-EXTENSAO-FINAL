import 'server-only'

import config from '@payload-config'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

type AppAuthCollection = 'users' | 'operators'

export function createAppAuth(collection: AppAuthCollection, cookieName: string) {
  async function currentUser() {
    const token = (await cookies()).get(cookieName)?.value
    if (!token) return null

    try {
      const payload = await getPayload({ config })
      const headers = new Headers({ Authorization: `JWT ${token}` })
      const { user } = await payload.auth({ headers })
      return user?.collection === collection ? user : null
    } catch {
      return null
    }
  }

  async function setSession(token: string) {
    const cookieStore = await cookies()
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  async function clearSession() {
    ;(await cookies()).delete(cookieName)
  }

  return { currentUser, setSession, clearSession }
}

export const appAuth = createAppAuth('users', 'app-session')
export const operatorAuth = createAppAuth('operators', 'operator-session')
