"""Validate original authored lessons and emit an additive, rerunnable import.
Scored questions remain drafts for the existing staff review workflow.
"""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
d=json.loads((root/'content/class11/foundation-lessons.json').read_text())
catalog=json.loads((root/'content/class11/curriculum-2026-27.json').read_text())
known={(s['subject'],h['title'],c['title']) for s in catalog['subjects'] for b in s['books'] for h in b['chapters'] for t in h['topics'] for c in t['concepts']}
seen=set()
for c in d:
 key=(c['subject'],c['chapter'],c['title'])
 assert key in known and key not in seen,key
 seen.add(key)
 assert all(len(c[k])>35 for k in ['goal','explain','ideas','rules','example','mistakes','summary']),key
 assert len(c['checks'])>=2
 for q in c['checks']:
  assert 0<=q['answer']<len(q['options']) and len(set(q['options']))==len(q['options']) and len(q['explanation'])>30
print('''-- Add original foundation lessons without replacing existing lessons or student data.
-- No fabricated reviewer identity. Scored bank items remain unpublished until staff review.
do $import$ declare data jsonb:=$content$'''+json.dumps(d,ensure_ascii=False)+'''$content$;
x jsonb;q jsonb;v uuid;c uuid;t uuid;sid uuid;qid uuid;n integer;labels text[]:=array['Learning goals','The idea, explained','Key ideas and connections','Rules and notation','Worked example','Common mistakes','Concept summary'];fields text[]:=array['goal','explain','ideas','rules','example','mistakes','summary'];blocks jsonb;
begin
select id into strict sid from public.academic_source_registry where source_code='tipix-original';
for x in select * from jsonb_array_elements(data) loop
 select id into strict v from public.academic_curriculum_versions where class_level=11 and subject=x->>'subject' and board='NCERT' and academic_year='2026-27';
 select id into strict c from public.academic_concepts where curriculum_id=v and chapter_title=x->>'chapter' and concept_title=x->>'title';
 if not exists(select 1 from public.academic_learning_tasks where concept_id=c) then
  for n in 1..7 loop
   blocks:=jsonb_build_array(jsonb_build_object('type',case when n=4 then 'formula' else 'paragraph' end,'text',x->>fields[n]));
   if n=5 and coalesce(x->>'visual','')<>'' then blocks:=blocks||jsonb_build_array(jsonb_build_object('type','explore_'||(x->>'visual'),'text','Change the controls and compare the result with the worked example.'));end if;
   insert into public.academic_learning_tasks(concept_id,position,title,blocks) values(c,n,labels[n],blocks);
  end loop;
  n:=7;
  for q in select * from jsonb_array_elements(x->'checks') loop
   n:=n+1;
   insert into public.academic_learning_tasks(concept_id,position,title,blocks,check_prompt,check_options) values(c,n,'Concept check '||(n-7),jsonb_build_array(jsonb_build_object('type','paragraph','text','Concept Practice · Original TIPIX question. Your feedback and lesson position are saved. These learning checks do not award leaderboard points.')),q->>'prompt',q->'options') returning id into t;
   insert into tipix_private.academic_task_keys(task_id,answer,explanation) values(t,(q->>'answer')::integer,q->>'explanation');
  end loop;
  update public.academic_concepts set lesson=x->>'explain',lesson_rights_reference='TIPIX Original: authored concept explanations and original exercises; not copied NCERT or examination questions.',published=true,classification_reference=classification_reference||jsonb_build_object('content_source','TIPIX Original','content_pack','foundation-v1','editorial_status','Original lesson; curriculum decomposition pending editorial review') where id=c;
  update public.academic_curriculum_versions set status='published' where id=v and status='candidate';
 end if;
 n:=0;
 for q in select * from jsonb_array_elements(x->'checks') loop
  n:=n+1;
  insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,marks,difficulty,source_url,license_code,rights_reference,fingerprint,position,hint)
  values(c,sid,'mcq',q->>'prompt',q->'options',1,case when n=1 then 1 else 2 end,'https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','TIPIX_ORIGINAL','Original TIPIX concept practice. Scored publication awaits staff review.',md5('foundation-v1:'||c::text||':'||(q->>'prompt')),n,'Review the key ideas and worked example for this concept.') on conflict(fingerprint) do nothing returning id into qid;
  if qid is not null then insert into tipix_private.academic_answer_keys(question_id,answer,explanation) values(qid,q->'answer',q->>'explanation');end if;
 end loop;
end loop;end $import$;''')
