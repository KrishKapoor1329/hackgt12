-- Run this in Supabase SQL editor

-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- Profiles table to extend auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  email text unique,
  phone text,
  avatar_url text,
  city text,
  state text,
  country text default 'US',
  win_rate numeric default 0,
  total_winnings numeric default 0,
  total_picks integer default 0,
  correct_picks integer default 0,
  current_streak integer default 0,
  best_streak integer default 0,
  favorite_nfl_team text,
  created_at timestamp with time zone default now()
);

-- Ensure new columns exist for pre-existing tables
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists country text default 'US';
alter table public.profiles add column if not exists correct_picks integer default 0;
alter table public.profiles add column if not exists current_streak integer default 0;
alter table public.profiles add column if not exists best_streak integer default 0;
alter table public.profiles add column if not exists favorite_nfl_team text;

-- Backfill emails from auth.users for existing rows
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email <> u.email);

-- Friends table (bidirectional edges; one row per relation)
create table if not exists public.friends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, friend_id)
);

-- Add foreign key constraints to profiles for better joins (drop first if exists)
alter table public.friends drop constraint if exists friends_user_id_fkey;
alter table public.friends drop constraint if exists friends_friend_id_fkey;
alter table public.friends add constraint friends_user_id_fkey 
  foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.friends add constraint friends_friend_id_fkey 
  foreign key (friend_id) references public.profiles(id) on delete cascade;

-- Add cascade delete for group-related tables
alter table public.group_members drop constraint if exists group_members_group_id_fkey;
alter table public.group_members add constraint group_members_group_id_fkey 
  foreign key (group_id) references public.friend_groups(id) on delete cascade;

alter table public.group_members drop constraint if exists group_members_user_id_fkey;
alter table public.group_members add constraint group_members_user_id_fkey 
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.group_invitations drop constraint if exists group_invitations_group_id_fkey;
alter table public.group_invitations add constraint group_invitations_group_id_fkey 
  foreign key (group_id) references public.friend_groups(id) on delete cascade;

-- Simple bets table
create table if not exists public.bets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  league text not null check (league in ('NFL','NBA')),
  game text not null,
  pick text not null,
  stake numeric not null,
  odds numeric,
  status text not null default 'pending' check (status in ('pending','won','lost','void')),
  payout numeric,
  created_at timestamp with time zone default now()
);

-- Leaderboard materialized view (simple)
drop materialized view if exists public.leaderboard;
create materialized view public.leaderboard as
select 
  p.id,
  coalesce(p.username, split_part(u.email,'@',1)) as username,
  p.win_rate,
  p.total_winnings,
  p.total_picks
from auth.users u
join public.profiles p on p.id = u.id;

-- Friend Groups for private leaderboards
create table if not exists public.friend_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text unique default upper(substring(md5(random()::text), 1, 8)),
  is_private boolean default true,
  created_at timestamp with time zone default now()
);

-- Group memberships
create table if not exists public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(group_id, user_id)
);

-- Group invitations
create table if not exists public.group_invitations (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamp with time zone default now(),
  unique(group_id, to_user)
);

-- Security: RLS
alter table public.profiles enable row level security;
alter table public.friends enable row level security;
alter table public.bets enable row level security;
alter table public.friend_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;

-- Policies
-- Profiles: users can read all, update own row
drop policy if exists "profiles_read_all" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Friends: users can manage own relations
drop policy if exists "friends_select_own" on public.friends;
drop policy if exists "friends_insert_own" on public.friends;
drop policy if exists "friends_delete_own" on public.friends;
create policy "friends_select_own" on public.friends for select using (user_id = auth.uid() or friend_id = auth.uid());
create policy "friends_insert_own" on public.friends for insert with check (user_id = auth.uid());
create policy "friends_delete_own" on public.friends for delete using (user_id = auth.uid());

-- Bets: users can manage own bets
drop policy if exists "bets_select_own" on public.bets;
drop policy if exists "bets_insert_own" on public.bets;
drop policy if exists "bets_update_own" on public.bets;
drop policy if exists "bets_delete_own" on public.bets;
create policy "bets_select_own" on public.bets for select using (user_id = auth.uid());
create policy "bets_insert_own" on public.bets for insert with check (user_id = auth.uid());
create policy "bets_update_own" on public.bets for update using (user_id = auth.uid());
create policy "bets_delete_own" on public.bets for delete using (user_id = auth.uid());

-- Friend Groups: users can read groups they're in, create/manage own groups
drop policy if exists "groups_read_member" on public.friend_groups;
drop policy if exists "groups_create_own" on public.friend_groups;
drop policy if exists "groups_update_own" on public.friend_groups;
create policy "groups_read_member" on public.friend_groups for select using (
  owner_id = auth.uid() or 
  id in (select group_id from public.group_members where user_id = auth.uid())
);
create policy "groups_create_own" on public.friend_groups for insert with check (owner_id = auth.uid());
create policy "groups_update_own" on public.friend_groups for update using (owner_id = auth.uid());

-- Group Members: simplified policies to avoid recursion
drop policy if exists "group_members_read_own" on public.group_members;
drop policy if exists "group_members_read_all" on public.group_members;
drop policy if exists "group_members_join" on public.group_members;
drop policy if exists "group_members_leave" on public.group_members;
create policy "group_members_read_all" on public.group_members for select using (true);
create policy "group_members_join" on public.group_members for insert with check (user_id = auth.uid());
create policy "group_members_leave" on public.group_members for delete using (user_id = auth.uid());

-- Group Invitations: users can manage invitations involving them
drop policy if exists "group_invites_read_own" on public.group_invitations;
drop policy if exists "group_invites_send" on public.group_invitations;
drop policy if exists "group_invites_respond" on public.group_invitations;
create policy "group_invites_read_own" on public.group_invitations for select using (
  from_user = auth.uid() or to_user = auth.uid()
);
create policy "group_invites_send" on public.group_invitations for insert with check (from_user = auth.uid());
create policy "group_invites_respond" on public.group_invitations for update using (
  from_user = auth.uid() or to_user = auth.uid()
);

-- Triggers: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, email)
  values (new.id, split_part(new.email,'@',1), '', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- Friend requests (pending workflow)
create table if not exists public.friend_requests (
  id uuid primary key default uuid_generate_v4(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(from_user, to_user)
);

-- Helpful indexes
create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_phone on public.profiles (phone);
create index if not exists idx_profiles_city on public.profiles (city);
create index if not exists idx_friend_groups_invite_code on public.friend_groups (invite_code);
create index if not exists idx_group_members_group on public.group_members (group_id);
create index if not exists idx_group_members_user on public.group_members (user_id);

alter table public.friend_requests enable row level security;
drop policy if exists "friend_requests_read_own" on public.friend_requests;
drop policy if exists "friend_requests_write_from" on public.friend_requests;
drop policy if exists "friend_requests_update_to" on public.friend_requests;

-- Either party can view a request involving them
create policy "friend_requests_read_own" on public.friend_requests
for select using (from_user = auth.uid() or to_user = auth.uid());

-- Only the sender can create/cancel their outgoing request
create policy "friend_requests_write_from" on public.friend_requests
for insert with check (from_user = auth.uid());

-- Receiver can update status to accepted/declined; sender can cancel (set cancelled)
create policy "friend_requests_update_to" on public.friend_requests
for update using (from_user = auth.uid() or to_user = auth.uid());

-- When a request is accepted, insert reciprocal rows into friends
create or replace function public.handle_friend_request_accept()
returns trigger as $$
begin
  if (new.status = 'accepted' and old.status <> 'accepted') then
    -- Insert both directions if not present
    insert into public.friends (user_id, friend_id)
    select new.from_user, new.to_user
    where not exists (
      select 1 from public.friends f where f.user_id = new.from_user and f.friend_id = new.to_user
    );
    insert into public.friends (user_id, friend_id)
    select new.to_user, new.from_user
    where not exists (
      select 1 from public.friends f where f.user_id = new.to_user and f.friend_id = new.from_user
    );
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_friend_request_updated on public.friend_requests;
create trigger on_friend_request_updated
after update on public.friend_requests
for each row execute function public.handle_friend_request_accept();


