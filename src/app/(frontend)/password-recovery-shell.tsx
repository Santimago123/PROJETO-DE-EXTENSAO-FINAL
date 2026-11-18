import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

export function PasswordRecoveryShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#f4f7fb] p-4 text-slate-950 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_rgba(15,23,42,.12)] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden bg-[#4169E1] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/20 bg-white/10" />
          <Link href="/" className="relative flex items-center gap-3 font-semibold">
            <Image
              src="/resolver-logo.png"
              alt="Símbolo da Resolver"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
              unoptimized
            />
            Resolver
          </Link>
          <div className="relative max-w-md">
            <p className="mb-5 text-xs font-bold uppercase tracking-[.24em] text-blue-100">
              Acesso protegido
            </p>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">
              Volte a acompanhar seus chamados.
            </h1>
            <p className="mt-6 text-lg leading-8 text-blue-100/80">
              Use um link seguro e temporário para recuperar o acesso à sua conta.
            </p>
          </div>
          <p className="relative text-sm text-blue-100/60">
            O link expira em uma hora e só pode ser usado uma vez.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 inline-flex lg:hidden">
              <Image
                src="/resolver-logo.png"
                alt="Voltar para a Resolver"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                priority
                unoptimized
              />
            </Link>
            <p className="text-sm font-semibold text-[#4169E1]">{eyebrow}</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-3 leading-7 text-slate-500">{description}</p>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
