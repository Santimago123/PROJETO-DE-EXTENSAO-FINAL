'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordReset } from '../auth-actions'
import { initialPasswordActionState } from '../password-action-state'

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialPasswordActionState)

  return (
    <>
      <form action={action} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold">
          E-mail da conta
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition focus:border-[#4169E1] focus:bg-white"
          />
        </label>
        {state.message && (
          <p
            role="status"
            className={`rounded-xl p-3 text-sm ${
              state.status === 'success'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {state.message}
          </p>
        )}
        <button
          disabled={pending}
          className="w-full rounded-xl bg-[#4169E1] px-5 py-3.5 font-semibold text-white transition hover:bg-[#4169E1]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">
        Lembrou sua senha?{' '}
        <Link href="/" className="font-semibold text-[#4169E1] hover:underline">
          Voltar para entrar
        </Link>
      </p>
    </>
  )
}
