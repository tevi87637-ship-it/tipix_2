-- Transactional authenticated API tests. Never retains test users or scores.
begin;
do $$ declare uid uuid:=gen_random_uuid();other_id uuid:=gen_random_uuid();item record;t record;r jsonb;cid uuid;tid uuid;counted integer:=0;denied boolean:=false;begin
insert into auth.users(id,email,email_confirmed_at) values(uid,'foundation-fixture@example.invalid',now()),(other_id,'foundation-other@example.invalid',now());
insert into public.tipix_student_profiles(id,full_name,school_name,school_city,grade,stream) values(uid,'Foundation learner','Test school','Test city',11,'pcmb'),(other_id,'Another learner','Test school','Test city',11,'pcmb');
perform set_config('request.jwt.claim.sub',uid::text,true);
for item in select id from public.academic_concepts where classification_reference->>'content_pack'='foundation-v1' loop
 cid:=item.id;counted:=counted+1;
 execute 'set local role authenticated';r:=public.learning_api('lesson',jsonb_build_object('concept_id',cid));execute 'reset role';
 if jsonb_array_length(r->'tasks')<>9 then raise exception 'Incomplete lesson %',cid;end if;
 if exists(select 1 from jsonb_array_elements(r->'tasks') a where a ? 'answer' or a ? 'explanation') then raise exception 'Private check answer leaked';end if;
 for t in select a.id,k.answer from public.academic_learning_tasks a join tipix_private.academic_task_keys k on k.task_id=a.id where a.concept_id=cid order by a.position loop
  tid:=t.id;execute 'set local role authenticated';
  r:=public.learning_api('check',jsonb_build_object('concept_id',cid,'task_id',tid,'answer',(t.answer+1)%3));
  if (r->'state'->'answers'->tid::text->>'correct')::boolean then raise exception 'Wrong answer accepted';end if;
  r:=public.learning_api('check',jsonb_build_object('concept_id',cid,'task_id',tid,'answer',t.answer));
  if not (r->'state'->'answers'->tid::text->>'correct')::boolean then raise exception 'Correct answer rejected';end if;
  r:=public.learning_api('lesson',jsonb_build_object('concept_id',cid));
  if r->'state'->>'task_id'<>tid::text or r->'state'->'answers'->tid::text->>'explanation' is null then raise exception 'Exact resume failed';end if;
  execute 'reset role';
 end loop;
end loop;
if counted<>28 then raise exception 'Expected 28 new concepts, got %',counted;end if;
if exists(select 1 from public.academic_verified_question_bank q join public.academic_concepts c on c.id=q.concept_id where c.classification_reference->>'content_pack'='foundation-v1' and (q.is_published or q.source_year is not null or q.source_exam is not null)) then raise exception 'Draft publication or original provenance broken';end if;
execute 'set local role authenticated';r:=public.academic_api('overview');if (r->'totals'->>'points')::int<>0 then raise exception 'Unreviewed learning checks awarded points';end if;
perform set_config('request.jwt.claim.sub',other_id::text,true);
if exists(select 1 from public.academic_learning_state) then raise exception 'Student state isolation failed';end if;
begin perform * from tipix_private.academic_task_keys;exception when insufficient_privilege then denied:=true;end;
if not denied then raise exception 'Private answer keys accessible';end if;
execute 'reset role';
end $$;
select 'passed' as foundation_28_lessons_feedback_resume_and_isolation;
rollback;
