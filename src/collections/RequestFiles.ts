import type { Access, CollectionConfig } from 'payload'

const ownFiles: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection === 'users') return { owner: { equals: req.user.id } }
  return false
}

export const RequestFiles: CollectionConfig = {
  slug: 'request-files',
  admin: {
    group: 'Atendimento',
    useAsTitle: 'alt',
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users' || req.user?.collection === 'admins',
    read: ownFiles,
    update: ownFiles,
    delete: ownFiles,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: {
        create: () => false,
        update: () => false,
      },
      hooks: {
        beforeChange: [
          ({ req, value }) => req.user?.collection === 'users' ? req.user.id : value,
        ],
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
  },
}
