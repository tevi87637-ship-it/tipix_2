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
 and (prof.grade<=10 or (v.subject='Mathematics' and prof.stream in ('pcm','pcmb','commerce')) or (v.subject in ('Physics','Chemistry') and prof.stream in ('pcm','pcb','pcmb')) or (v.subject='Biology' and prof.stream in ('pcb','pcmb')) or (v.subject in ('Commerce','Accountancy','Business Studies','Economics') and prof.stream='commerce'))
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
 insert into public.academic_curriculum_versions(board,academic_year,class_level,subject,official_source)
 values(payload->>'board',payload->>'academic_year',(payload->>'class_level')::smallint,payload->>'subject',payload->>'official_source') returning id into cid;
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
