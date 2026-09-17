create table public.academic_chapters(id uuid primary key default gen_random_uuid(),curriculum_id uuid not null references public.academic_curriculum_versions,position integer not null,title text not null,source_url text not null,unique(curriculum_id,title),unique(curriculum_id,position));
alter table public.academic_chapters enable row level security;
revoke all on public.academic_chapters from public,anon,authenticated;
-- Chapter titles and sequence checked against NCERT 2026–27 contents; no textbook prose copied.
insert into public.academic_chapters(curriculum_id,position,title,source_url)
select v.id,x.n,x.title,'https://ncert.nic.in/textbook/pdf/lemh2ps.pdf' from public.academic_curriculum_versions v cross join (values (1,'Relations and Functions'),(2,'Inverse Trigonometric Functions'),(3,'Matrices'),(4,'Determinants'),(5,'Continuity and Differentiability'),(6,'Application of Derivatives'),(7,'Integrals'),(8,'Application of Integrals'),(9,'Differential Equations'),(10,'Vector Algebra'),(11,'Three Dimensional Geometry'),(12,'Linear Programming'),(13,'Probability'))x(n,title) where v.subject='Mathematics' and v.class_level=12 and v.academic_year='2026-27';
-- Original explanation, examples and learning checks; no examination provenance claimed.
insert into public.academic_concepts(curriculum_id,chapter_title,concept_title,subtopic,position,lesson,lesson_rights_reference,published)
select id,'Probability','Conditional Probability','Conditional Probability',1,'Conditional probability measures the chance of A after learning that B occurred. Restrict the possible outcomes to B, then find the proportion that also belong to A. For P(B) > 0, P(A | B) = P(A ∩ B) / P(B).','TIPIX-authored explanation and examples, 2026-09-17',true from public.academic_curriculum_versions where subject='Mathematics' and class_level=12 and academic_year='2026-27';
insert into public.academic_learning_tasks(concept_id,position,title,blocks,check_prompt,check_options)
select c.id,x.n,x.title,x.blocks::jsonb,x.prompt,x.options::jsonb from public.academic_concepts c cross join (values
(1,'Introduction & learning goals','[{"type":"paragraph","text":"Conditional probability asks a more focused question: how likely is A when we already know B happened? The new information changes the set of possibilities we should consider."},{"type":"paragraph","text":"Your goals: identify the given event, restrict the sample space to that event, calculate the intersection and explain why reversing the condition may change the answer."}]',null,'[]'),
(2,'Understand the key idea','[{"type":"paragraph","text":"Think of B as a smaller window inside the original sample space. Outcomes outside B are no longer possible once B is known. Inside that window, count the outcomes also satisfying A."},{"type":"formula","text":"P(A | B) = P(A ∩ B) / P(B), provided P(B) > 0."},{"type":"paragraph","text":"For equally likely finite outcomes, this becomes: number of outcomes in both A and B ÷ number of outcomes in B. Equal likelihood matters: counting alone is not valid for an unfair die."}]',null,'[]'),
(3,'Worked example: a fair die','[{"type":"paragraph","text":"Roll a fair six-sided die. Let A mean the result is greater than 3, and B mean the result is even. We are told B happened."},{"type":"paragraph","text":"Step 1: restrict the possibilities to B = {2, 4, 6}. Step 2: keep outcomes also in A: A ∩ B = {4, 6}. Step 3: divide 2 by 3. So P(A | B) = 2/3."},{"type":"paragraph","text":"Check using probabilities: P(A ∩ B) = 2/6 and P(B) = 3/6. Their ratio is (2/6)/(3/6) = 2/3. Without the information B, P(A) would be 3/6 = 1/2."}]',null,'[]'),
(4,'Avoid the common mistake','[{"type":"paragraph","text":"Do not keep all six outcomes in the denominator after being told the result is even. The condition is your new sample space."},{"type":"paragraph","text":"Do not assume P(A | B) = P(B | A). For a fair die, let A be {6} and B be {2, 4, 6}. Then P(A | B) = 1/3, while P(B | A) = 1."},{"type":"paragraph","text":"Summary: identify the event after the vertical bar, check its probability is positive, find the intersection, and divide by the probability of the given event."}]',null,'[]'),
(5,'Prove what you understood','[{"type":"note","text":"Concept check · original learning exercise, not an NCERT question or PYQ. Your response saves lesson progress; academic practice points remain separate."}]','A fair die is rolled. Given that its result is greater than 3, what is the probability that the result is even?','["1/3","1/2","2/3","1"]')
)x(n,title,blocks,prompt,options) where c.concept_title='Conditional Probability' and c.chapter_title='Probability';
insert into tipix_private.academic_task_keys select t.id,2,'The condition restricts the outcomes to {4, 5, 6}. Two of those three outcomes, 4 and 6, are even. The conditional probability is 2/3.' from public.academic_learning_tasks t join public.academic_concepts c on c.id=t.concept_id where c.concept_title='Conditional Probability' and t.position=5;
create or replace function tipix_private.learning_api(op text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare uid uuid:=auth.uid();cid uuid:=(payload->>'concept_id')::uuid;tid uuid; t public.academic_learning_tasks%rowtype;k tipix_private.academic_task_keys%rowtype;st public.academic_learning_state%rowtype;answer integer;correct boolean;result jsonb;q public.academic_verified_question_bank%rowtype;f jsonb;bank jsonb;
begin
 if uid is null or not tipix_private.verified_account() then raise exception 'Verified sign-in required' using errcode='42501';end if;
 if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>30000 then raise exception 'Invalid request';end if;
 if op='chapters' then
 return (select coalesce(jsonb_agg(to_jsonb(x) order by x.subject,x.position),'[]') from(select h.*,v.subject,v.class_level,v.academic_year,(select count(*) from public.academic_concepts c where c.curriculum_id=h.curriculum_id and c.chapter_title=h.title and c.published) as concept_count from public.academic_chapters h join public.academic_curriculum_versions v on v.id=h.curriculum_id where exists(select 1 from jsonb_array_elements(tipix_private.academic_api('catalog','{}')) c where c->>'curriculum_id'=h.curriculum_id::text))x);
 end if;
 if op='summary' then return (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at desc),'[]') from public.academic_learning_state s where s.student_id=uid);end if;
 if not exists(select 1 from jsonb_array_elements(tipix_private.academic_api('catalog','{}')) c where c->>'id'=cid::text) then raise exception 'Concept unavailable for your course plan' using errcode='42501';end if;
 if op not in ('lesson','next') then
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
