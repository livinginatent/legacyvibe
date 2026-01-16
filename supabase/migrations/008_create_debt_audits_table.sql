-- 008_create_debt_audits_table.sql
-- Stores one-time technical debt audits per user + repo

create table if not exists public.debt_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  repo_full_name text not null,
  summary jsonb not null,
  analyzed_at timestamp with time zone not null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

-- Ensure one audit per user + repo (latest row wins on upsert)
create unique index if not exists debt_audits_user_repo_idx
  on public.debt_audits(user_id, repo_full_name);

-- Basic RLS: users can only see their own audits
alter table public.debt_audits enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'debt_audits' 
      and policyname = 'Users can view their own audits'
  ) then
    create policy "Users can view their own audits"
      on public.debt_audits
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'debt_audits' 
      and policyname = 'Users can insert their own audits'
  ) then
    create policy "Users can insert their own audits"
      on public.debt_audits
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'debt_audits' 
      and policyname = 'Users can update their own audits'
  ) then
    create policy "Users can update their own audits"
      on public.debt_audits
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

