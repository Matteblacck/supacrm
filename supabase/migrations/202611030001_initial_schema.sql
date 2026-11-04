-- Мини-CRM: схемы, RLS, аудит статусов и проверяемый переход задачи.
-- Роль пользователя назначается вручную через SQL Editor в Supabase.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null,
  role text not null default 'executor' check (role in ('manager', 'executor')),
  created_at timestamptz not null default now()
);

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  address text not null check (length(trim(address)) > 0),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  object_id uuid not null references public.objects(id) on delete restrict,
  assigned_to uuid not null references public.profiles(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  status text not null default 'new' check (status in ('new', 'in_progress', 'review', 'rework', 'accepted')),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

-- История хранит имя автора события отдельно, поэтому она остаётся читаемой,
-- даже если учётную запись позже деактивируют или удалят вручную.
create table public.task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete restrict,
  actor_id uuid,
  actor_name text not null,
  from_status text check (from_status is null or from_status in ('new', 'in_progress', 'review', 'rework', 'accepted')),
  to_status text not null check (to_status in ('new', 'in_progress', 'review', 'rework', 'accepted')),
  comment text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
begin
  v_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  if v_name is null then
    v_name := coalesce(nullif(split_part(new.email, '@', 1), ''), 'Пользователь');
  end if;
  insert into public.profiles (id, display_name, role)
  values (new.id, v_name, 'executor')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'manager'
  );
$$;

revoke all on function public.is_manager() from public, anon;
grant execute on function public.is_manager() to authenticated;

create or replace function public.guard_task_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Изменить статус можно только из SECURITY DEFINER RPC-функции,
  -- владельцем которой является postgres. Для API-пользователей это закрыто.
  if new.status is distinct from old.status and current_user <> 'postgres' then
    raise exception 'Статус задачи меняется только через transition_task';
  end if;

  if not public.is_manager() and current_user <> 'postgres' then
    raise exception 'Изменять данные задачи может только постановщик';
  end if;

  if new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'Автор и дата создания неизменяемы';
  end if;

  return new;
end;
$$;

create trigger guard_task_update_before
before update on public.tasks
for each row execute function public.guard_task_update();

create or replace function public.validate_task_relations()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = new.assigned_to and p.role = 'executor'
  ) then
    raise exception 'Назначить задачу можно только исполнителю';
  end if;

  if not exists (
    select 1 from public.objects o
    where o.id = new.object_id and o.archived_at is null
  ) then
    raise exception 'Выберите активный объект';
  end if;

  return new;
end;
$$;

create trigger validate_task_relations_before
before insert or update of object_id, assigned_to on public.tasks
for each row execute function public.validate_task_relations();

create or replace function public.guard_object_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.is_manager() then
    raise exception 'Изменять объекты может только постановщик';
  end if;

  if old.archived_at is null and new.archived_at is not null and exists (
    select 1 from public.tasks t
    where t.object_id = old.id and t.archived_at is null
  ) then
    raise exception 'Сначала архивируйте активные задачи объекта';
  end if;

  return new;
end;
$$;

create trigger guard_object_update_before
before update on public.objects
for each row execute function public.guard_object_update();

create or replace function public.record_task_creation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_name text;
begin
  select p.display_name into v_actor_name
  from public.profiles p where p.id = new.created_by;

  insert into public.task_status_history (task_id, actor_id, actor_name, from_status, to_status)
  values (new.id, new.created_by, coalesce(v_actor_name, 'Система'), null, new.status);
  return new;
end;
$$;

create trigger record_task_creation_after
after insert on public.tasks
for each row execute function public.record_task_creation();

create or replace function public.transition_task(
  p_task_id uuid,
  p_to_status text,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_role text;
  v_from_status text;
  v_assigned_to uuid;
  v_comment text := nullif(trim(coalesce(p_comment, '')), '');
begin
  if v_actor is null then
    raise exception 'Необходима авторизация';
  end if;

  select p.role, p.display_name into v_role, v_actor_name
  from public.profiles p where p.id = v_actor;
  if v_role is null then
    raise exception 'Профиль пользователя не найден';
  end if;

  select t.status, t.assigned_to into v_from_status, v_assigned_to
  from public.tasks t
  where t.id = p_task_id and t.archived_at is null
  for update;
  if not found then
    raise exception 'Задача не найдена';
  end if;

  if v_role = 'manager' then
    if v_from_status <> 'review' or p_to_status not in ('accepted', 'rework') then
      raise exception 'Недопустимый переход статуса для постановщика';
    end if;
    if p_to_status = 'rework' and v_comment is null then
      raise exception 'При возврате на доработку укажите комментарий';
    end if;
  else
    if v_assigned_to <> v_actor then
      raise exception 'Эта задача назначена другому исполнителю';
    end if;
    if not (
      (v_from_status = 'new' and p_to_status = 'in_progress') or
      (v_from_status = 'in_progress' and p_to_status = 'review') or
      (v_from_status = 'rework' and p_to_status = 'in_progress')
    ) then
      raise exception 'Недопустимый переход статуса для исполнителя';
    end if;
  end if;

  update public.tasks set status = p_to_status where id = p_task_id;
  insert into public.task_status_history (
    task_id, actor_id, actor_name, from_status, to_status, comment
  ) values (
    p_task_id, v_actor, v_actor_name, v_from_status, p_to_status, v_comment
  );
end;
$$;

revoke all on function public.transition_task(uuid, text, text) from public, anon;
grant execute on function public.transition_task(uuid, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_status_history enable row level security;

create policy "Authenticated users can view staff names"
on public.profiles for select to authenticated using (true);

create policy "Managers can view active objects; executors only their own"
on public.objects for select to authenticated using (
  archived_at is null and (
    public.is_manager() or exists (
      select 1 from public.tasks t
      where t.object_id = objects.id
        and t.assigned_to = auth.uid()
        and t.archived_at is null
    )
  )
);

create policy "Managers can create objects"
on public.objects for insert to authenticated
with check (public.is_manager());

create policy "Managers can edit objects"
on public.objects for update to authenticated
using (public.is_manager()) with check (public.is_manager());

create policy "Managers see all active tasks; executors see assigned tasks"
on public.tasks for select to authenticated using (
  archived_at is null and (public.is_manager() or assigned_to = auth.uid())
);

create policy "Managers can create tasks"
on public.tasks for insert to authenticated
with check (
  public.is_manager() and created_by = auth.uid() and status = 'new' and archived_at is null
);

create policy "Managers can edit tasks; executors may call transition RPC"
on public.tasks for update to authenticated
using (archived_at is null and (public.is_manager() or assigned_to = auth.uid()))
with check (public.is_manager() or (assigned_to = auth.uid() and archived_at is null));

create policy "Users can view history for tasks they can access"
on public.task_status_history for select to authenticated using (
  public.is_manager() or exists (
    select 1 from public.tasks t
    where t.id = task_status_history.task_id and t.assigned_to = auth.uid()
  )
);

-- Нет прямых удалений. Удаление из интерфейса означает архивирование,
-- чтобы не уничтожать задачу, её автора и журнал статусов.
revoke all on public.profiles, public.objects, public.tasks, public.task_status_history from public, anon, authenticated;
grant select on public.profiles, public.objects, public.tasks, public.task_status_history to authenticated;
grant insert (name, address), update (name, address, archived_at) on public.objects to authenticated;
grant insert (title, description, object_id, assigned_to),
      update (title, description, object_id, assigned_to, archived_at)
on public.tasks to authenticated;

comment on table public.task_status_history is 'Append-only status journal. No API role has write permissions.';
