-- Isolated admin editorial endpoint. Does not replace scoring/authentication functions.
create or replace function tipix_private.curriculum_review(op text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();cid uuid; qid uuid;taskid uuid;result jsonb;
begin
if uid is null or not tipix_private.verified_account() or not exists(select 1 from tipix_private.academic_staff where user_id=uid and role='admin') then raise exception 'Administrator review required' using errcode='42501';end if;
if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>50000 then raise exception 'Invalid review request';end if;
if op='inspect' then
cid:=(payload->>'curriculum_id')::uuid;
return jsonb_build_object('books',(select coalesce(jsonb_agg(to_jsonb(b)),'[]') from public.academic_books b where b.curriculum_id=cid),'concepts',(select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('tasks',(select coalesce(jsonb_agg(to_jsonb(t) order by t.position),'[]') from public.academic_learning_tasks t where t.concept_id=c.id)) order by c.position),'[]') from public.academic_concepts c where c.curriculum_id=cid));
elsif op='save_task' then
 taskid:=(payload->>'task_id')::uuid;
 if not exists(select 1 from public.academic_learning_tasks t join public.academic_concepts c on c.id=t.concept_id join public.academic_curriculum_versions v on v.id=c.curriculum_id where t.id=taskid and v.status='candidate') then raise exception 'Only draft lessons may be edited';end if;
 if jsonb_typeof(payload->'blocks')<>'array' or jsonb_array_length(payload->'blocks') not between 1 and 30 or exists(select 1 from jsonb_array_elements(payload->'blocks') b where coalesce(b->>'type','') not in ('paragraph','formula','motion','venn') or coalesce(length(b->>'text'),0) not between 1 and 10000) then raise exception 'Use valid lesson blocks';end if;
 update public.academic_learning_tasks set blocks=payload->'blocks' where id=taskid;
 return jsonb_build_object('saved',true);
elsif op='save_question' then
 qid:=(payload->>'question_id')::uuid;
 if not exists(select 1 from public.academic_verified_question_bank where id=qid and not is_published) or exists(select 1 from public.academic_attempts where question_id=qid) then raise exception 'Only unused draft questions may be edited';end if;
 if coalesce(length(payload->>'question_text'),0) not between 1 and 20000 or coalesce(length(payload->>'explanation'),0) not between 1 and 20000 or not(payload ? 'answer') then raise exception 'Question, answer and detailed solution required';end if;
 update public.academic_verified_question_bank set question_text=payload->>'question_text',hint=payload->>'hint',is_verified=false,reviewed_by=null,reviewed_at=null where id=qid;
 update tipix_private.academic_answer_keys set answer=payload->'answer',explanation=payload->>'explanation' where question_id=qid;
 return jsonb_build_object('saved',true);
elsif op='publish_curriculum' then
 cid:=(payload->>'curriculum_id')::uuid;
 if not exists(select 1 from public.academic_concepts where curriculum_id=cid) or exists(select 1 from public.academic_concepts c where c.curriculum_id=cid and not exists(select 1 from public.academic_learning_tasks where concept_id=c.id)) then raise exception 'Review complete lessons before publishing';end if;
 result:=tipix_private.academic_api('publish_curriculum',payload);
 update public.academic_concepts set classification_reference=classification_reference||jsonb_build_object('verification_status','verified','reviewed_by',uid,'reviewed_at',now()) where curriculum_id=cid;
 return result;
else raise exception 'Unknown review action';end if;
end $$;
revoke all on function tipix_private.curriculum_review(text,jsonb) from public,anon,authenticated;
grant execute on function tipix_private.curriculum_review(text,jsonb) to authenticated;
create or replace function public.curriculum_review(op text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select tipix_private.curriculum_review(op,payload); $$;
revoke all on function public.curriculum_review(text,jsonb) from public,anon;
grant execute on function public.curriculum_review(text,jsonb) to authenticated;
