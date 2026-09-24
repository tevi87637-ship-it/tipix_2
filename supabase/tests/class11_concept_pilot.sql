-- Run after the approved pilot migration. Uses disposable fixtures inside a rollback.
begin;
do $$
declare u uuid:=gen_random_uuid();other uuid:=gen_random_uuid();cid uuid; qid uuid; req uuid:=gen_random_uuid();r jsonb;feedback jsonb;total integer;denied boolean; expected jsonb; question record;
begin
 insert into auth.users(id,email,email_confirmed_at) values(u,'pilot-fixture@example.invalid',now()),(other,'pilot-isolation@example.invalid',now());
 insert into public.tipix_student_profiles(id,full_name,school_name,school_city,grade,stream) values(u,'Pilot Fixture','Test School','Test City',11,'pcm'),(other,'Isolation Fixture','Test School','Test City',11,'pcb');
 select c.id into strict cid from public.academic_concepts c join public.academic_curriculum_versions v on v.id=c.curriculum_id where v.class_level=11 and c.concept_title='Union and intersection';
 if (select count(*) from public.academic_verified_question_bank where concept_id=cid and is_published)<>8 then raise exception 'FAIL expected eight questions'; end if;
 if exists(select 1 from public.academic_verified_question_bank q join public.academic_source_registry s on s.id=q.source_id where q.concept_id=cid and (s.source_name<>'Concept Practice' or q.source_year is not null or q.source_exam is not null)) then raise exception 'FAIL original source labels';end if;
 perform set_config('request.jwt.claim.sub',u::text,true);execute 'set local role authenticated';
 r:=public.academic_api('catalog');if not exists(select 1 from jsonb_array_elements(r) c where c->>'id'=cid::text) then raise exception 'FAIL class stream catalogue';end if;
 r:=public.learning_api('resume',jsonb_build_object('concept_id',cid,'filters','{}'::jsonb));qid:=(r->'question'->>'id')::uuid;
 if r->'question' ? 'answer' or r->'feedback'<>'null'::jsonb then raise exception 'FAIL answer disclosed before submission';end if;
 perform public.learning_api('draft',jsonb_build_object('concept_id',cid,'question_id',qid,'answer',1));
 r:=public.learning_api('resume',jsonb_build_object('concept_id',cid,'filters','{}'::jsonb));if r->'question'->>'id'<>qid::text or r->'state'->>'draft'<>'1' then raise exception 'FAIL exact draft position';end if;
 feedback:=public.academic_api('submit',jsonb_build_object('question_id',qid,'request_id',req,'answer',1));
 if not (feedback->'attempt'->>'correct')::boolean then raise exception 'FAIL grading';end if;
 perform public.academic_api('submit',jsonb_build_object('question_id',qid,'request_id',req,'answer',1));
 perform public.academic_api('submit',jsonb_build_object('question_id',qid,'request_id',gen_random_uuid(),'answer',1));
 r:=public.academic_api('overview');if (r->'totals'->>'points')::integer<>10 or (r->'totals'->>'attempted')::integer<>1 then raise exception 'FAIL duplicate points';end if;
 r:=public.learning_api('resume',jsonb_build_object('concept_id',cid,'filters','{}'::jsonb));if r->'question'->>'id'<>qid::text or r->'feedback'->'attempt'->>'id'<>feedback->'attempt'->>'id' then raise exception 'FAIL feedback resume';end if;
 r:=public.learning_api('next',jsonb_build_object('concept_id',cid,'filters','{}'::jsonb));if r->'question'->>'id'=qid::text then raise exception 'FAIL advancement';end if;
 r:=public.learning_api('resume',jsonb_build_object('concept_id',cid,'filters',jsonb_build_object('difficulty','3','type','numerical')));if r->'question'->>'difficulty'<>'3' or r->'question'->>'question_type'<>'numerical' then raise exception 'FAIL difficulty/type filters';end if;
 r:=public.learning_api('resume',jsonb_build_object('concept_id',cid,'filters',jsonb_build_object('year','2024')));if r->'question'<>'null'::jsonb then raise exception 'FAIL year filter';end if;
 denied:=false;begin perform * from tipix_private.academic_answer_keys;exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'FAIL private answer access';end if;
 denied:=false;begin perform public.academic_api('publish_curriculum',jsonb_build_object('curriculum_id',cid));exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'FAIL student publication';end if;
 execute 'reset role';
 for question in select q.id,k.answer from public.academic_verified_question_bank q join tipix_private.academic_answer_keys k on k.question_id=q.id where q.concept_id=cid order by q.position loop
 expected:=question.answer;
 execute 'set local role authenticated';perform public.academic_api('submit',jsonb_build_object('question_id',question.id,'request_id',gen_random_uuid(),'answer',expected));execute 'reset role';
 end loop;
 execute 'set local role authenticated';r:=public.academic_api('overview');if (r->'totals'->>'points')::integer<>80 then raise exception 'FAIL shared points total';end if;
 if not exists(select 1 from jsonb_array_elements(r->'concepts') c where c->>'concept_id'=cid::text and (c->>'mastery')::numeric=100) then raise exception 'FAIL mastery';end if;
 perform set_config('request.jwt.claim.sub',other::text,true);
 if exists(select 1 from public.academic_attempts) or exists(select 1 from public.academic_learning_state) then raise exception 'FAIL student isolation';end if;
 denied:=false;begin perform public.learning_api('lesson',jsonb_build_object('concept_id',cid));exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'FAIL stream isolation';end if;
 execute 'reset role';
end $$;
select 'passed' as class11_pilot_security_scoring_resume;
rollback;
