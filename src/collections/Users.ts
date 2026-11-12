import type { Access, CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    hidden: true,
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    forgotPassword: {
      expiration: 60 * 60 * 1000,
      minRequestInterval: 60 * 1000,
      generateEmailSubject: () => 'Redefina sua senha da Resolver',
      generateEmailHTML: (args) => {
        const resetURL = new URL(
          '/redefinir-senha',
          process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        )
        resetURL.searchParams.set('token', args?.token || '')

        return `
          <div style="background:#f4f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
            <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:32px">
              <p style="margin:0 0 12px;color:#4169E1;font-size:12px;font-weight:700;letter-spacing:.16em">RESOLVER</p>
              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">Redefina sua senha</h1>
              <p style="margin:0 0 24px;color:#475569;line-height:1.6">Recebemos uma solicitação para criar uma nova senha para sua conta. Este link expira em uma hora.</p>
              <a href="${resetURL.toString()}" style="display:inline-block;border-radius:12px;background:#4169E1;color:#fff;padding:14px 20px;font-weight:700;text-decoration:none">Criar nova senha</a>
              <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6">Se você não fez esta solicitação, ignore este e-mail. Sua senha continuará a mesma.</p>
            </div>
          </div>
        `
      },
    },
  },
  access: {
    create: () => true,
    read: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      if (req.user?.collection === 'users') return { id: { equals: req.user.id } }
      return false
    },
    update: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      if (req.user?.collection === 'users') return { id: { equals: req.user.id } }
      return false
    },
    delete: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      if (req.user?.collection === 'users') return { id: { equals: req.user.id } }
      return false
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
  ],
}
