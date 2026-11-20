import type { Access, CollectionConfig, FieldAccess } from 'payload'
import { getEarliestScheduleDate, isBusinessDate } from '../lib/scheduling'

const ownRequests: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection === 'operators') return true
  if (req.user?.collection === 'users') return { customer: { equals: req.user.id } }
  return false
}

const adminUpdate: FieldAccess = ({ req }) => req.user?.collection === 'admins'

export const ServiceRequests: CollectionConfig = {
  slug: 'service-requests',
  labels: {
    singular: 'Chamado',
    plural: 'Chamados',
  },
  admin: {
    group: 'Atendimento',
    useAsTitle: 'protocol',
    defaultColumns: ['protocol', 'customer', 'category', 'status', 'scheduledFor'],
    description:
      'Clique no protocolo para visualizar todos os detalhes, fotos e atualizar o status.',
  },
  disableBulkDelete: true,
  disableBulkEdit: true,
  disableDuplicate: true,
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    read: ownRequests,
    update: ({ req }) => req.user?.collection === 'admins' || req.user?.collection === 'operators',
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
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc

        const existingFolders = await req.payload.find({
          collection: 'folders',
          overrideAccess: true,
          where: { name: { equals: doc.protocol } },
          limit: 1,
          depth: 0,
          req,
        })
        const folder =
          existingFolders.docs[0] ??
          (await req.payload.create({
            collection: 'folders',
            overrideAccess: true,
            data: { name: doc.protocol },
            req,
          }))

        const photoIds = Array.isArray(doc.photos)
          ? doc.photos.map((photo: unknown) =>
              typeof photo === 'object' && photo !== null && 'id' in photo
                ? String(photo.id)
                : String(photo),
            )
          : []

        await Promise.all(
          photoIds.map((id: string) =>
            req.payload.update({
              collection: 'request-files',
              id,
              overrideAccess: true,
              data: {
                serviceRequest: doc.id,
                _h_folders: folder.id,
              },
              req,
            }),
          ),
        )

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'protocol',
      label: 'Protocolo',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
      access: { create: () => false, update: () => false },
      hooks: {
        beforeChange: [({ value }) => value || `CH-${Date.now().toString(36).toUpperCase()}`],
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { readOnly: true },
      access: { create: () => false, update: () => false },
      hooks: {
        beforeChange: [
          ({ req, value }) => (req.user?.collection === 'users' ? req.user.id : value),
        ],
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: 'Solicitação',
      admin: { readOnly: true },
      access: { update: adminUpdate },
      options: [
        { label: 'Computador / Notebook', value: 'computer' },
        { label: 'Internet / Wi-Fi / Roteador', value: 'network' },
        { label: 'Formatação, limpeza e vírus', value: 'maintenance' },
        { label: 'Impressoras e periféricos', value: 'peripherals' },
        { label: 'Outro / Não sei identificar', value: 'other' },
      ],
    },
    {
      name: 'description',
      label: 'Mensagem da solicitação',
      type: 'textarea',
      required: true,
      admin: { readOnly: true },
      access: { update: adminUpdate },
    },
    {
      name: 'whatsapp',
      label: 'Número do consumidor',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Contato usado para negociar o horário do atendimento.',
      },
      access: { update: adminUpdate },
    },
    {
      name: 'deviceModel',
      label: 'Dispositivo',
      type: 'text',
      admin: { readOnly: true },
      access: { update: adminUpdate },
    },
    {
      name: 'operatingSystem',
      label: 'Sistema operacional',
      type: 'text',
      admin: { readOnly: true },
      access: { update: adminUpdate },
    },
    {
      name: 'photos',
      label: 'Fotos do chamado',
      type: 'relationship',
      relationTo: 'request-files',
      hasMany: true,
      required: true,
      minRows: 5,
      maxRows: 5,
      admin: {
        readOnly: true,
        description: 'Abra uma foto para visualizá-la em tamanho completo.',
      },
      access: { update: adminUpdate },
    },
    {
      name: 'address',
      label: 'Endereço do atendimento',
      type: 'group',
      admin: { readOnly: true },
      access: { update: adminUpdate },
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
      label: 'Data solicitada',
      type: 'date',
      required: true,
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
      access: { update: adminUpdate },
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'received',
      access: {
        create: () => false,
        update: ({ req }) =>
          req.user?.collection === 'admins' || req.user?.collection === 'operators',
      },
      options: [
        { label: 'Solicitação recebida', value: 'received' },
        { label: 'Concluída', value: 'completed' },
        { label: 'Cancelada', value: 'cancelled' },
      ],
    },
  ],
}
