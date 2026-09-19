-- Additive pilot: original content is identified explicitly, never presented as verified external material.
alter table public.academic_curriculum_versions add column streams text[];
update public.academic_curriculum_versions set streams=case when class_level<=10 then array['general'] when subject='Mathematics' then array['pcm','pcmb','commerce'] when subject in ('Physics','Chemistry') then array['pcm','pcb','pcmb'] when subject='Biology' then array['pcb','pcmb'] else array['commerce'] end;
alter table public.academic_curriculum_versions alter column streams set default array[]::text[];
alter table public.academic_curriculum_versions alter column streams set not null;
alter table public.academic_curriculum_versions add constraint curriculum_streams_valid check(streams <@ array['general','pcm','pcb','pcmb','commerce']::text[]);
create table public.academic_topics(id uuid primary key default gen_random_uuid(),chapter_id uuid not null references public.academic_chapters,title text not null,position integer not null default 1,unique(chapter_id,title));
alter table public.academic_topics enable row level security;
revoke all on public.academic_topics from public,anon,authenticated;
alter table public.academic_concepts add column topic_id uuid references public.academic_topics;
create index academic_concept_topic on public.academic_concepts(topic_id);
insert into public.academic_topics(chapter_id,title) select distinct h.id,coalesce(nullif(c.subtopic,''),c.chapter_title) from public.academic_concepts c join public.academic_chapters h on h.curriculum_id=c.curriculum_id and h.title=c.chapter_title on conflict do nothing;
update public.academic_concepts c set topic_id=t.id from public.academic_topics t join public.academic_chapters h on h.id=t.chapter_id where h.curriculum_id=c.curriculum_id and h.title=c.chapter_title and t.title=coalesce(nullif(c.subtopic,''),c.chapter_title);
-- No invented human reviewer: separately identify the user-authorized original pilot seed.
-- Client grants remain revoked and the admin import API cannot set this field.
alter table public.academic_verified_question_bank add column original_seed_reference text;
alter table public.academic_verified_question_bank add column position integer not null default 1;
alter table public.academic_verified_question_bank drop constraint academic_verified_question_bank_check;
alter table public.academic_verified_question_bank add constraint academic_question_publication_check check(not is_published or (is_verified and reviewed_at is not null and (reviewed_by is not null or (original_seed_reference='class11-sets-pilot-v1' and source_exam is null and source_year is null and license_code='TIPIX_ORIGINAL'))));
insert into public.academic_source_registry(source_code,source_name,source_type,organization,base_url,rights_status,license_code,rights_reference,active) values('concept-practice','Concept Practice','open','TIPIX','https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','approved','TIPIX_ORIGINAL','Original questions created for the user-authorized Class 11 pilot. Not NCERT or examination questions.',true);
insert into public.academic_curriculum_versions(board,academic_year,class_level,subject,official_source,status,streams) values('NCERT','2026-27',11,'Mathematics','https://ncert.nic.in/textbook/pdf/kemh101.pdf','published',array['pcm','pcmb','commerce']);
insert into public.academic_chapters(curriculum_id,position,title,source_url) select id,1,'Sets',official_source from public.academic_curriculum_versions where board='NCERT' and class_level=11 and subject='Mathematics' and academic_year='2026-27';
insert into public.academic_topics(chapter_id,title,position) select h.id,'Set operations',1 from public.academic_chapters h join public.academic_curriculum_versions v on v.id=h.curriculum_id where v.class_level=11 and v.subject='Mathematics' and h.title='Sets';
insert into public.academic_concepts(curriculum_id,chapter_title,concept_title,subtopic,position,lesson,lesson_rights_reference,published,topic_id) select h.curriculum_id,h.title,'Union and intersection','Set operations',1,'Combine two sets with union; find their shared elements with intersection. Learn the difference, represent both operations and count distinct elements.','Original TIPIX lesson; chapter alignment checked against NCERT Mathematics Class XI, Sets. No textbook prose reproduced.',true,t.id from public.academic_topics t join public.academic_chapters h on h.id=t.chapter_id join public.academic_curriculum_versions v on v.id=h.curriculum_id where v.class_level=11 and v.subject='Mathematics' and h.title='Sets' and t.title='Set operations';

do $$ declare cid uuid; sid uuid; qid uuid; begin
select c.id into strict cid from public.academic_concepts c join public.academic_curriculum_versions v on v.id=c.curriculum_id where v.class_level=11 and v.subject='Mathematics' and c.concept_title='Union and intersection';
select id into strict sid from public.academic_source_registry where source_code='concept-practice';
insert into public.academic_learning_tasks(concept_id,position,title,blocks) values(cid,1,'Start here · learning goals','[{"type": "paragraph", "text": "A set is a collection of distinct elements. Union combines the elements of two sets. Intersection keeps only the elements shared by both."}, {"type": "paragraph", "text": "By the end, you will identify union and intersection, write their elements without duplicates, interpret overlapping groups and calculate the size of a union."}]'::jsonb);
insert into public.academic_learning_tasks(concept_id,position,title,blocks) values(cid,2,'Key ideas · either or both','[{"type": "paragraph", "text": "An element belongs to A ∪ B when it is in A, in B, or in both. This is inclusive “or”. An element belongs to A ∩ B only when it belongs to both A and B."}, {"type": "formula", "text": "A ∪ B = {x : x ∈ A or x ∈ B}\nA ∩ B = {x : x ∈ A and x ∈ B}"}, {"type": "paragraph", "text": "If the sets have no shared elements, their intersection is the empty set, ∅. The order of elements does not change a set."}]'::jsonb);
insert into public.academic_learning_tasks(concept_id,position,title,blocks) values(cid,3,'Visual · explore the overlap','[{"type": "venn", "text": "Let A = {1, 2, 3} and B = {3, 4, 5}. The shared region contains 3. The two circles together contain 1, 2, 3, 4 and 5."}, {"type": "paragraph", "text": "Switch between union and intersection in the diagram. Ask which regions satisfy “at least one set” and which satisfy “both sets”."}]'::jsonb);
insert into public.academic_learning_tasks(concept_id,position,title,blocks) values(cid,4,'Important formula · count each element once','[{"type": "formula", "text": "n(A ∪ B) = n(A) + n(B) − n(A ∩ B)"}, {"type": "paragraph", "text": "Adding n(A) and n(B) counts every shared element twice. Subtract the overlap once to count it exactly once. This counting formula applies to finite sets."}, {"type": "formula", "text": "A ∪ B = B ∪ A\nA ∩ B = B ∩ A\nA ∪ ∅ = A\nA ∩ ∅ = ∅"}]'::jsonb);
insert into public.academic_learning_tasks(concept_id,position,title,blocks) values(cid,5,'Worked example · school clubs','[{"type": "paragraph", "text": "A coding club has 18 students and a science club has 14 students. Six students join both. How many join at least one of the two clubs?"}, {"type": "paragraph", "text": "Step 1: identify n(A) = 18, n(B) = 14 and n(A ∩ B) = 6.\nStep 2: “at least one” asks for the union.\nStep 3: calculate 18 + 14 − 6 = 26.\nStep 4: check the regions: coding only 12, both 6, science only 8. Their sum is 26."}, {"type": "paragraph", "text": "The union is not necessarily the whole class. Students joining neither club are outside it."}]'::jsonb);
insert into public.academic_learning_tasks(concept_id,position,title,blocks) values(cid,6,'Common mistakes','[{"type": "paragraph", "text": "Do not list a shared element twice in a union. {1, 2, 2, 3} represents the same set as {1, 2, 3}."}, {"type": "paragraph", "text": "Do not confuse “either or both” with “exactly one”. Union includes the overlap. Intersection contains only the overlap."}, {"type": "paragraph", "text": "Do not add the overlap in the counting formula; subtract it once. Do not write {0} for an empty intersection: {0} has one element, while ∅ has none."}]'::jsonb);
insert into public.academic_learning_tasks(concept_id,position,title,blocks) values(cid,7,'Summary · choose the operation','[{"type": "paragraph", "text": "Union: collect every element present in either set, without repetition. Intersection: keep elements present in both. For finite sets, subtract the overlap once when adding their sizes."}, {"type": "paragraph", "text": "You are ready to practise when you can explain why 3 belongs to both operations for A = {1, 2, 3}, B = {3, 4, 5}, but 1 belongs only to their union. Practice below is original Concept Practice, not an NCERT exercise or PYQ."}]'::jsonb);
insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,difficulty,marks,source_url,license_code,rights_reference,fingerprint,is_verified,is_published,reviewed_at,original_seed_reference,position) values(cid,sid,'mcq','If A = {1, 3, 5} and B = {3, 4}, which set is A ∪ B?','["{3}", "{1, 3, 4, 5}", "{1, 4, 5}", "{1, 3, 5}"]'::jsonb,1,1,'https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','TIPIX_ORIGINAL','Original Concept Practice; no external source or exam year claimed.','class11-sets-pilot-v1-1',true,true,now(),'class11-sets-pilot-v1',1) returning id into qid;
insert into tipix_private.academic_answer_keys(question_id,answer,explanation) values(qid,'1'::jsonb,'Union collects elements from either set. Start with 1, 3, 5 and add 4 from B. The element 3 is already present. The distinct elements are {1, 3, 4, 5}.');
insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,difficulty,marks,source_url,license_code,rights_reference,fingerprint,is_verified,is_published,reviewed_at,original_seed_reference,position) values(cid,sid,'mcq','For A = {2, 4, 6, 8} and B = {1, 2, 3, 4}, find A ∩ B.','["{1, 2, 3, 4, 6, 8}", "{6, 8}", "{2, 4}", "∅"]'::jsonb,1,1,'https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','TIPIX_ORIGINAL','Original Concept Practice; no external source or exam year claimed.','class11-sets-pilot-v1-2',true,true,now(),'class11-sets-pilot-v1',2) returning id into qid;
insert into tipix_private.academic_answer_keys(question_id,answer,explanation) values(qid,'2'::jsonb,'Intersection requires membership in both sets. The elements 2 and 4 occur in both; 6 and 8 occur only in A, and 1 and 3 occur only in B. Hence A ∩ B = {2, 4}.');
insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,difficulty,marks,source_url,license_code,rights_reference,fingerprint,is_verified,is_published,reviewed_at,original_seed_reference,position) values(cid,sid,'true_false','The union of two sets includes the elements that belong to both sets.','[]'::jsonb,1,1,'https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','TIPIX_ORIGINAL','Original Concept Practice; no external source or exam year claimed.','class11-sets-pilot-v1-3',true,true,now(),'class11-sets-pilot-v1',3) returning id into qid;
insert into tipix_private.academic_answer_keys(question_id,answer,explanation) values(qid,'true'::jsonb,'True. The word “or” in the definition of union is inclusive: an element may belong to either set or both. The overlap is part of the union.');
insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,difficulty,marks,source_url,license_code,rights_reference,fingerprint,is_verified,is_published,reviewed_at,original_seed_reference,position) values(cid,sid,'numerical','A has 15 elements, B has 12 elements and A ∩ B has 5 elements. How many elements are in A ∪ B?','[]'::jsonb,2,2,'https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','TIPIX_ORIGINAL','Original Concept Practice; no external source or exam year claimed.','class11-sets-pilot-v1-4',true,true,now(),'class11-sets-pilot-v1',4) returning id into qid;
insert into tipix_private.academic_answer_keys(question_id,answer,explanation) values(qid,'22'::jsonb,'Use n(A ∪ B) = n(A) + n(B) − n(A ∩ B). Substituting gives 15 + 12 − 5 = 22. Subtracting 5 removes the duplicate count of the shared elements.');
insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,difficulty,marks,source_url,license_code,rights_reference,fingerprint,is_verified,is_published,reviewed_at,original_seed_reference,position) values(cid,sid,'multiple_select','A = {a, b, c} and B = {b, c, d}. Select every element of A ∩ B.','["a", "b", "c", "d"]'::jsonb,2,2,'https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','TIPIX_ORIGINAL','Original Concept Practice; no external source or exam year claimed.','class11-sets-pilot-v1-5',true,true,now(),'class11-sets-pilot-v1',5) returning id into qid;
insert into tipix_private.academic_answer_keys(question_id,answer,explanation) values(qid,'[1, 2]'::jsonb,'Check each element against both sets. b and c occur in A and B. a is only in A; d is only in B. Select b and c, so A ∩ B = {b, c}.');
insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,difficulty,marks,source_url,license_code,rights_reference,fingerprint,is_verified,is_published,reviewed_at,original_seed_reference,position) values(cid,sid,'mcq','A = {2, 4} and B = {1, 3}. Which statement is correct?','["A ∩ B = {0}", "A ∪ B = ∅", "A ∩ B = ∅", "A ∪ B = {2, 4}"]'::jsonb,2,2,'https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','TIPIX_ORIGINAL','Original Concept Practice; no external source or exam year claimed.','class11-sets-pilot-v1-6',true,true,now(),'class11-sets-pilot-v1',6) returning id into qid;
insert into tipix_private.academic_answer_keys(question_id,answer,explanation) values(qid,'2'::jsonb,'There are no common elements, so the intersection is ∅. It is not {0}, which contains the number zero. The union is {1, 2, 3, 4}.');
insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,difficulty,marks,source_url,license_code,rights_reference,fingerprint,is_verified,is_published,reviewed_at,original_seed_reference,position) values(cid,sid,'numerical','Of 40 students, 23 join art, 19 join music and 7 join neither. How many join both clubs?','[]'::jsonb,3,3,'https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','TIPIX_ORIGINAL','Original Concept Practice; no external source or exam year claimed.','class11-sets-pilot-v1-7',true,true,now(),'class11-sets-pilot-v1',7) returning id into qid;
insert into tipix_private.academic_answer_keys(question_id,answer,explanation) values(qid,'9'::jsonb,'First find the union: 40 − 7 = 33 students join at least one club. Rearrange the formula: n(A ∩ B) = 23 + 19 − 33 = 9. Check: art only 14, both 9, music only 10, neither 7; total 40.');
insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,difficulty,marks,source_url,license_code,rights_reference,fingerprint,is_verified,is_published,reviewed_at,original_seed_reference,position) values(cid,sid,'multiple_select','For any two sets A and B, select all statements that are always true.','["Every element of A ∩ B belongs to A ∪ B.", "A ∩ B always equals A ∪ B.", "A ∪ B equals B ∪ A.", "A ∩ B cannot be empty."]'::jsonb,3,3,'https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','TIPIX_ORIGINAL','Original Concept Practice; no external source or exam year claimed.','class11-sets-pilot-v1-8',true,true,now(),'class11-sets-pilot-v1',8) returning id into qid;
insert into tipix_private.academic_answer_keys(question_id,answer,explanation) values(qid,'[0, 2]'::jsonb,'An element in both sets is certainly in at least one, so the first statement is true. Union is commutative, so the third is true. The second fails for unequal disjoint sets. The fourth fails whenever there are no common elements.');
end $$;
create or replace function tipix_private.academic_api(op text, payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
 uid uuid := auth.uid(); staff text; prof public.tipix_student_profiles%rowtype;
 cid uuid; sid uuid; qid uuid; req uuid; q public.academic_verified_question_bank%rowtype;
 k tipix_private.academic_answer_keys%rowtype; a public.academic_attempts%rowtype;
 cv public.academic_curriculum_versions%rowtype; src public.academic_source_registry%rowtype;
 ans jsonb; ok boolean; num integer; pts integer; result jsonb; j jsonb; rid uuid;
begin
 if uid is null or not tipix_private.verified_account() then raise exception 'Verified sign-in required' using errcode='42501'; end if;
 if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>250000 then raise exception 'Invalid request'; end if;
 select * into prof from public.tipix_student_profiles where id=uid;
 select role into staff from tipix_private.academic_staff where user_id=uid;
 if prof.id is null and staff is null then raise exception 'Complete student profile first'; end if;
 -- Serializes mutations per account; duplicate requests cannot award twice.
 if op not in ('overview','catalog','sources','staff_report','admin_review') then
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 insert into tipix_private.academic_rate_limits values(uid,op,now(),1)
 on conflict(actor_id,action) do update set hits=case when academic_rate_limits.window_at < now()-interval '1 minute' then 1 else academic_rate_limits.hits+1 end,
 window_at=case when academic_rate_limits.window_at < now()-interval '1 minute' then now() else academic_rate_limits.window_at end;
 if (select hits from tipix_private.academic_rate_limits where actor_id=uid and action=op)>60 then raise exception 'Too many requests. Wait a minute.'; end if;
 end if;
 if op='sources' then
 return (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.academic_source_registry s);
 elsif op='catalog' then
 return (select coalesce(jsonb_agg(to_jsonb(t) order by t.subject,t.chapter_title,t.position),'[]') from (
 select c.*,v.class_level,v.subject,v.academic_year,v.official_source,
 (select count(*) from public.academic_verified_question_bank b join public.academic_source_registry s on s.id=b.source_id where b.concept_id=c.id and b.is_published and b.is_verified and s.active and s.rights_status='approved') as question_count
 from public.academic_concepts c join public.academic_curriculum_versions v on v.id=c.curriculum_id
 where c.published and v.status='published' and v.class_level=prof.grade
 and coalesce(prof.stream,'general')=any(v.streams)
 )t);
 elsif op in ('next','submit','review') then
 if op='next' then cid:=(payload->>'concept_id')::uuid;
 else qid:=(payload->>'question_id')::uuid; select concept_id into cid from public.academic_verified_question_bank where id=qid; end if;
 select v.* into cv from public.academic_concepts c join public.academic_curriculum_versions v on v.id=c.curriculum_id where c.id=cid and c.published and v.status='published';
 if cv.id is null or cv.class_level<>prof.grade or not exists(select 1 from jsonb_array_elements(tipix_private.academic_api('catalog','{}')) x where x->>'id'=cid::text) then raise exception 'Concept unavailable for your course plan' using errcode='42501'; end if;
 if op='next' then
 sid:=nullif(payload->>'source_id','')::uuid;
 insert into public.academic_practice_progress(student_id,concept_id,source_filter) values(uid,cid,sid)
 on conflict(student_id,concept_id) do update set source_filter=excluded.source_filter,last_visited_at=now();
 select b.* into q from public.academic_verified_question_bank b join public.academic_source_registry s on s.id=b.source_id
 where b.concept_id=cid and b.is_published and b.is_verified and s.active and s.rights_status='approved' and (sid is null or b.source_id=sid)
 and not exists(select 1 from public.academic_attempts at where at.student_id=uid and at.question_id=b.id)
 order by b.created_at,b.id limit 1;
 return jsonb_build_object('question',case when q.id is null then null else to_jsonb(q) end,
 'filters',(select coalesce(jsonb_agg(to_jsonb(f)),'[]') from(select s.id,s.source_name,count(*) as count from public.academic_verified_question_bank b join public.academic_source_registry s on s.id=b.source_id where b.concept_id=cid and b.is_published and b.is_verified and s.active and s.rights_status='approved' group by s.id,s.source_name)f),
 'answered',(select count(distinct at.question_id) from public.academic_attempts at join public.academic_verified_question_bank b on b.id=at.question_id where at.student_id=uid and b.concept_id=cid and (sid is null or b.source_id=sid)));
 end if;
 select * into q from public.academic_verified_question_bank where id=qid;
 if op='review' then
 if not exists(select 1 from public.academic_attempts where student_id=uid and question_id=qid) then raise exception 'Submit this question before viewing feedback' using errcode='42501'; end if;
 select * into k from tipix_private.academic_answer_keys where question_id=qid;
 return jsonb_build_object('question',to_jsonb(q),'answer',k.answer,'explanation',k.explanation);
 end if;
 if not q.is_published or not q.is_verified or not exists(select 1 from public.academic_source_registry where id=q.source_id and active and rights_status='approved') then raise exception 'Question unavailable'; end if;
 req:=(payload->>'request_id')::uuid;
 if req is null then raise exception 'Request ID required'; end if;
 ans:=payload->'answer';
 select * into a from public.academic_attempts where student_id=uid and request_id=req;
 if a.id is not null then
 if a.question_id<>qid or a.selected_answer<>ans then raise exception 'Request ID already used'; end if;
 else
 select count(*)+1 into num from public.academic_attempts where student_id=uid and question_id=qid;
 if num>1 and coalesce((payload->>'retry')::boolean,false)=false then
 select * into a from public.academic_attempts where student_id=uid and question_id=qid order by attempt_number limit 1;
 else
 select * into k from tipix_private.academic_answer_keys where question_id=qid;
 if k.question_id is null or ans is null or ans='null'::jsonb or octet_length(ans::text)>10000 then raise exception 'Answer unavailable or invalid'; end if;
 if q.question_type in ('mcq','assertion_reason') and (jsonb_typeof(ans)<>'number' or (ans::text)::numeric<>trunc((ans::text)::numeric) or (ans::text)::integer not between 0 and jsonb_array_length(q.options)-1) then raise exception 'Choose a valid option'; end if;
 if q.question_type='true_false' and jsonb_typeof(ans)<>'boolean' then raise exception 'Choose true or false'; end if;
 if q.question_type='multiple_select' and (jsonb_typeof(ans)<>'array' or exists(select 1 from jsonb_array_elements(ans) x where jsonb_typeof(x)<>'number' or (x::text)::numeric<>trunc((x::text)::numeric) or (x::text)::integer not between 0 and jsonb_array_length(q.options)-1)) then raise exception 'Choose valid options'; end if;
 if q.question_type='numerical' then
 if jsonb_typeof(ans)<>'number' then raise exception 'Enter a numeric answer'; end if;
 ok:=abs((ans::text)::numeric-(k.answer::text)::numeric)<=k.tolerance;
 elsif q.question_type='multiple_select' then
 if jsonb_typeof(ans)<>'array' or jsonb_array_length(ans)=0 then raise exception 'Select at least one answer'; end if;
 ok:=ans @> k.answer and k.answer @> ans;
 elsif q.question_type in ('mcq','true_false','assertion_reason','output','trace','match','short_answer') then ok:=ans=k.answer;
 else raise exception 'This question type needs a configured execution or marking provider'; end if;
 pts:=case when num=1 and ok then 10 else 0 end;
 insert into public.academic_attempts(student_id,question_id,request_id,selected_answer,correct,marks_earned,marks_available,points,attempt_number,response_time_ms)
 values(uid,qid,req,ans,ok,case when ok then q.marks else -q.negative_marks end,q.marks,pts,num,coalesce((payload->>'response_time_ms')::integer,0)) returning * into a;
 if not ok then
 insert into public.academic_mistake_memory(student_id,question_id,first_attempt_id,latest_attempt_id) values(uid,qid,a.id,a.id)
 on conflict(student_id,question_id) do update set latest_attempt_id=excluded.latest_attempt_id,repeated_count=academic_mistake_memory.repeated_count+1,resolved_at=null,updated_at=now();
 else update public.academic_mistake_memory set resolved_at=now(),latest_attempt_id=a.id,updated_at=now() where student_id=uid and question_id=qid; end if;
 insert into public.academic_practice_progress(student_id,concept_id,last_question_id) values(uid,cid,qid)
 on conflict(student_id,concept_id) do update set last_question_id=qid,last_visited_at=now();
 end if;
 end if;
 select * into k from tipix_private.academic_answer_keys where question_id=qid;
 insert into public.academic_learning_state(student_id,concept_id,question_id,draft,section) values(uid,cid,qid,a.selected_answer,'practice') on conflict(student_id,concept_id) do update set question_id=excluded.question_id,draft=excluded.draft,section=coalesce(academic_learning_state.section,'practice'),updated_at=now();
 return jsonb_build_object('attempt',to_jsonb(a),'answer',k.answer,'explanation',k.explanation);
 elsif op='goal' then
 insert into public.academic_goals(student_id,exam,target_score,target_rank,target_percentile)
 values(uid,payload->>'exam',nullif(payload->>'target_score','')::numeric,nullif(payload->>'target_rank','')::integer,nullif(payload->>'target_percentile','')::numeric)
 on conflict(student_id) do update set exam=excluded.exam,target_score=excluded.target_score,target_rank=excluded.target_rank,target_percentile=excluded.target_percentile,updated_at=now();
 return jsonb_build_object('saved',true);
 elsif op='mistake_tag' then
 update public.academic_mistake_memory set mistake_type=payload->>'mistake_type' where student_id=uid and question_id=(payload->>'question_id')::uuid;
 return jsonb_build_object('saved',found);
 elsif op='complete_intervention' then
 update public.academic_interventions set completed_at=now() where student_id=uid and id=(payload->>'id')::uuid;
 return jsonb_build_object('saved',found);
 elsif op='overview' then
 -- First-attempt scores are immutable. Mastery uses one latest observation per distinct question,
 -- with retries discounted, difficulty weighted 1/1.25/1.5 and bounded 90-day recency decay.
 return jsonb_build_object('staff_role',staff,
 'totals',(select jsonb_build_object('attempted',count(*) filter(where attempt_number=1),'correct',count(*) filter(where attempt_number=1 and correct),'points',coalesce(sum(points),0),'marks',coalesce(sum(marks_earned) filter(where attempt_number=1),0),'available',coalesce(sum(marks_available) filter(where attempt_number=1),0)) from public.academic_attempts where student_id=uid),
 'goal',(select to_jsonb(g) from public.academic_goals g where student_id=uid),
 'concepts',(select coalesce(jsonb_agg(to_jsonb(c)),'[]') from(
 select x.concept_id,c.concept_title,c.chapter_title,v.subject,count(*) as distinct_questions,
 case when count(*)>=5 then round(100*sum(case when x.correct then x.weight else 0 end)/sum(x.weight),1) else null end as mastery,
 sum(case when x.correct then 1 else 0 end) as correct,
 max(x.created_at) as last_practised
 from(select distinct on(a.question_id) a.*,b.concept_id,(1+(b.difficulty-1)*0.25)*greatest(0.25,exp(-extract(epoch from(now()-a.created_at))/7776000))*case when a.attempt_number=1 then 1 else 0.5 end as weight
 from public.academic_attempts a join public.academic_verified_question_bank b on b.id=a.question_id where a.student_id=uid order by a.question_id,a.attempt_number desc)x
 join public.academic_concepts c on c.id=x.concept_id join public.academic_curriculum_versions v on v.id=c.curriculum_id
 group by x.concept_id,c.concept_title,c.chapter_title,v.subject)c),
 'attempts',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select a.*,c.concept_title,b.question_text,s.source_name,b.source_year from public.academic_attempts a join public.academic_verified_question_bank b on b.id=a.question_id join public.academic_concepts c on c.id=b.concept_id join public.academic_source_registry s on s.id=b.source_id where a.student_id=uid order by a.created_at desc limit 200)x),
 'mistakes',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select m.*,b.question_text,c.concept_title,c.id as concept_id from public.academic_mistake_memory m join public.academic_verified_question_bank b on b.id=m.question_id join public.academic_concepts c on c.id=b.concept_id where student_id=uid order by m.updated_at desc)x),
 'progress',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from public.academic_practice_progress p where student_id=uid),
 'interventions',(select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at desc),'[]') from public.academic_interventions i where student_id=uid),
 'rank',(select rnk from(select a.student_id,rank() over(order by sum(a.points) desc) rnk from public.academic_attempts a join public.tipix_student_profiles p on p.id=a.student_id where p.grade=prof.grade group by a.student_id)x where student_id=uid),
 'leaderboard',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select rank() over(order by sum(a.points) desc) as rank,case when a.student_id=uid then 'You' else 'Learner '||left(md5(a.student_id::text),8) end as learner,sum(a.points) as points from public.academic_attempts a join public.tipix_student_profiles p on p.id=a.student_id where p.grade=prof.grade group by a.student_id order by points desc limit 50)x));
 elsif op in ('staff_report','intervene') then
 if staff is null then raise exception 'Staff access required' using errcode='42501'; end if;
 if op='intervene' then
 sid:=(payload->>'student_id')::uuid;
 if staff<>'admin' and not exists(select 1 from tipix_private.academic_teacher_students where teacher_id=uid and student_id=sid) then raise exception 'Student is not assigned to you' using errcode='42501'; end if;
 insert into public.academic_interventions(teacher_id,student_id,concept_id,message,due_at) values(uid,sid,nullif(payload->>'concept_id','')::uuid,payload->>'message',nullif(payload->>'due_at','')::date);
 return jsonb_build_object('saved',true);
 end if;
 return (select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select p.id,p.full_name,p.grade,count(a.id) filter(where a.attempt_number=1) as attempted,count(a.id) filter(where a.attempt_number=1 and a.correct) as correct,
 (select count(*) from public.academic_mistake_memory m where m.student_id=p.id and resolved_at is null) as unresolved_mistakes
 from public.tipix_student_profiles p left join public.academic_attempts a on a.student_id=p.id
 where staff='admin' or exists(select 1 from tipix_private.academic_teacher_students ts where ts.teacher_id=uid and ts.student_id=p.id)
 group by p.id)x);
 end if;
 -- No client can grant themselves staff privileges. Provisioning is a database-owner operation.
 if staff is distinct from 'admin' then raise exception 'Administrator access required' using errcode='42501'; end if;
 if op='configure_source' then
 if coalesce(length(payload->>'source_code'),0)<2 or coalesce(length(payload->>'source_name'),0)<2 then raise exception 'Source identity required'; end if;
 insert into public.academic_source_registry(source_code,source_name,source_type,organization,base_url,rights_status,license_code,rights_reference,active)
 values(payload->>'source_code',payload->>'source_name',payload->>'source_type',payload->>'organization',payload->>'base_url',coalesce(payload->>'rights_status','pending'),payload->>'license_code',payload->>'rights_reference',coalesce((payload->>'active')::boolean,false))
 on conflict(source_code) do update set source_name=excluded.source_name,organization=excluded.organization,base_url=excluded.base_url,rights_status=excluded.rights_status,license_code=excluded.license_code,rights_reference=excluded.rights_reference,active=excluded.active,updated_at=now();
 return jsonb_build_object('saved',true);
 elsif op='create_curriculum' then
 insert into public.academic_curriculum_versions(board,academic_year,class_level,subject,official_source,streams)
 values(payload->>'board',payload->>'academic_year',(payload->>'class_level')::smallint,payload->>'subject',payload->>'official_source',case when payload ? 'streams' then array(select jsonb_array_elements_text(payload->'streams')) when (payload->>'class_level')::integer<=10 then array['general'] when payload->>'subject'='Mathematics' then array['pcm','pcmb','commerce'] when payload->>'subject' in ('Physics','Chemistry') then array['pcm','pcb','pcmb'] when payload->>'subject'='Biology' then array['pcb','pcmb'] else array['commerce'] end) returning id into cid;
 return jsonb_build_object('id',cid,'status','candidate');
 elsif op='create_concept' then
 cid:=(payload->>'curriculum_id')::uuid;
 if not exists(select 1 from public.academic_curriculum_versions where id=cid and status='candidate') then raise exception 'Use a candidate curriculum. Published versions are immutable.'; end if;
 if nullif(payload->>'lesson','') is not null and nullif(payload->>'lesson_rights_reference','') is null then raise exception 'Lesson reuse rights required'; end if;
 insert into public.academic_concepts(curriculum_id,chapter_title,concept_title,subtopic,position,lesson,lesson_rights_reference)
 values(cid,payload->>'chapter_title',payload->>'concept_title',coalesce(payload->>'subtopic',''),coalesce((payload->>'position')::integer,0),payload->>'lesson',payload->>'lesson_rights_reference') returning id into qid;
 return jsonb_build_object('id',qid);
 elsif op='publish_curriculum' then
 cid:=(payload->>'curriculum_id')::uuid;
 if not exists(select 1 from public.academic_concepts where curriculum_id=cid) then raise exception 'Add reviewed concepts before publication'; end if;
 update public.academic_curriculum_versions set status='published' where id=cid and status='candidate';
 if not found then raise exception 'Candidate curriculum required'; end if;
 update public.academic_concepts set published=true where curriculum_id=cid;
 return jsonb_build_object('published',true);
 elsif op='admin_review' then
 return jsonb_build_object('curricula',(select coalesce(jsonb_agg(to_jsonb(v)),'[]') from public.academic_curriculum_versions v), 'concepts',(select coalesce(jsonb_agg(to_jsonb(c)),'[]') from public.academic_concepts c), 'questions',(select coalesce(jsonb_agg(to_jsonb(q)||jsonb_build_object('key',to_jsonb(k))),'[]') from public.academic_verified_question_bank q join tipix_private.academic_answer_keys k on k.question_id=q.id where not q.is_published),
 'runs',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from(select * from public.academic_source_sync_runs order by started_at desc limit 50)r));
 elsif op='import_question' then
 select * into src from public.academic_source_registry where id=(payload->>'source_id')::uuid;
 if src.id is null or src.rights_status<>'approved' or not src.active then raise exception 'An active, rights-approved source is required'; end if;
 if coalesce(length(payload->>'rights_reference'),0)<5 or coalesce(length(payload->>'license_code'),0)<2 or not(payload ? 'answer') then raise exception 'Rights documentation and answer required'; end if;
 if src.source_type='pyq' and (not(payload ? 'source_year') or not(payload ? 'source_exam') or not(payload ? 'source_question_number')) then raise exception 'Exact PYQ provenance required'; end if;
 insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,marks,negative_marks,difficulty,source_exam,source_year,source_session,source_shift,source_paper,source_question_number,source_page,source_url,license_code,rights_reference,fingerprint)
 values((payload->>'concept_id')::uuid,src.id,payload->>'question_type',payload->>'question_text',coalesce(payload->'options','[]'),coalesce((payload->>'marks')::numeric,1),coalesce((payload->>'negative_marks')::numeric,0),coalesce((payload->>'difficulty')::smallint,1),payload->>'source_exam',(payload->>'source_year')::integer,payload->>'source_session',payload->>'source_shift',payload->>'source_paper',payload->>'source_question_number',payload->>'source_page',payload->>'source_url',payload->>'license_code',payload->>'rights_reference',md5(lower(regexp_replace(payload->>'question_text','\s+',' ','g'))))
 on conflict(fingerprint) do nothing returning id into qid;
 insert into tipix_private.academic_ingestion(actor_id,payload,question_id,status) values(uid,payload,qid,case when qid is null then 'duplicate' else 'review' end);
 if qid is not null then insert into tipix_private.academic_answer_keys(question_id,answer,explanation,tolerance) values(qid,payload->'answer',payload->>'explanation',coalesce((payload->>'tolerance')::numeric,0)); end if;
 return jsonb_build_object('id',qid,'status',case when qid is null then 'duplicate' else 'review' end);
 elsif op='publish_question' then
 qid:=(payload->>'question_id')::uuid;
 select * into q from public.academic_verified_question_bank where id=qid;
 select * into k from tipix_private.academic_answer_keys where question_id=qid;
 if q.id is null or k.question_id is null or q.question_type in ('coding','debugging','complete_code') then raise exception 'Question needs a supported grading provider'; end if;
 if not exists(select 1 from public.academic_source_registry where id=q.source_id and rights_status='approved' and active) then raise exception 'Source rights approval required'; end if;
 if q.question_type in ('mcq','assertion_reason') and (jsonb_array_length(q.options)<2 or jsonb_typeof(k.answer)<>'number' or (k.answer::text)::numeric<>trunc((k.answer::text)::numeric) or (k.answer::text)::integer not between 0 and jsonb_array_length(q.options)-1) then raise exception 'Invalid choice answer'; end if;
 if q.question_type='numerical' and jsonb_typeof(k.answer)<>'number' then raise exception 'Numeric key required'; end if;
 if q.question_type='true_false' and jsonb_typeof(k.answer)<>'boolean' then raise exception 'Boolean key required'; end if;
 if q.question_type='multiple_select' and (jsonb_typeof(k.answer)<>'array' or jsonb_array_length(k.answer)=0 or exists(select 1 from jsonb_array_elements(k.answer) x where jsonb_typeof(x)<>'number' or (x::text)::numeric<>trunc((x::text)::numeric) or (x::text)::integer not between 0 and jsonb_array_length(q.options)-1)) then raise exception 'Answer array required'; end if;
 update public.academic_verified_question_bank set is_verified=true,is_published=true,reviewed_by=uid,reviewed_at=now() where id=qid;
 return jsonb_build_object('published',true);
 elsif op='sync' then
 if payload->>'mode' not in ('health','scope','all') then raise exception 'Invalid sync mode'; end if;
 if payload->>'mode'='health' then return jsonb_build_object('database','available','configured_feeds',0,'message','No licensed feed configured; reviewed manual import is available.'); end if;
 cid:=nullif(payload->>'concept_id','')::uuid;
 if payload->>'mode'='scope' and not exists(select 1 from public.academic_concepts where id=cid) then raise exception 'Valid concept required'; end if;
 insert into public.academic_source_sync_runs(actor_id,provider,concept_id,status,finished_at,message)
 values(uid,'registered-sources',cid,'unavailable',now(),'No authorized provider feed configured. No questions substituted.') returning id into rid;
 return jsonb_build_object('run_id',rid,'status','unavailable','imported',0);
 end if;
 raise exception 'Unsupported operation';
end $$;

-- Syllabus identifiers and topic names only; no copyrighted questions or textbook passages copied.
-- Verified against CBSE 2026-27 Mathematics (041), page 7, on 2026-09-16.
with v as (
 insert into public.academic_curriculum_versions(board,academic_year,class_level,subject,official_source,status)
 values('CBSE','2026-27',12,'Mathematics','https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Maths_SecP2_2026-27.pdf','published')
 on conflict(board,academic_year,class_level,subject) do nothing returning id
)
insert into public.academic_concepts(curriculum_id,chapter_title,concept_title,position,published)
select v.id,'Relations and Functions',x.title,x.position,true from v cross join (values
 ('Reflexive Relations',1),('Symmetric Relations',2),('Transitive Relations',3),('Equivalence Relations',4),('One-One Functions',5),('Onto Functions',6))x(title,position)
on conflict(curriculum_id,chapter_title,concept_title) do nothing;
create or replace function tipix_private.learning_api(op text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare uid uuid:=auth.uid();cid uuid:=(payload->>'concept_id')::uuid;tid uuid; t public.academic_learning_tasks%rowtype;k tipix_private.academic_task_keys%rowtype;st public.academic_learning_state%rowtype;answer integer;correct boolean;result jsonb;q public.academic_verified_question_bank%rowtype;f jsonb;bank jsonb;feedback jsonb;selected_attempt public.academic_attempts%rowtype;
begin
 if uid is null or not tipix_private.verified_account() then raise exception 'Verified sign-in required' using errcode='42501';end if;
 if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>30000 then raise exception 'Invalid request';end if;
 if op='chapters' then
 return (select coalesce(jsonb_agg(to_jsonb(x) order by x.subject,x.position),'[]') from(select h.*,v.subject,v.class_level,v.academic_year,(select count(*) from public.academic_concepts c where c.curriculum_id=h.curriculum_id and c.chapter_title=h.title and c.published) as concept_count from public.academic_chapters h join public.academic_curriculum_versions v on v.id=h.curriculum_id where exists(select 1 from jsonb_array_elements(tipix_private.academic_api('catalog','{}')) c where c->>'curriculum_id'=h.curriculum_id::text))x);
 end if;
 if op='summary' then return (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at desc),'[]') from public.academic_learning_state s where s.student_id=uid);end if;
 if not exists(select 1 from jsonb_array_elements(tipix_private.academic_api('catalog','{}')) c where c->>'id'=cid::text) then raise exception 'Concept unavailable for your course plan' using errcode='42501';end if;
 if op <> 'lesson' then
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 insert into tipix_private.academic_rate_limits values(uid,'learning',now(),1) on conflict(actor_id,action) do update set hits=case when academic_rate_limits.window_at<now()-interval '1 minute' then 1 else academic_rate_limits.hits+1 end,window_at=case when academic_rate_limits.window_at<now()-interval '1 minute' then now() else academic_rate_limits.window_at end;
 if (select hits from tipix_private.academic_rate_limits where actor_id=uid and action='learning')>120 then raise exception 'Please wait a minute before trying again';end if;
 end if;
 if op='position' then
 if payload->>'section' not in ('practice','ncert','pyq') then raise exception 'Invalid section';end if;
 insert into public.academic_learning_state(student_id,concept_id,section) values(uid,cid,payload->>'section') on conflict(student_id,concept_id) do update set section=excluded.section,updated_at=now();
 elsif op='filters' then
 if jsonb_typeof(payload->'filters')<>'object' then raise exception 'Invalid filters';end if;
 insert into public.academic_learning_state(student_id,concept_id,filters) values(uid,cid,payload->'filters') on conflict(student_id,concept_id) do update set filters=excluded.filters,updated_at=now();
 elsif op in ('visit','complete','check') then
 tid:=(payload->>'task_id')::uuid;select * into t from public.academic_learning_tasks where id=tid and concept_id=cid;if t.id is null then raise exception 'Task unavailable';end if;
 insert into public.academic_learning_state(student_id,concept_id,task_id) values(uid,cid,tid) on conflict(student_id,concept_id) do update set task_id=excluded.task_id,section=null,updated_at=now();
 if op='complete' then
 if t.check_prompt is not null then raise exception 'Answer the concept check first';end if;
 update public.academic_learning_state set completed=array(select distinct x from unnest(completed||tid) x) where student_id=uid and concept_id=cid;
 elsif op='check' then
 select * into k from tipix_private.academic_task_keys where task_id=tid;if k.task_id is null then raise exception 'No check for this task';end if;
 answer:=(payload->>'answer')::integer;if answer is null or answer<0 or answer>=jsonb_array_length(t.check_options) then raise exception 'Choose an option';end if;correct:=answer=k.answer;
 update public.academic_learning_state set answers=jsonb_set(answers,array[tid::text],jsonb_build_object('selected',answer,'correct',correct,'answer',k.answer,'explanation',k.explanation)),completed=case when correct then array(select distinct x from unnest(completed||tid) x) else array_remove(completed,tid) end where student_id=uid and concept_id=cid;
 end if;
 elsif op='draft' then
 if payload->>'question_id' is null or not exists(select 1 from public.academic_verified_question_bank where id=(payload->>'question_id')::uuid and concept_id=cid and is_published) then raise exception 'Question unavailable';end if;
 if exists(select 1 from public.academic_attempts where student_id=uid and question_id=(payload->>'question_id')::uuid) then raise exception 'This answer is already submitted';end if;
 insert into public.academic_learning_state(student_id,concept_id,question_id,draft,filters) values(uid,cid,(payload->>'question_id')::uuid,payload->'answer',coalesce(payload->'filters','{}')) on conflict(student_id,concept_id) do update set question_id=excluded.question_id,draft=excluded.draft,filters=excluded.filters,updated_at=now();
 elsif op in ('next','resume') then
 f:=coalesce(payload->'filters','{}');
 select coalesce(jsonb_agg(to_jsonb(b)||jsonb_build_object('source_name',s.source_name,'source_type',s.source_type) order by case when s.source_type='pyq' then 3 when s.source_name like 'NCERT%' then 1 else 2 end,b.position,b.difficulty,b.created_at,b.id),'[]') into bank from public.academic_verified_question_bank b join public.academic_source_registry s on s.id=b.source_id where b.concept_id=cid and b.is_published and b.is_verified and s.active and s.rights_status='approved';
 select * into st from public.academic_learning_state where student_id=uid and concept_id=cid;
 select x into result from jsonb_array_elements(bank) x where (coalesce(f->>'source','')='' or x->>'source_id'=f->>'source') and (coalesce(f->>'year','')='' or x->>'source_year'=f->>'year') and (coalesce(f->>'difficulty','')='' or x->>'difficulty'=f->>'difficulty') and (coalesce(f->>'type','')='' or x->>'question_type'=f->>'type') and (coalesce(f->>'group','')='' or (f->>'group'='pyq' and x->>'source_type'='pyq') or (f->>'group'='ncert' and x->>'source_name' like 'NCERT%')) and ((op='resume' and st.filters=f and x->>'id'=st.question_id::text) or not exists(select 1 from public.academic_attempts a where a.student_id=uid and a.question_id=(x->>'id')::uuid)) order by case when op='resume' and st.filters=f and x->>'id'=st.question_id::text then 0 else 1 end, (x->>'position')::integer,(x->>'difficulty')::integer,x->>'id' limit 1;
 if result is not null then
 select * into selected_attempt from public.academic_attempts where student_id=uid and question_id=(result->>'id')::uuid order by attempt_number desc limit 1;
 if selected_attempt.id is not null then
 feedback:=tipix_private.academic_api('review',jsonb_build_object('question_id',result->>'id')) || jsonb_build_object('attempt',to_jsonb(selected_attempt));
 end if;
 end if;
 insert into public.academic_learning_state(student_id,concept_id,question_id,filters,draft) values(uid,cid,(result->>'id')::uuid,f,null) on conflict(student_id,concept_id) do update set question_id=excluded.question_id,filters=excluded.filters,draft=case when academic_learning_state.question_id=excluded.question_id then academic_learning_state.draft else null end,updated_at=now();
 return jsonb_build_object('question',result,'feedback',feedback,'metadata',(select coalesce(jsonb_agg(distinct jsonb_build_object('source_id',x->'source_id','source_name',x->'source_name','year',x->'source_year','difficulty',x->'difficulty','type',x->'question_type')),'[]') from jsonb_array_elements(bank) x),'total',jsonb_array_length(bank),'answered',(select count(distinct a.question_id) from public.academic_attempts a join public.academic_verified_question_bank b on b.id=a.question_id where a.student_id=uid and b.concept_id=cid),'state',(select to_jsonb(s) from public.academic_learning_state s where student_id=uid and concept_id=cid));
 elsif op<>'lesson' then raise exception 'Unknown learning action';end if;
 return jsonb_build_object('tasks',(select coalesce(jsonb_agg(to_jsonb(x) order by position),'[]') from public.academic_learning_tasks x where concept_id=cid),'state',(select to_jsonb(s) from public.academic_learning_state s where student_id=uid and concept_id=cid));
end $$;
