-- Enable required extensions
create extension if not exists "pgcrypto";

-- Polls table
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  description text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- Poll options table
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists poll_options_poll_id_idx on public.poll_options(poll_id);

-- Votes table
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  voter_id uuid references auth.users(id),
  voter_fingerprint text,
  created_at timestamptz not null default now()
);
create index if not exists votes_poll_id_idx on public.votes(poll_id);
create index if not exists votes_option_id_idx on public.votes(option_id);

-- Prevent duplicate votes by the same user or fingerprint per poll
create unique index if not exists unique_vote_per_user_per_poll
  on public.votes(poll_id, voter_id) where voter_id is not null;
create unique index if not exists unique_vote_per_fingerprint_per_poll
  on public.votes(poll_id, voter_fingerprint) where voter_fingerprint is not null;

-- Ensure vote option belongs to the same poll (trigger)
create or replace function public.ensure_option_matches_poll()
returns trigger
language plpgsql
as $$
begin
  if (select poll_id from public.poll_options where id = new.option_id) != new.poll_id then
    raise exception 'Option % does not belong to poll %', new.option_id, new.poll_id;
  end if;
  return new;
end;
$$;

drop trigger if exists votes_option_poll_check on public.votes;
create trigger votes_option_poll_check
before insert or update on public.votes
for each row execute function public.ensure_option_matches_poll();

-- RLS policies (permissive defaults for reads; controlled writes)
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;

-- Polls policies
drop policy if exists "Allow read polls for all" on public.polls;
create policy "Allow read polls for all"
  on public.polls for select using (true);
drop policy if exists "Allow insert polls for authenticated" on public.polls;
create policy "Allow insert polls for authenticated"
  on public.polls for insert
  with check (auth.role() = 'authenticated');
drop policy if exists "Allow update own polls" on public.polls;
create policy "Allow update own polls"
  on public.polls for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);
drop policy if exists "Allow delete own polls" on public.polls;
create policy "Allow delete own polls"
  on public.polls for delete
  using (auth.uid() = created_by);

-- Poll options policies
drop policy if exists "Allow read options for all" on public.poll_options;
create policy "Allow read options for all"
  on public.poll_options for select using (true);
drop policy if exists "Allow manage options by poll owner" on public.poll_options;
create policy "Allow manage options by poll owner"
  on public.poll_options for all
  using (exists (
    select 1 from public.polls p
    where p.id = poll_options.poll_id and p.created_by = auth.uid()
  ))
  with check (exists (
    select 1 from public.polls p
    where p.id = poll_options.poll_id and p.created_by = auth.uid()
  ));

-- Votes policies (permit anonymous and authenticated inserts; uniqueness enforced by indexes)
drop policy if exists "Allow read votes for all" on public.votes;
create policy "Allow read votes for all"
  on public.votes for select using (true);
drop policy if exists "Allow insert votes for all" on public.votes;
create policy "Allow insert votes for all"
  on public.votes for insert with check (true);


