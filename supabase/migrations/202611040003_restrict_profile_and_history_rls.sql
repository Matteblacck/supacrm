-- Ограничивает доступ к профилям и скрывает историю архивных задач от исполнителей.
begin;

drop policy if exists "Authenticated users can view staff names"
on public.profiles;

create policy "Users can view relevant staff profiles"
on public.profiles for select to authenticated using (
  public.is_manager()
  or id = auth.uid()
  or exists (
    select 1
    from public.tasks t
    where t.assigned_to = auth.uid()
      and t.created_by = profiles.id
      and t.archived_at is null
  )
);

drop policy if exists "Users can view history for tasks they can access"
on public.task_status_history;

create policy "Users can view history for tasks they can access"
on public.task_status_history for select to authenticated using (
  public.is_manager()
  or exists (
    select 1
    from public.tasks t
    where t.id = task_status_history.task_id
      and t.assigned_to = auth.uid()
      and t.archived_at is null
  )
);

commit;
