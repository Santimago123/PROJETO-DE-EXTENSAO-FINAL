import type { Metadata } from 'next'
import { PasswordRecoveryShell } from '../password-recovery-shell'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = {
  title: 'Recuperar senha | Resolver',
  description: 'Solicite um link seguro para recuperar o acesso à sua conta.',
}

export default function ForgotPasswordPage() {
  return (
    <PasswordRecoveryShell
      eyebrow="RECUPERAÇÃO DE CONTA"
      title="Esqueceu sua senha?"
      description="Informe o e-mail usado no cadastro. Se a conta existir, enviaremos um link seguro para você criar uma nova senha."
    >
      <ForgotPasswordForm />
    </PasswordRecoveryShell>
  )
}
