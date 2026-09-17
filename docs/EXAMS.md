# Server-scored assigned exams

The /app/exams route now uses Supabase records. The existing demo remains at /app/demo/exams. Dashboard and Profile display the same saved exam records. Exam marks are explicitly separate from practice points; this release does not add exam evidence to mastery or readiness calculations.

Staff can create a timed test for assigned students from a reviewed concept bank. Supported types are single choice, multiple select, numerical (with reviewed tolerance), true/false and assertion/reason. Questions and keys are copied into immutable private snapshots. Creation checks grade, stream, teacher assignment, source rights and publication. A request ID prevents duplicate exam creation.

Starting is idempotent and preserves the server deadline. Answers autosave after a 500ms pause, using serialized requests and optimistic revision checks. Revision conflicts tell the student to reload saved answers, rather than silently overwrite a second tab. Unsaved-change warnings apply to browser unload; best-effort saving also continues on app navigation. Network failures are shown and retry/reload controls are provided. Offline answer delivery is not guaranteed.

The server rejects changes after the deadline and calculates marks from the private key. Manual submission is final and idempotent. The active page submits when the timer expires. If the page is closed, the server finalizes the run on its next state/save/start request, teacher report or result release; no background scheduler is configured. This is deadline enforcement, not a claim of scheduled background submission.

Scores and explanations remain unavailable to students until the owner/admin releases results. Release is blocked until the closing time or every assigned student submits. Teacher report/release operations recheck current student assignments. Revoked teachers cannot inspect student submissions. Tests use a fixed, reviewed bank; existing practice access may expose the same educational questions, so these are learning assessments, not a secure unseen competitive examination or proctored system.

## Validation

supabase/tests/secure_exams.sql passed in a rolled-back fixture transaction: duplicate creation, unauthorized assignments, early release denial, unassigned start, student access to staff options, pre-release key/score protection, answer revisions, cross-device resume, stale write denial, private grading denial, correct numerical tolerance/scoring, repeated submit, final-answer immutability, late answer rejection and revoked teacher access. No synthetic questions or users were retained.

Production TypeScript/build checks passed. Authenticated browser end-to-end testing, mobile screenshot review and concurrent load testing remain outstanding. The current production question bank is empty and no staff account is provisioned, so no real exam is pre-populated.

Migration: 20260917095545_secure_exams.sql. The CLI was unavailable; the local filename uses the migration version returned by Supabase. Public tables and private snapshots have RLS with no direct client grants. The public RPC is security-invoker; its private implementation validates identity and authorization. The private grading helper is not granted to authenticated users. RPC-only deny-all RLS INFO notices are intentional.

Next requirements: provision named staff accounts and assignments, import authorised question content, add multi-concept exam authoring, integrate exam evidence into readiness, configure background expiry processing if required, and complete authenticated browser/load verification.
