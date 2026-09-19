# Class 11 pilot: pending integration

## Implemented in this change

- Restore learning screens to existing TIPIX dark workspace tokens, sidebar, typography and buttons. Landing/auth are unchanged.
- Add an accessible interactive union/intersection diagram, with reduced-motion support inherited from the learning theme.
- Prepare one Class 11 Mathematics / Sets / Set operations / Union and intersection lesson with seven steps and eight original Concept Practice questions.
- Prepare server catalogue eligibility from curriculum stream records, chapter/topic relationships and private answer keys.
- Prepare atomic answer/cursor saving and a `resume` operation that restores submitted feedback until Next is chosen.
- Update practice UI for feedback restoration, detailed solutions, concept labels and hiding Year when no years exist.
- Replace Profile's demonstration statistics/course links with the existing academic provider's persisted totals/catalogue.

## Production database approval required

`supabase/pending/class11_concept_pilot.sql` has NOT been applied. Automatic approval review rejected it because it changes production tables, publication constraints and security-sensitive functions without approval for that exact change. Do not apply by another execution route.

The proposed migration adds stream metadata and topic relationships, inserts only this Class 11 pilot, and replaces the academic/learning RPC bodies while retaining verified-account, grade/stream and role checks. It changes the publication constraint to permit this explicitly identified original seed without inventing a human reviewer. Normal imported questions continue to require an actual reviewer. This publication-rule change is material and needs explicit review/approval. No student is promoted to staff; no auth configuration is changed.

The frontend `resume` call requires this migration. Do not deploy this branch before migration approval and integration verification. The migration is in `pending`, not in the applied migration history. After approval, use the server-returned migration version for the tracked filename (the local Supabase CLI is unavailable).

## Verification evidence and limits

- Production build passed before final cleanup; rerun at commit.
- Isolated development fixture rendered Courses → Subject → Chapter → Concept and the lesson in React StrictMode.
- Inspected desktop lesson screenshot: dark TIPIX surfaces/navigation and interactive diagram.
- This fixture mocked the database and was NOT an authenticated end-to-end test. Temporary fixture entrypoints and test context exports have been removed.
- Error #185 was not reproduced. No exact offending component is identified, and no error suppression or claimed fix was added.
- `supabase/tests/class11_concept_pilot.sql` contains rollback tests for catalogue access, private answers, drafts, feedback resume, duplicate points, filtering, shared totals/mastery and student isolation. It has NOT run because the migration is blocked.
- Authenticated login/exit/login/resume, actual database persistence, mobile practice and complete browser regression remain unverified.

## Expansion gate

First approve and validate this pilot. Then expand the same data-driven model to reviewed chapters/topics/concepts in each class and stream. Original questions must remain Concept Practice; verified NCERT/Exemplar/board/PYQ imports require supplied permitted material with source references and accurate exam years. Do not advertise full-syllabus coverage while only this pilot exists.
