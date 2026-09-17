-- Additive task content and own-account learning state. Existing scoring remains authoritative.
create table public.academic_learning_tasks (
 id uuid primary key default gen_random_uuid(), concept_id uuid not null references public.academic_concepts,
 position integer not null check(position>0), title text not null, blocks jsonb not null check(jsonb_typeof(blocks)='array'),
 check_prompt text, check_options jsonb not null default '[]', unique(concept_id,position)
);
create table tipix_private.academic_task_keys (
 task_id uuid primary key references public.academic_learning_tasks on delete cascade, answer integer not null, explanation text not null
);
create table public.academic_learning_state (
 student_id uuid not null references public.tipix_student_profiles on delete cascade,
 concept_id uuid not null references public.academic_concepts, task_id uuid references public.academic_learning_tasks,
 completed uuid[] not null default '{}', answers jsonb not null default '{}', filters jsonb not null default '{}',
 question_id uuid references public.academic_verified_question_bank, draft jsonb, updated_at timestamptz not null default now(),
 primary key(student_id,concept_id)
);
alter table public.academic_learning_tasks enable row level security;
alter table public.academic_learning_state enable row level security;
alter table tipix_private.academic_task_keys enable row level security;
revoke all on public.academic_learning_tasks,public.academic_learning_state,tipix_private.academic_task_keys from public,anon,authenticated;
grant select on public.academic_learning_state to authenticated;
create policy own_learning_state on public.academic_learning_state for select to authenticated using(student_id=(select auth.uid()) and (select tipix_private.verified_account()));
create index academic_learning_recent on public.academic_learning_state(student_id,updated_at desc);
create index academic_question_filters on public.academic_verified_question_bank(concept_id,difficulty,source_year,question_type) where is_published;
-- Turn existing, authored lessons into short database-owned blocks; no copied textbook content.
insert into public.academic_learning_tasks(concept_id,position,title,blocks)
select c.id,n,case n when 1 then 'Understand the key idea' when 2 then 'Connect it to an example' else 'Avoid the common mistake' end,
 coalesce((select jsonb_agg(jsonb_build_object('type','paragraph','text',p) order by ord) from unnest(string_to_array(c.lesson,E'\n\n')) with ordinality a(p,ord)
 where case when p like 'Example:%' or p like 'Domain matters:%' or p like 'This relation%' then 2 when p like 'Common misconception:%' or p like 'Recap:%' then 3 else 1 end=n),'[]')
from public.academic_concepts c cross join generate_series(1,3) n where c.published and nullif(c.lesson,'') is not null;
-- Curriculum topic names are explicit, not inferred by the frontend.
update public.academic_concepts set subtopic=case when concept_title in ('One-One Functions','Onto Functions') then 'Types of functions' else 'Types of relations' end where chapter_title='Relations and Functions' and subtopic='';
with checks(title,prompt,options,answer,explanation) as (values
('Reflexive Relations','On A = {1, 2, 3}, which pair is missing from R = {(1,1), (2,2), (1,3)} for reflexivity?','["(3,3)","(3,1)","(2,3)"]'::jsonb,0,'Reflexivity requires (a,a) for every member of A. The only missing diagonal pair is (3,3).'),
('Symmetric Relations','R = {(1,2), (2,1)} on {1,2}. Is R symmetric?','["No, because self-pairs are missing","Yes, each pair has its reverse","Only if every possible pair is present"]'::jsonb,1,'Each listed pair has its reverse. Symmetry does not require self-pairs.'),
('Transitive Relations','A relation contains (1,2) and (2,3). Which pair does transitivity require?','["(3,1)","(2,1)","(1,3)"]'::jsonb,2,'The two-step chain 1 → 2 → 3 requires the shortcut 1 → 3.'),
('Equivalence Relations','A relation is reflexive and symmetric but not transitive. Is it an equivalence relation?','["Yes, two properties suffice","No, all three properties are required"]'::jsonb,1,'An equivalence relation must be reflexive, symmetric and transitive simultaneously.'),
('One-One Functions','Is f(x) = x² one-one on all real numbers?','["Yes, every input has one output","No, 2 and −2 both produce 4"]'::jsonb,1,'Being a function is not the same as being one-one. Two distinct inputs sharing 4 disprove injectivity.'),
('Onto Functions','Is f(x) = x² from the real numbers to the real numbers onto?','["No, negative outputs are not reached","Yes, every real input can be squared"]'::jsonb,0,'Onto concerns the entire stated codomain. No real input squares to a negative value.')
), added as (
insert into public.academic_learning_tasks(concept_id,position,title,blocks,check_prompt,check_options)
select c.id,4,'Prove what you understood','[{"type":"note","text":"Concept check · original learning exercise. This checks the lesson, not NCERT or an examination paper. Academic practice points are separate."}]',x.prompt,x.options from checks x join public.academic_concepts c on c.concept_title=x.title where c.chapter_title='Relations and Functions' returning *
) insert into tipix_private.academic_task_keys select a.id,x.answer,x.explanation from added a join checks x on x.prompt=a.check_prompt;
create function tipix_private.learning_api(op text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare uid uuid:=auth.uid();cid uuid:=(payload->>'concept_id')::uuid;tid uuid; t public.academic_learning_tasks%rowtype;k tipix_private.academic_task_keys%rowtype;st public.academic_learning_state%rowtype;answer integer;correct boolean;result jsonb;q public.academic_verified_question_bank%rowtype;f jsonb;bank jsonb;
begin
 if uid is null or not tipix_private.verified_account() then raise exception 'Verified sign-in required' using errcode='42501';end if;
 if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>30000 then raise exception 'Invalid request';end if;
 if op='summary' then return (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at desc),'[]') from public.academic_learning_state s where s.student_id=uid);end if;
 if not exists(select 1 from jsonb_array_elements(tipix_private.academic_api('catalog','{}')) c where c->>'id'=cid::text) then raise exception 'Concept unavailable for your course plan' using errcode='42501';end if;
 if op not in ('lesson','next') then
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 insert into tipix_private.academic_rate_limits values(uid,'learning',now(),1) on conflict(actor_id,action) do update set hits=case when academic_rate_limits.window_at<now()-interval '1 minute' then 1 else academic_rate_limits.hits+1 end,window_at=case when academic_rate_limits.window_at<now()-interval '1 minute' then now() else academic_rate_limits.window_at end;
 if (select hits from tipix_private.academic_rate_limits where actor_id=uid and action='learning')>120 then raise exception 'Please wait a minute before trying again';end if;
 end if;
 if op in ('visit','complete','check') then
 tid:=(payload->>'task_id')::uuid;select * into t from public.academic_learning_tasks where id=tid and concept_id=cid;if t.id is null then raise exception 'Task unavailable';end if;
 insert into public.academic_learning_state(student_id,concept_id,task_id) values(uid,cid,tid) on conflict(student_id,concept_id) do update set task_id=excluded.task_id,updated_at=now();
 if op='complete' then
 if t.check_prompt is not null then raise exception 'Answer the concept check first';end if;
 update public.academic_learning_state set completed=array(select distinct x from unnest(completed||tid) x) where student_id=uid and concept_id=cid;
 elsif op='check' then
 select * into k from tipix_private.academic_task_keys where task_id=tid;if k.task_id is null then raise exception 'No check for this task';end if;
 answer:=(payload->>'answer')::integer;if answer is null or answer<0 or answer>=jsonb_array_length(t.check_options) then raise exception 'Choose an option';end if;correct:=answer=k.answer;
 update public.academic_learning_state set answers=jsonb_set(answers,array[tid::text],jsonb_build_object('selected',answer,'correct',correct,'answer',k.answer,'explanation',k.explanation)),completed=case when correct then array(select distinct x from unnest(completed||tid) x) else array_remove(completed,tid) end where student_id=uid and concept_id=cid;
 end if;
 elsif op='draft' then
 if payload->>'question_id' is not null and not exists(select 1 from public.academic_verified_question_bank where id=(payload->>'question_id')::uuid and concept_id=cid and is_published) then raise exception 'Question unavailable';end if;
 insert into public.academic_learning_state(student_id,concept_id,question_id,draft,filters) values(uid,cid,(payload->>'question_id')::uuid,payload->'answer',coalesce(payload->'filters','{}')) on conflict(student_id,concept_id) do update set question_id=excluded.question_id,draft=excluded.draft,filters=excluded.filters,updated_at=now();
 elsif op='next' then
 f:=coalesce(payload->'filters','{}');
 select coalesce(jsonb_agg(to_jsonb(b)||jsonb_build_object('source_name',s.source_name,'source_type',s.source_type) order by case when s.source_type='pyq' then 3 when s.source_name like 'NCERT%' then 1 else 2 end,b.difficulty,b.created_at,b.id),'[]') into bank from public.academic_verified_question_bank b join public.academic_source_registry s on s.id=b.source_id where b.concept_id=cid and b.is_published and b.is_verified and s.active and s.rights_status='approved';
 select x into result from jsonb_array_elements(bank) x where (coalesce(f->>'source','')='' or x->>'source_id'=f->>'source') and (coalesce(f->>'year','')='' or x->>'source_year'=f->>'year') and (coalesce(f->>'difficulty','')='' or x->>'difficulty'=f->>'difficulty') and (coalesce(f->>'type','')='' or x->>'question_type'=f->>'type') and (coalesce(f->>'group','')='' or (f->>'group'='pyq' and x->>'source_type'='pyq') or (f->>'group'='ncert' and x->>'source_name' like 'NCERT%')) and not exists(select 1 from public.academic_attempts a where a.student_id=uid and a.question_id=(x->>'id')::uuid) limit 1;
 return jsonb_build_object('question',result,'metadata',(select coalesce(jsonb_agg(distinct jsonb_build_object('source_id',x->'source_id','source_name',x->'source_name','year',x->'source_year','difficulty',x->'difficulty','type',x->'question_type')),'[]') from jsonb_array_elements(bank) x),'total',jsonb_array_length(bank),'answered',(select count(distinct a.question_id) from public.academic_attempts a join public.academic_verified_question_bank b on b.id=a.question_id where a.student_id=uid and b.concept_id=cid),'state',(select to_jsonb(s) from public.academic_learning_state s where student_id=uid and concept_id=cid));
 elsif op<>'lesson' then raise exception 'Unknown learning action';end if;
 return jsonb_build_object('tasks',(select coalesce(jsonb_agg(to_jsonb(x) order by position),'[]') from public.academic_learning_tasks x where concept_id=cid),'state',(select to_jsonb(s) from public.academic_learning_state s where student_id=uid and concept_id=cid));
end $$;
revoke all on function tipix_private.learning_api(text,jsonb) from public,anon;
grant execute on function tipix_private.learning_api(text,jsonb) to authenticated;
create function public.learning_api(op text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select tipix_private.learning_api(op,payload)$$;
revoke all on function public.learning_api(text,jsonb) from public,anon;
grant execute on function public.learning_api(text,jsonb) to authenticated;
