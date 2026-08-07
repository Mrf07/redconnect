-- Supabase SQL schema for Cash Advance Internal

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('karyawan', 'bod', 'finance', 'admin')) default 'karyawan',
  bod_order integer check (bod_order in (1, 2, 3)),
  created_at timestamptz not null default now()
);

create table if not exists cash_advance_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount numeric not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'ditolak', 'lolos_finance', 'diproses', 'selesai')),
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references cash_advance_requests(id) on delete cascade,
  bod_user_id uuid not null references users(id) on delete cascade,
  decision text not null default 'pending' check (decision in ('pending', 'approved', 'rejected')),
  decided_at timestamptz
);

create table if not exists finance_actions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references cash_advance_requests(id) on delete cascade,
  finance_user_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('proses', 'ditolak', 'pending')),
  notes text,
  processed_at timestamptz not null default now()
);

create or replace function public.set_request_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cash_advance_requests_set_updated_at
before update on cash_advance_requests
for each row execute procedure public.set_request_updated_at();

create or replace function public.create_approvals_for_new_request()
returns trigger language plpgsql as $$
begin
  insert into approvals (request_id, bod_user_id, decision, decided_at)
  select new.id, u.id, 'pending', null
  from users u
  where u.role = 'bod';
  return new;
end;
$$;

create trigger create_approvals_after_request_insert
after insert on cash_advance_requests
for each row execute procedure public.create_approvals_for_new_request();

create or replace function public.evaluate_cash_advance_status()
returns trigger language plpgsql security definer as $$
declare
  b1_decision text;
  bod2_3_approved int;
  bod2_3_rejected int;
begin
  select a.decision into b1_decision
  from approvals a
  join users u on a.bod_user_id = u.id
  where a.request_id = new.request_id and u.bod_order = 1
  limit 1;

  if b1_decision = 'approved' then
    update cash_advance_requests set status = 'lolos_finance', updated_at = now() where id = new.request_id;
    return new;
  elsif b1_decision = 'rejected' then
    update cash_advance_requests set status = 'ditolak', updated_at = now() where id = new.request_id;
    return new;
  end if;

  select count(*) filter (where a.decision = 'approved') into bod2_3_approved
  from approvals a
  join users u on a.bod_user_id = u.id
  where a.request_id = new.request_id and u.bod_order in (2, 3);

  select count(*) filter (where a.decision = 'rejected') into bod2_3_rejected
  from approvals a
  join users u on a.bod_user_id = u.id
  where a.request_id = new.request_id and u.bod_order in (2, 3);

  if bod2_3_rejected > 0 then
    update cash_advance_requests set status = 'ditolak', updated_at = now() where id = new.request_id;
    return new;
  elsif bod2_3_approved = 2 then
    update cash_advance_requests set status = 'lolos_finance', updated_at = now() where id = new.request_id;
    return new;
  else
    update cash_advance_requests set status = 'pending', updated_at = now() where id = new.request_id;
    return new;
  end if;
end;
$$;

create trigger evaluate_cash_advance_after_approval_update
after update on approvals
for each row execute procedure public.evaluate_cash_advance_status();

create or replace function public.set_finance_processed_at()
returns trigger language plpgsql as $$
begin
  new.processed_at = now();
  return new;
end;
$$;

create trigger finance_actions_set_processed_at
before insert or update on finance_actions
for each row execute procedure public.set_finance_processed_at();

create or replace function public.evaluate_finance_action_status()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'ditolak' then
    update cash_advance_requests set status = 'ditolak', updated_at = now() where id = new.request_id;
  elsif new.status = 'proses' then
    update cash_advance_requests set status = 'diproses', updated_at = now() where id = new.request_id;
  elsif new.status = 'selesai' then
    update cash_advance_requests set status = 'selesai', updated_at = now() where id = new.request_id;
  end if;
  return new;
end;
$$;

create trigger evaluate_cash_advance_after_finance_action
after insert or update on finance_actions
for each row execute procedure public.evaluate_finance_action_status();

-- Row Level Security policies
alter table users enable row level security;
alter table cash_advance_requests enable row level security;
alter table approvals enable row level security;
alter table finance_actions enable row level security;

create policy admin_full_access on users
  for all
  using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin'));

create policy user_own_profile on users
  for select
  using (id = auth.uid());

create policy request_admin_or_owner on cash_advance_requests
  for select
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
    or user_id = auth.uid()
    or exists (select 1 from users u where u.id = auth.uid() and u.role = 'bod')
    or (exists (select 1 from users u where u.id = auth.uid() and u.role = 'finance') and status in ('lolos_finance', 'diproses', 'selesai'))
  );

create policy request_insert_own on cash_advance_requests
  for insert
  with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role in ('karyawan', 'bod', 'admin'))
    and user_id = auth.uid()
  );

create policy request_update_own_pending on cash_advance_requests
  for update
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'pending');

create policy request_delete_own_pending on cash_advance_requests
  for delete
  using (user_id = auth.uid() and status = 'pending');

create policy approvals_admin_or_bod on approvals
  for select
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
    or exists (select 1 from users u where u.id = auth.uid() and u.role = 'bod')
    or exists (
      select 1 from cash_advance_requests r where r.id = request_id and r.user_id = auth.uid()
    )
  );

create policy approvals_update_own on approvals
  for update
  using (bod_user_id = auth.uid())
  with check (bod_user_id = auth.uid());

create policy finance_actions_admin_or_owner on finance_actions
  for select
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
    or finance_user_id = auth.uid()
  );

create policy finance_actions_insert_own on finance_actions
  for insert
  with check (finance_user_id = auth.uid());

create policy finance_actions_update_own on finance_actions
  for update
  using (finance_user_id = auth.uid())
  with check (finance_user_id = auth.uid());
