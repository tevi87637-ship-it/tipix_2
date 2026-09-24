begin;
do $$ declare uid uuid:=gen_random_uuid();cid uuid;tid uuid;correct_answer integer;r jsonb;item record;begin
insert into auth.users(id,email,email_confirmed_at) values(uid,'sets-learning-fixture@example.invalid',now());
insert into public.tipix_student_profiles(id,full_name,school_name,school_city,grade,stream) values(uid,'Sets learner','Test school','Test city',11,'pcm');
perform set_config('request.jwt.claim.sub',uid::text,true);
for item in select c.id from public.academic_concepts c join public.academic_curriculum_versions v on v.id=c.curriculum_id where v.class_level=11 and v.subject='Mathematics' and c.chapter_title='Sets' and c.concept_title<>'Union and intersection' loop
 cid:=item.id;
 execute 'set local role authenticated';r:=public.learning_api('lesson',jsonb_build_object('concept_id',cid));execute 'reset role';
 if jsonb_array_length(r->'tasks')<>9 then raise exception 'New lesson missing tasks';end if;
 select t.id,k.answer into strict tid,correct_answer from public.academic_learning_tasks t join tipix_private.academic_task_keys k on k.task_id=t.id where t.concept_id=cid and t.position=7;
 execute 'set local role authenticated';
 r:=public.learning_api('check',jsonb_build_object('concept_id',cid,'task_id',tid,'answer',(correct_answer+1)%2));
 r:=public.learning_api('check',jsonb_build_object('concept_id',cid,'task_id',tid,'answer',correct_answer));
 if not (r->'state'->'answers'->tid::text->>'correct')::boolean then raise exception 'Correct check not saved';end if;
 r:=public.learning_api('lesson',jsonb_build_object('concept_id',cid));
 if r->'state'->>'task_id'<>tid::text or r->'state'->'answers'->tid::text->>'explanation' is null then raise exception 'Lesson resume lost feedback';end if;
 execute 'reset role';
end loop;
execute 'set local role authenticated';r:=public.academic_api('overview');
if (r->'totals'->>'points')::int<>0 then raise exception 'Learning checks awarded scored points';end if;
execute 'reset role';end $$;
select 'passed' as sets_content_checks_and_resume;
rollback;
