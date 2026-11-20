import { createFolderField } from 'payload'
import type { Access, CollectionConfig } from 'payload'

const ownFiles: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection === 'users') return { owner: { equals: req.user.id } }
  return false
}

const readableFiles: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection === 'operators') return true
  if (req.user?.collection === 'users') return { owner: { equals: req.user.id } }
  return false
}

export const RequestFiles: CollectionConfig = {
  slug: 'request-files',
  admin: {
    group: 'Atendimento',
    useAsTitle: 'alt',
    defaultColumns: ['requestProtocol', 'alt', 'createdAt'],
    description: 'Fotos organizadas por protocolo da ordem de serviço.',
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users' || req.user?.collection === 'admins',
    read: readableFiles,
    update: ownFiles,
    delete: ownFiles,
  },
  fields: [
    {
      name: 'alt',
      label: 'Descrição da foto',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'owner',
      label: 'Consumidor',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { readOnly: true },
      access: {
        create: () => false,
        update: () => false,
      },
      hooks: {
        beforeChange: [
          ({ req, value }) => (req.user?.collection === 'users' ? req.user.id : value),
        ],
      },
    },
    {
      name: 'serviceRequest',
      label: 'Chamado',
      type: 'relationship',
      relationTo: 'service-requests',
      index: true,
      admin: {
        readOnly: true,
        description: 'Ordem de serviço à qual esta foto pertence.',
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: 'requestProtocol',
      label: 'Pasta / Protocolo',
      type: 'text',
      virtual: 'serviceRequest.protocol',
      admin: { readOnly: true },
    },
    createFolderField({
      relationTo: 'folders',
      label: 'Pasta do chamado',
      admin: { readOnly: true },
    }),
  ],
  upload: {
    mimeTypes: ['image/*'],
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'private, no-store')
      return headers
    },
  },
}
