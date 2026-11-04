import { useEffect, useState } from 'react'
import type { Role } from '../../../04-entities/profile/model/types'
import { listTaskHistory } from '../../../04-entities/task-status-history/api/status-history'
import type { StatusEvent } from '../../../04-entities/task-status-history/model/types'
import { statusLabels } from '../../../04-entities/task-status/model/types'
import type { Task } from '../../../04-entities/task/model/types'
import { formatDate, errorMessage } from '../../../05-shared/lib/format'
import { Button, Dialog } from '../../../05-shared/ui'
import { TaskTransitionActions } from '../../../03-features/tasks/transition-task/ui/TaskTransitionActions'

export function TaskDetailsDialog({
  task,
  role,
  onClose,
  onEdit,
  onArchive,
  onChanged,
}: {
  task: Task
  role: Role
  onClose: () => void
  onEdit: () => void
  onArchive: () => void
  onChanged: () => void
}) {
  const [history, setHistory] = useState<StatusEvent[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listTaskHistory(task.id)
      .then((events) => {
        if (active) setHistory(events)
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause))
      })
    return () => {
      active = false
    }
  }, [task.id, task.status])

  return (
    <Dialog title="Карточка задачи" onClose={onClose} wide>
      <div className="task-detail">
        <div className="task-detail__body">
          <div className="task-detail__title">
            <span className={`status status--${task.status}`}>{statusLabels[task.status]}</span>
            <h2>{task.title}</h2>
          </div>
          <p className="task-detail__description">{task.description || 'Описание не добавлено.'}</p>
          <dl className="task-meta">
            <div>
              <dt>Объект</dt>
              <dd>{task.object?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Исполнитель</dt>
              <dd>{task.assignee?.display_name ?? '—'}</dd>
            </div>
            <div>
              <dt>Поставил</dt>
              <dd>{task.creator?.display_name ?? '—'}</dd>
            </div>
            <div>
              <dt>Создана</dt>
              <dd>{formatDate(task.created_at)}</dd>
            </div>
          </dl>
          <section className="history-section">
            <div className="history-heading">
              <h3>История изменений</h3>
              <span>{history.length}</span>
            </div>
            {error ? (
              <p className="form-error">{error}</p>
            ) : history.length === 0 ? (
              <p className="muted">История пока не загружена.</p>
            ) : (
              <ol className="history-list">
                {history.map((event) => (
                  <li key={event.id}>
                    <span className="history-list__dot" />
                    <div>
                      <strong>
                        {event.from_status
                          ? `${statusLabels[event.from_status]} → ${statusLabels[event.to_status]}`
                          : `Создана · ${statusLabels[event.to_status]}`}
                      </strong>
                      <p>
                        {event.actor_name} · {formatDate(event.created_at)}
                      </p>
                      {event.comment && <blockquote>{event.comment}</blockquote>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
        <aside className="task-detail__actions">
          <h3>Действия</h3>
          <TaskTransitionActions task={task} role={role} onChanged={onChanged} />
          {role === 'manager' && (
            <div className="manager-actions">
              <Button onClick={onEdit}>Изменить задачу</Button>
              <Button kind="danger" onClick={onArchive}>
                Архивировать задачу
              </Button>
            </div>
          )}
          {role === 'executor' &&
            task.status !== 'new' &&
            task.status !== 'in_progress' &&
            task.status !== 'rework' && (
              <p className="muted small">Действий сейчас нет. Дождитесь решения постановщика.</p>
            )}
        </aside>
      </div>
    </Dialog>
  )
}
