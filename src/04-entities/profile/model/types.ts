export type Role = 'manager' | 'executor'

export type Profile = {
  id: string
  display_name: string
  role: Role
}
