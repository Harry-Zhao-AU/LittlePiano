-- Parent-issued awards: deliberately no rating or catalogue-completeness gate.
create table public.certificates (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references public.students(id) on delete cascade,
 book_id uuid references public.books(id),
 song_id uuid,
 kind text not null check(kind in ('book','special')),
 template_id text not null,
 template_version integer not null default 1 check(template_version=1),
 child_name text not null check(length(trim(child_name)) between 1 and 80),
 title text not null check(length(trim(title)) between 1 and 160),
 message text not null default '' check(length(message)<=300),
 awarded_by text not null check(length(trim(awarded_by)) between 1 and 80),
 awarded_on date not null,
 created_at timestamptz not null default clock_timestamp(),
 foreign key(song_id,book_id) references public.songs(id,book_id),
 check(song_id is null or book_id is not null),
 check(kind <> 'book' or (book_id is not null and song_id is null and message='')),
 check((kind='book' and template_id in ('piano-party','musical-parchment')) or
       (kind='special' and template_id in ('little-star','brave-performer')))
);
create index certificates_student on public.certificates(student_id,created_at desc,id desc);
alter table public.certificates enable row level security;
revoke all on public.certificates from anon,authenticated;
grant select,delete on public.certificates to authenticated;
grant insert(id,student_id,book_id,song_id,kind,template_id,template_version,child_name,title,message,awarded_by,awarded_on) on public.certificates to authenticated;
create policy certificates_read on public.certificates for select to authenticated using(
 exists(select 1 from public.students s where s.id=student_id and s.owner_user_id=(select auth.uid())));
create policy certificates_delete on public.certificates for delete to authenticated using(
 exists(select 1 from public.students s where s.id=student_id and s.owner_user_id=(select auth.uid())));
create policy certificates_insert on public.certificates for insert to authenticated with check(
 exists(select 1 from public.students s where s.id=student_id and s.owner_user_id=(select auth.uid()))
 and (book_id is null or exists(select 1 from public.student_books sb where sb.student_id=certificates.student_id and sb.book_id=certificates.book_id)));
-- No UPDATE privilege: certificate snapshots and relationships are immutable.
