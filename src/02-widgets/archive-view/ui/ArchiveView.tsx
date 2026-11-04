import { useState } from 'react'
import type { Site } from '../../../04-entities/object/model/types'
import type { Task } from '../../../04-entities/task/model/types'
import { statusLabels } from '../../../04-entities/task-status/model/types'
import { formatDate } from '../../../05-shared/lib/format'
import { Button } from '../../../05-shared/ui'
import { EmptyState } from '../../../05-shared/ui/EmptyState'

type ArchiveKind = 'objects' | 'tasks'

export function ArchiveView({
  objects,
  tasks,
  busy,
  onRestoreObject,
  onRestoreTask,
}: {
  objects: Site[]
  tasks: Task[]
  busy: boolean
  onRestoreObject: (object: Site) => void
  onRestoreTask: (task: Task) => void
}) {
  const [kind, setKind] = useState<ArchiveKind>('tasks')

  return (
    <section className="page-content">
      <div className="section-heading">
        <div>
          <h1>Архив</h1>
          <p className="muted">Архивные записи можно вернуть в работу.</p>
        </div>
      </div>

      <div className="archive-tabs" role="tablist" aria-label="Тип архивных записей">
        <button
          className={kind === 'tasks' ? 'archive-tabs__item is-active' : 'archive-tabs__item'}
          role="tab"
          aria-selected={kind === 'tasks'}
          onClick={() => setKind('tasks')}
        >
          Задачи <span>{tasks.length}</span>
        </button>
        <button
          className={kind === 'objects' ? 'archive-tabs__item is-active' : 'archive-tabs__item'}
          role="tab"
          aria-selected={kind === 'objects'}
          onClick={() => setKind('objects')}
        >
          Объекты <span>{objects.length}</span>
        </button>
      </div>

      {kind === 'tasks' ? (
        tasks.length === 0 ? (
          <EmptyState title="В архиве пока нет задач" text="Сюда попадут архивированные задачи." />
        ) : (
          <div className="archive-list" role="tabpanel">
            {tasks.map((task) => {
              const objectIsArchived = task.object?.archived_at != null

              return (
                <article className="archive-item" key={task.id}>
                  <div className="archive-item__content">
                    <div className="archive-item__title">
                      <strong>{task.title}</strong>
                      <span className={`status status--${task.status}`}>
                        {statusLabels[task.status]}
                      </span>
                    </div>
                    <p>
                      {task.object?.name ?? 'Объект'} ·{' '}
                      {task.assignee?.display_name ?? 'Исполнитель'}
                    </p>
                    <small>
                      В архиве с {task.archived_at ? formatDate(task.archived_at) : '—'}
                    </small>
                    {objectIsArchived && (
                      <small className="archive-item__hint">
                        Сначала восстановите объект «{task.object?.name}».
                      </small>
                    )}
                  </div>
                  <Button disabled={busy || objectIsArchived} onClick={() => onRestoreTask(task)}>
                    Восстановить
                  </Button>
                </article>
              )
            })}
          </div>
        )
      ) : objects.length === 0 ? (
        <EmptyState
          title="В архиве пока нет объектов"
          text="Сюда попадут архивированные объекты."
        />
      ) : (
        <div className="archive-list" role="tabpanel">
          {objects.map((object) => (
            <article className="archive-item" key={object.id}>
              <div className="archive-item__content">
                <strong>{object.name}</strong>
                <p>{object.address}</p>
                <small>
                  В архиве с {object.archived_at ? formatDate(object.archived_at) : '—'}
                </small>
              </div>
              <Button disabled={busy} onClick={() => onRestoreObject(object)}>
                Восстановить
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
