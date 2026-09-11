create schema if not exists tipix_private;
revoke all on schema tipix_private from public, anon;
grant usage on schema tipix_private to authenticated;
create or replace function tipix_private.verified_account() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.users where id = (select auth.uid()) and email_confirmed_at is not null);
$$;
revoke all on function tipix_private.verified_account() from public, anon;
grant execute on function tipix_private.verified_account() to authenticated;
create table if not exists public.tipix_student_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
 school_name text not null check (char_length(btrim(school_name)) between 2 and 160),
 school_city text not null check (char_length(btrim(school_city)) between 2 and 100),
 grade smallint not null check (grade between 6 and 12),
 stream text,
 role text not null default 'student' check (role = 'student'),
 created_at timestamptz not null default now(),
 constraint valid_grade_stream check ((grade <= 10 and stream is null) or
 (grade >= 11 and stream is not null and stream in ('pcm','pcb','pcmb','commerce')))
);
alter table public.tipix_student_profiles enable row level security;
revoke all on public.tipix_student_profiles from anon, authenticated;
grant select on public.tipix_student_profiles to authenticated;
grant insert(id,full_name,school_name,school_city,grade,stream) on public.tipix_student_profiles to authenticated;
drop policy if exists student_reads_own_profile on public.tipix_student_profiles;
create policy student_reads_own_profile on public.tipix_student_profiles for select to authenticated
 using (id = (select auth.uid()) and (select tipix_private.verified_account()));
drop policy if exists student_creates_own_profile on public.tipix_student_profiles;
create policy student_creates_own_profile on public.tipix_student_profiles for insert to authenticated
 with check (id = (select auth.uid()) and (select tipix_private.verified_account()));
comment on table public.tipix_student_profiles is 'Self-reported student onboarding. School name does not grant school membership. Grade and role are immutable to clients; only student registration is supported.';
