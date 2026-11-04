import { SignInForm } from '../../../03-features/auth/sign-in/ui/SignInForm'

export function SignInPage() {
  return (
    <main className="login-page">
      <section className="login-card">
        <h1>Вход</h1>
        <p className="muted">Введите email и пароль, выданные постановщиком.</p>
        <SignInForm />
        <p className="login-note">Если у вас нет доступа, обратитесь к постановщику.</p>
      </section>
    </main>
  )
}
