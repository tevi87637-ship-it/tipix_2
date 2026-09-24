import json,pathlib
r=pathlib.Path(__file__).resolve().parents[1]
d=json.loads((r/'content/class11/sets-lessons.json').read_text())
assert len(d)==7 and len({x['title'] for x in d})==7
for x in d:
 assert all(x[k].strip() for k in ['goal','simple','detail','formula','worked','real','mistakes'])
 assert len(x['checks'])==3
 for q in x['checks']:assert 0<=q['answer']<len(q['options']) and len(set(q['options']))==len(q['options']) and q['explanation']
print('''-- Original TIPIX Sets lessons; no changes to existing lessons, attempts or scoring.
-- Lesson mini-checks use the existing saved learning-check API and award no exam points.
do $import$ declare d jsonb:=$data$'''+json.dumps(d,ensure_ascii=False)+'''$data$;x jsonb;q jsonb;cid uuid;tid uuid;vid uuid;blocks jsonb;n integer;heading text;body text;begin
select id into strict vid from public.academic_curriculum_versions where class_level=11 and subject='Mathematics' and board='NCERT' and academic_year='2026-27';
for x in select * from jsonb_array_elements(d) loop
 select id into strict cid from public.academic_concepts where curriculum_id=vid and chapter_title='Sets' and concept_title=x->>'title';
 if exists(select 1 from public.academic_learning_tasks where concept_id=cid) then continue;end if;
 for n in 1..6 loop
  heading:=case n when 1 then 'Your goal and the key idea' when 2 then 'Understand the reasoning' when 3 then 'Notation and important rules' when 4 then 'Worked example' when 5 then 'Connect it to everyday life' else 'Common mistakes and recap' end;
  body:=case n when 1 then (x->>'goal')||E'\n\n'||(x->>'simple') when 2 then x->>'detail' when 3 then x->>'formula' when 4 then x->>'worked' when 5 then x->>'real' else (x->>'mistakes')||E'\n\nRecap: '||(x->>'simple') end;
  blocks:=jsonb_build_array(jsonb_build_object('type',case when n=3 then 'formula' else 'paragraph' end,'text',body));
  if n=4 then blocks:=blocks||jsonb_build_array(jsonb_build_object('type','venn','text','Explore A = {1,2,3} and B = {3,4,5}. Compare membership and the highlighted regions.'));end if;
  insert into public.academic_learning_tasks(concept_id,position,title,blocks) values(cid,n,heading,blocks);
 end loop;
 n:=6;
 for q in select * from jsonb_array_elements(x->'checks') loop
  n:=n+1;
  insert into public.academic_learning_tasks(concept_id,position,title,blocks,check_prompt,check_options) values(cid,n,'Practice check '||(n-6),jsonb_build_array(jsonb_build_object('type','paragraph','text','Source: TIPIX Original. Answer this concept check, then read the reasoning. Learning checks save to your lesson progress; they do not award leaderboard points.')),q->>'prompt',q->'options') returning id into tid;
  insert into tipix_private.academic_task_keys(task_id,answer,explanation) values(tid,(q->>'answer')::integer,q->>'explanation');
 end loop;
 update public.academic_concepts set lesson=x->>'simple',lesson_rights_reference='TIPIX Original: authored explanations and independently checked finite-set examples, 24 September 2026. No NCERT text or external questions copied.',published=true,classification_reference=classification_reference||jsonb_build_object('content_source','TIPIX Original','content_check','Authored examples and answers checked; curriculum decomposition remains pending editorial review') where id=cid;
end loop;end $import$;
''')
