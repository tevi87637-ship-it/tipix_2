# Student workspace frontend

## Delivered

The account-page refinement and the student workspace are delivered together. The landing page, shared marketing stylesheet, header/footer layout, and original crystal renderer are unchanged. The workspace is loaded as a separate route bundle; its styles are scoped to workspace-specific names.

Account pages include an explicit **Explore the student workspace preview** link. The signup review can carry the chosen grade and stream to the preview, but never includes a name, email, password, or other private input in its URL. No sign-in success is simulated.

| Route                     | Working frontend behavior                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/app/dashboard`          | Continue learning, real local attempt totals, correct answers, accuracy, points, course cards and next actions                       |
| `/app/courses`            | Class/stream-filtered courses and clearly identified concept samplers                                                                |
| `/app/courses/:courseId`  | Horizontal concept path, lesson overview, practice entry, and honestly labeled planned assessment nodes                              |
| `/app/practice`           | Subject selection and local progress                                                                                                 |
| `/app/practice/:courseId` | Four original demo questions per course, immediate explanations, first-answer scoring, question review, resume after refresh         |
| `/app/exams`              | Five-minute demo exams, local answer retention, explicit submission, deadline checks, results and explanations, fresh-preview action |
| `/app/submissions`        | Subject filter and review links for local practice attempts                                                                          |
| `/app/concept-progress`   | Concept-level first-attempt evidence; no unsupported mastery claim                                                                   |
| `/app/leaderboard`        | Local user points alongside clearly fictional peers; no official rank                                                                |
| `/app/flashcards`         | Flip, navigate, and mark a card recalled locally                                                                                     |
| `/app/projects`           | Subject-specific project briefs with real instructions; no fake uploads                                                              |
| `/app/doubts`             | Local question drafts, explicitly not sent to a teacher                                                                              |
| `/app/profile`            | Preview class, course plan, attempts and points; no invented student identity                                                        |
| `/app/settings`           | Confirmed local reset, data scope, and motion guidance                                                                               |

## Grade and content rules

Grades 6–10 get Mathematics and integrated Science. Grades 11–12 use PCM, PCB, PCMB, or Commerce. A class change explicitly resets this tab's preview progress and requires a new stream selection where applicable. Unsupported subjects cannot open a lesson or practice set merely by changing a URL.

The sample catalogue contains four questions per available subject. It is deliberately marked as original demo content. It is not full syllabus coverage, NCERT/PYQ content, or a current-year curriculum certification. Coding/AI/Cybersecurity are listed as separate future tracks. Teacher/admin workspace, assignments, code execution, live notifications, official achievements, and full curriculum editing remain later work.

## State and scoring

`sessionStorage` holds only explicitly local preview data. It is not authentication or secure storage. State is shared by workspace pages in a React context. Practice answers use a unique subject/question key; a second submission for the same key cannot add points. Points are derived from correct stored first answers, with 10 per correct answer. Exam results are separate and never silently add practice points. Concept signals are explicitly limited evidence, not a certified mastery score.

Refreshing a practice page picks the first unanswered question; submission review links target a specific answer. Refreshing an existing class preview preserves its data. Returning to a completed exam shows its result. Deadline and scoring logic are client-side demonstrations; server enforcement is required before real student use.

Closing the browser tab normally ends its session, though browser restore features can restore session storage. Use Settings → Reset preview progress for an explicit clear. Real accounts, cross-device persistence, content authorization, official grade/leaderboard generation, teacher messaging, and server-side exams are not connected.

## Validation

- Production TypeScript and Vite build passed.
- Five account-profile tests and four workspace catalogue tests passed.
- Practice empty-choice error verified, correct answer awarded 10 local points, refresh resumed at question 2, and Dashboard/Submissions reflected the same result.
- Exam preview started, submitted with unanswered questions, displayed 0/4 and explanations, and returned to subject selection.
- Flashcard flip and project brief interaction verified.
- A local-draft compatibility defect was found in the non-HTTPS test environment, fixed, and rechecked successfully. No teacher message was transmitted.
- Class 12 Commerce displayed only Commerce after changing class/stream.
- Desktop dashboard screenshot and 390px mobile dashboard, practice, and course screenshots inspected. Mobile dashboard/practice document width equaled viewport content width, with no horizontal overflow.
- Grade and signup review safeguards from `ACCOUNT-PAGES.md` were tested earlier in this same work sequence.
- Landing and shared marketing source files checked unchanged using git diff.

No physical-device performance, live account, backend authorization, official content coverage, or concurrency capacity certification is claimed. Browser-extension metadata errors were excluded from app error assessment. Temporary responsive QA files were removed before the final build.

## Next integration phase

Connect a specifically selected Supabase project. Implement verified sign-up/recovery, a trusted student profile, school/grade/stream validation, RLS, and server-side scoring. Replace local preview data with tenant-aware service adapters and reviewed curriculum. Do not treat frontend grade selection or hidden navigation as access control.

An optional read-only WebMCP profile tool is feature-detected. The test browser did not expose `document.modelContext`, so WebMCP registration/execution validation was unavailable. Normal navigation does not depend on it.
