begin;
insert into auth.users(id,email) values ('fe9d0000-0000-4000-8000-000000000101','owner-phase4@test.invalid'),('fe9d0000-0000-4000-8000-000000000102','editor-phase4@test.invalid'),('fe9d0000-0000-4000-8000-000000000103','viewer-phase4@test.invalid'),('fe9d0000-0000-4000-8000-000000000104','outsider-phase4@test.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','fe9d0000-0000-4000-8000-000000000101',true);
insert into public.bep_projects(id,user_id,project_data) values ('phase4-rollback-test','fe9d0000-0000-4000-8000-000000000101','{"fields":{"projectName":"Test"},"lists":{}}');
reset role;
insert into public.bep_project_collaborators(project_id,user_id,owner_id,role) values ('phase4-rollback-test','fe9d0000-0000-4000-8000-000000000102','fe9d0000-0000-4000-8000-000000000101','editor'),('phase4-rollback-test','fe9d0000-0000-4000-8000-000000000103','fe9d0000-0000-4000-8000-000000000101','viewer');
set local role authenticated;
select set_config('request.jwt.claim.sub','fe9d0000-0000-4000-8000-000000000102',true);
select public.write_bep_comment('phase4-rollback-test','technical','Review coordinates');
select public.write_bep_comment('phase4-rollback-test','technical','',id,true) from public.bep_review_comments where project_id='phase4-rollback-test';
select set_config('request.jwt.claim.sub','fe9d0000-0000-4000-8000-000000000101',true);
update public.bep_projects set project_data=jsonb_set(project_data,'{fields,projectName}','"Updated"') where id='phase4-rollback-test';
select set_config('request.jwt.claim.sub','fe9d0000-0000-4000-8000-000000000103',true);
do $$ begin
 if (select count(*) from public.bep_review_comments where project_id='phase4-rollback-test')<>1 then raise exception 'Viewer cannot read comments'; end if;
 if (select count(*) from public.bep_activity where project_id='phase4-rollback-test')<>4 then raise exception 'Activity missing'; end if;
 begin perform public.write_bep_comment('phase4-rollback-test','technical','Unauthorized');raise exception 'Viewer wrote comment';exception when raise_exception then if SQLERRM<>'Project editing access required' then raise; end if;end;
 if not exists(select 1 from public.bep_activity where project_id='phase4-rollback-test' and action='Project saved' and changed_paths @> '["fields.projectName"]'::jsonb and actor_label='owner-phase4@test.invalid') then raise exception 'Saved change actor/path missing';end if;
 begin delete from public.bep_activity where project_id='phase4-rollback-test';raise exception 'Activity deletion allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','fe9d0000-0000-4000-8000-000000000104',true);
do $$ begin
 if exists(select 1 from public.bep_review_comments where project_id='phase4-rollback-test') or exists(select 1 from public.bep_activity where project_id='phase4-rollback-test') then raise exception 'Other account can read';end if;
 begin perform public.write_bep_comment('phase4-rollback-test','technical','Unauthorized');raise exception 'Other account wrote';exception when raise_exception then if SQLERRM<>'Project editing access required' then raise;end if;end;
end $$;
set local role anon;
do $$ begin
 begin perform * from public.bep_review_comments;raise exception 'Anonymous read allowed';exception when insufficient_privilege then null;end;
 begin perform public.write_bep_comment('phase4-rollback-test','technical','Unauthorized');raise exception 'Anonymous write allowed';exception when insufficient_privilege then null;end;
end $$;
select 'PASS: editor discussion, viewer read-only, outsider/anon isolation, server activity and no client deletion' as result;
rollback;
