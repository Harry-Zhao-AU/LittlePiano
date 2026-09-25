-- Distinguish the requested editions from previously imported US books.
-- Existing books, selected books and assessment history are preserved.
alter table public.books add column catalogue_active boolean not null default true;
alter table public.books add column catalogue_order integer not null default 1000;
alter table public.books add column catalogue_notes text;
-- Existing table-level SELECT and read-only RLS cover these metadata columns.
-- No browser write grants are added.
