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

-- Versioned section editing, undo-safe saves and Revit-style borrowing
alter table public.bep_projects add column version bigint not null default 1 check (version > 0);

create or replace function public.bump_bep_project_version()
returns trigger language plpgsql set search_path=''
as $$ begin
  if new.project_data is distinct from old.project_data and new.version=old.version then new.version:=old.version+1; end if;
  return new;
end $$;
revoke all on function public.bump_bep_project_version() from public,anon,authenticated;
drop trigger if exists bump_bep_project_version on public.bep_projects;
create trigger bump_bep_project_version before update of project_data on public.bep_projects
for each row execute function public.bump_bep_project_version();

drop policy if exists "Owners and editors update BEP projects" on public.bep_projects;
create policy "Owners update their BEP projects" on public.bep_projects for update to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

create table public.bep_section_locks (
  project_id text not null references public.bep_projects(id) on delete cascade,
  section_key text not null check (section_key in ('__project__','project','organization','information','technical','coordination','modules','files','appearance')),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  holder_email text not null default '',
  acquired_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (project_id,section_key),
  check (expires_at > acquired_at)
);
create index bep_section_locks_user_idx on public.bep_section_locks (user_id,project_id);
create index bep_section_locks_expiry_idx on public.bep_section_locks (expires_at);
alter table public.bep_section_locks enable row level security;
create policy "Project members read section locks" on public.bep_section_locks for select to authenticated
using (
  exists (select 1 from public.bep_projects p where p.id=project_id and p.user_id=(select auth.uid()))
  or exists (select 1 from public.bep_project_collaborators c where c.project_id=bep_section_locks.project_id and c.user_id=(select auth.uid()))
);
revoke all on table public.bep_section_locks from public,anon,authenticated;
grant select on table public.bep_section_locks to authenticated;

create or replace function public.acquire_bep_section_lock(p_project_id text,p_section_key text,p_client_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_project public.bep_projects%rowtype;
  v_lock public.bep_section_locks%rowtype;
  v_now timestamptz:=clock_timestamp();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_client_id is null or p_section_key not in ('__project__','project','organization','information','technical','coordination','modules','files','appearance') then
    raise exception 'Invalid editing section';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_project_id,7142));
  select p.* into v_project from public.bep_projects p
  where p.id=p_project_id and (
    p.user_id=v_user or exists (
      select 1 from public.bep_project_collaborators c
      where c.project_id=p.id and c.user_id=v_user and c.role='editor'
    )
  );
  if not found then raise exception 'You do not have editing access to this project'; end if;

  delete from public.bep_section_locks l where l.project_id=p_project_id and l.expires_at<=v_now;
  if p_section_key='__project__' then
    select l.* into v_lock from public.bep_section_locks l
    where l.project_id=p_project_id and not (l.user_id=v_user and l.client_id=p_client_id)
    order by l.acquired_at limit 1;
  else
    select l.* into v_lock from public.bep_section_locks l
    where l.project_id=p_project_id
      and (l.section_key in ('__project__',p_section_key))
      and not (l.user_id=v_user and l.client_id=p_client_id)
    order by l.acquired_at limit 1;
  end if;
  if found then
    return jsonb_build_object(
      'acquired',false,'sectionKey',p_section_key,'holderEmail',v_lock.holder_email,'expiresAt',v_lock.expires_at,
      'project',v_project.project_data,'version',v_project.version,'updatedAt',v_project.updated_at
    );
  end if;

  if p_section_key='__project__' then
    delete from public.bep_section_locks l where l.project_id=p_project_id and l.user_id=v_user and l.client_id=p_client_id;
  end if;
  insert into public.bep_section_locks(project_id,section_key,user_id,client_id,holder_email,acquired_at,heartbeat_at,expires_at)
  values(p_project_id,p_section_key,v_user,p_client_id,coalesce(auth.jwt()->>'email','Signed-in editor'),v_now,v_now,v_now+interval '2 minutes')
  on conflict(project_id,section_key) do update
    set user_id=excluded.user_id,client_id=excluded.client_id,holder_email=excluded.holder_email,
        acquired_at=excluded.acquired_at,heartbeat_at=excluded.heartbeat_at,expires_at=excluded.expires_at
  returning * into v_lock;
  return jsonb_build_object(
    'acquired',true,'sectionKey',p_section_key,'holderEmail',v_lock.holder_email,'expiresAt',v_lock.expires_at,
    'project',v_project.project_data,'version',v_project.version,'updatedAt',v_project.updated_at
  );
end
$$;

create or replace function public.heartbeat_bep_section_lock(p_project_id text,p_section_key text,p_client_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_expiry timestamptz;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  update public.bep_section_locks set heartbeat_at=clock_timestamp(),expires_at=clock_timestamp()+interval '2 minutes'
  where project_id=p_project_id and section_key=p_section_key and user_id=v_user and client_id=p_client_id and expires_at>clock_timestamp()
    and (
      exists(select 1 from public.bep_projects p where p.id=p_project_id and p.user_id=v_user)
      or exists(select 1 from public.bep_project_collaborators c where c.project_id=p_project_id and c.user_id=v_user and c.role='editor')
    )
  returning expires_at into v_expiry;
  return jsonb_build_object('acquired',found,'expiresAt',v_expiry);
end
$$;

create or replace function public.release_bep_section_lock(p_project_id text,p_section_key text,p_client_id uuid,p_force boolean default false)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_deleted bigint;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_force and not exists(select 1 from public.bep_projects p where p.id=p_project_id and p.user_id=v_user) then
    raise exception 'Only the project owner can force release a section';
  end if;
  delete from public.bep_section_locks l
  where l.project_id=p_project_id and l.section_key=p_section_key
    and ((l.user_id=v_user and l.client_id=p_client_id) or p_force);
  get diagnostics v_deleted=row_count;
  return v_deleted>0;
end
$$;

create or replace function public.save_bep_project_section(
  p_project_id text,p_section_key text,p_client_id uuid,p_patch jsonb,p_expected_version bigint
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_project public.bep_projects%rowtype;
  v_data jsonb;
  v_fields text[];
  v_lists text[];
  v_key text;
  v_now timestamptz:=clock_timestamp();
  v_next bigint;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_patch is null or jsonb_typeof(p_patch)<>'object' or octet_length(p_patch::text)>5000000 then raise exception 'Invalid section data'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_project_id,7142));
  select p.* into v_project from public.bep_projects p
  where p.id=p_project_id and (
    p.user_id=v_user or exists (
      select 1 from public.bep_project_collaborators c
      where c.project_id=p.id and c.user_id=v_user and c.role='editor'
    )
  ) for update;
  if not found then raise exception 'You do not have editing access to this project'; end if;
  if not exists (
    select 1 from public.bep_section_locks l
    where l.project_id=p_project_id and l.section_key=p_section_key and l.user_id=v_user
      and l.client_id=p_client_id and l.expires_at>v_now
  ) then raise exception 'Your editing lock has expired. Reopen the section before saving'; end if;
  if p_expected_version>v_project.version then raise exception 'The project version is invalid'; end if;
  v_data:=v_project.project_data;

  if p_section_key='__project__' then
    if p_expected_version<>v_project.version then raise exception 'The project changed before this full-document update. Reopen the section and try again'; end if;
    if p_patch->>'id' is distinct from p_project_id then raise exception 'Project identity mismatch'; end if;
    v_data:=p_patch-'accessRole'-'ownerId'-'dbVersion';
  elsif p_section_key='project' then
    v_fields:=array['projectName','projectCode','description','location','sector','contractNumber','documentTitle','documentCode','revision','issueDate','issuePurpose','preparedBy','checkedBy','approvedBy','contractor','client','consultant','designer','contractType','designResponsibility','informationRole','coordinationScope','exclusions'];
  elsif p_section_key='information' then
    v_fields:=array['cde','cdeUrl','submissionPlatform','worksharingMode','informationStates','suitabilitySystem','reviewWorkflow','backupLocation','backupFrequency','retention'];
    v_lists:=array['references','uses','software','exchanges'];
  elsif p_section_key='technical' then
    v_fields:=array['namingPattern','originatorCode','drawingStrategy','crs','verticalDatum','units','ursReference','northRotation','loinSystem','classification','modelSizeLimit','authoringProcedure'];
    v_lists:=array['models','namingFields','loin'];
  elsif p_section_key='coordination' then
    v_fields:=array['coordinationCycle','issuePlatform','issueWorkflow','qaFrequency','warningPolicy','fourDTool','programmeSource','fiveDTool','assetSchema','cobieVersion','asBuiltMethod','asBuiltAccuracy'];
    v_lists:=array['milestones','deliverables','clashes','meetings','qaChecks','assetRequirements'];
  elsif p_section_key='organization' then
    v_lists:=array['parties','team','responsibilities'];
  elsif p_section_key='files' then
    v_lists:=array['appendices','decisions'];
    if p_patch ? 'attachments' and jsonb_typeof(p_patch->'attachments')='array' then
      v_data:=jsonb_set(v_data,'{attachments}',p_patch->'attachments',true);
    end if;
  elsif p_section_key='modules' then
    if jsonb_typeof(p_patch->'moduleStates')='object' then v_data:=jsonb_set(v_data,'{moduleStates}',p_patch->'moduleStates',true); end if;
    if jsonb_typeof(p_patch->'notes')='object' then v_data:=jsonb_set(v_data,'{notes}',p_patch->'notes',true); end if;
  elsif p_section_key='appearance' then
    if jsonb_typeof(p_patch->'style')='object' then v_data:=jsonb_set(v_data,'{style}',p_patch->'style',true); end if;
  else
    raise exception 'Invalid editing section';
  end if;

  if v_fields is not null then
    if jsonb_typeof(p_patch->'fields')<>'object' then raise exception 'Invalid field data'; end if;
    foreach v_key in array v_fields loop
      if (p_patch->'fields') ? v_key then
        if jsonb_typeof(p_patch->'fields'->v_key)<>'string' then raise exception 'Invalid field value'; end if;
        v_data:=jsonb_set(v_data,array['fields',v_key],p_patch->'fields'->v_key,true);
      end if;
    end loop;
  end if;
  if v_lists is not null then
    if jsonb_typeof(p_patch->'lists')<>'object' then raise exception 'Invalid schedule data'; end if;
    foreach v_key in array v_lists loop
      if (p_patch->'lists') ? v_key then
        if jsonb_typeof(p_patch->'lists'->v_key)<>'array' then raise exception 'Invalid schedule data'; end if;
        v_data:=jsonb_set(v_data,array['lists',v_key],p_patch->'lists'->v_key,true);
      end if;
    end loop;
  end if;

  v_next:=v_project.version+1;
  v_data:=jsonb_set(v_data,'{updatedAt}',to_jsonb(v_now),true);
  update public.bep_projects set
    project_data=v_data,
    name=coalesce(v_data->'fields'->>'projectName',''),
    code=coalesce(v_data->'fields'->>'projectCode',''),
    archived=coalesce((v_data->>'archived')::boolean,false),
    updated_at=v_now,
    version=v_next
  where id=p_project_id;
  update public.bep_section_locks set heartbeat_at=v_now,expires_at=v_now+interval '2 minutes'
  where project_id=p_project_id and section_key=p_section_key and user_id=v_user and client_id=p_client_id;
  return jsonb_build_object('project',v_data,'version',v_next,'updatedAt',v_now);
end
$$;

revoke all on function public.acquire_bep_section_lock(text,text,uuid) from public,anon,authenticated;
revoke all on function public.heartbeat_bep_section_lock(text,text,uuid) from public,anon,authenticated;
revoke all on function public.release_bep_section_lock(text,text,uuid,boolean) from public,anon,authenticated;
revoke all on function public.save_bep_project_section(text,text,uuid,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.acquire_bep_section_lock(text,text,uuid) to authenticated;
grant execute on function public.heartbeat_bep_section_lock(text,text,uuid) to authenticated;
grant execute on function public.release_bep_section_lock(text,text,uuid,boolean) to authenticated;
grant execute on function public.save_bep_project_section(text,text,uuid,jsonb,bigint) to authenticated;
