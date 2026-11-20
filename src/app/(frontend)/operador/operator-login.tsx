'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { operatorLogin } from './operator-actions'
import { initialOperatorActionState } from './operator-action-state'

export function OperatorLogin() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [state, action, pending] = useActionState(operatorLogin, initialOperatorActionState)

  useEffect(() => {
    if (state.status === 'success') router.refresh()
  }, [router, state.status])

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-5 py-10 text-slate-950 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-[#102a56] p-8 text-white sm:p-12 lg:p-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-[#4169E1]/30 blur-2xl" />
          <div className="relative">
            <p className="text-xs font-bold tracking-[0.2em] text-blue-200">RESOLVER</p>
            <h1 className="mt-16 max-w-md text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Atendimento claro, do chamado à solução.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-blue-100/80">
              Consulte os dados completos das ordens de serviço e mantenha o cliente informado
              atualizando o status em tempo real.
            </p>
            <div className="mt-14 border-t border-white/15 pt-6 text-sm text-blue-100/70">
              Portal exclusivo para funcionários autorizados.
            </div>
          </div>
        </section>

        <section className="flex items-center p-8 sm:p-12 lg:p-14">
          <div className="w-full">
            <p className="text-sm font-bold text-[#4169E1]">PORTAL DO OPERADOR</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Acesse sua conta</h2>
            <p className="mt-3 leading-7 text-slate-500">
              Use o e-mail e a senha cadastrados pelo administrador.
            </p>

            <form action={action} className="mt-8 space-y-5">
              <label className="block text-sm font-semibold text-slate-700">
                E-mail
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition focus:border-[#4169E1] focus:bg-white focus:ring-4 focus:ring-[#4169E1]/10"
                  placeholder="nome@empresa.com"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Senha
                <span className="relative mt-2 block">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    minLength={6}
                    maxLength={128}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-24 font-normal outline-none transition focus:border-[#4169E1] focus:bg-white focus:ring-4 focus:ring-[#4169E1]/10"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-3 my-auto h-fit rounded-lg px-2 py-1 text-xs font-bold text-[#4169E1] hover:bg-[#4169E1]/5"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </span>
              </label>

              {state.message && (
                <p
                  role="status"
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    state.status === 'error'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {state.message}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-[#4169E1] px-5 py-3.5 font-bold text-white shadow-lg shadow-[#4169E1]/20 transition hover:bg-[#3458c7] disabled:cursor-wait disabled:opacity-60"
              >
                {pending ? 'Entrando...' : 'Entrar no painel'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
