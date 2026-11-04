import type { TaskStatus } from '../../task-status/model/types'

export type Task = {
  id: string
  title: string
  description: string
  object_id: string
  assigned_to: string
  created_by: string
  status: TaskStatus
  created_at: string
  archived_at: string | null
  object?: { id: string; name: string; archived_at?: string | null } | null
  assignee?: { display_name: string } | null
  creator?: { display_name: string } | null
}
