# Class 11 course library — 24 September 2026

The Courses browser now queries the curriculum registry, independently of published lessons and questions. Every Class 11 student can browse the four subject cards and all 56 chapters; lesson access still follows their registered stream and publication rules. Existing Mathematics/Physics content and all student attempts are preserved.

## Actual Supabase counts after import

| Subject | Books | Chapters | Topics | Concepts | Lesson tasks | Questions |
|---|---:|---:|---:|---:|---:|---:|
| Physics | 2 | 14 | 43 | 109 | 35 | 30 |
| Chemistry | 2 | 9 | 30 | 101 | 0 | 0 |
| Mathematics | 1 | 14 | 35 | 93 | 7 | 8 |
| Biology | 1 | 19 | 50 | 160 | 0 | 0 |

Lesson tasks are blocks within a concept lesson, not complete lessons. Physics has five authored draft concept lessons; Mathematics has one published concept lesson. New topic/concept outlines are pending editorial review. The numbers above do not mean all lessons or question banks are ready.

## Current changes

- Versioned JSON manifest and validating, idempotent SQL importer for all four subjects.
- Reuses existing curriculum, book, chapter, topic and concept tables.
- Metadata-only authenticated catalogue endpoint; draft lessons and answer keys remain protected.
- Chapter search and full vertical chapter list; no completion gates.
- Complete imported topic/concept maps, including explicit preparation state for unavailable lessons.
- Progress is derived from the existing persisted mastery evidence. Unassessed concepts contribute zero to the displayed aggregate; assessed coverage is stated explicitly.
- Existing practice, hints, source filters, resume, scoring and feedback code is preserved.
- Admin can publish an individually reviewed complete lesson without publishing the entire curriculum. No account privileges were changed.

## Curriculum references

Chapter list: NCERT rationalised English reprint 2026–27. These are textbook chapter counts, not a claim about every examination syllabus.

- Physics: https://ncert.nic.in/textbook/pdf/keph1ps.pdf and https://ncert.nic.in/textbook/pdf/keph2ps.pdf
- Chemistry: https://ncert.nic.in/textbook/pdf/kech1ps.pdf and https://ncert.nic.in/textbook/pdf/kech2ps.pdf (Part II includes the Part I chapter list)
- Mathematics: https://ncert.nic.in/textbook/pdf/kemh1ps.pdf
- Biology: https://www.ncert.nic.in/textbook/pdf/kebo1ps.pdf

Topic/concept organisation is TIPIX editorial classification, not claimed to be official NCERT headings. Existing extra material, including the relative-velocity lesson, is preserved rather than deleted.

## Still incomplete

- Original teaching content and useful question banks for the remaining concepts, including Chemistry and Biology. No filler lessons or fabricated PYQs were inserted.
- Full subject-matter review of the granular classifications; fine-grained subsection completeness has not been certified.
- Authenticated browser flow and rendered screenshots: the Sites-required control-browser skill is unavailable in this session. Build and SQL tests do not substitute for that check.
- AI tutor, expanded recovery workflow and comprehensive CP aggregation remain outside what this change completes.
- No React #185 recurrence has been reproduced; this change does not claim to identify or fix an unobserved loop.

Existing security advisory: Supabase leaked-password protection remains disabled; authentication configuration was preserved. https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
