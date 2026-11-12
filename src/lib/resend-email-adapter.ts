import type { PayloadEmailAdapter, SendEmailOptions } from 'payload'

function addresses(value: unknown): string[] {
  if (!value) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(addresses)
  if (typeof value === 'object' && 'address' in value) {
    const address = (value as { address?: unknown }).address
    return typeof address === 'string' ? [address] : []
  }
  return []
}

function sender(value: SendEmailOptions['from'], fallback: string) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'address' in value) {
    const address = String(value.address)
    return value.name ? `${value.name} <${address}>` : address
  }
  return fallback
}

export const resendEmailAdapter: PayloadEmailAdapter = () => {
  const defaultFromAddress = process.env.RESEND_FROM_EMAIL || ''

  return {
    name: 'resend',
    defaultFromAddress,
    defaultFromName: 'Resolver',
    sendEmail: async (message) => {
      const apiKey = process.env.RESEND_API_KEY
      const fromAddress = process.env.RESEND_FROM_EMAIL

      if (!apiKey || !fromAddress) {
        throw new Error('A configuração de envio de e-mail está incompleta.')
      }

      const to = addresses(message.to)
      if (to.length === 0) throw new Error('O e-mail não possui destinatário.')
      const replyTo = addresses(message.replyTo)

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: sender(message.from, fromAddress),
          to,
          subject: message.subject || 'Mensagem da Resolver',
          html: typeof message.html === 'string' ? message.html : undefined,
          text: typeof message.text === 'string' ? message.text : undefined,
          ...(replyTo.length > 0 ? { reply_to: replyTo } : {}),
        }),
      })

      if (!response.ok) {
        throw new Error(`A Resend recusou o envio do e-mail (${response.status}).`)
      }

      return response.json()
    },
  }
}
