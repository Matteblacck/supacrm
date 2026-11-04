import { useMemo, useState } from 'react'
import type { Site } from '../../../04-entities/object/model/types'
import type { Role } from '../../../04-entities/profile/model/types'
import type { Task } from '../../../04-entities/task/model/types'
import { TaskRow } from '../../../04-entities/task/ui/TaskRow'
import { Button } from '../../../05-shared/ui'
import { EmptyState } from '../../../05-shared/ui/EmptyState'

export function ObjectsView({
  objects,
  tasks,
  role,
  selectedObjectId,
  onSelectObject,
  onNewObject,
  onEditObject,
  onArchiveObject,
  onNewTask,
  onSelectTask,
}: {
  objects: Site[]
  tasks: Task[]
  role: Role
  selectedObjectId: string | null
  onSelectObject: (id: string | null) => void
  onNewObject: () => void
  onEditObject: (object: Site) => void
  onArchiveObject: (object: Site) => void
  onNewTask: (objectId: string) => void
  onSelectTask: (task: Task) => void
}) {
  const [search, setSearch] = useState('')
  const selectedObject = objects.find((object) => object.id === selectedObjectId)
  const objectTasks = tasks.filter((task) => task.object_id === selectedObjectId)
  const filteredObjects = useMemo(
    () =>
      objects.filter((object) =>
        `${object.name} ${object.address}`
          .toLocaleLowerCase('ru')
          .includes(search.toLocaleLowerCase('ru')),
      ),
    [objects, search],
  )

  if (selectedObject) {
    return (
      <section className="page-content">
        <button className="back-link" onClick={() => onSelectObject(null)}>
          ← Все объекты
        </button>
        <div className="section-heading object-heading">
          <div>
            <h1>{selectedObject.name}</h1>
            <p className="muted">{selectedObject.address}</p>
          </div>
          {role === 'manager' && (
            <div className="button-row">
              <Button onClick={() => onEditObject(selectedObject)}>Изменить</Button>
              <Button
                kind="danger"
                disabled={objectTasks.length > 0}
                title={
                  objectTasks.length ? 'Сначала архивируйте задачи объекта' : 'Архивировать объект'
                }
                onClick={() => onArchiveObject(selectedObject)}
              >
                Архивировать
              </Button>
            </div>
          )}
        </div>
        <div className="section-heading subheading">
          <div>
            <h2>
              Задачи <span className="count">{objectTasks.length}</span>
            </h2>
          </div>
          {role === 'manager' && (
            <Button kind="primary" onClick={() => onNewTask(selectedObject.id)}>
              Добавить задачу
            </Button>
          )}
        </div>
        {objectTasks.length === 0 ? (
          <EmptyState
            title="Задач пока нет"
            text={
              role === 'manager'
                ? 'Создайте первую задачу для этого объекта.'
                : 'На объекте сейчас нет ваших задач.'
            }
          />
        ) : (
          <div className="task-list">
            {objectTasks.map((task) => (
              <TaskRow key={task.id} task={task} role={role} onClick={() => onSelectTask(task)} />
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="page-content">
      <div className="section-heading">
        <div>
          <h1>Объекты</h1>
        </div>
        {role === 'manager' && (
          <Button kind="primary" onClick={onNewObject}>
            Добавить объект
          </Button>
        )}
      </div>
      <div className="toolbar">
        <label className="search-field">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Найти объект по названию или адресу"
          />
        </label>
        <span className="muted">
          {objects.length} {objects.length === 1 ? 'объект' : 'объекта'}
        </span>
      </div>
      {filteredObjects.length === 0 ? (
        <EmptyState
          title={objects.length ? 'Ничего не найдено' : 'Добавьте первый объект'}
          text={
            objects.length
              ? 'Измените поисковый запрос.'
              : role === 'manager'
                ? 'Начните с объекта стройки, затем добавьте задачи.'
                : 'Здесь появятся объекты, где вам назначены задачи.'
          }
        />
      ) : (
        <div className="object-grid">
          {filteredObjects.map((object) => {
            const count = tasks.filter((task) => task.object_id === object.id).length
            return (
              <button
                className="object-card"
                key={object.id}
                onClick={() => onSelectObject(object.id)}
              >
                <span className="object-card__top">
                  <span className="object-card__icon">Объект</span>
                </span>
                <strong>{object.name}</strong>
                <span className="object-card__address">{object.address}</span>
                <span className="object-card__footer">
                  <span>
                    {count} {count === 1 ? 'задача' : 'задач'}
                  </span>
                  <span>Открыть</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
