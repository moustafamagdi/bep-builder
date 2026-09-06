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

create table public.bep_templates (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  template_type text not null check (template_type in ('company','client')),
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '',
  source_reference text not null default '',
  version text not null default '1.0',
  is_default boolean not null default false,
  template_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bep_templates_user_updated_idx on public.bep_templates (user_id, updated_at desc);
alter table public.bep_templates enable row level security;
create policy "Owners read templates" on public.bep_templates for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners insert templates" on public.bep_templates for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update templates" on public.bep_templates for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners delete templates" on public.bep_templates for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on table public.bep_templates from anon;
grant select, insert, update, delete on table public.bep_templates to authenticated;

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

-- Sharing and collaboration
create extension if not exists pgcrypto with schema extensions;

create table public.bep_project_collaborators (
  project_id text not null references public.bep_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer','editor')),
  collaborator_email text not null default '',
  accepted_at timestamptz not null default now(),
  primary key (project_id,user_id),
  check (user_id <> owner_id)
);
create index bep_collaborators_user_idx on public.bep_project_collaborators (user_id,project_id);
create index bep_collaborators_owner_idx on public.bep_project_collaborators (owner_id,project_id);
alter table public.bep_project_collaborators enable row level security;
create policy "Owners and members read collaborators" on public.bep_project_collaborators for select to authenticated
using ((select auth.uid()) = owner_id or (select auth.uid()) = user_id);
create policy "Owners remove collaborators" on public.bep_project_collaborators for delete to authenticated
using ((select auth.uid()) = owner_id or (select auth.uid()) = user_id);
revoke all on table public.bep_project_collaborators from anon;
grant select,delete on table public.bep_project_collaborators to authenticated;

drop policy "Users can read their BEP projects" on public.bep_projects;
drop policy "Users can update their BEP projects" on public.bep_projects;
create policy "Owners and collaborators read BEP projects" on public.bep_projects for select to authenticated
using ((select auth.uid())=user_id or exists (select 1 from public.bep_project_collaborators c where c.project_id=bep_projects.id and c.user_id=(select auth.uid())));
create policy "Owners and editors update BEP projects" on public.bep_projects for update to authenticated
using ((select auth.uid())=user_id or exists (select 1 from public.bep_project_collaborators c where c.project_id=bep_projects.id and c.user_id=(select auth.uid()) and c.role='editor'))
with check ((select auth.uid())=user_id or exists (select 1 from public.bep_project_collaborators c where c.project_id=bep_projects.id and c.user_id=(select auth.uid()) and c.role='editor'));

create or replace function public.prevent_bep_project_owner_change()
returns trigger language plpgsql set search_path=''
as $$ begin
  if new.user_id <> old.user_id then raise exception 'Project ownership cannot be changed'; end if;
  return new;
end $$;
revoke all on function public.prevent_bep_project_owner_change() from public,anon,authenticated;
drop trigger if exists prevent_bep_project_owner_change on public.bep_projects;
create trigger prevent_bep_project_owner_change before update of user_id on public.bep_projects
for each row execute function public.prevent_bep_project_owner_change();

create table public.bep_project_invites (
  id uuid primary key,
  project_id text not null references public.bep_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  role text not null check (role in ('viewer','editor')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  check (expires_at > created_at)
);
create index bep_project_invites_owner_idx on public.bep_project_invites (owner_id,project_id,created_at desc);
create index bep_project_invites_project_idx on public.bep_project_invites (project_id);
create index bep_project_invites_accepted_by_idx on public.bep_project_invites (accepted_by) where accepted_by is not null;
alter table public.bep_project_invites enable row level security;
create policy "Owners read project invites" on public.bep_project_invites for select to authenticated using ((select auth.uid())=owner_id);
create policy "Owners create project invites" on public.bep_project_invites for insert to authenticated
with check ((select auth.uid())=owner_id and exists (select 1 from public.bep_projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy "Owners revoke project invites" on public.bep_project_invites for update to authenticated
using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "Owners delete project invites" on public.bep_project_invites for delete to authenticated using ((select auth.uid())=owner_id);
revoke all on table public.bep_project_invites from anon;
grant select,insert,update,delete on table public.bep_project_invites to authenticated;

create table public.bep_public_shares (
  id uuid primary key,
  project_id text not null references public.bep_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  title text not null check (char_length(title) between 1 and 180),
  project_data jsonb not null check (jsonb_typeof(project_data)='object'),
  public_logos jsonb not null default '[]'::jsonb check (jsonb_typeof(public_logos)='array'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check (expires_at > created_at)
);
create index bep_public_shares_owner_idx on public.bep_public_shares (owner_id,project_id,created_at desc);
create index bep_public_shares_project_idx on public.bep_public_shares (project_id);
alter table public.bep_public_shares enable row level security;
create policy "Owners read public previews" on public.bep_public_shares for select to authenticated using ((select auth.uid())=owner_id);
create policy "Owners create public previews" on public.bep_public_shares for insert to authenticated
with check ((select auth.uid())=owner_id and exists (select 1 from public.bep_projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy "Owners revoke public previews" on public.bep_public_shares for update to authenticated
using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "Owners delete public previews" on public.bep_public_shares for delete to authenticated using ((select auth.uid())=owner_id);
revoke all on table public.bep_public_shares from anon;
grant select,insert,update,delete on table public.bep_public_shares to authenticated;

create or replace function public.get_bep_public_share(p_token text)
returns jsonb language sql stable security definer set search_path=''
as $$
  select jsonb_build_object('project',s.project_data,'logos',s.public_logos,'title',s.title,'createdAt',s.created_at,'expiresAt',s.expires_at)
  from public.bep_public_shares s
  where char_length(p_token) between 32 and 200
    and s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
    and s.revoked_at is null and s.expires_at>now()
  limit 1
$$;
revoke all on function public.get_bep_public_share(text) from public,anon,authenticated;
grant execute on function public.get_bep_public_share(text) to anon;

create or replace function public.accept_bep_project_invite(p_token text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid := auth.uid();
  v_invite public.bep_project_invites%rowtype;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if char_length(p_token) not between 32 and 200 then raise exception 'Invalid invitation'; end if;
  select * into v_invite from public.bep_project_invites
  where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and revoked_at is null and expires_at>now() and accepted_at is null
  for update;
  if not found then raise exception 'This invitation is invalid, expired or already used'; end if;
  if v_invite.owner_id=v_user then raise exception 'The project owner cannot accept their own invitation'; end if;
  insert into public.bep_project_collaborators(project_id,user_id,owner_id,role,collaborator_email)
  values(v_invite.project_id,v_user,v_invite.owner_id,v_invite.role,coalesce(auth.jwt()->>'email',''))
  on conflict(project_id,user_id) do update set role=excluded.role,collaborator_email=excluded.collaborator_email,accepted_at=now();
  update public.bep_project_invites set accepted_by=v_user,accepted_at=now() where id=v_invite.id;
  return jsonb_build_object('projectId',v_invite.project_id,'role',v_invite.role);
end
$$;
revoke all on function public.accept_bep_project_invite(text) from public,anon,authenticated;
grant execute on function public.accept_bep_project_invite(text) to authenticated;

create policy "Collaborators read shared attachments" on storage.objects for select to authenticated
using (bucket_id='bep-attachments' and (exists (select 1 from public.bep_project_collaborators c where c.project_id=(storage.foldername(name))[2] and c.user_id=(select auth.uid())) or exists (select 1 from public.bep_projects p where p.id=(storage.foldername(name))[2] and p.user_id=(select auth.uid()))));
create policy "Editors upload shared attachments" on storage.objects for insert to authenticated
with check (bucket_id='bep-attachments' and exists (select 1 from public.bep_project_collaborators c where c.project_id=(storage.foldername(name))[2] and c.user_id=(select auth.uid()) and c.role='editor'));
create policy "Editors update shared attachments" on storage.objects for update to authenticated
using (bucket_id='bep-attachments' and (exists (select 1 from public.bep_project_collaborators c where c.project_id=(storage.foldername(name))[2] and c.user_id=(select auth.uid()) and c.role='editor') or exists (select 1 from public.bep_projects p where p.id=(storage.foldername(name))[2] and p.user_id=(select auth.uid()))))
with check (bucket_id='bep-attachments' and (exists (select 1 from public.bep_project_collaborators c where c.project_id=(storage.foldername(name))[2] and c.user_id=(select auth.uid()) and c.role='editor') or exists (select 1 from public.bep_projects p where p.id=(storage.foldername(name))[2] and p.user_id=(select auth.uid()))));
create policy "Editors delete shared attachments" on storage.objects for delete to authenticated
using (bucket_id='bep-attachments' and (exists (select 1 from public.bep_project_collaborators c where c.project_id=(storage.foldername(name))[2] and c.user_id=(select auth.uid()) and c.role='editor') or exists (select 1 from public.bep_projects p where p.id=(storage.foldername(name))[2] and p.user_id=(select auth.uid()))));
