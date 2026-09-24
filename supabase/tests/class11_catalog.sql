begin;
do $$ declare u uuid:=gen_random_uuid();r jsonb;s jsonb;h jsonb;c jsonb;denied boolean;begin
insert into auth.users(id,email,email_confirmed_at) values(u,'catalog-fixture@example.invalid',now());
insert into public.tipix_student_profiles(id,full_name,school_name,school_city,grade,stream) values(u,'Catalog fixture','Test','Test',11,'pcm');
perform set_config('request.jwt.claim.sub',u::text,true);execute 'set local role authenticated';
r:=public.curriculum_catalog();
if jsonb_array_length(r)<>4 then raise exception 'Class 11 must expose four subject cards';end if;
for s in select * from jsonb_array_elements(r) loop
 if jsonb_array_length(s->'chapters')<>(case s->>'subject' when 'Physics' then 14 when 'Chemistry' then 9 when 'Mathematics' then 14 when 'Biology' then 19 end) then raise exception 'Chapter coverage incorrect';end if;
 for h in select * from jsonb_array_elements(s->'chapters') loop
  if jsonb_array_length(h->'topics')<2 or jsonb_array_length(h->'concepts')<3 then raise exception 'Missing chapter map';end if;
  for c in select * from jsonb_array_elements(h->'concepts') loop
   if c ? 'lesson' or c ? 'answer' or c ? 'blocks' then raise exception 'Draft content leaked';end if;
  end loop;
 end loop;
 if s->>'subject'='Biology' and (s->>'in_study_plan')::boolean then raise exception 'Stream mapping lost';end if;
end loop;
denied:=false;begin perform public.publish_learning_concept((r->0->'chapters'->0->'concepts'->0->>'id')::uuid);exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Student could publish';end if;
execute 'reset role';update public.tipix_student_profiles set grade=12 where id=u;execute 'set local role authenticated';r:=public.curriculum_catalog();
if exists(select 1 from jsonb_array_elements(r) item where (item->>'class_level')::int<>12) then raise exception 'Cross-grade metadata leak';end if;
execute 'reset role';perform set_config('request.jwt.claim.sub','',true);execute 'set local role anon';
denied:=false;begin perform public.curriculum_catalog();exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Anonymous curriculum access';end if;
execute 'reset role';end $$;
select 'passed' as curriculum_metadata_and_isolation;
rollback;
