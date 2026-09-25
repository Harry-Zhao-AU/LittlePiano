-- Owner-scoped progress; catalogue maintained only through reviewed SQL.
create table public.books (
 id uuid primary key default gen_random_uuid(), series text not null default 'Piano Adventures',
 title text not null, level text not null, book_type text not null, edition text not null, language text not null,
 isbn text, catalogue_status text not null check (catalogue_status in ('partial','verified_complete'))
);
create table public.songs (
 id uuid primary key default gen_random_uuid(), book_id uuid not null references public.books(id),
 title text not null, page_number integer check(page_number > 0), sort_order integer not null check(sort_order > 0),
 unique(book_id,sort_order), unique(id,book_id)
);
create table public.catalogue_sources (
 id uuid primary key default gen_random_uuid(), book_id uuid not null references public.books(id),
 song_id uuid, source_url text not null check(source_url like 'https://%'), verified_at date not null,
 foreign key(song_id,book_id) references public.songs(id,book_id)
);
create table public.students (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 display_name text not null check(length(trim(display_name)) between 1 and 80), created_at timestamptz not null default now(),
 unique(owner_user_id)
);
create table public.student_books (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
 book_id uuid not null references public.books(id), started_at timestamptz not null default now(), archived_at timestamptz,
 unique(student_id,book_id)
);
create table public.assessments (
 id uuid primary key default gen_random_uuid(), student_book_id uuid not null references public.student_books(id) on delete cascade,
 song_id uuid not null references public.songs(id), stars integer not null check(stars between 1 and 3),
 feedback text check(length(feedback) <= 2000), assessed_at timestamptz not null default clock_timestamp()
);
create index assessments_history on public.assessments(student_book_id,song_id,assessed_at desc,id desc);
create index student_books_student on public.student_books(student_id);
create index catalogue_sources_book on public.catalogue_sources(book_id);

-- Invoker trigger observes RLS. Parents are immutable to browser clients, so the
-- relationship cannot become invalid after this check (including concurrent edits).
create function public.check_assessment_book() returns trigger language plpgsql set search_path = '' as $$
begin
 if not exists(select 1 from public.student_books sb join public.songs s on s.book_id=sb.book_id
   where sb.id=new.student_book_id and s.id=new.song_id) then
   raise exception 'Song must belong to the selected student book' using errcode='23514';
 end if;
 new.assessed_at := clock_timestamp();
 return new;
end $$;
create trigger assessment_book before insert on public.assessments for each row execute function public.check_assessment_book();

alter table public.books enable row level security;
alter table public.songs enable row level security;
alter table public.catalogue_sources enable row level security;
alter table public.students enable row level security;
alter table public.student_books enable row level security;
alter table public.assessments enable row level security;

revoke all on public.books,public.songs,public.catalogue_sources,public.students,public.student_books,public.assessments from anon,authenticated;
grant select on public.books,public.songs,public.catalogue_sources,public.students,public.student_books,public.assessments to authenticated;
grant insert(id,owner_user_id,display_name) on public.students to authenticated;
grant insert(id,student_id,book_id) on public.student_books to authenticated;
grant insert(id,student_book_id,song_id,stars,feedback) on public.assessments to authenticated;
-- Append-only MVP: no browser UPDATE/DELETE privileges, no mutable ownership or parents.
create policy catalogue_books on public.books for select to authenticated using(true);
create policy catalogue_songs on public.songs for select to authenticated using(true);
create policy catalogue_sources on public.catalogue_sources for select to authenticated using(true);
create policy own_students_read on public.students for select to authenticated using(owner_user_id=(select auth.uid()));
create policy own_students_insert on public.students for insert to authenticated with check(owner_user_id=(select auth.uid()));
create policy own_books_read on public.student_books for select to authenticated using(
 exists(select 1 from public.students s where s.id=student_id and s.owner_user_id=(select auth.uid())));
create policy own_books_insert on public.student_books for insert to authenticated with check(
 exists(select 1 from public.students s where s.id=student_id and s.owner_user_id=(select auth.uid())));
create policy own_assessments_read on public.assessments for select to authenticated using(
 exists(select 1 from public.student_books sb join public.students s on s.id=sb.student_id where sb.id=student_book_id and s.owner_user_id=(select auth.uid())));
create policy own_assessments_insert on public.assessments for insert to authenticated with check(
 exists(select 1 from public.student_books sb join public.students s on s.id=sb.student_id where sb.id=student_book_id and s.owner_user_id=(select auth.uid())));

-- PostgreSQL 15 security_invoker preserves the base-table policies.
create view public.latest_assessments with (security_invoker=true) as
 select distinct on (student_book_id,song_id) * from public.assessments
 order by student_book_id,song_id,assessed_at desc,id desc;
revoke all on public.latest_assessments from anon,authenticated;
grant select on public.latest_assessments to authenticated;
