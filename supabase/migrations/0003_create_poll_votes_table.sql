-- Create poll_votes table with the new structure
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid references auth.users(id),
  option_id uuid not null references public.poll_options(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Create indexes for performance
create index if not exists poll_votes_poll_id_idx on public.poll_votes(poll_id);
create index if not exists poll_votes_option_id_idx on public.poll_votes(option_id);
create index if not exists poll_votes_user_id_idx on public.poll_votes(user_id);

-- Prevent duplicate votes by the same user per poll
create unique index if not exists unique_poll_vote_per_user
  on public.poll_votes(poll_id, user_id) where user_id is not null;

-- Enable RLS
alter table public.poll_votes enable row level security;

-- RLS policies for poll_votes
drop policy if exists "Allow read poll votes for all" on public.poll_votes;
create policy "Allow read poll votes for all"
  on public.poll_votes for select using (true);

drop policy if exists "Allow insert poll votes for all" on public.poll_votes;
create policy "Allow insert poll votes for all"
  on public.poll_votes for insert with check (true);
