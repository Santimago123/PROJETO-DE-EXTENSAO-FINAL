export const operatorStatuses = ['received', 'completed', 'cancelled'] as const

export type OperatorStatus = (typeof operatorStatuses)[number]

export type OperatorActionState = {
  status: 'idle' | 'error' | 'success'
  message: string
}

export const initialOperatorActionState: OperatorActionState = {
  status: 'idle',
  message: '',
}

export type OperatorPhotoView = {
  id: string
  alt: string
  url: string
  width: number
  height: number
}

export type OperatorRequestView = {
  id: string
  protocol: string
  category: string
  description: string
  whatsapp: string
  deviceModel: string
  operatingSystem: string
  scheduledFor: string
  createdAt: string
  status: OperatorStatus
  customer: {
    name: string
    email: string
    phone: string
  }
  address: {
    street: string
    number: string
    district: string
    city: string
    postalCode: string
    complement: string
  }
  photos: OperatorPhotoView[]
}
