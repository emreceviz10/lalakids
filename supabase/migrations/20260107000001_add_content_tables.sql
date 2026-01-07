-- Scenes Table
create table public.scenes (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  
  scene_order integer not null,
  narrative_text text not null,
  visual_description text not null,
  learning_objective text,
  
  image_url text,
  audio_url text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(course_id, scene_order)
);

alter table public.scenes enable row level security;
create policy "Users can view scenes for their courses" on public.scenes
  for select using (
    exists (
      select 1 from public.courses
      where courses.id = scenes.course_id
      and (courses.parent_id = auth.uid() or courses.student_id = auth.uid())
    )
  );

-- Flashcards Table
create table public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  
  term text not null,
  definition text not null,
  example text,
  image_url text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.flashcards enable row level security;
create policy "Users can view flashcards for their courses" on public.flashcards
  for select using (
    exists (
      select 1 from public.courses
      where courses.id = flashcards.course_id
      and (courses.parent_id = auth.uid() or courses.student_id = auth.uid())
    )
  );
