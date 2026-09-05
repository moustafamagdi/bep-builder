create table public.bep_projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 180),
  code text not null default '' check (char_length(code) <= 70),
  archived boolean not null default false,
  project_data jsonb not null check (jsonb_typeof(project_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bep_projects_user_updated_idx
  on public.bep_projects (user_id, updated_at desc);

alter table public.bep_projects enable row level security;

create policy "Users can read their BEP projects"
  on public.bep_projects for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their BEP projects"
  on public.bep_projects for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their BEP projects"
  on public.bep_projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their BEP projects"
  on public.bep_projects for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.bep_projects from anon;
grant select, insert, update, delete on table public.bep_projects to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bep-attachments','bep-attachments',false,26214400,array['application/pdf','image/png','image/jpeg','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

create policy "Users can read their BEP attachments" on storage.objects for select to authenticated
using (bucket_id = 'bep-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload their BEP attachments" on storage.objects for insert to authenticated
with check (bucket_id = 'bep-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can update their BEP attachments" on storage.objects for update to authenticated
using (bucket_id = 'bep-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'bep-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their BEP attachments" on storage.objects for delete to authenticated
using (bucket_id = 'bep-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
