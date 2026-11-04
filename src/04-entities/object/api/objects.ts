import { supabase } from '../../../05-shared/api/supabase/client'
import type { Site } from '../model/types'

export async function listObjects() {
  if (!supabase) throw new Error('Supabase не настроен')
  const { data, error } = await supabase
    .from('objects')
    .select('id, name, address, created_at, archived_at')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Site[]
}

export async function listArchivedObjects() {
  if (!supabase) throw new Error('Supabase не настроен')
  const { data, error } = await supabase
    .from('objects')
    .select('id, name, address, created_at, archived_at')
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Site[]
}

export async function saveObject(values: { name: string; address: string }, id?: string) {
  if (!supabase) throw new Error('Supabase не настроен')
  const query = id
    ? supabase.from('objects').update(values).eq('id', id)
    : supabase.from('objects').insert(values)
  const { error } = await query
  if (error) throw error
}

export async function archiveObject(id: string) {
  if (!supabase) throw new Error('Supabase не настроен')
  const { data, error } = await supabase
    .from('objects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Объект не найден или у вас нет права его архивировать.')
}

export async function restoreObject(id: string) {
  if (!supabase) throw new Error('Supabase не настроен')
  const { data, error } = await supabase
    .from('objects')
    .update({ archived_at: null })
    .eq('id', id)
    .not('archived_at', 'is', null)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Объект не найден или у вас нет права его восстановить.')
}
