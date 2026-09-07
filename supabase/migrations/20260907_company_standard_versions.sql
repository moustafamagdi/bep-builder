-- Released company versions are immutable. Existing unversioned templates are preserved.
create unique index if not exists bep_standard_family_version_idx
on public.bep_templates (user_id, (template_data #>> '{standard,familyId}'), version)
where template_type = 'company' and template_data #>> '{standard,status}' = 'released';

create or replace function public.guard_bep_standard_version()
returns trigger language plpgsql set search_path = public as $$
begin
  if TG_OP in ('UPDATE','DELETE') then
    if OLD.template_type = 'company' and OLD.template_data #>> '{standard,status}' = 'released' then
      raise exception 'Released company standards are immutable; create a new version.';
    end if;
  end if;
  if TG_OP = 'DELETE' then return OLD; end if;
  if NEW.template_type = 'company' and NEW.template_data ? 'standard' then
    if coalesce(NEW.template_data #>> '{standard,status}','') <> 'released'
      or coalesce(NEW.template_data #>> '{standard,familyId}','') !~ '^[0-9a-fA-F-]{36}$'
      or btrim(NEW.name) = '' or btrim(NEW.version) = '' or btrim(NEW.source_reference) = ''
      or btrim(coalesce(NEW.template_data #>> '{standard,releaseNotes}','')) = '' then
      raise exception 'A released standard needs a family ID, name, version, source and release notes.';
    end if;
    if NEW.template_data #>> '{standard,parentId}' is not null and not exists (
      select 1 from public.bep_templates t where t.id::text = NEW.template_data #>> '{standard,parentId}'
      and t.user_id = NEW.user_id and t.template_type = 'company'
      and t.template_data #>> '{standard,status}' = 'released'
      and t.template_data #>> '{standard,familyId}' = NEW.template_data #>> '{standard,familyId}'
    ) then raise exception 'Parent standard must be a released version in the same library and family.'; end if;
  end if;
  return NEW;
end;
$$;
revoke all on function public.guard_bep_standard_version() from public, anon, authenticated;
drop trigger if exists guard_bep_standard_version on public.bep_templates;
create trigger guard_bep_standard_version before insert or update or delete on public.bep_templates
for each row execute function public.guard_bep_standard_version();
