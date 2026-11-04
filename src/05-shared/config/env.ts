export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  string | undefined
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)
