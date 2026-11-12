export type PasswordActionState = {
  status: 'idle' | 'error' | 'success'
  message: string
}

export const initialPasswordActionState: PasswordActionState = {
  status: 'idle',
  message: '',
}
