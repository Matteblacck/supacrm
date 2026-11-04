import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getProfile } from '../04-entities/profile/api/profiles'
import type { Profile } from '../04-entities/profile/model/types'
import { SignInPage } from '../01-pages/sign-in/ui/SignInPage'
import { WorkspacePage } from '../01-pages/workspace/ui/WorkspacePage'
import { supabase } from '../05-shared/api/supabase/client'
import { isSupabaseConfigured } from '../05-shared/config/env'
import { errorMessage } from '../05-shared/lib/format'
import { Button } from '../05-shared/ui'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let active = true
    if (!session?.user.id) {
      setProfile(null)
      setProfileError('')
      return () => {
        active = false
      }
    }
    setProfileLoading(true)
    void getProfile(session.user.id)
      .then((nextProfile) => {
        if (active) {
          setProfile(nextProfile)
          setProfileError('')
        }
      })
      .catch((cause: unknown) => {
        if (active) setProfileError(errorMessage(cause))
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })
    return () => {
      active = false
    }
  }, [session?.user.id])

  if (!isSupabaseConfigured) {
    return (
      <main className="setup-page">
        <div className="setup-card">
          <h1>Подключите Supabase</h1>
          <p className="muted">
            Создайте проект Supabase, выполните миграцию из <code>supabase/migrations</code>, затем
            скопируйте <code>.env.example</code> в <code>.env.local</code> и заполните URL проекта и
            публичный publishable key.
          </p>
          <div className="setup-callout">
            <strong>Важно</strong>
            <span>
              В приложение нужен только publishable key с префиксом <code>sb_publishable_</code>.
              Secret key нельзя добавлять во фронтенд.
            </span>
          </div>
          <p className="small muted">
            После настройки перезапустите <code>npm run dev</code>.
          </p>
        </div>
      </main>
    )
  }

  if (session === undefined)
    return (
      <main className="loading loading--screen">
        <span className="spinner" />
        Проверяем вход…
      </main>
    )
  if (!session) return <SignInPage />
  if (profileLoading)
    return (
      <main className="loading loading--screen">
        <span className="spinner" />
        Загружаем профиль…
      </main>
    )
  if (profileError || !profile)
    return (
      <main className="loading loading--screen">
        <section className="error-card">
          <h1>Не удалось загрузить профиль</h1>
          <p>{profileError || 'Для пользователя не создан профиль.'}</p>
          <Button onClick={() => void supabase?.auth.signOut()}>Выйти</Button>
        </section>
      </main>
    )
  return <WorkspacePage profile={profile} />
}
