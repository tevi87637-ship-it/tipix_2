-- Transactional authorization tests. No email, password, or lasting users created.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-4000-8000-000000000001','rls-a@example.invalid',now()),
 ('00000000-0000-4000-8000-000000000002','rls-b@example.invalid',now()),
 ('00000000-0000-4000-8000-000000000003','rls-c@example.invalid',null);
insert into public.tipix_student_profiles(id,full_name,school_name,school_city,grade)
 values('00000000-0000-4000-8000-000000000002','Test B','Test School','Test City',8);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
do $$ begin
 if tipix_private.verified_account() then raise exception 'Unconfirmed account incorrectly verified'; end if;
 begin
  insert into public.tipix_student_profiles(id,full_name,school_name,school_city,grade)
   values('00000000-0000-4000-8000-000000000003','Test C','Test School','Test City',8);
  raise exception 'Unconfirmed insert accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ begin
 begin
  insert into public.tipix_student_profiles(id,full_name,school_name,school_city,grade)
   values('00000000-0000-4000-8000-000000000001','Test A','Test School','Test City',12);
  raise exception 'Missing upper-class stream accepted';
 exception when check_violation then null;
 end;
 begin
  insert into public.tipix_student_profiles(id,full_name,school_name,school_city,grade)
   values('00000000-0000-4000-8000-000000000003','Test C','Test School','Test City',8);
  raise exception 'Cross-user insert accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
insert into public.tipix_student_profiles(id,full_name,school_name,school_city,grade)
 values('00000000-0000-4000-8000-000000000001','Test A','Test School','Test City',10);
select count(*)=1 as sees_only_own_profile,
 bool_and(id='00000000-0000-4000-8000-000000000001'::uuid) as ownership_enforced,
 bool_and(role='student') as student_role_only,
 not has_table_privilege('authenticated','public.tipix_student_profiles','UPDATE') as grade_updates_blocked,
 not has_table_privilege('anon','public.tipix_student_profiles','SELECT') as anonymous_reads_blocked,
 not has_column_privilege('authenticated','public.tipix_student_profiles','role','INSERT') as role_assignment_blocked
from public.tipix_student_profiles;
rollback;
