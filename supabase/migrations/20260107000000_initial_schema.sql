-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Users Table
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  role text not null check (role in ('parent', 'student')),
  
  first_name text not null,
  last_name text not null,
  display_name text, 
  avatar_url text,
  date_of_birth date,
  grade_level integer check (grade_level between 1 and 5),
  
  parent_id uuid references public.users(id) on delete cascade,
  
  -- Gamification
  total_xp integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_date date,
  
  -- Settings
  preferred_language text default 'tr' check (preferred_language in ('tr', 'en')),
  content_language text default 'tr' check (content_language in ('tr', 'en')),
  theme text default 'light' check (theme in ('light', 'dark', 'auto')),
  notifications_enabled boolean default true,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login_at timestamptz,
  is_active boolean default true,
  
  constraint valid_student_has_parent 
    check (role = 'parent' or (role = 'student' and parent_id is not null))
);

-- RLS
alter table public.users enable row level security;

create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Parents can view their children" on public.users
  for select using (parent_id = auth.uid());

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- Courses Table
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  
  title text not null,
  subject text not null,
  grade_level integer not null,
  unit_number integer,
  description text,
  
  original_file_url text not null,
  original_file_name text not null,
  original_file_type text not null,
  page_count integer,
  
  status text not null default 'pending',
  error_message text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.courses enable row level security;

create policy "Users can view courses they own or are assigned" on public.courses
  for select using (auth.uid() = parent_id or auth.uid() = student_id);
