# Learning redesign — 17 September 2026

## Audit and preservation

Inspected routing, StudentLayout/WorkspaceContext, AuthProvider/profile gate, Supabase client, academic context/API, practice scoring/review, submissions/mastery/leaderboard, exam and doubt migrations, existing styles and content studio. Landing, authentication, accounts, existing scoring, exams, doubts and demonstration routes remain intact. Existing curriculum IDs and concept IDs remain authoritative; no tables were dropped.

| Area | Implementation |
| --- | --- |
| Course library | Registered class/stream, subject search, subject cards, published content counts, saved continuation |
| Subject journey | Database chapter metadata, alternating pastel cards, animated dotted path, horizontal scrolling |
| Chapter | Sticky overview and connected topic/concept nodes |
| Lessons | Database task blocks, collapsible sections, examples, formulas, common mistakes and private-key learning checks |
| Persistence | Own-account task completion, active task/section, question draft and filters |
| Inline practice | Exact concept; source/year/difficulty/type filters; one question returned per request; existing protected server scoring |
| Shared results | Existing academic attempts update mastery/points/mistakes; Dashboard/Profile also link to recent learning tasks |
| Theme | Warm light surfaces, green learning accent, cyan/pink/lavender chapter cards; scoped to academic learning routes |
| Motion | CSS transitions and SVG dotted paths reuse the existing stack, respect pause/reduced motion; no additional animation dependency |

The same sidebar is restyled as a narrow rail; navigation is not duplicated. Existing /app/courses/:courseId demo behavior is preserved. New subject journey is /app/subjects/:subject. Chapter/concept URLs are retained.

## Data model

Existing academic_curriculum_versions → academic_concepts → academic_verified_question_bank / private answer keys → academic_attempts / mistake memory remains intact. Curriculum carries class, board, subject and year; concepts carry chapter/topic. New academic_chapters supplies explicit chapter order. New academic_learning_tasks stores ordered content blocks and optional concept-check prompts. Private academic_task_keys protects learning-check answers. academic_learning_state is keyed by student + concept, with task, section, completion, checked answers, draft and filters.

learning_api verifies confirmed authentication and curriculum access. Mutations derive the student from auth.uid(), are rate limited, and do not accept client scores or roles. Private keys are unavailable through client table access. Own-state SELECT is protected by RLS. RPC-only content tables intentionally have no client table grants. Existing academic_api remains the only practice-scoring source. Lesson reading/check completion does NOT award examination points or establish mastery. Current mastery remains the documented minimum-five-question evidence estimate; a complete lesson-plus-assessment mastery certification is not implemented.

## Content coverage and sources

Current publication: Class 12 Mathematics, 13 chapter titles, lessons in Relations and Functions and Conditional Probability. Six existing relations/functions concepts have four tasks each; Conditional Probability has five original tasks. Other chapter lessons and other classes still require content publication. Original learning checks are labelled as such and do not impersonate NCERT/PYQs. No approved NCERT/PYQ question bank is present; those sections show honest empty states. This is not a fully populated Classes 6–12 product.

Chapter sequence verified from NCERT 2026–27 contents:
- https://ncert.nic.in/textbook/pdf/lemh1ps.pdf
- https://ncert.nic.in/textbook/pdf/lemh2ps.pdf

No textbook body text or questions were copied. Existing optional PDF references remain on the Syllabus page; learning no longer requires opening a PDF.

Course photograph: Vitaly Gariev, Unsplash, https://unsplash.com/photos/hand-writing-mathematical-formulas-on-a-chalkboard-4dXO2xAzRQk . Downloaded as a local asset. Mathematics-specific image is not assigned to unrelated future subjects.

## Verification

- Production TypeScript/Vite build passed; preexisting large Three.js/main chunks remain.
- Transaction-rollback database test checks authenticated access, grade isolation, own-state RLS, hidden keys, duplicate completion, saved check feedback, section resume, question filtering, draft restoration, server scoring and exclusion of answered questions. Fixtures are rolled back.
- Browser checked the real auth gate: unauthenticated Courses redirects to Login.
- Isolated component fixture rendered actual course, chapter and lesson components at desktop and the course card in a 390px iframe viewport. Reviewed against the uploaded reference contact sheet. Temporary fixture entrypoints/provider exports removed before production build. This is component visual QA, not authenticated end-to-end testing.
- No learner credentials were available; full real-account login → submit → reload browser flow remains unverified. No load-test claim.
- Reference resemblance is structural/palette-based, not an exact match. Reference has many populated subjects; production currently has one partially populated subject. Existing straight/dotted concept connector differs from the reference's curved concept path.
- Supabase security advisor: intentional RLS-deny-all content tables; preexisting leaked-password-protection warning remains. See https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .

## Remaining requirements

Full syllabus lessons and permitted/verified question datasets; staff/admin provisioning by an explicitly named registered account; content-editor support for structured task editing; optional cross-class browsing; exam-to-mastery integration; production-scale query optimization and load tests; real-account browser QA. Structured/free-form marking and code execution still require their appropriate marking/execution services. Existing provider-dependent question types must not be presented as fully supported.

Required frontend environment names unchanged: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY. No secret key added.

Supabase CLI unavailable in cached environment. Native migrations applied, then local files saved under server-returned migration versions.
