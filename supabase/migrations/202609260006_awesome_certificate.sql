-- Add Awesome without changing previously issued Brave Performer certificates.
do $$
declare constraint_name text;
begin
 for constraint_name in select conname from pg_constraint
 where conrelid='public.certificates'::regclass and contype='c'
 and pg_get_constraintdef(oid) like '%template_id%'
 loop execute format('alter table public.certificates drop constraint %I',constraint_name); end loop;
end $$;
alter table public.certificates add constraint certificates_template_kind_check
 check((kind='book' and template_id in ('piano-party','musical-parchment')) or
       (kind='special' and template_id in ('little-star','brave-performer','awesome')));
