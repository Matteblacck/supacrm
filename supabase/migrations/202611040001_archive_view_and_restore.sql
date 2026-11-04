-- Показывает архив постановщику и позволяет безопасно восстанавливать записи.
begin;

drop policy if exists "Managers can view active objects; executors only their own"
on public.objects;

create policy "Managers can view all objects; executors only active assigned objects"
on public.objects for select to authenticated using (
  public.is_manager() or (
    archived_at is null and exists (
      select 1 from public.tasks t
      where t.object_id = objects.id
        and t.assigned_to = auth.uid()
        and t.archived_at is null
    )
  )
);

drop policy if exists "Managers see all active tasks; executors see assigned tasks"
on public.tasks;

create policy "Managers see all tasks; executors see active assigned tasks"
on public.tasks for select to authenticated using (
  public.is_manager() or (archived_at is null and assigned_to = auth.uid())
);

drop policy if exists "Managers can edit tasks; executors may call transition RPC"
on public.tasks;

create policy "Managers can edit tasks; executors may call transition RPC"
on public.tasks for update to authenticated
using (
  public.is_manager() or (archived_at is null and assigned_to = auth.uid())
)
with check (
  public.is_manager() or (assigned_to = auth.uid() and archived_at is null)
);

create or replace function public.guard_task_restore()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.archived_at is not null
    and new.archived_at is null
    and not exists (
      select 1 from public.objects o
      where o.id = new.object_id and o.archived_at is null
    ) then
    raise exception 'Сначала восстановите объект задачи';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_task_restore() from public, anon, authenticated;

drop trigger if exists guard_task_restore_before on public.tasks;
create trigger guard_task_restore_before
before update of archived_at on public.tasks
for each row execute function public.guard_task_restore();

commit;
