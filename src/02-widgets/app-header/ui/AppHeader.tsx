import type { Profile } from '../../../04-entities/profile/model/types'
import { SignOutButton } from '../../../03-features/auth/sign-out/ui/SignOutButton'

export function AppHeader({
  profile,
  page,
  onPageChange,
}: {
  profile: Profile
  page: 'objects' | 'my-tasks' | 'archive'
  onPageChange: (page: 'objects' | 'my-tasks' | 'archive') => void
}) {
  return (
    <header className="topbar">
      <nav className="topnav" aria-label="Основная навигация">
        <button
          className={page === 'objects' ? 'topnav__item is-active' : 'topnav__item'}
          onClick={() => onPageChange('objects')}
        >
          Каталог
        </button>
        {profile.role === 'manager' && (
          <button
            className={page === 'archive' ? 'topnav__item is-active' : 'topnav__item'}
            onClick={() => onPageChange('archive')}
          >
            Архив
          </button>
        )}
        {profile.role === 'executor' && (
          <button
            className={page === 'my-tasks' ? 'topnav__item is-active' : 'topnav__item'}
            onClick={() => onPageChange('my-tasks')}
          >
            Задачи
          </button>
        )}
      </nav>
      <div className="user-menu">
        <span className="user-menu__identity">
          <strong>{profile.display_name}</strong>
          <small>{profile.role === 'manager' ? 'Постановщик' : 'Исполнитель'}</small>
        </span>
        <SignOutButton />
      </div>
    </header>
  )
}
