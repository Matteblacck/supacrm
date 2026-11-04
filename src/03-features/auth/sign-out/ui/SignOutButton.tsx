import { supabase } from '../../../../05-shared/api/supabase/client'
import { Button } from '../../../../05-shared/ui'

export function SignOutButton() {
  return (
    <Button kind="quiet" onClick={() => void supabase?.auth.signOut()}>
      Выйти
    </Button>
  )
}
