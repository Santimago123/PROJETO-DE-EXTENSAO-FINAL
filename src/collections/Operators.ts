import type { Access, CollectionConfig } from 'payload'

const adminOnly: Access = ({ req }) => req.user?.collection === 'admins'

export const Operators: CollectionConfig = {
  slug: 'operators',
  labels: {
    singular: 'Operador',
    plural: 'Operadores',
  },
  admin: {
    group: 'Atendimento',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'updatedAt'],
    description: 'Contas dos funcionários que acessam o portal /operador.',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    create: adminOnly,
    read: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      if (req.user?.collection === 'operators') return { id: { equals: req.user.id } }
      return false
    },
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'name',
      label: 'Nome',
      type: 'text',
      required: true,
    },
  ],
}
