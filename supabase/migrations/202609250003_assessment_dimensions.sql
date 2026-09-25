-- Design-stage change: the owner confirmed there are no saved assessments.
-- Refuse to transform existing records or invent scores if that assumption changes.
begin;
do $$ begin
 if exists(select 1 from public.assessments) then
  raise exception 'This design-stage migration requires an empty assessments table. No records were changed.';
 end if;
end $$;
drop view public.latest_assessments;
alter table public.assessments drop column stars;
alter table public.assessments add column fluency integer not null check(fluency between 1 and 3);
alter table public.assessments add column dynamics integer not null check(dynamics between 1 and 3);
alter table public.assessments add column rhythm integer not null check(rhythm between 1 and 3);
grant insert(fluency,dynamics,rhythm) on public.assessments to authenticated;
create view public.latest_assessments with (security_invoker=true) as
 select distinct on (student_book_id,song_id) * from public.assessments
 order by student_book_id,song_id,assessed_at desc,id desc;
revoke all on public.latest_assessments from anon,authenticated;
grant select on public.latest_assessments to authenticated;
commit;
