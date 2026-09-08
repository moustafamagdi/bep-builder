-- Private review discussions and server-generated project activity, from installation onward.
create table public.bep_review_comments (
 id uuid primary key default gen_random_uuid(), project_id text not null references public.bep_projects(id) on delete cascade,
 section text not null check(section in ('project','organization','information','technical','coordination','modules','files','appearance','review','templates')),
 body text not null check(length(btrim(body)) between 1 and 4000), author_id uuid not null,
 author_label text not null, created_at timestamptz not null default clock_timestamp(),
 resolved boolean not null default false, resolved_by text, resolved_at timestamptz
);
create index bep_comments_project_time_idx on public.bep_review_comments(project_id,created_at desc,id);
create table public.bep_activity (
 id bigint generated always as identity primary key, project_id text not null references public.bep_projects(id) on delete cascade,
 actor_id uuid, actor_label text not null, action text not null, version bigint,
 changed_paths jsonb not null default '[]', created_at timestamptz not null default clock_timestamp()
);
create index bep_activity_project_id_idx on public.bep_activity(project_id,id desc);
alter table public.bep_review_comments enable row level security;
alter table public.bep_activity enable row level security;
revoke all on public.bep_review_comments,public.bep_activity from anon,authenticated;
grant select on public.bep_review_comments,public.bep_activity to authenticated;
create policy "Project members read comments" on public.bep_review_comments for select to authenticated using (exists(select 1 from public.bep_projects p where p.id=project_id));
create policy "Project members read activity" on public.bep_activity for select to authenticated using (exists(select 1 from public.bep_projects p where p.id=project_id));

create or replace function public.record_bep_activity() returns trigger language plpgsql security definer set search_path='' as $$
declare paths jsonb:='[]'; k text; sub text; olddata jsonb; who text;
begin
 olddata:=case when TG_OP='INSERT' then '{}'::jsonb else OLD.project_data end;
 for k in select jsonb_object_keys(NEW.project_data||olddata) loop
  if k in ('updatedAt','dbVersion','accessRole','ownerId') then continue; end if;
  if NEW.project_data->k is not distinct from olddata->k then continue; end if;
  if k in ('fields','lists','notes','moduleStates') and jsonb_typeof(NEW.project_data->k)='object' then
   for sub in select jsonb_object_keys(coalesce(olddata->k,'{}'::jsonb)||NEW.project_data->k) loop
    if NEW.project_data->k->sub is distinct from olddata->k->sub then paths:=paths||jsonb_build_array(k||'.'||sub); end if;
   end loop;
  else paths:=paths||jsonb_build_array(k); end if;
 end loop;
 if paths='[]'::jsonb then return NEW; end if;
 select email into who from auth.users where id=auth.uid();
 insert into public.bep_activity(project_id,actor_id,actor_label,action,version,changed_paths)
 values(NEW.id,auth.uid(),coalesce(who,'System'),case when TG_OP='INSERT' then 'Project created' else 'Project saved' end,NEW.version,paths);
 return NEW;
end $$;
revoke all on function public.record_bep_activity() from public,anon,authenticated;
create trigger record_bep_activity after insert or update on public.bep_projects for each row execute function public.record_bep_activity();

create or replace function public.write_bep_comment(p_project_id text,p_section text,p_body text,p_comment_id uuid default null,p_resolved boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare who text; result uuid;
begin
 if auth.uid() is null or not exists(select 1 from public.bep_projects p where p.id=p_project_id and (p.user_id=auth.uid() or exists(select 1 from public.bep_project_collaborators c where c.project_id=p.id and c.user_id=auth.uid() and c.role='editor'))) then raise exception 'Project editing access required'; end if;
 select email into who from auth.users where id=auth.uid();
 if p_comment_id is null then
  insert into public.bep_review_comments(project_id,section,body,author_id,author_label) values(p_project_id,p_section,p_body,auth.uid(),coalesce(who,'Project editor')) returning id into result;
 else
  update public.bep_review_comments set resolved=p_resolved,resolved_by=coalesce(who,'Project editor'),resolved_at=clock_timestamp()
  where id=p_comment_id and project_id=p_project_id and resolved is distinct from p_resolved returning id into result;
  if result is null then raise exception 'Comment changed or no longer exists. Refresh the discussion.'; end if;
 end if;
 insert into public.bep_activity(project_id,actor_id,actor_label,action,changed_paths) values(p_project_id,auth.uid(),coalesce(who,'Project editor'),case when p_comment_id is null then 'Comment added' when p_resolved then 'Comment resolved' else 'Comment reopened' end,jsonb_build_array('comment:'||result::text));
 return result;
end $$;
revoke all on function public.write_bep_comment(text,text,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.write_bep_comment(text,text,text,uuid,boolean) to authenticated;
