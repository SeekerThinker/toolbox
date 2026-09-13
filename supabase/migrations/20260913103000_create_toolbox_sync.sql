create table if not exists public.toolbox_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint toolbox_sync_payload_object check (jsonb_typeof(payload) = 'object')
);

alter table public.toolbox_sync enable row level security;

revoke all on table public.toolbox_sync from anon, authenticated;
grant select, insert, update, delete on table public.toolbox_sync to authenticated;

drop policy if exists "toolbox_sync_select_own" on public.toolbox_sync;
create policy "toolbox_sync_select_own"
on public.toolbox_sync for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "toolbox_sync_insert_own" on public.toolbox_sync;
create policy "toolbox_sync_insert_own"
on public.toolbox_sync for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "toolbox_sync_update_own" on public.toolbox_sync;
create policy "toolbox_sync_update_own"
on public.toolbox_sync for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "toolbox_sync_delete_own" on public.toolbox_sync;
create policy "toolbox_sync_delete_own"
on public.toolbox_sync for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.toolbox_push(expected_revision bigint, new_payload jsonb)
returns table(new_revision bigint, new_updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if jsonb_typeof(new_payload) <> 'object' then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  if expected_revision = 0 then
    return query
      insert into public.toolbox_sync as s (user_id, payload, revision, updated_at)
      values (current_user_id, new_payload, 1, now())
      on conflict (user_id) do nothing
      returning s.revision, s.updated_at;
  else
    return query
      update public.toolbox_sync as s
      set payload = new_payload,
          revision = s.revision + 1,
          updated_at = now()
      where s.user_id = current_user_id
        and s.revision = expected_revision
      returning s.revision, s.updated_at;
  end if;

  if not found then
    raise exception 'sync_conflict' using errcode = '40001';
  end if;
end;
$$;

revoke all on function public.toolbox_push(bigint, jsonb) from public, anon;
grant execute on function public.toolbox_push(bigint, jsonb) to authenticated;
