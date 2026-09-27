begin;

grant update(display_name) on public.students to authenticated;
create policy own_students_update on public.students for update to authenticated
 using(owner_user_id=(select auth.uid())) with check(owner_user_id=(select auth.uid()));

create function public.set_book_archived(p_student_book_id uuid, p_archived boolean)
returns public.student_books language plpgsql security definer set search_path = '' as $$
declare result public.student_books;
begin
 if p_archived is null then raise exception 'Choose archive or restore' using errcode='22023'; end if;
 select sb.* into result from public.student_books sb join public.students s on s.id=sb.student_id
 where sb.id=p_student_book_id and s.owner_user_id=auth.uid() for update of sb;
 if not found then raise exception 'Book unavailable' using errcode='42501'; end if;
 update public.student_books set archived_at=case when p_archived then coalesce(archived_at,clock_timestamp()) else null end
 where id=p_student_book_id returning * into result;
 return result;
end $$;
revoke all on function public.set_book_archived(uuid,boolean) from public,anon;
grant execute on function public.set_book_archived(uuid,boolean) to authenticated;

-- Serialize inserts and archive/restore on the same selected-book row.
create function public.require_active_book() returns trigger
language plpgsql security definer set search_path = '' as $$
declare selected public.student_books;
begin
 if tg_table_name='assessments' then
  select sb.* into selected from public.student_books sb join public.students s on s.id=sb.student_id
  where sb.id=new.student_book_id and s.owner_user_id=auth.uid() for update of sb;
 else
  if new.book_id is null then return new; end if;
  select sb.* into selected from public.student_books sb join public.students s on s.id=sb.student_id
  where sb.student_id=new.student_id and sb.book_id=new.book_id and s.owner_user_id=auth.uid() for update of sb;
 end if;
 if not found then raise exception 'Book unavailable' using errcode='42501'; end if;
 if selected.archived_at is not null then raise exception 'Restore this book before adding practice or awards' using errcode='23514'; end if;
 return new;
end $$;
revoke all on function public.require_active_book() from public,anon,authenticated;
create trigger assessment_active_book before insert on public.assessments for each row execute function public.require_active_book();
create trigger certificate_active_book before insert on public.certificates for each row execute function public.require_active_book();

create table public.assessment_revisions (
 id uuid primary key,
 assessment_id uuid not null references public.assessments(id) on delete cascade,
 revision_number integer not null check(revision_number>0),
 fluency integer not null check(fluency between 1 and 3),
 dynamics integer not null check(dynamics between 1 and 3),
 rhythm integer not null check(rhythm between 1 and 3),
 feedback text check(length(feedback)<=2000),
 excluded boolean not null,
 created_at timestamptz not null default clock_timestamp(),
 unique(assessment_id,revision_number)
);
alter table public.assessment_revisions enable row level security;
revoke all on public.assessment_revisions from anon,authenticated;
grant select on public.assessment_revisions to authenticated;
create policy own_revisions_read on public.assessment_revisions for select to authenticated using(
 exists(select 1 from public.assessments a where a.id=assessment_id));

create function public.revise_assessment(p_id uuid,p_assessment_id uuid,p_expected_revision integer,
 p_fluency integer,p_dynamics integer,p_rhythm integer,p_feedback text,p_excluded boolean)
returns public.assessment_revisions language plpgsql security definer set search_path = '' as $$
declare original public.assessments; saved public.assessment_revisions; current_revision integer;
begin
 select a.* into original from public.assessments a
 join public.student_books sb on sb.id=a.student_book_id join public.students s on s.id=sb.student_id
 where a.id=p_assessment_id and s.owner_user_id=auth.uid() for update of a;
 if not found then raise exception 'Assessment unavailable' using errcode='42501'; end if;
 if p_id is null or p_expected_revision is null or p_expected_revision<0 then
  raise exception 'Invalid revision request' using errcode='22023';
 end if;
 select * into saved from public.assessment_revisions where id=p_id;
 if found then
  if saved.assessment_id=p_assessment_id and saved.revision_number=p_expected_revision+1
   and saved.fluency is not distinct from p_fluency and saved.dynamics is not distinct from p_dynamics
   and saved.rhythm is not distinct from p_rhythm and saved.feedback is not distinct from p_feedback
   and saved.excluded is not distinct from p_excluded then return saved; end if;
  raise exception 'Revision ID already used with different details' using errcode='22023';
 end if;
 select coalesce(max(revision_number),0) into current_revision from public.assessment_revisions where assessment_id=p_assessment_id;
 if current_revision<>p_expected_revision then
  raise exception 'This assessment changed in another session. Reload the assessment before trying again.' using errcode='40001';
 end if;
 insert into public.assessment_revisions(id,assessment_id,revision_number,fluency,dynamics,rhythm,feedback,excluded)
 values(p_id,p_assessment_id,current_revision+1,p_fluency,p_dynamics,p_rhythm,p_feedback,p_excluded) returning * into saved;
 return saved;
end $$;
revoke all on function public.revise_assessment(uuid,uuid,integer,integer,integer,integer,text,boolean) from public,anon;
grant execute on function public.revise_assessment(uuid,uuid,integer,integer,integer,integer,text,boolean) to authenticated;

create view public.effective_assessments with (security_invoker=true) as
 select a.id,a.student_book_id,a.song_id,a.assessed_at,
 coalesce(r.fluency,a.fluency) as fluency,coalesce(r.dynamics,a.dynamics) as dynamics,coalesce(r.rhythm,a.rhythm) as rhythm,
 case when r.id is null then a.feedback else r.feedback end as feedback,
 coalesce(r.excluded,false) as excluded,coalesce(r.revision_number,0) as revision_number,r.created_at as revised_at
 from public.assessments a left join lateral (
  select * from public.assessment_revisions where assessment_id=a.id order by revision_number desc limit 1
 ) r on true;
drop view public.latest_assessments;
create view public.latest_assessments with (security_invoker=true) as
 select distinct on(student_book_id,song_id) * from public.effective_assessments where not excluded
 order by student_book_id,song_id,assessed_at desc,id desc;
revoke all on public.effective_assessments,public.latest_assessments from anon,authenticated;
grant select on public.effective_assessments,public.latest_assessments to authenticated;
commit;
