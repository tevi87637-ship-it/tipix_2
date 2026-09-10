# TIPIX architecture and implementation sequence

## Current architecture

Browser → React Router → public page components and shared UI. Home lazily loads React Three Fiber/Three.js; GSAP owns reveal and scroll state, while the renderer owns crystal transforms. Auth pages perform only local form validation and send no requests. Browser storage is not used for passwords, roles, results, or analytics.

Routes delivered: `/`, `/courses`, `/for-schools`, `/login`, `/register`, `/forgot-password`. Unknown routes show an explicit fallback. Production hosting must serve `index.html` for client routes.

The dashboard is a labeled illustration inside the landing and school pages, not an authenticated route. Planned routes: `/reset-password`, `/onboarding`, `/app/dashboard`, `/app/courses/:courseId`, `/app/learn/:conceptId`, `/app/practice/:conceptId`, `/app/exams/:examId`, `/app/submissions`, `/app/concept-progress`, `/app/leaderboard`, `/app/profile`, `/app/settings`, `/teacher/*`, `/admin/*`.

## Phase 2: identity and one complete learning path

Before implementation, check the current Supabase changelog and official Auth, RLS, Storage, and Edge Function documentation. Configure real Supabase Auth and recovery redirects. Introduce student onboarding, trusted memberships, teacher provisioning, and route guards. Route guards are a convenience; database and endpoint authorization must enforce access independently.

Then deliver one verified class/subject learning slice: course → chapter → topic → concept → lesson → practice → stored attempt → consistent dashboard results. Test with at least two schools and two students to prove isolation. Only after this slice passes should content coverage expand.

### Proposed tables

| Tables                                                               | Purpose and access                                                                                         |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| schools, classes                                                     | School and grade organization; tenant-scoped access                                                        |
| profiles                                                             | Student display name and preferences; self access with controlled teacher visibility                       |
| school_memberships, class_memberships                                | Trusted role and class assignments; admin-managed, never self-writable elevation                           |
| courses, course_modules, chapters, topics, concepts, learning_blocks | Versioned curriculum hierarchy; published content readable by enrolled students; authorized teacher drafts |
| course_enrollments, class_courses                                    | Bind learners/classes to available course versions                                                         |
| materials                                                            | Private storage object references, owner, school, course, and publication state                            |
| questions, question_concepts, question_sources                       | Type, concept tags, difficulty, licensed provenance, verified year, review state                           |
| private.question_keys, private.coding_tests                          | Server-only answers, rubrics, hidden tests; never exposed with unanswered questions                        |
| practice_sessions, attempts, responses                               | Saved question order and cursor; owned by learner; scored on trusted server                                |
| exams, exam_questions, exam_assignments, exam_sessions               | Timers, release policy, autosave, server cutoff and submission state                                       |
| score_events                                                         | Append-only points ledger; unique idempotency key per eligible scored action                               |
| concept_evidence, concept_progress                                   | Concept observations and derived mastery summaries; consistent source for all pages                        |
| doubts, doubt_messages                                               | Context-attached questions; visible only to student and authorized class teachers                          |
| assignments, submissions, projects                                   | Class work and deliverables with author and teacher permissions                                            |
| flashcards, flashcard_reviews                                        | Owned spaced practice scheduling                                                                           |
| audit_events                                                         | Privileged actions and scoring changes; restricted access                                                  |

Course modules are optional grouping above chapters. Each question has a source record only when verified; unknown provenance cannot silently become an NCERT/PYQ label. Class 6–10 Physics/Chemistry/Biology browsing must map to the school's integrated Science curriculum. Commerce is stream-dependent for Classes 11–12. Content examples in the current UI are not a complete or verified current-year syllabus.

### Security and scoring

Enable RLS on every exposed table and test SELECT, INSERT, UPDATE, and DELETE for each role. Require ownership plus membership and school predicates as appropriate. UPDATE policies need both USING and WITH CHECK. Restrict privilege changes to trusted server/admin paths. Do not authorize from user-editable metadata. Prefer RLS-respecting views with security_invoker and invoker functions. Store answer keys outside exposed schemas. Never use a service/secret key in browser code.

An authenticated scoring endpoint verifies session ownership, question assignment, exam cutoff, and answer-release policy. In one transaction, persist the response, validate its idempotency key, calculate the score, append any eligible score event once, and update progress. Dashboard/profile/leaderboard all read those canonical results. Retried or edited practice responses must not earn duplicate points. Practice reveals feedback after submission; exams follow release policy.

Use private storage with object-level school/class ownership and short-lived signed URLs. Validate uploads, request bodies, and limits. Rate-limit AI, scoring, auth-sensitive operations, and execution endpoints. Do not log passwords or student answers in general request logs. Avoid client-trusted timer or anti-cheat decisions; fullscreen and clipboard controls alone cannot establish exam integrity.

### Mastery proposal, not implemented analytics

Display insufficient evidence until at least five distinct reviewed questions cover a concept. A first transparent candidate is `100 × sum(correct × weight) / sum(weight)` using only eligible attempts, a documented latest-attempt/retry policy, and bounded recency weights. Show attempt count, coverage, and last practice alongside the score. Keep mastery separate from participation points. Calibrate with teacher feedback before attaching proficiency labels; do not claim predictive accuracy. All current UI values are illustrations.

## Later phases

3. Expand reviewed content and exams; add teacher curriculum, classes, assignments, and doubts.
4. Add projects, flashcards, sandboxed coding execution, and grounded AI explanations behind server functions.
5. Harden operations: audit trails, monitoring, backups, accessibility review, school pilot, and load testing.

Capacity targets are 70 concurrent authentication requests and 500 active users. These are targets, not tested capacity. Model sign-in bursts separately from active-user workloads. Load-test representative lesson reads, autosaves, grading transactions, and class reports; record p95 latency, error rate, lock contention, connection use, and service quotas.

## Environment contract

Phase 1: no variables needed.

Future browser public values: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
Future server-only secrets/settings: `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, `JUDGE0_API_URL`, `JUDGE0_API_KEY`, `APP_ORIGIN`. Confirm provider-specific key names during integration. Configure through each provider's secret manager. A real secret key must never appear in `.env.example`, Git, public build output, or any `VITE_` variable.
