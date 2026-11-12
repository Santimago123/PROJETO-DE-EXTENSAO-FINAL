import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PasswordRecoveryShell } from '../password-recovery-shell'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Redefinir senha | Resolver',
  description: 'Crie uma nova senha para sua conta Resolver.',
}

export default function ResetPasswordPage() {
  return (
    <PasswordRecoveryShell
      eyebrow="NOVA SENHA"
      title="Crie uma nova senha"
      description="Escolha uma senha segura. Ao concluir, você será conectado automaticamente à sua conta."
    >
      <Suspense
        fallback={
          <div
            className="mt-8 h-48 animate-pulse rounded-2xl bg-slate-100"
            aria-label="Carregando formulário"
          />
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </PasswordRecoveryShell>
  )
}
