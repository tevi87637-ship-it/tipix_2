# Class 11 pilot: database applied; browser verification pending

## Implemented in this change

- Restore learning screens to existing TIPIX dark workspace tokens, sidebar, typography and buttons. Landing/auth are unchanged.
- Add an accessible interactive union/intersection diagram, with reduced-motion support inherited from the learning theme.
- Prepare one Class 11 Mathematics / Sets / Set operations / Union and intersection lesson with seven steps and eight original Concept Practice questions.
- Prepare server catalogue eligibility from curriculum stream records, chapter/topic relationships and private answer keys.
- Prepare atomic answer/cursor saving and a `resume` operation that restores submitted feedback until Next is chosen.
- Update practice UI for feedback restoration, detailed solutions, concept labels and hiding Year when no years exist.
- Replace Profile's demonstration statistics/course links with the existing academic provider's persisted totals/catalogue.

## Approved production migration

After explicit user approval, `supabase/migrations/20260919122511_class11_concept_pilot.sql` was applied to the existing TIPIX project on 19 September 2026. The server returned migration version `20260919122511`.

The migration adds stream metadata and topic relationships, inserts only the Class 11 pilot, and updates academic/learning RPCs while retaining account, grade/stream and role checks. The approved publication constraint permits this explicitly identified original seed without inventing a human reviewer. Normal imported questions continue to require an actual reviewer. No student was promoted to staff and no authentication configuration was changed.

Frontend changes remain in the draft PR, not the deployed Site. Authenticated browser integration verification is still required before declaring the pilot complete.

## Verification evidence and limits

- Production build and profile validation tests passed.
- Isolated development fixture rendered Courses → Subject → Chapter → Concept and the lesson in React StrictMode.
- Inspected desktop lesson screenshot: dark TIPIX surfaces/navigation and interactive diagram.
- This fixture mocked the database and was NOT an authenticated end-to-end test. Temporary fixture entrypoints and test context exports have been removed.
- Error #185 was not reproduced. No exact offending component is identified, and no error suppression or claimed fix was added.
- Production Postgres rollback suites passed: `class11_concept_pilot.sql`, `learning_tasks.sql`, and `secure_exams.sql`. They test catalogue access, private answers, drafts, feedback resume, duplicate points, filtering, shared totals/mastery and student isolation. Disposable transaction fixtures are rolled back; these are not browser authentication tests.
- The development homepage and login rendered without React #185. The browser has no authenticated student session. Authenticated login/exit/login/resume, mobile practice and complete browser regression remain unverified. Database persistence logic is covered by the rollback suites, not yet by the browser flow.

## Expansion gate

First complete authenticated browser validation of this pilot. Then expand the same data-driven model to reviewed chapters/topics/concepts in each class and stream. Original questions must remain Concept Practice; verified NCERT/Exemplar/board/PYQ imports require supplied permitted material with source references and accurate exam years. Do not advertise full-syllabus coverage while only this pilot exists.
