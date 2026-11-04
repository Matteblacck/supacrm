import { createClient } from '@supabase/supabase-js'
import { supabasePublishableKey, supabaseUrl } from '../../config/env'

export const supabase =
  supabaseUrl && supabasePublishableKey ? createClient(supabaseUrl, supabasePublishableKey) : null
