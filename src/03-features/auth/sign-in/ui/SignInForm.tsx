import { useState, type FormEvent } from 'react'
import { supabase } from '../../../../05-shared/api/supabase/client'
import { errorMessage } from '../../../../05-shared/lib/format'
import { Button } from '../../../../05-shared/ui'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(getSignInErrorMessage(signInError))
    } catch (cause) {
      setError(getSignInErrorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="field">
        <span>Пароль</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button kind="primary" type="submit" disabled={busy}>
        {busy ? 'Входим…' : 'Войти'}
      </Button>
    </form>
  )
}

function getSignInErrorMessage(error: unknown) {
  const message = errorMessage(error)
  const normalizedMessage = message.toLowerCase()

  if (message === 'Invalid login credentials') return 'Неверный email или пароль.'
  if (message === 'Email not confirmed') return 'Подтвердите email пользователя в Supabase.'
  if (
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('timeout')
  ) {
    return 'Не удалось связаться с Supabase. Проверьте URL проекта и подключение к интернету.'
  }
  return message
}
