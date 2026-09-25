-- Family photographs of printed publisher contents are identified, not uploaded.
-- Retain the existing HTTPS source rule and allow only our explicit photo namespace.
begin;
alter table public.catalogue_sources drop constraint catalogue_sources_source_url_check;
alter table public.catalogue_sources add constraint catalogue_sources_source_url_check
 check (source_url like 'https://%' or source_url ~ '^urn:little-piano:family-photo:[0-9]{4}-[0-9]{2}-[0-9]{2}:[a-z0-9-]+:[0-9]+$');
commit;
