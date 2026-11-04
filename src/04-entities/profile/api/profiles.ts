import { supabase } from '../../../05-shared/api/supabase/client'
import type { Profile } from '../model/types'

export async function getProfile(userId: string) {
  if (!supabase) throw new Error('Supabase не настроен')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as Profile
}

export async function listProfiles() {
  if (!supabase) throw new Error('Supabase не настроен')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .order('display_name')
  if (error) throw error
  return (data ?? []) as Profile[]
}
