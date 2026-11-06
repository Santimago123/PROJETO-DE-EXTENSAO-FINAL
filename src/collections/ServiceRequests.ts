import type { Access, CollectionConfig } from 'payload'
import { getEarliestScheduleDate, isBusinessDate } from '../lib/scheduling'

const ownRequests: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection === 'users') return { customer: { equals: req.user.id } }
  return false
}

export const ServiceRequests: CollectionConfig = {
  slug: 'service-requests',
  admin: {
    group: 'Atendimento',
    useAsTitle: 'protocol',
    defaultColumns: ['protocol', 'category', 'status', 'scheduledFor'],
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    read: ownRequests,
    update: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation !== 'create') return data
        if (!Array.isArray(data?.photos) || data.photos.length !== 5) {
          throw new Error('O chamado deve conter exatamente 5 fotos.')
        }
        const scheduledDate = String(data?.scheduledFor || '').slice(0, 10)
        if (!isBusinessDate(scheduledDate) || scheduledDate < getEarliestScheduleDate()) {
          throw new Error('O agendamento não respeita o prazo mínimo de dias úteis.')
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'protocol',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { create: () => false, update: () => false },
      hooks: {
        beforeChange: [
          ({ value }) => value || `CH-${Date.now().toString(36).toUpperCase()}`,
        ],
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: { create: () => false, update: () => false },
      hooks: {
        beforeChange: [
          ({ req, value }) => req.user?.collection === 'users' ? req.user.id : value,
        ],
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Computador / Notebook', value: 'computer' },
        { label: 'Internet / Wi-Fi / Roteador', value: 'network' },
        { label: 'Formatação, limpeza e vírus', value: 'maintenance' },
        { label: 'Impressoras e periféricos', value: 'peripherals' },
        { label: 'Outro / Não sei identificar', value: 'other' },
      ],
    },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'whatsapp',
      type: 'text',
      admin: {
        description: 'Contato usado para negociar o horário do atendimento.',
      },
    },
    { name: 'deviceModel', type: 'text' },
    { name: 'operatingSystem', type: 'text' },
    {
      name: 'photos',
      type: 'relationship',
      relationTo: 'request-files',
      hasMany: true,
      required: true,
      minRows: 5,
      maxRows: 5,
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text', required: true },
        { name: 'number', type: 'text', required: true },
        { name: 'district', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'postalCode', type: 'text', required: true },
        { name: 'complement', type: 'text' },
      ],
    },
    {
      name: 'scheduledFor',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'received',
      access: { create: () => false, update: ({ req }) => req.user?.collection === 'admins' },
      options: [
        { label: 'Solicitação recebida', value: 'received' },
        { label: 'Visita agendada', value: 'scheduled' },
        { label: 'Em atendimento', value: 'in_progress' },
        { label: 'Concluído', value: 'completed' },
        { label: 'Cancelado', value: 'cancelled' },
      ],
    },
  ],
}
