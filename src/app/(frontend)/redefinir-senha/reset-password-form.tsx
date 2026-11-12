'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { resetPassword } from '../auth-actions'
import { initialPasswordActionState } from '../password-action-state'

export function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') || ''
  const [state, action, pending] = useActionState(resetPassword, initialPasswordActionState)

  useEffect(() => {
    if (state.status !== 'success') return
    router.replace('/')
    router.refresh()
  }, [router, state.status])

  if (!token) {
    return (
      <div className="mt-8">
        <p className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
          Este link de recuperação está incompleto. Solicite um novo link para continuar.
        </p>
        <Link
          href="/esqueci-senha"
          className="mt-5 inline-flex w-full justify-center rounded-xl bg-[#4169E1] px-5 py-3.5 font-semibold text-white transition hover:bg-[#4169E1]/90"
        >
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm font-semibold">
        Nova senha
        <input
          required
          minLength={8}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition focus:border-[#4169E1] focus:bg-white"
        />
      </label>
      <label className="block text-sm font-semibold">
        Confirme a nova senha
        <input
          required
          minLength={8}
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          placeholder="Digite a senha novamente"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition focus:border-[#4169E1] focus:bg-white"
        />
      </label>
      {state.message && (
        <p
          role="status"
          className={`rounded-xl p-3 text-sm ${
            state.status === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {state.message}
        </p>
      )}
      <button
        disabled={pending || state.status === 'success'}
        className="w-full rounded-xl bg-[#4169E1] px-5 py-3.5 font-semibold text-white transition hover:bg-[#4169E1]/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending || state.status === 'success' ? 'Atualizando...' : 'Criar nova senha'}
      </button>
    </form>
  )
}
