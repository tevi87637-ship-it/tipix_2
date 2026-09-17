-- Assessment records are RPC-only. Private snapshots keep keys and unreleased scores off the client.
create table public.academic_exams (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 title text not null check(length(btrim(title)) between 5 and 180), concept_id uuid not null references public.academic_concepts,
 duration_minutes integer not null check(duration_minutes between 5 and 180), closes_at timestamptz not null,
 released_at timestamptz, request_id uuid not null, created_at timestamptz not null default now(), unique(owner_id,request_id)
);
create table public.academic_exam_assignments (
 exam_id uuid references public.academic_exams on delete cascade, student_id uuid references public.tipix_student_profiles on delete cascade,
 primary key(exam_id,student_id)
);
create table tipix_private.academic_exam_questions (
 exam_id uuid references public.academic_exams on delete cascade, question_id uuid references public.academic_verified_question_bank,
 position integer not null, question jsonb not null, answer jsonb not null, explanation text, tolerance numeric not null default 0,
 primary key(exam_id,question_id),unique(exam_id,position)
);
create table tipix_private.academic_exam_runs (
 exam_id uuid not null,student_id uuid not null,started_at timestamptz not null,deadline_at timestamptz not null,
 submitted_at timestamptz,answers jsonb not null default '{}',revision integer not null default 0,
 score numeric,total numeric,review jsonb,
 primary key(exam_id,student_id),foreign key(exam_id,student_id) references public.academic_exam_assignments on delete cascade
);
create index academic_exam_assigned_student on public.academic_exam_assignments(student_id,exam_id);
create index academic_exams_owner on public.academic_exams(owner_id,created_at desc);
alter table public.academic_exams enable row level security;
alter table public.academic_exam_assignments enable row level security;
alter table tipix_private.academic_exam_questions enable row level security;
alter table tipix_private.academic_exam_runs enable row level security;
revoke all on public.academic_exams,public.academic_exam_assignments,tipix_private.academic_exam_questions,tipix_private.academic_exam_runs from public,anon,authenticated;
create function tipix_private.finish_exam(eid uuid,sid uuid) returns void language plpgsql security definer set search_path='' as $$
declare run tipix_private.academic_exam_runs%rowtype;q record;ans jsonb;ok boolean;earned numeric;sum_marks numeric:=0;max_marks numeric:=0;items jsonb:='[]';
begin
 select * into run from tipix_private.academic_exam_runs where exam_id=eid and student_id=sid for update;
 if run.exam_id is null or run.submitted_at is not null then return;end if;
 for q in select * from tipix_private.academic_exam_questions where exam_id=eid order by position loop
 ans:=run.answers->q.question_id::text;ok:=false;
 if ans is not null and ans<>'null'::jsonb then
 if q.question->>'question_type'='numerical' then ok:=abs((ans::text)::numeric-(q.answer::text)::numeric)<=q.tolerance;
 elsif q.question->>'question_type'='multiple_select' then ok:=(select jsonb_agg(x order by x) from jsonb_array_elements(ans)x)=(select jsonb_agg(x order by x) from jsonb_array_elements(q.answer)x);
 else ok:=ans=q.answer;end if;end if;
 earned:=case when ok then (q.question->>'marks')::numeric when ans is null or ans='null'::jsonb then 0 else -(q.question->>'negative_marks')::numeric end;
 sum_marks:=sum_marks+earned;max_marks:=max_marks+(q.question->>'marks')::numeric;
 items:=items||jsonb_build_array(jsonb_build_object('question',q.question,'answer',q.answer,'selected_answer',ans,'correct',ok,'earned',earned,'explanation',q.explanation));
 end loop;
 update tipix_private.academic_exam_runs set submitted_at=clock_timestamp(),score=sum_marks,total=max_marks,review=items where exam_id=eid and student_id=sid;
end $$;
revoke all on function tipix_private.finish_exam(uuid,uuid) from public,anon,authenticated;
create function tipix_private.exam_api(op text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare uid uuid:=auth.uid();staff text;e public.academic_exams%rowtype;r tipix_private.academic_exam_runs%rowtype;eid uuid;cid uuid;req uuid;sid uuid;q record;ans jsonb;key text;num integer;requested integer;minutes integer;closing timestamptz;revision integer;is_owner boolean;students uuid[];stored jsonb;catalog jsonb;
begin
 if uid is null or not tipix_private.verified_account() then raise exception 'Verified sign-in required' using errcode='42501';end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>100000 then raise exception 'Invalid request';end if;
 select role into staff from tipix_private.academic_staff where user_id=uid;
 if op not in ('list','options','state','create','start','save','submit','release','report') then raise exception 'Unsupported operation';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if op in ('create','start','save','submit','release') then
 insert into tipix_private.academic_rate_limits values(uid,'exam_'||op,now(),1)
 on conflict(actor_id,action) do update set hits=case when academic_rate_limits.window_at<now()-interval '1 minute' then 1 else academic_rate_limits.hits+1 end,
 window_at=case when academic_rate_limits.window_at<now()-interval '1 minute' then now() else academic_rate_limits.window_at end;
 if (select hits from tipix_private.academic_rate_limits where actor_id=uid and action='exam_'||op)>120 then raise exception 'Too many requests. Wait a minute.';end if;
 end if;
 if op='options' then
 if staff is null then raise exception 'Staff access required' using errcode='42501';end if;
 return jsonb_build_object('students',tipix_private.academic_api('staff_report','{}'),'concepts',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (
 select c.id,c.concept_title,c.chapter_title,v.subject,v.class_level,count(b.id) as question_count from public.academic_concepts c join public.academic_curriculum_versions v on v.id=c.curriculum_id
 join public.academic_verified_question_bank b on b.concept_id=c.id join public.academic_source_registry s on s.id=b.source_id
 where c.published and v.status='published' and b.is_published and b.is_verified and s.active and s.rights_status='approved' and b.question_type in ('mcq','multiple_select','numerical','true_false','assertion_reason') group by c.id,v.subject,v.class_level)x));
 elsif op='list' then
 return (select coalesce(jsonb_agg(to_jsonb(x) order by created_at desc),'[]') from (
 select e.id,e.title,e.duration_minutes,e.closes_at,e.released_at,e.created_at,e.owner_id=uid as is_owner,
 c.concept_title,(select count(*) from tipix_private.academic_exam_questions q where q.exam_id=e.id) as question_count,
 r.started_at,r.deadline_at,r.submitted_at,case when e.released_at is not null then r.score else null end as score,case when e.released_at is not null then r.total else null end as total
 from public.academic_exams e join public.academic_concepts c on c.id=e.concept_id left join tipix_private.academic_exam_runs r on r.exam_id=e.id and r.student_id=uid
 where (e.owner_id=uid and staff is not null) or staff='admin' or exists(select 1 from public.academic_exam_assignments a where a.exam_id=e.id and a.student_id=uid)
 order by e.created_at desc limit 100)x);
 elsif op='create' then
 if staff is null then raise exception 'Staff access required' using errcode='42501';end if;
 cid:=(payload->>'concept_id')::uuid;req:=(payload->>'request_id')::uuid;requested:=(payload->>'question_count')::integer;minutes:=(payload->>'duration_minutes')::integer;closing:=(payload->>'closes_at')::timestamptz;
 if req is null or requested is null or requested not between 1 and 100 or minutes is null or minutes not between 5 and 180 or closing is null or closing<=clock_timestamp() or length(btrim(coalesce(payload->>'title',''))) not between 5 and 180 then raise exception 'Check title, question count, duration and closing time';end if;
 if jsonb_typeof(payload->'student_ids') is distinct from 'array' or jsonb_array_length(payload->'student_ids') not between 1 and 500 then raise exception 'Choose 1–500 assigned students';end if;
 select array_agg(distinct value::uuid) into students from jsonb_array_elements_text(payload->'student_ids');
 -- Idempotent creation. A retry returns the existing immutable exam, without modifying assignments.
 select * into e from public.academic_exams where owner_id=uid and request_id=req;
 if e.id is not null then return jsonb_build_object('id',e.id);end if;
 for sid in select unnest(students) loop
 if not exists(select 1 from public.tipix_student_profiles p join public.academic_concepts c on c.id=cid join public.academic_curriculum_versions v on v.id=c.curriculum_id
 where p.id=sid and p.grade=v.class_level and c.published and v.status='published' and
 (p.grade<=10 or v.subject='Mathematics' and p.stream in ('pcm','pcmb','commerce') or v.subject in ('Physics','Chemistry') and p.stream in ('pcm','pcb','pcmb') or v.subject='Biology' and p.stream in ('pcb','pcmb') or v.subject in ('Commerce','Accountancy','Business Studies','Economics') and p.stream='commerce')) then raise exception 'Student and curriculum do not match';end if;
 if staff<>'admin' and not exists(select 1 from tipix_private.academic_teacher_students ts where ts.teacher_id=uid and ts.student_id=sid) then raise exception 'Student not assigned to this teacher' using errcode='42501';end if;
 end loop;
 insert into public.academic_exams(owner_id,title,concept_id,duration_minutes,closes_at,request_id) values(uid,btrim(payload->>'title'),cid,minutes,closing,req) returning * into e;
 insert into tipix_private.academic_exam_questions(exam_id,question_id,position,question,answer,explanation,tolerance)
 select e.id,b.id,row_number() over(order by b.created_at,b.id),to_jsonb(b)||jsonb_build_object('source_name',s.source_name),k.answer,k.explanation,k.tolerance
 from public.academic_verified_question_bank b join public.academic_source_registry s on s.id=b.source_id join tipix_private.academic_answer_keys k on k.question_id=b.id
 where b.concept_id=cid and b.is_published and b.is_verified and s.active and s.rights_status='approved' and b.question_type in ('mcq','multiple_select','numerical','true_false','assertion_reason') order by b.created_at,b.id limit requested;
 get diagnostics num=row_count;if num<requested then raise exception 'Not enough reviewed, rights-approved questions for this test';end if;
 insert into public.academic_exam_assignments(exam_id,student_id) select e.id,unnest(students);
 return jsonb_build_object('id',e.id);
 end if;
 eid:=(payload->>'id')::uuid;select * into e from public.academic_exams where id=eid;
 is_owner:=coalesce(staff='admin' or staff is not null and e.owner_id=uid,false);
 if e.id is null then raise exception 'Exam unavailable' using errcode='42501';end if;
 if op in ('release','report') then
 if not is_owner then raise exception 'Exam owner access required' using errcode='42501';end if;
 -- Teacher scope is rechecked, including after class assignments are revoked.
 if staff<>'admin' and exists(select 1 from public.academic_exam_assignments a where a.exam_id=eid and not exists(select 1 from tipix_private.academic_teacher_students ts where ts.teacher_id=uid and ts.student_id=a.student_id)) then raise exception 'Student assignment changed. Contact an administrator.' using errcode='42501';end if;
 if op='release' then
 if e.closes_at>clock_timestamp() and exists(select 1 from public.academic_exam_assignments a left join tipix_private.academic_exam_runs r on r.exam_id=a.exam_id and r.student_id=a.student_id where a.exam_id=eid and r.submitted_at is null) then raise exception 'Wait until the exam closes or all assigned students submit';end if;
 for sid in select student_id from tipix_private.academic_exam_runs where exam_id=eid and submitted_at is null loop perform tipix_private.finish_exam(eid,sid);end loop;
 update public.academic_exams set released_at=coalesce(released_at,clock_timestamp()) where id=eid;
 return jsonb_build_object('released',true);
 end if;
 for sid in select student_id from tipix_private.academic_exam_runs where exam_id=eid and submitted_at is null and deadline_at<=clock_timestamp() loop perform tipix_private.finish_exam(eid,sid);end loop;
 return (select coalesce(jsonb_agg(jsonb_build_object('student_id',a.student_id,'full_name',p.full_name,'started_at',r.started_at,'submitted_at',r.submitted_at,'score',r.score,'total',r.total)),'[]') from public.academic_exam_assignments a join public.tipix_student_profiles p on p.id=a.student_id left join tipix_private.academic_exam_runs r on r.exam_id=a.exam_id and r.student_id=a.student_id where a.exam_id=eid);
 end if;
 if not exists(select 1 from public.academic_exam_assignments where exam_id=eid and student_id=uid) then raise exception 'This exam is not assigned to you' using errcode='42501';end if;
 select * into r from tipix_private.academic_exam_runs where exam_id=eid and student_id=uid for update;
 if op='start' and r.exam_id is null then
 if e.closes_at<=clock_timestamp() or e.released_at is not null then raise exception 'This exam is closed';end if;
 insert into tipix_private.academic_exam_runs(exam_id,student_id,started_at,deadline_at) values(eid,uid,clock_timestamp(),least(e.closes_at,clock_timestamp()+make_interval(mins=>e.duration_minutes))) returning * into r;
 end if;
 if r.exam_id is null then raise exception 'Start the exam first';end if;
 if r.submitted_at is null and r.deadline_at<=clock_timestamp() then perform tipix_private.finish_exam(eid,uid);select * into r from tipix_private.academic_exam_runs where exam_id=eid and student_id=uid;end if;
 if op='save' and r.submitted_at is null then
 revision:=(payload->>'revision')::integer;stored:=payload->'answers';
 if revision is null or revision<>r.revision+1 then raise exception 'Answers changed in another tab. Reload to resume safely.';end if;
 if jsonb_typeof(stored) is distinct from 'object' then raise exception 'Answers must be an object';end if;
 for key,ans in select * from jsonb_each(stored) loop
 select * into q from tipix_private.academic_exam_questions where exam_id=eid and question_id::text=key;
 if q.question_id is null then raise exception 'Question does not belong to this exam';end if;
 if ans='null'::jsonb then continue;end if;
 if q.question->>'question_type' in ('mcq','assertion_reason') then
 if jsonb_typeof(ans)<>'number' or (ans::text)::numeric<>trunc((ans::text)::numeric) or (ans::text)::numeric not between 0 and jsonb_array_length(q.question->'options')-1 then raise exception 'Invalid option';end if;
 elsif q.question->>'question_type'='multiple_select' then
 if jsonb_typeof(ans)<>'array' or jsonb_array_length(ans)=0 then raise exception 'Select one or more options';end if;
 if exists(select 1 from jsonb_array_elements(ans)x where jsonb_typeof(x)<>'number' or (x::text)::numeric<>trunc((x::text)::numeric) or (x::text)::numeric not between 0 and jsonb_array_length(q.question->'options')-1) or (select count(*)<>count(distinct x) from jsonb_array_elements(ans)x) then raise exception 'Invalid options';end if;
 elsif q.question->>'question_type'='numerical' and jsonb_typeof(ans)<>'number' then raise exception 'Numeric answer required';
 elsif q.question->>'question_type'='true_false' and jsonb_typeof(ans)<>'boolean' then raise exception 'Boolean answer required';end if;
 end loop;
 update tipix_private.academic_exam_runs set answers=stored,revision=revision+1 where exam_id=eid and student_id=uid;
 elsif op='submit' then perform tipix_private.finish_exam(eid,uid);
 end if;
 select * into r from tipix_private.academic_exam_runs where exam_id=eid and student_id=uid;
 return jsonb_build_object('id',eid,'title',e.title,'server_now',clock_timestamp(),'deadline_at',r.deadline_at,'submitted_at',r.submitted_at,'revision',r.revision,'answers',r.answers,'released',e.released_at is not null,
 'questions',case when r.submitted_at is null then (select jsonb_agg(q.question order by q.position) from tipix_private.academic_exam_questions q where q.exam_id=eid) else '[]'::jsonb end,
 'score',case when e.released_at is not null then r.score else null end,'total',case when e.released_at is not null then r.total else null end,'review',case when e.released_at is not null then r.review else null end);
end $$;
revoke all on function tipix_private.exam_api(text,jsonb) from public,anon;
grant execute on function tipix_private.exam_api(text,jsonb) to authenticated;
create function public.exam_api(op text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select tipix_private.exam_api(op,payload); $$;
revoke all on function public.exam_api(text,jsonb) from public,anon;
grant execute on function public.exam_api(text,jsonb) to authenticated;
