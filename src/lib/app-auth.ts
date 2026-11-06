import 'server-only'

import config from '@payload-config'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

const COOKIE_NAME = 'app-session'

export function createAppAuth(collection: 'users') {
  async function currentUser() {
    const token = (await cookies()).get(COOKIE_NAME)?.value
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
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  async function clearSession() {
    (await cookies()).delete(COOKIE_NAME)
  }

  return { currentUser, setSession, clearSession }
}

export const appAuth = createAppAuth('users')
