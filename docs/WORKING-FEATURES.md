# TIPIX delivery status — 17 September 2026

## This update

- Grade/stream-aware syllabus browser: current official subject PDFs for Classes 9–12 and the NCERT textbook catalogue for Classes 6–8. These links expose the full official documents, not a claim that all curriculum content has been imported into TIPIX.
- Content Studio: draft curriculum, topic/concept lessons, MCQ/numerical/true-false question authoring, provenance fields and publication workflow. Existing advanced JSON operations remain available for other supported types. Rights approval remains mandatory.
- Interactive finite-set relations and functions: property checks update with students' selections. These explorations are explicitly unscored.
- Persistent doubts: new questions, concept context, replies, resolve/reopen and refresh. Teachers see assigned students only; administrators can supervise. Thread lists show the most recent 50. Existing demo doubts remain separate.

## Backend implementation

Migration 20260917091203_student_doubts.sql was applied using the Supabase connector. The CLI was unavailable in this environment; the local migration filename matches the server-returned migration version.

The doubts and messages tables have RLS and no direct client grants. The public RPC is security-invoker; its private implementation verifies the account and rechecks ownership or teacher assignment for every read/write. Sender identity and role are server-derived. Messages enforce size limits, a per-user 20/minute mutation limit and idempotency keys. React renders messages as plain text, not HTML.

Doubt authorization tests passed in a rollback-only transaction: duplicate creates/replies, cross-student read/write denial, assigned teacher access, revoked assignment denial, resolve/reopen persistence, unverified-account denial, direct table access denial and anonymous RPC denial. No fixture users or messages were retained.

Academic tests also passed, including draft/lesson/publication, published version immutability, student catalogue visibility, scoring, duplicate points prevention, resume, mistake recovery and account isolation.

## Remaining limits

Production currently has one published curriculum version, six concepts and zero rights-approved scored questions. The three source-linked NCERT exercises are unscored. No teacher/admin accounts are provisioned. Provisioning requires the intended registered staff email and class/student assignments; never choose an account by guesswork.

Full 6–12 lesson/question coverage, licensed PYQ imports, multi-concept/proctored exams and exam-to-mastery integration, Judge0 execution, full school/class administration, readiness modelling, parent access, source synchronization and load testing remain incomplete. Existing demonstration pages are not production implementations of those features.

The syllabus URLs were checked against https://cbseacademic.nic.in/curriculum_2027.html and https://ncert.nic.in/textbook.php on 16 September 2026. They are external references. Curriculum and content publication is a separate reviewed workflow.

Authenticated desktop/mobile browser QA has not been completed. Production builds passed, with pre-existing large-bundle warnings.

The security advisor reports INFO notices for intentionally RPC-only tables with deny-all RLS, and an existing warning that leaked-password protection is disabled. Configure it in Supabase Auth when available: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . No password settings were silently changed.

## Exam update

Server-scored assigned exams with autosave, deadlines and result-release controls are now implemented; see EXAMS.md for precise scope and validation.
