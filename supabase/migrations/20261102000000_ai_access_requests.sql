create table if not exists public.ai_access_requests (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null check (char_length(agent_name) between 1 and 80),
  purpose text not null check (char_length(purpose) between 1 and 1000),
  scope text not null default 'read' check (scope in ('read','write')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
grant insert on public.ai_access_requests to anon, authenticated;
grant select, update on public.ai_access_requests to authenticated;
grant all on public.ai_access_requests to service_role;
alter table public.ai_access_requests enable row level security;
create policy "anyone submits pending request" on public.ai_access_requests for insert to anon, authenticated
  with check (status = 'pending' and reviewed_by is null);
create policy "admins read requests" on public.ai_access_requests for select to authenticated
  using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));
create policy "admins review requests" on public.ai_access_requests for update to authenticated
  using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')) with check (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));
