# Academic engine — delivery and operational status

This update extends tipix_2; it does not replace Auth, profile registration, landing, palette, course samplers, or demo exams. Previous academic demos are preserved at /app/demo/dashboard, /app/demo/practice, /app/demo/practice/:courseId, /app/demo/submissions, /app/demo/concept-progress and /app/demo/leaderboard. Production academic pages use Supabase evidence only.

## Implemented

- Source registry with explicit unavailability and documented rights approval. No questions are seeded in production.
- Versioned curriculum, published concept rooms, original explanatory lessons, exact source references. Six Class 12 Relations and Functions concepts checked against CBSE 2026–27 Mathematics (041), PDF page 7: https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Maths_SecP2_2026-27.pdf . This is a partial curriculum, not complete coverage of Classes 6–12. Source topic metadata is separate from permission to reproduce questions.
- Reviewed manual ingestion: authenticated administrator imports JSON, rights are required, normalized question fingerprints reject duplicates, immutable keys remain in the private schema, drafts require explicit publication. Raw input is retained privately.
- Server-side transactional evaluation for MCQ, multiple-select, numerical (absolute tolerance), true/false, assertion/reason, exact output/trace, exact JSON match and exact structured-answer keys. This is NOT semantic short-answer grading.
- Student identity derives from the verified JWT. Grade/stream access derives from the existing persisted profile. No scores or roles are trusted from client data.
- Account-scoped transaction lock, idempotency UUID and question attempt numbering. Only correct first attempts earn 10 points; retries never award points, even after a wrong first answer. First-attempt marks stay distinct from recovery evidence.
- Next unanswered question is selected from stored attempts and ordered by immutable creation time/ID; source filter and last question persist on the server. Banks are not capped at 20; questions load individually. Withdrawal/republication can change the available bank; historical attempts are retained.
- First-attempt totals shared by dashboard, profile evidence panel and leaderboard. Leaderboard includes only real same-grade participants and anonymous peer labels. Recent submissions UI shows the latest 200; underlying history is retained.
- Mistake history, student-labelled mistake category, repeated count, recovery after a correct retry. Wrong answers do not automatically prove a cognitive cause; the category is a student reflection.
- Transparent concept estimate: weighted latest answer per distinct question, difficulty 1/1.25/1.5, 90-day exponential recency decay with floor 0.25, retries weighted 0.5. At least five distinct questions required. No source prestige multipliers or invented future ranks. Goals persist; overall readiness remains insufficient evidence until exam/coverage evidence exists.
- Teacher reports restricted to server-assigned students, persisted interventions and student completion. Self-reported school name is never used as a permission grant.
- sync-practice-concept Edge Function with explicit JWT validation (getUser), verified-email check, RPC admin authorization and per-account/action rate limiting. It supports health/scope/all and records unavailable-feed checks; it does not pretend to import from unconfigured providers. Gateway verify_jwt=false because authentication is validated explicitly in the function and forwarded to the RPC; it is not an anonymous endpoint.

## Remaining production work — not claimed complete

- Complete reviewed 6–12 curricula and authorized question banks; no publisher licences or feed credentials were supplied. Commercial publishers remain unavailable.
- Actual provider-specific feed adapters, pagination, external fetch monitoring, raw ingestion failure records for provider failures, and scheduled curriculum change detection/admin diffs. No external recurring jobs were enabled.
- Server-timed exams, release controls, unified exam evidence; existing exams remain explicit browser-tab demos. Do not use them for official examinations.
- Monaco/Judge0 programming execution and hidden tests; no execution provider configured. Coding/debugging/completion publication is rejected instead of scored insecurely.
- School/class membership management and staff onboarding. Existing verified student-profile gate is retained, so a staff tester currently also needs an existing profile. No user was promoted to admin automatically.
- Evidence-backed exam readiness, validated rank models, parent views, advanced teacher concept reports, full-screen violation handling. No invented readiness percentages.
- Browser end-to-end testing with real authenticated staff/student accounts and provider delivery tests. Database role/JWT-context tests are not a substitute for browser authentication tests.
- Load testing 70 concurrent auth requests/500 active students. Capacity is not established.

## Setup / deployment order

The migration files in supabase/migrations are the complete SQL, and the Edge Function folder contains complete deployable source. Apply each migration once through migration history; do not paste individual fragments into a live database.

1. Create a database backup using the project's backup facility before any future migration. This update used additive tables/functions and transactional rollback fixtures, not destructive replacements; no pre-change data backup was exported.
2. Review and run `supabase db push` against the linked project. The four academic migrations in this delivery are already applied to the connected project; do not manually reapply them.
3. Preserve VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Never place SMTP passwords, a service-role key or provider credentials in VITE variables.
4. Deploy `supabase functions deploy sync-practice-concept --no-verify-jwt`. Explicit getUser validation and private-role checks must remain enabled in its source.
5. `npm run build` (includes TypeScript).
6. Run `supabase/tests/academic_engine.sql` in a database session. The script creates test-only fixtures, exercises authenticated roles, asserts invariants and rolls back. Never convert those fixtures into production migrations.
7. `npm run test:profile` and `npm run test:workspace` for the retained foundation.
8. `npm run dev`. Test with two real registered students and designated staff before school rollout.

## Privileged provisioning

A database owner must select the intended existing user first. No client registration or metadata can self-assign teacher/admin. Using a parameterized database administration client, insert the approved auth user ID into `tipix_private.academic_staff(user_id,role)`. Roles are `admin` or `teacher`. For each teacher, insert specifically authorized student IDs into `tipix_private.academic_teacher_students(teacher_id,student_id)`. This membership is authoritative; avoid broad access from matching school-name strings.

No staff assignment has been made as part of this change. /app/staff displays a restricted state until provisioning.

## Content administration contract

Use /app/staff after provisioning. The operation selector accepts these record shapes (replace values with actual verified records, not fabricated source labels):

- configure_source: source_code, source_name, source_type (curriculum/official/open/pyq/licensed), organization, base_url (HTTPS), rights_status (unavailable/pending/approved), license_code, rights_reference, active. Approval requires documented rights.
- create_curriculum: board, academic_year (YYYY-YY), class_level (6–12), subject, official_source (HTTPS). Returns candidate ID. Use real current official metadata only.
- create_concept: curriculum_id, chapter_title, concept_title, subtopic, position, optional lesson and lesson_rights_reference. Published curricula are immutable through this API; add a new version instead.
- publish_curriculum: curriculum_id. Review the official version and mapped concepts before publishing.
- import_question: source_id, concept_id, question_type, question_text, options (array), answer, explanation, marks, negative_marks, difficulty (1–3), source_url, license_code, rights_reference. Include source_exam, source_year, source_session, source_shift, source_paper, source_question_number, source_page where applicable. PYQ imports require exam, year and question number. UI publication displays the provenance and answer key for authorized review.
- MCQ answers use a zero-based option index; multiple_select uses an array of zero-based indices; numerical uses a JSON number plus optional tolerance; true_false uses boolean; match uses exact JSON; output/trace/short_answer use exact JSON strings.

The database does not independently prove that an administrator's rights declaration is true; the human publication review must verify documents. Admin review data includes all curriculum and concept IDs. Never mark a source approved simply because its website is public.

## Security validation

Academic test assertions cover pre-submit key denial, private key table denial, admin gate, positive/negative grading, duplicate submissions with same and different request IDs, next-question resume, mistake creation/recovery, no retry points, consistent totals, minimum mastery evidence, student isolation and direct-score-write denial. Fixtures roll back. Security advisor reported no academic ERROR/WARN findings; intentional RPC-only tables have RLS with no policies and no client grants (INFO). Auth leaked-password protection is disabled in the hosted configuration (WARN); enable it in Auth settings if supported by the plan. No Auth configuration was changed by this update.
