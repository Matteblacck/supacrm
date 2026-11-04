import type { Task } from '../../../04-entities/task/model/types'
import { TaskRow } from '../../../04-entities/task/ui/TaskRow'
import { EmptyState } from '../../../05-shared/ui/EmptyState'

export function MyTasksView({
  tasks,
  onSelectTask,
}: {
  tasks: Task[]
  onSelectTask: (task: Task) => void
}) {
  return (
    <section className="page-content">
      <div className="section-heading">
        <div>
          <h1>Мои задачи</h1>
        </div>
      </div>
      {tasks.length === 0 ? (
        <EmptyState
          title="Задач пока нет"
          text="Когда постановщик назначит вам задачу, она появится здесь."
        />
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} role="executor" onClick={() => onSelectTask(task)} />
          ))}
        </div>
      )}
    </section>
  )
}
