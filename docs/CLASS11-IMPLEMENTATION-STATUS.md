# Class 11 learning status — 23 September 2026

This is an incremental release in the existing TIPIX project. It is not full Class 11 completion.

## Content actually stored

| Subject | Books | Chapters | Topics | Concepts | Questions | Publication |
|---|---:|---:|---:|---:|---:|---|
| Physics | 1 | 1 | 5 | 5 | 30 | Draft; requires administrator review |
| Chemistry | 0 | 0 | 0 | 0 | 0 | Not populated |
| Mathematics | 0 book records | 1 | 1 | 1 | 8 | Existing published pilot |
| Biology | 0 | 0 | 0 | 0 | 0 | Not populated |

Physics has 35 lesson tasks and five mini checks. Draft questions are numerical, cover easy/medium/hard, have hints and detailed private solutions, and use source name **TIPIX Original**. This does not yet meet the requested mixed question types, challenge difficulty or approximately 20 questions per concept. The earlier Mathematics pilot retains its existing **Concept Practice** source label. Verified external questions: zero. No source years or examination provenance were invented.

## Official reference

NCERT, Physics Part I, Class XI, Chapter 2, *Motion in a Straight Line*, reprint 2026–27:
https://ncert.nic.in/textbook/pdf/keph102.pdf

The official chapter number, title and section headings were inspected on 23 September 2026. TIPIX's granular concept classification remains pending human review. Lessons, examples, mini checks, simulations and numerical questions are original; textbook paragraphs, illustrations and exercise questions were not copied. A source reference is not a claim that every concept classification has been approved.

## Reused infrastructure

Curriculum versions, chapters, topics, concepts, learning tasks/state, source registry, question bank, private answer/task keys, attempts, practice progress, mistake memory, staff roles and teacher assignments. No account roles, authentication settings, existing examination engine or scoring rules were changed.

New table: `academic_books`, linked to the existing curriculum and chapters. RLS is enabled; direct anonymous/authenticated table access is revoked. The admin-only review RPC is the read path for draft book metadata. Existing class and subject identity remains in curriculum-version records; no parallel class/subject systems were introduced.

Applied migrations:
- `20260923160735_class11_physics_drafts`: book metadata, hint/classification fields and pending Physics content.
- `20260923161020_curriculum_review`: isolated editorial RPC with verified-account and server-side admin checks. It does not replace academic scoring or authentication functions.

The initially combined replacement of the academic API was rejected by automatic review. It was not applied. The safer additive draft import and isolated editorial endpoint were accepted.

## Frontend changes

- Main Practice reuses InlinePractice for saved drafts, saved feedback, source/year/difficulty/type filters and source metadata. The pre-existing recovery route remains available.
- InlinePractice records client-reported response time, shows hints/question position/type and reloads persisted counts after submission.
- Existing TIPIX dark workspace styling from the prior draft is included. Landing and auth remain unchanged.
- MotionVisual adds a keyboard-accessible constant-acceleration exploration with position-time graph and live displacement/velocity/speed values.
- CurriculumReview lets admins inspect book references and lesson tasks, edit draft lesson blocks, and edit unused draft question text, hints, answer and solution. Existing publication checks are reused.
- Profile uses the shared persisted academic provider from the prior draft.

## Verification

Production TypeScript/Vite build passed. The new rollback database suite passes: administrator review/publication, exact draft and feedback resume, correct/incorrect grading, mistake retention, recovery without extra points, shared totals, mastery and unauthorized student/editor access. Fixtures and their role assignments are rolled back.

These are real database tests, not authenticated browser login tests. The required browser login → logout → login → resume flow is NOT yet passed. The current managed-browser skill is unavailable, so browser validation was not substituted with an unsupported automation method. Error #185 remains unconfirmed, not claimed fixed; the user's latest recording showed no such crash.

Security advisors: RPC-only tables have intentional deny-by-default RLS with direct grants revoked. Existing leaked-password protection warning remains; auth settings were preserved. Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Remaining work and blockers

- No real curriculum administrator is assigned. The owner must identify the intended account before a server-controlled admin role can be provisioned. Physics drafts must be reviewed before student publication; no student was silently promoted.
- Complete Stage A authenticated browser validation before scaling.
- Full Physics, Chemistry, Mathematics and Biology book/chapter/concept coverage.
- Automated official-source extraction and import-run review. The current Python importer is a rerunnable local JSON-to-draft-SQL importer, not a live NCERT crawler.
- Subconcept records and competitive-exam mappings.
- Approximately 20 varied original questions per concept, challenge level and robust marking of richer question types.
- Personalized AI tutor requires a configured authenticated server provider; none was faked.
- Mistake memory records wrong attempts/repetitions and resolution; diagnostic misconception rules and a dedicated three-question recovery sequence are not yet implemented.
- Existing mastery uses latest distinct-question evidence, difficulty, recency and discounted retries; at least five distinct questions are required. No new CP score was invented. Separate CP rollups for assignments/projects/exams remain unimplemented.
- Dashboard/Profile/Leaderboard use existing server evidence. Full browser propagation remains unverified.
- Admin reject/unpublish/reorder, complete source-metadata editing and paginated editorial search remain to be added.

Do not advertise full syllabus or end-to-end completion from this release.
