import { supabase } from '../../../05-shared/api/supabase/client'
import type { Task } from '../model/types'
import type { TaskStatus } from '../../task-status/model/types'

export async function listTasks() {
  if (!supabase) throw new Error('Supabase не настроен')
  const { data, error } = await supabase
    .from('tasks')
    .select(
      'id, title, description, object_id, assigned_to, created_by, status, created_at, archived_at, object:objects!tasks_object_id_fkey(id, name), assignee:profiles!tasks_assigned_to_fkey(display_name), creator:profiles!tasks_created_by_fkey(display_name)',
    )
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Task[]
}

export async function listArchivedTasks() {
  if (!supabase) throw new Error('Supabase не настроен')
  const { data, error } = await supabase
    .from('tasks')
    .select(
      'id, title, description, object_id, assigned_to, created_by, status, created_at, archived_at, object:objects!tasks_object_id_fkey(id, name, archived_at), assignee:profiles!tasks_assigned_to_fkey(display_name), creator:profiles!tasks_created_by_fkey(display_name)',
    )
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Task[]
}

export async function saveTask(
  values: {
    title: string
    description: string
    object_id: string
    assigned_to: string
  },
  id?: string,
) {
  if (!supabase) throw new Error('Supabase не настроен')
  const query = id
    ? supabase.from('tasks').update(values).eq('id', id)
    : supabase.from('tasks').insert(values)
  const { error } = await query
  if (error) throw error
}

export async function archiveTask(id: string) {
  if (!supabase) throw new Error('Supabase не настроен')
  const { error } = await supabase.rpc('archive_task', { p_task_id: id })
  if (error) throw error
}

export async function restoreTask(id: string) {
  if (!supabase) throw new Error('Supabase не настроен')
  const { error } = await supabase.rpc('restore_task', { p_task_id: id })
  if (error) throw error
}

export async function transitionTask(id: string, toStatus: TaskStatus, comment = '') {
  if (!supabase) throw new Error('Supabase не настроен')
  const { error } = await supabase.rpc('transition_task', {
    p_task_id: id,
    p_to_status: toStatus,
    p_comment: comment,
  })
  if (error) throw error
}
