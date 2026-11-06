import type { Access, CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    hidden: true,
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
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
