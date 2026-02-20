-- Mindly Database Schema
-- Run this in Supabase SQL Editor

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  experience_level text default 'beginner' check (experience_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Roadmaps table
create table if not exists public.roadmaps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  certification_id text not null,
  title text not null,
  sections jsonb not null default '[]',
  experience_level text not null,
  created_at timestamptz default now()
);

alter table public.roadmaps enable row level security;

create policy "Users can view own roadmaps" on public.roadmaps
  for select using (auth.uid() = user_id);

create policy "Users can insert own roadmaps" on public.roadmaps
  for insert with check (auth.uid() = user_id);

create policy "Users can update own roadmaps" on public.roadmaps
  for update using (auth.uid() = user_id);

-- Section Progress table
create table if not exists public.section_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  roadmap_id uuid references public.roadmaps(id) on delete cascade not null,
  section_index integer not null,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  score integer,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, roadmap_id, section_index)
);

alter table public.section_progress enable row level security;

create policy "Users can view own progress" on public.section_progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own progress" on public.section_progress
  for insert with check (auth.uid() = user_id);

create policy "Users can update own progress" on public.section_progress
  for update using (auth.uid() = user_id);

-- Quiz Attempts table
create table if not exists public.quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  roadmap_id uuid references public.roadmaps(id) on delete cascade not null,
  section_index integer not null,
  questions jsonb not null default '[]',
  user_answers jsonb not null default '[]',
  score integer not null default 0,
  created_at timestamptz default now()
);

alter table public.quiz_attempts enable row level security;

create policy "Users can view own quiz attempts" on public.quiz_attempts
  for select using (auth.uid() = user_id);

create policy "Users can insert own quiz attempts" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);

-- User Badges table
create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Users can view own badges" on public.user_badges
  for select using (auth.uid() = user_id);

create policy "Users can insert own badges" on public.user_badges
  for insert with check (auth.uid() = user_id);

-- Chat Sessions table
create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  roadmap_id uuid references public.roadmaps(id) on delete cascade,
  section_index integer,
  session_type text not null check (session_type in ('tutor', 'interview')),
  messages jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.chat_sessions enable row level security;

create policy "Users can view own chat sessions" on public.chat_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own chat sessions" on public.chat_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own chat sessions" on public.chat_sessions
  for update using (auth.uid() = user_id);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
