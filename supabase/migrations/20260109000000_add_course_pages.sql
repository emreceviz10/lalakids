-- Course Pages Table
-- Stores extracted text content per page from OCR processing
create table public.course_pages (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  
  page_number integer not null,
  content text not null,
  
  created_at timestamptz default now(),
  
  -- Ensure unique page numbers per course
  unique(course_id, page_number)
);

-- Create index for faster lookups
create index course_pages_course_id_idx on public.course_pages(course_id);
create index course_pages_page_number_idx on public.course_pages(course_id, page_number);

-- Enable RLS
alter table public.course_pages enable row level security;

-- RLS Policy: Users can view pages for their courses
create policy "Users can view pages for their courses" on public.course_pages
  for select using (
    exists (
      select 1 from public.courses
      where courses.id = course_pages.course_id
      and (courses.parent_id = auth.uid() or courses.student_id = auth.uid())
    )
  );

-- RLS Policy: Parents can insert pages for their courses
create policy "Parents can insert pages for their courses" on public.course_pages
  for insert with check (
    exists (
      select 1 from public.courses
      where courses.id = course_pages.course_id
      and courses.parent_id = auth.uid()
    )
  );

-- RLS Policy: Parents can delete pages from their courses
create policy "Parents can delete pages from their courses" on public.course_pages
  for delete using (
    exists (
      select 1 from public.courses
      where courses.id = course_pages.course_id
      and courses.parent_id = auth.uid()
    )
  );

-- Add update policy for courses table (needed for status updates)
-- Only add if not exists - this allows parents to update their own courses
create policy "Parents can update their courses" on public.courses
  for update using (parent_id = auth.uid());

-- Add insert policy for courses table 
create policy "Parents can insert courses" on public.courses
  for insert with check (parent_id = auth.uid());
