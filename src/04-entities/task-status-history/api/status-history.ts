import { supabase } from '../../../05-shared/api/supabase/client'
import type { StatusEvent } from '../model/types'

export async function listTaskHistory(taskId: string) {
  if (!supabase) throw new Error('Supabase не настроен')
  const { data, error } = await supabase
    .from('task_status_history')
    .select('id, task_id, actor_id, actor_name, from_status, to_status, comment, created_at')
    .eq('task_id', taskId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as StatusEvent[]
}
