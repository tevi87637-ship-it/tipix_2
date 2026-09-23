"""Rerunnable review-only import; never publishes generated classifications/questions."""
import json
from pathlib import Path
from urllib.parse import urlparse
root = Path(__file__).resolve().parents[1]
d = json.loads((root/'content/class11/physics-motion-review.json').read_text())
assert d['class_number'] == 11 and urlparse(d['official_source_url']).hostname == 'ncert.nic.in'
def s(x): return "'" + str(x).replace("'", "''") + "'"
def j(x): return s(json.dumps(x, ensure_ascii=False))+'::jsonb'
print('''alter table public.academic_verified_question_bank add column if not exists hint text;
alter table public.academic_concepts add column if not exists classification_reference jsonb not null default '{}'::jsonb;
create table if not exists public.academic_books(id uuid primary key default gen_random_uuid(),curriculum_id uuid not null references public.academic_curriculum_versions,title text not null,part text not null,language text not null default 'English',official_source_url text not null,last_verified_at timestamptz,unique(curriculum_id,title,part));
alter table public.academic_books enable row level security;
revoke all on public.academic_books from public,anon,authenticated;
alter table public.academic_chapters add column if not exists book_id uuid references public.academic_books;
create index if not exists academic_chapter_book on public.academic_chapters(book_id);
insert into public.academic_source_registry(source_code,source_name,source_type,organization,base_url,rights_status,license_code,rights_reference,active) values('tipix-original','TIPIX Original','open','TIPIX','https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','approved','TIPIX_ORIGINAL','Original TIPIX content; not external textbook or exam questions.',true) on conflict do nothing;
do $import$ declare vid uuid;bid uuid;hid uuid;tid uuid;cid uuid;sid uuid;qid uuid;taskid uuid;begin
insert into public.academic_curriculum_versions(board,academic_year,class_level,subject,official_source,status,streams) values('NCERT','2026-27',11,'Physics','https://ncert.nic.in/textbook/pdf/keph102.pdf','candidate',array['pcm','pcb','pcmb']) on conflict do nothing;
select id into strict vid from public.academic_curriculum_versions where board='NCERT' and academic_year='2026-27' and class_level=11 and subject='Physics';
insert into public.academic_books(curriculum_id,title,part,official_source_url,last_verified_at) values(vid,'Physics Part I','I','https://ncert.nic.in/textbook/pdf/keph102.pdf','2026-09-23') on conflict do nothing;
select id into strict bid from public.academic_books where curriculum_id=vid and title='Physics Part I' and part='I';
insert into public.academic_chapters(curriculum_id,position,title,source_url,book_id) values(vid,2,'Motion in a Straight Line','https://ncert.nic.in/textbook/pdf/keph102.pdf',bid) on conflict do nothing;
select id into strict hid from public.academic_chapters where curriculum_id=vid and title='Motion in a Straight Line';
select id into strict sid from public.academic_source_registry where source_code='tipix-original';''')
for i,c in enumerate(d['concepts'],1):
    print(f"insert into public.academic_topics(chapter_id,title,position) values(hid,{s(c['topic'])},{i}) on conflict do nothing;")
    print(f"select id into strict tid from public.academic_topics where chapter_id=hid and title={s(c['topic'])};")
    meta=dict(verification_status='pending',classification='TIPIX proposed concept',official_source_url=d['official_source_url'],section=c['topic'])
    print(f"insert into public.academic_concepts(curriculum_id,chapter_title,concept_title,subtopic,position,lesson,lesson_rights_reference,published,topic_id,classification_reference) values(vid,{s(d['chapter'])},{s(c['title'])},{s(c['topic'])},{i},{s(c['simple'])},'Original TIPIX instructional content; pending subject review.',false,tid,{j(meta)}) on conflict do nothing;")
    print(f"select id into strict cid from public.academic_concepts where curriculum_id=vid and chapter_title={s(d['chapter'])} and concept_title={s(c['title'])};")
    tasks=[('What you will learn',[('paragraph',c['goals']),('paragraph',c['simple'])]),('Build the idea',[('paragraph',c['detail']),('paragraph',c['ideas'])]),('Formulae, variables and units',[('formula',c['formula']),('paragraph',c['units'])]),('Explore motion',[('motion','Change the starting velocity, acceleration and time. Compare signed displacement and velocity.')]),('Worked example and everyday connection',[('paragraph',c['example']),('paragraph',c['real'])]),('Common mistakes and exam checks',[('paragraph',c['mistakes']),('paragraph',c['tip'])]),('Summary and mini check',[('paragraph',c['summary'])])]
    for n,(title,blocks) in enumerate(tasks,1):
        prompt=s(c['check']) if n==7 else 'null'
        options=j(c['options']) if n==7 else "'[]'::jsonb"
        print(f"insert into public.academic_learning_tasks(concept_id,position,title,blocks,check_prompt,check_options) select cid,{n},{s(title)},{j([dict(type=t,text=x) for t,x in blocks])},{prompt},{options} where not exists(select 1 from public.academic_learning_tasks where concept_id=cid and position={n}) returning id into taskid;")
        if n==7: print(f"if taskid is not null then insert into tipix_private.academic_task_keys(task_id,answer,explanation) values(taskid,{c['answer']},{s(c['why'])});end if;")
    for n,q in enumerate(c['questions'],1):
        fingerprint=s('physics-motion-review-v1:'+c['title']+':'+q['text'])
        print(f"insert into public.academic_verified_question_bank(concept_id,source_id,question_type,question_text,options,marks,difficulty,source_url,license_code,rights_reference,fingerprint,position,hint) values(cid,sid,'numerical',{s(q['text'])},'[]',{q['difficulty']},{q['difficulty']},'https://tipix-learning-phase-one.vvreddy1584.chatgpt.site','TIPIX_ORIGINAL','Original TIPIX question; pending answer and concept review.',md5({fingerprint}),{n},{s(q['hint'])}) on conflict(fingerprint) do nothing returning id into qid;")
        print(f"if qid is not null then insert into tipix_private.academic_answer_keys(question_id,answer,explanation,tolerance) values(qid,{j(q['answer'])},{s(q['solution'])},0);end if;")
print('end $import$;')
