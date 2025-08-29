-- Fix RLS policies to allow service role and anonymous poll creation
-- Drop existing policies
drop policy if exists "Allow insert polls for authenticated" on public.polls;
drop policy if exists "Allow manage options by poll owner" on public.poll_options;

-- Create more permissive policies for poll creation
create policy "Allow insert polls for all"
  on public.polls for insert
  with check (true);

-- Allow insert options for any poll (will be validated by trigger)
create policy "Allow insert options for all"
  on public.poll_options for insert
  with check (true);

-- Keep existing read policies
-- Keep existing update/delete policies for authenticated users
