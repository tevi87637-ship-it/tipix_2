-- Publishing one reviewed lesson must not require publishing an entire curriculum map.
create or replace function tipix_private.publish_learning_concept(concept_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();cv uuid;
begin
 if uid is null or not tipix_private.verified_account() or not exists(select 1 from tipix_private.academic_staff where user_id=uid and role='admin') then raise exception 'Administrator review required' using errcode='42501';end if;
 select c.curriculum_id into cv from public.academic_concepts c where c.id=concept_id and nullif(btrim(c.lesson),'') is not null and nullif(btrim(c.lesson_rights_reference),'') is not null for update;
 if cv is null then raise exception 'Lesson and authorship reference required';end if;
 if (select count(*) from public.academic_learning_tasks t where t.concept_id=publish_learning_concept.concept_id)<7 then raise exception 'Review the complete lesson tasks before publishing';end if;
 if exists(select 1 from public.academic_learning_tasks t where t.concept_id=publish_learning_concept.concept_id and (jsonb_array_length(t.blocks)=0 or (t.check_prompt is not null and not exists(select 1 from tipix_private.academic_task_keys k where k.task_id=t.id)))) then raise exception 'Lesson tasks or mini-check answer missing';end if;
 update public.academic_curriculum_versions set status='published' where id=cv and status='candidate';
 if not exists(select 1 from public.academic_curriculum_versions where id=cv and status='published') then raise exception 'Cannot publish into an archived curriculum';end if;
 update public.academic_concepts c set published=true,classification_reference=classification_reference||jsonb_build_object('verification_status','verified','reviewed_by',uid,'reviewed_at',now()) where c.id=concept_id;
 return jsonb_build_object('published',true,'concept_id',concept_id);
end $$;
revoke all on function tipix_private.publish_learning_concept(uuid) from public,anon;
grant execute on function tipix_private.publish_learning_concept(uuid) to authenticated;
create or replace function public.publish_learning_concept(concept_id uuid) returns jsonb language sql security invoker set search_path='' as $$ select tipix_private.publish_learning_concept(concept_id) $$;
revoke all on function public.publish_learning_concept(uuid) from public,anon;
grant execute on function public.publish_learning_concept(uuid) to authenticated;
