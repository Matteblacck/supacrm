import { useEffect, useState } from 'react'
import type { Site } from '../../../04-entities/object/model/types'
import {
  archiveObject,
  listArchivedObjects,
  listObjects,
  restoreObject,
} from '../../../04-entities/object/api/objects'
import type { Profile } from '../../../04-entities/profile/model/types'
import { listProfiles } from '../../../04-entities/profile/api/profiles'
import type { Task } from '../../../04-entities/task/model/types'
import {
  archiveTask,
  listArchivedTasks,
  listTasks,
  restoreTask,
} from '../../../04-entities/task/api/tasks'
import { AppHeader } from '../../../02-widgets/app-header/ui/AppHeader'
import { ArchiveView } from '../../../02-widgets/archive-view/ui/ArchiveView'
import { MyTasksView } from '../../../02-widgets/my-tasks-view/ui/MyTasksView'
import { ObjectsView } from '../../../02-widgets/objects-view/ui/ObjectsView'
import { TaskDetailsDialog } from '../../../02-widgets/task-details/ui/TaskDetailsDialog'
import { ObjectFormDialog } from '../../../03-features/objects/manage-object/ui/ObjectFormDialog'
import { TaskFormDialog } from '../../../03-features/tasks/manage-task/ui/TaskFormDialog'
import { errorMessage } from '../../../05-shared/lib/format'
import type { Role } from '../../../04-entities/profile/model/types'
import { Button } from '../../../05-shared/ui'

type Page = 'objects' | 'my-tasks' | 'archive'

export function WorkspacePage({ profile }: { profile: Profile }) {
  const [page, setPage] = useState<Page>('objects')
  const [objects, setObjects] = useState<Site[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [archivedObjects, setArchivedObjects] = useState<Site[]>([])
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [objectDialog, setObjectDialog] = useState<{ object?: Site } | null>(null)
  const [taskDialog, setTaskDialog] = useState<{ task?: Task; objectId?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const [nextObjects, nextTasks, nextProfiles] = await Promise.all([
          listObjects(),
          listTasks(),
          profile.role === 'manager' ? listProfiles() : Promise.resolve([profile]),
        ])
        let nextArchivedObjects: Site[] = []
        let nextArchivedTasks: Task[] = []
        if (profile.role === 'manager') {
          const archivedData = await Promise.all([listArchivedObjects(), listArchivedTasks()])
          nextArchivedObjects = archivedData[0]
          nextArchivedTasks = archivedData[1]
        }
        if (!active) return
        setObjects(nextObjects)
        setTasks(nextTasks)
        setArchivedObjects(nextArchivedObjects)
        setArchivedTasks(nextArchivedTasks)
        setProfiles(nextProfiles)
        setMessage('')
      } catch (cause) {
        if (active) setMessage(errorMessage(cause))
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [profile, reloadKey])

  const role: Role = profile.role
  const selectedTask = tasks.find((task) => task.id === selectedTaskId)

  function changed() {
    setReloadKey((value) => value + 1)
    setMessage('')
  }

  async function handleArchiveObject(object: Site) {
    if (!window.confirm(`Архивировать объект «${object.name}»?`)) return
    setBusy(true)
    try {
      await archiveObject(object.id)
      setSelectedObjectId(null)
      changed()
    } catch (cause) {
      setMessage(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function handleArchiveTask(task: Task) {
    if (!window.confirm(`Архивировать задачу «${task.title}»? История сохранится.`)) return
    setBusy(true)
    try {
      await archiveTask(task.id)
      setSelectedTaskId(null)
      changed()
    } catch (cause) {
      setMessage(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function handleRestoreObject(object: Site) {
    setBusy(true)
    try {
      await restoreObject(object.id)
      changed()
    } catch (cause) {
      setMessage(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function handleRestoreTask(task: Task) {
    setBusy(true)
    try {
      await restoreTask(task.id)
      changed()
    } catch (cause) {
      setMessage(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-frame">
      <AppHeader
        profile={profile}
        page={page}
        onPageChange={(next) => {
          setPage(next)
          setSelectedObjectId(null)
          setSelectedTaskId(null)
        }}
      />
      <main>
        {message && (
          <div className="notice notice--error">
            <span>{message}</span>
            <Button kind="quiet" onClick={() => setMessage('')}>
              ×
            </Button>
          </div>
        )}
        {loading ? (
          <div className="loading">
            <span className="spinner" />
            Загружаем данные…
          </div>
        ) : page === 'archive' && role === 'manager' ? (
          <ArchiveView
            objects={archivedObjects}
            tasks={archivedTasks}
            busy={busy}
            onRestoreObject={(object) => void handleRestoreObject(object)}
            onRestoreTask={(task) => void handleRestoreTask(task)}
          />
        ) : page === 'objects' || role === 'manager' ? (
          <ObjectsView
            objects={objects}
            tasks={tasks}
            role={role}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onNewObject={() => setObjectDialog({})}
            onEditObject={(object) => setObjectDialog({ object })}
            onArchiveObject={(object) => void handleArchiveObject(object)}
            onNewTask={(objectId) => setTaskDialog({ objectId })}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
          />
        ) : (
          <MyTasksView tasks={tasks} onSelectTask={(task) => setSelectedTaskId(task.id)} />
        )}
      </main>
      {busy && (
        <div className="busy-indicator" aria-live="polite">
          Обновляем…
        </div>
      )}
      {objectDialog && (
        <ObjectFormDialog
          object={objectDialog.object}
          onClose={() => setObjectDialog(null)}
          onSaved={() => {
            setObjectDialog(null)
            changed()
          }}
        />
      )}
      {taskDialog && (
        <TaskFormDialog
          task={taskDialog.task}
          initialObjectId={taskDialog.objectId}
          objects={objects}
          profiles={profiles}
          onClose={() => setTaskDialog(null)}
          onSaved={() => {
            setTaskDialog(null)
            changed()
          }}
        />
      )}
      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          role={role}
          onClose={() => setSelectedTaskId(null)}
          onEdit={() => {
            setTaskDialog({ task: selectedTask })
            setSelectedTaskId(null)
          }}
          onArchive={() => void handleArchiveTask(selectedTask)}
          onChanged={changed}
        />
      )}
    </div>
  )
}
