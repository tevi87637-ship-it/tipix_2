# Login and student signup refinement

The landing page, its shared stylesheet, layout, crystals, and existing course explorer are unchanged. All new styling is scoped under `.auth-v2` in `src/pages/Auth.css`.

## Experience

Login, signup, and recovery retain the charcoal and #5266eb palette. The account pages add slow CSS orbital lights, a breathing central book icon, hover/focus feedback, and short step transitions. These effects do not require WebGL. Reduced-motion preferences disable continuous and transition animations. The decorative panel is hidden on small screens to prioritize the form.

Signup: Account → Your studies → Review.

- Student full name, accessible email, password and confirmation.
- School name and school city/town.
- Current grade 6–12, with no preselection.
- Mandatory stream for grades 11–12: PCM, PCB, PCMB, or Commerce, matching the currently planned content coverage.
- Live subject preview. Grades 6–10 use Mathematics and integrated Science; upper-secondary selections use stream-specific subjects.
- Explicit final confirmation of grade and stream; details can be edited without losing the other step's in-memory input.
- Changing grade clears stream and confirmation, preventing stale upper-secondary course choices.
- No date of birth, home address, phone, identity number, or other unnecessary sensitive information is collected.

## Data contract and limits

`registrationProfile` validates the complete form, trims fields, normalizes the email, converts grade to an integer, and excludes passwords, password confirmation, and role assignments. Lower grades always produce `stream: null`. Password is retained only as temporary component state for the future authentication call and is never included in the review or persisted. Refreshing or leaving the page clears the form.

This update is an account-page frontend refinement. It does not connect Supabase or create accounts. Valid submissions explicitly state that nothing was saved. Grade-based subjects are a preview, not implemented authenticated course authorization.

When integrating the backend, revalidate the profile on the server; create a trusted student profile linked to the authenticated user; derive enrolled courses from the persisted grade and stream, never from query strings or a client-provided subject list; use RLS to prevent privilege/tenant changes. Grade progression must be an explicit validated update, not automatic promotion based on a date. No server role may be assigned from signup input.

## Verification

- Production TypeScript/Vite build passes.
- `npm run test:profile`: five tests covering invalid grades, required upper-secondary streams, lower-secondary course isolation, password mismatch and confirmation, and normalized profile output excluding secrets/roles.
- Browser flow with synthetic test-only input passed Account → Studies → Review → confirmation-required error → honest not-connected result.
- Changing Class 11 Biology to Class 8 displayed Mathematics/Science; changing back to Class 11 left stream blank, requiring a new selection.
- Desktop signup and review inspected; CSS orbital lights rendered without WebGL.
- Mobile login/signup screenshots inspected at 390px frame width; content scroll width equals client width, with no horizontal overflow.
- Landing and shared source files verified unchanged with git diff.
- Browser click dispatch occasionally timed out after the action completed. Visible state was inspected and remaining controls were exercised with keyboard interaction.
