-- Явно проверяет роль постановщика и меняет архивный статус на сервере.
-- Это позволяет не выполнять архивирование прямым UPDATE из клиентского API.
begin;

create or replace function public.archive_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_manager() then
    raise exception 'Архивировать задачи может только постановщик'
      using errcode = '42501';
  end if;

  update public.tasks
  set archived_at = now()
  where id = p_task_id
    and archived_at is null;

  if not found then
    raise exception 'Активная задача не найдена';
  end if;
end;
$$;

create or replace function public.restore_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_manager() then
    raise exception 'Восстанавливать задачи может только постановщик'
      using errcode = '42501';
  end if;

  update public.tasks
  set archived_at = null
  where id = p_task_id
    and archived_at is not null;

  if not found then
    raise exception 'Архивная задача не найдена';
  end if;
end;
$$;

revoke all on function public.archive_task(uuid) from public, anon;
revoke all on function public.restore_task(uuid) from public, anon;
grant execute on function public.archive_task(uuid) to authenticated;
grant execute on function public.restore_task(uuid) to authenticated;

commit;
