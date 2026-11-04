import { useState } from 'react'
import type { Role } from '../../../../04-entities/profile/model/types'
import type { Task } from '../../../../04-entities/task/model/types'
import type { TaskStatus } from '../../../../04-entities/task-status/model/types'
import { transitionTask } from '../../../../04-entities/task/api/tasks'
import { errorMessage } from '../../../../05-shared/lib/format'
import { Button } from '../../../../05-shared/ui'

const executorActions: Record<TaskStatus, { status: TaskStatus; label: string }[]> = {
  new: [{ status: 'in_progress', label: 'Взять в работу' }],
  in_progress: [{ status: 'review', label: 'Отправить на проверку' }],
  rework: [{ status: 'in_progress', label: 'Взять в работу повторно' }],
  review: [],
  accepted: [],
}

export function TaskTransitionActions({
  task,
  role,
  onChanged,
}: {
  task: Task
  role: Role
  onChanged: () => void
}) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const actions: { status: TaskStatus; label: string }[] =
    role === 'manager'
      ? task.status === 'review'
        ? [
            { status: 'accepted', label: 'Принять задачу' },
            { status: 'rework', label: 'Вернуть на доработку' },
          ]
        : []
      : executorActions[task.status]

  async function changeStatus(status: TaskStatus) {
    setBusy(true)
    setError('')
    try {
      await transitionTask(task.id, status, status === 'rework' ? comment : '')
      onChanged()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (actions.length === 0) return null
  return (
    <div className="transition-box">
      {actions.some((action) => action.status === 'rework') && (
        <label className="field">
          <span>Комментарий исполнителю</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Объясните, что нужно исправить"
            required
          />
        </label>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        {actions.map((action) => (
          <Button
            key={action.status}
            kind={action.status === 'rework' ? 'danger' : 'primary'}
            disabled={busy || (action.status === 'rework' && comment.trim().length === 0)}
            onClick={() => void changeStatus(action.status)}
          >
            {busy ? 'Сохраняем…' : action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
