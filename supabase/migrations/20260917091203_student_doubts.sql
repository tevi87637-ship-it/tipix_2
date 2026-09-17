create table public.academic_doubts (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.tipix_student_profiles(id) on delete cascade,
 concept_id uuid references public.academic_concepts(id), title text not null check(length(btrim(title)) between 5 and 180),
 status text not null default 'open' check(status in ('open','resolved')), request_id uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(student_id,request_id)
);
create index academic_doubts_student_updated on public.academic_doubts(student_id,updated_at desc);
create table public.academic_doubt_messages (
 id uuid primary key default gen_random_uuid(), doubt_id uuid not null references public.academic_doubts(id) on delete cascade,
 author_id uuid not null references auth.users(id), author_role text not null check(author_role in ('student','teacher','admin')),
 body text not null check(length(btrim(body)) between 2 and 5000), request_id uuid not null,
 created_at timestamptz not null default now(), unique(author_id,request_id)
);
create index academic_doubt_messages_thread on public.academic_doubt_messages(doubt_id,created_at);
alter table public.academic_doubts enable row level security;
alter table public.academic_doubt_messages enable row level security;
revoke all on public.academic_doubts,public.academic_doubt_messages from public,anon,authenticated;
-- These RPC-only tables deny direct Data API access. Every operation checks the current assignment.
create function tipix_private.doubts_api(op text,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare uid uuid:=auth.uid(); staff text; d public.academic_doubts%rowtype; mid uuid; cid uuid; rid uuid; text_body text; title_body text; old_body text; result jsonb;
begin
 if uid is null or not tipix_private.verified_account() then raise exception 'Verified sign-in required' using errcode='42501';end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>30000 then raise exception 'Invalid request';end if;
 select role into staff from tipix_private.academic_staff where user_id=uid;
 if op='list' then
 return (select coalesce(jsonb_agg(to_jsonb(x) order by updated_at desc),'[]') from (
 select d.*,p.full_name as student_name,c.concept_title,
 (select count(*) from public.academic_doubt_messages m where m.doubt_id=d.id) as message_count
 from public.academic_doubts d join public.tipix_student_profiles p on p.id=d.student_id left join public.academic_concepts c on c.id=d.concept_id
 where d.student_id=uid or staff='admin' or (staff='teacher' and exists(select 1 from tipix_private.academic_teacher_students ts where ts.teacher_id=uid and ts.student_id=d.student_id))
 order by d.updated_at desc limit 50)x);
 end if;
 if op not in ('detail','create','reply','resolve') then raise exception 'Unsupported operation';end if;
 if op<>'detail' then
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 insert into tipix_private.academic_rate_limits values(uid,'doubts',now(),1)
 on conflict(actor_id,action) do update set hits=case when academic_rate_limits.window_at<now()-interval '1 minute' then 1 else academic_rate_limits.hits+1 end,
 window_at=case when academic_rate_limits.window_at<now()-interval '1 minute' then now() else academic_rate_limits.window_at end;
 if (select hits from tipix_private.academic_rate_limits where actor_id=uid and action='doubts')>20 then raise exception 'Too many messages. Try again in a minute.';end if;
 end if;
 if op='create' then
 if not exists(select 1 from public.tipix_student_profiles where id=uid) then raise exception 'Student profile required' using errcode='42501';end if;
 rid:=(payload->>'request_id')::uuid; text_body:=btrim(payload->>'body');title_body:=btrim(payload->>'title');cid:=nullif(payload->>'concept_id','')::uuid;
 if rid is null or title_body is null or length(title_body) not between 5 and 180 or text_body is null or length(text_body) not between 2 and 5000 then raise exception 'Enter a title and question within the length limits';end if;
 if cid is not null and not exists(select 1 from jsonb_array_elements(tipix_private.academic_api('catalog','{}')) c where c->>'id'=cid::text) then raise exception 'Concept is outside your course plan' using errcode='42501';end if;
 select * into d from public.academic_doubts where student_id=uid and request_id=rid;
 if d.id is not null then
 select body into old_body from public.academic_doubt_messages where author_id=uid and request_id=rid;
 if d.title<>title_body or d.concept_id is distinct from cid or old_body is distinct from text_body then raise exception 'Request already used with different content';end if;
 return jsonb_build_object('id',d.id);
 end if;
 insert into public.academic_doubts(student_id,concept_id,title,request_id) values(uid,cid,title_body,rid) returning * into d;
 insert into public.academic_doubt_messages(doubt_id,author_id,author_role,body,request_id) values(d.id,uid,'student',text_body,rid);
 return jsonb_build_object('id',d.id);
 end if;
 select * into d from public.academic_doubts where id=(payload->>'id')::uuid;
 if d.id is null or not (d.student_id=uid or coalesce(staff='admin',false) or (coalesce(staff='teacher',false) and exists(select 1 from tipix_private.academic_teacher_students ts where ts.teacher_id=uid and ts.student_id=d.student_id))) then raise exception 'Doubt unavailable' using errcode='42501';end if;
 if op='detail' then
 return jsonb_build_object('doubt',to_jsonb(d),'messages',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'body',m.body,'author_role',m.author_role,'is_own',m.author_id=uid,'created_at',m.created_at) order by m.created_at,m.id),'[]') from public.academic_doubt_messages m where m.doubt_id=d.id));
 elsif op='resolve' then
 if payload->>'status' not in ('open','resolved') or payload->>'status' is null then raise exception 'Invalid status';end if;
 update public.academic_doubts set status=payload->>'status',updated_at=now() where id=d.id;
 return jsonb_build_object('saved',true);
 elsif op='reply' then
 rid:=(payload->>'request_id')::uuid;text_body:=btrim(payload->>'body');
 if rid is null or text_body is null or length(text_body) not between 2 and 5000 then raise exception 'Enter a message between 2 and 5000 characters';end if;
 select id,body into mid,old_body from public.academic_doubt_messages where author_id=uid and request_id=rid and doubt_id=d.id;
 if mid is not null then
 if old_body<>text_body then raise exception 'Request already used with different content';end if;
 return jsonb_build_object('id',mid);
 end if;
 insert into public.academic_doubt_messages(doubt_id,author_id,author_role,body,request_id) values(d.id,uid,case when d.student_id=uid then 'student' else staff end,text_body,rid) returning id into mid;
 update public.academic_doubts set status='open',updated_at=now() where id=d.id;
 return jsonb_build_object('id',mid);
 end if;
end $$;
revoke all on function tipix_private.doubts_api(text,jsonb) from public,anon;
grant execute on function tipix_private.doubts_api(text,jsonb) to authenticated;
create function public.doubts_api(op text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select tipix_private.doubts_api(op,payload); $$;
revoke all on function public.doubts_api(text,jsonb) from public,anon;
grant execute on function public.doubts_api(text,jsonb) to authenticated;
