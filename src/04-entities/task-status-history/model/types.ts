import type { TaskStatus } from '../../task-status/model/types'

export type StatusEvent = {
  id: string
  task_id: string
  actor_id: string | null
  actor_name: string
  from_status: TaskStatus | null
  to_status: TaskStatus
  comment: string | null
  created_at: string
}
