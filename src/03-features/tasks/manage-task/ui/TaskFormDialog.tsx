import { useState, type FormEvent } from 'react'
import type { Site } from '../../../../04-entities/object/model/types'
import type { Profile } from '../../../../04-entities/profile/model/types'
import type { Task } from '../../../../04-entities/task/model/types'
import { saveTask } from '../../../../04-entities/task/api/tasks'
import { errorMessage } from '../../../../05-shared/lib/format'
import { Dialog, FormActions } from '../../../../05-shared/ui'

export function TaskFormDialog({
  task,
  initialObjectId,
  objects,
  profiles,
  onClose,
  onSaved,
}: {
  task?: Task
  initialObjectId?: string
  objects: Site[]
  profiles: Profile[]
  onClose: () => void
  onSaved: () => void
}) {
  const executors = profiles.filter((profile) => profile.role === 'executor')
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [objectId, setObjectId] = useState(
    task?.object_id ?? initialObjectId ?? objects[0]?.id ?? '',
  )
  const [assignee, setAssignee] = useState(task?.assigned_to ?? executors[0]?.id ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await saveTask(
        {
          title: title.trim(),
          description: description.trim(),
          object_id: objectId,
          assigned_to: assignee,
        },
        task?.id,
      )
      onSaved()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title={task ? 'Изменить задачу' : 'Новая задача'} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label className="field">
          <span>Название</span>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
          />
        </label>
        <label className="field">
          <span>Описание</span>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Объект</span>
          <select value={objectId} onChange={(event) => setObjectId(event.target.value)} required>
            {objects.map((object) => (
              <option key={object.id} value={object.id}>
                {object.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Исполнитель</span>
          <select value={assignee} onChange={(event) => setAssignee(event.target.value)} required>
            {executors.map((executor) => (
              <option key={executor.id} value={executor.id}>
                {executor.display_name}
              </option>
            ))}
          </select>
        </label>
        {executors.length === 0 && (
          <p className="form-error">
            Сначала добавьте пользователя с ролью «Исполнитель» в Supabase.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <FormActions
          onCancel={onClose}
          busy={busy}
          submitLabel={task ? 'Сохранить' : 'Создать задачу'}
        />
      </form>
    </Dialog>
  )
}
