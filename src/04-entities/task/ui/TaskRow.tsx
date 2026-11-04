import type { Role } from '../../profile/model/types'
import type { Task } from '../model/types'
import { statusLabels } from '../../task-status/model/types'

export function TaskRow({ task, role, onClick }: { task: Task; role: Role; onClick: () => void }) {
  return (
    <button className="task-row" onClick={onClick}>
      <span className="task-row__main">
        <strong>{task.title}</strong>
        <small>{task.description || 'Без описания'}</small>
      </span>
      <span className="task-row__person">
        {role === 'manager'
          ? (task.assignee?.display_name ?? 'Исполнитель')
          : (task.object?.name ?? 'Объект')}
      </span>
      <span className={`status status--${task.status}`}>{statusLabels[task.status]}</span>
      <span className="task-row__arrow">→</span>
    </button>
  )
}
