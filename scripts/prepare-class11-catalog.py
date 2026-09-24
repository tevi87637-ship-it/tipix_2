"""Validate the versioned curriculum manifest and emit an idempotent additive SQL import.
No textbook prose/questions are imported. Does not publish lessons or change student data.
"""
import json,pathlib,sys
p=pathlib.Path(__file__).resolve().parents[1]/'content/class11/curriculum-2026-27.json'
d=json.loads(p.read_text())
assert d['class_level']==11 and d['academic_year']=='2026-27'
assert len({s['subject'] for s in d['subjects']})==len(d['subjects'])
for s in d['subjects']:
 chapters=[c for b in s['books'] for c in b['chapters']]
 assert [c['number'] for c in chapters]==list(range(1,len(chapters)+1))
 assert len({c['title'] for c in chapters})==len(chapters)
 for b in s['books']:
  assert b['official_source_url'].startswith('https://ncert.nic.in/textbook/pdf/')
  for c in b['chapters']:
   assert len(c['topics'])>=2
   names=[n['title'] for t in c['topics'] for n in t['concepts']]
   assert len(names)>=3 and len(set(names))==len(names)
print("""-- Additive curriculum browser; lesson publication remains independently protected.
alter table public.academic_curriculum_versions add column if not exists catalog_visible boolean not null default false;
alter table public.academic_curriculum_versions add column if not exists catalog_metadata jsonb not null default '{}';
alter table public.academic_chapters add column if not exists metadata jsonb not null default '{}';
alter table public.academic_topics add column if not exists metadata jsonb not null default '{}';
do $import$ declare doc jsonb := $manifest$"""+json.dumps(d,ensure_ascii=False)+"""$manifest$;
s jsonb;b jsonb;h jsonb;t jsonb;c jsonb;vid uuid;bid uuid;hid uuid;tid uuid;ci integer;ti integer;begin
for s in select * from jsonb_array_elements(doc->'subjects') loop
 insert into public.academic_curriculum_versions(board,academic_year,class_level,subject,official_source,status,streams)
 values(doc->>'board',doc->>'academic_year',11,s->>'subject',s->'books'->0->>'official_source_url','candidate',
 case when s->>'subject'='Biology' then array['pcb','pcmb'] when s->>'subject'='Mathematics' then array['pcm','pcmb','commerce'] else array['pcm','pcb','pcmb'] end)
 on conflict(board,academic_year,class_level,subject) do nothing;
 select id into strict vid from public.academic_curriculum_versions where board=doc->>'board' and academic_year=doc->>'academic_year' and class_level=11 and subject=s->>'subject';
 update public.academic_curriculum_versions set catalog_visible=true,catalog_metadata=jsonb_build_object('curriculum_version',doc->>'version','chapter_verification',doc->>'chapter_verification','classification_verification','pending','last_verified_at',doc->>'checked_at') where id=vid;
 for b in select * from jsonb_array_elements(s->'books') loop
  insert into public.academic_books(curriculum_id,title,part,official_source_url,last_verified_at) values(vid,b->>'title',b->>'part',b->>'official_source_url',(doc->>'checked_at')::timestamptz) on conflict(curriculum_id,title,part) do nothing;
  select id into strict bid from public.academic_books where curriculum_id=vid and title=b->>'title' and part=b->>'part';
  for h in select * from jsonb_array_elements(b->'chapters') loop
   insert into public.academic_chapters(curriculum_id,position,title,source_url,book_id) values(vid,(h->>'number')::integer,h->>'title',b->>'official_source_url',bid) on conflict(curriculum_id,title) do nothing;
   select id into strict hid from public.academic_chapters where curriculum_id=vid and title=h->>'title';
   update public.academic_chapters set book_id=bid,metadata=metadata||jsonb_build_object('verification_status','official_contents_checked','last_verified_at',doc->>'checked_at','curriculum_version',doc->>'version') where id=hid;
   ci:=0;ti:=0;
   for t in select * from jsonb_array_elements(h->'topics') loop
    ti:=ti+1;
    insert into public.academic_topics(chapter_id,title,position,metadata) values(hid,t->>'title',ti,jsonb_build_object('verification_status','pending','classification','TIPIX editorial outline')) on conflict(chapter_id,title) do nothing;
    select id into strict tid from public.academic_topics where chapter_id=hid and title=t->>'title';
    for c in select * from jsonb_array_elements(t->'concepts') loop
     ci:=ci+1;
     insert into public.academic_concepts(curriculum_id,chapter_title,concept_title,subtopic,position,topic_id,classification_reference)
     values(vid,h->>'title',c->>'title',t->>'title',ci,tid,jsonb_build_object('verification_status','pending','classification','TIPIX editorial outline','official_source_url',b->>'official_source_url','curriculum_version',doc->>'version'))
     on conflict(curriculum_id,chapter_title,concept_title) do nothing;
    end loop;
   end loop;
  end loop;
 end loop;
end loop;
end $import$;
""")
