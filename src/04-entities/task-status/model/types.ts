export type TaskStatus = 'new' | 'in_progress' | 'review' | 'rework' | 'accepted'

export const statusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  review: 'На проверке',
  rework: 'На доработке',
  accepted: 'Принята',
}
