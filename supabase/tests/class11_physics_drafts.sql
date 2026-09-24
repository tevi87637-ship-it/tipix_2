-- Tests publication, scoring, mistakes, recovery and resume in a rollback only.
begin;
do $$
declare admin_id uuid:=gen_random_uuid(); student_id uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); cv uuid;cid uuid;qid uuid;req uuid:=gen_random_uuid();r jsonb;f jsonb;k jsonb;row record;denied boolean;
begin
select id into strict cv from public.academic_curriculum_versions where class_level=11 and subject='Physics' and academic_year='2026-27';
if (select count(*) from public.academic_concepts where curriculum_id=cv and lesson is not null)<>5 then raise exception 'Five concepts required';end if;
if (select count(*) from public.academic_learning_tasks t join public.academic_concepts c on c.id=t.concept_id where c.curriculum_id=cv)<>35 then raise exception '35 complete lesson tasks required';end if;
if exists(select 1 from public.academic_verified_question_bank q join public.academic_concepts c on c.id=q.concept_id where c.curriculum_id=cv and (q.is_published or q.source_year is not null or q.source_exam is not null)) then raise exception 'Drafts must not be published or mislabelled';end if;
insert into auth.users(id,email,email_confirmed_at) values(admin_id,'physics-review-fixture@example.invalid',now()),(student_id,'physics-student-fixture@example.invalid',now()),(outsider,'physics-isolation-fixture@example.invalid',now());
insert into public.tipix_student_profiles(id,full_name,school_name,school_city,grade,stream) values(admin_id,'Review fixture','Test','Test',11,'pcm'),(student_id,'Student fixture','Test','Test',11,'pcm'),(outsider,'Other fixture','Test','Test',11,'commerce');
insert into tipix_private.academic_staff(user_id,role) values(admin_id,'admin');
perform set_config('request.jwt.claim.sub',admin_id::text,true);execute 'set local role authenticated';
r:=public.curriculum_review('inspect',jsonb_build_object('curriculum_id',cv));if (select count(*) from jsonb_array_elements(r->'concepts') c where jsonb_array_length(c->'tasks')>0)<>5 then raise exception 'Admin lesson inspection failed';end if;
execute 'reset role';
for row in select id from public.academic_concepts where curriculum_id=cv and lesson is not null loop
execute 'set local role authenticated';perform public.publish_learning_concept(row.id);execute 'reset role';end loop;
execute 'reset role';
for row in select q.id from public.academic_verified_question_bank q join public.academic_concepts c on c.id=q.concept_id where c.curriculum_id=cv loop
execute 'set local role authenticated';perform public.academic_api('publish_question',jsonb_build_object('question_id',row.id));execute 'reset role';end loop;
select c.id into strict cid from public.academic_concepts c where curriculum_id=cv and concept_title='Position and displacement';
perform set_config('request.jwt.claim.sub',student_id::text,true);execute 'set local role authenticated';
r:=public.learning_api('resume',jsonb_build_object('concept_id',cid,'filters','{}'::jsonb));qid:=(r->'question'->>'id')::uuid;
if r->'question'->>'source_name'<>'TIPIX Original' then raise exception 'Source label absent';end if;
perform public.learning_api('draft',jsonb_build_object('concept_id',cid,'question_id',qid,'answer',-999,'filters','{}'::jsonb));
r:=public.learning_api('resume',jsonb_build_object('concept_id',cid,'filters','{}'::jsonb));if r->'state'->>'draft'<>'-999' then raise exception 'Draft resume failed';end if;
f:=public.academic_api('submit',jsonb_build_object('question_id',qid,'request_id',req,'answer',-999));
if (f->'attempt'->>'correct')::boolean or f->>'explanation' is null then raise exception 'Wrong answer feedback failed';end if;
perform public.academic_api('submit',jsonb_build_object('question_id',qid,'request_id',req,'answer',-999));
r:=public.academic_api('overview');if jsonb_array_length(r->'mistakes')<>1 or (r->'totals'->>'attempted')::int<>1 then raise exception 'Mistake/idempotency failed';end if;
r:=public.learning_api('resume',jsonb_build_object('concept_id',cid,'filters','{}'::jsonb));if r->'feedback'->'attempt'->>'id'<>f->'attempt'->>'id' then raise exception 'Feedback resume failed';end if;
execute 'reset role';select answer into k from tipix_private.academic_answer_keys where question_id=qid;execute 'set local role authenticated';
f:=public.academic_api('submit',jsonb_build_object('question_id',qid,'request_id',gen_random_uuid(),'answer',k,'retry',true));
if not (f->'attempt'->>'correct')::boolean or (f->'attempt'->>'points')::int<>0 then raise exception 'Recovery grading failed';end if;
r:=public.academic_api('overview');if r->'mistakes'->0->>'resolved_at' is null then raise exception 'Recovery not recorded';end if;
execute 'reset role';
for row in select q.id,k.answer from public.academic_verified_question_bank q join tipix_private.academic_answer_keys k on k.question_id=q.id where q.concept_id=cid and q.id<>qid order by q.position loop
execute 'set local role authenticated';perform public.academic_api('submit',jsonb_build_object('question_id',row.id,'request_id',gen_random_uuid(),'answer',row.answer));execute 'reset role';end loop;
execute 'set local role authenticated';r:=public.academic_api('overview');if (r->'totals'->>'points')::int<>50 or (r->'totals'->>'attempted')::int<>6 then raise exception 'Shared totals incorrect';end if;
if not exists(select 1 from jsonb_array_elements(r->'concepts') c where c->>'concept_id'=cid::text and (c->>'mastery')::numeric=100) then raise exception 'Mastery incorrect';end if;
perform set_config('request.jwt.claim.sub',outsider::text,true);
if exists(select 1 from public.academic_attempts) then raise exception 'Private attempts leaked';end if;
denied:=false;begin perform public.learning_api('lesson',jsonb_build_object('concept_id',cid));exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Wrong stream gained access';end if;
denied:=false;begin perform public.curriculum_review('inspect',jsonb_build_object('curriculum_id',cv));exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Student accessed editor';end if;
denied:=false;begin perform * from public.academic_books;exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Unreviewed book exposed';end if;
execute 'reset role';end $$;
select 'passed' as physics_review_scoring_recovery_resume;
rollback;
