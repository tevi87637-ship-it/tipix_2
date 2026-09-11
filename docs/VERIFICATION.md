# Phase 1 verification

Checked 2026-09-10.

## Passed

- TypeScript and Vite production build.
- Desktop screenshots: landing hero and scrolled learning introduction. Layout direction, charcoal background, near-white type, and blue CTA compared to visible Mercury reference.
- Mobile screenshots: home, courses, and registration at a 390px iframe viewport (375px content area after scrollbar). No visible clipping; home and courses DOM scroll width matched 375px client width.
- Main navigation and anchor navigation to the learning/practice sections.
- Practice demo: incorrect answer displays a retry explanation; correct answer displays `60 ÷ 5 = 12 m/s` immediately.
- Mobile menu opens and closes. Class 6 removes Commerce; Class 12 restores the upper-secondary subject set.
- Desktop course selection: Class 11 Mathematics shows Sets; switching to Class 12 shows Matrices in the horizontally scrolling chapter preview.
- Registration submission with empty values displays required-field errors and a summary. No submission success is simulated.
- Source review: forms have no network submission or password persistence; answer examples do not award points; all dashboard results carry sample-data labels.
- Animation cleanup is implemented through GSAP context/tween cleanup, event listener removal, scene unmount, and React Three Fiber resource disposal.

## Limits

- This browser did not expose usable WebGL for the TIPIX scene. The static fallback rendered correctly. GPU crystal appearance, actual frame rate, pointer parallax, and live formation transitions have not been visually validated here.
- Mercury's canvases likewise did not render their full particle effect during inspection. Exact visual/animation equivalence is unverified. No reference recording was available in the current turn.
- Reduced-motion handling is implemented and reviewed in source; this browser was set to no-preference and did not expose a supported emulation control.
- Mobile checks used same-origin frames, not physical phones. No hardware performance or 200% text-zoom certification is claimed.
- Browser logs included browser-extension metadata errors, not application exceptions.
- One iframe click timed out; the equivalent course interaction passed in the normal desktop tab.
- Vite reports the lazy Three.js chunk above its 500kB warning threshold (about 233kB gzip). It is loaded only on the landing page. Further GPU/bundle profiling is appropriate before a school pilot.
- No backend, authorization, end-to-end persistence, or load testing is possible in this frontend-only phase. Capacity targets remain unverified.

Temporary responsive QA files were removed before the final build and are not published.

## September 11 — compact forms and real authentication integration

- Removed account marketing headline/footer; inspected desktop registration and mobile login/signup at 390 × 844. Final mobile screenshot shows the full form and action without scrolling. Registration keeps account, studies and review steps. Very small windows, enlarged text, keyboard display and error messages can require scrolling; content is never clipped.
- Supabase Auth public settings returned HTTP 200: email enabled, signup enabled, auto-confirm disabled.
- Nine existing profile/curriculum tests passed. Transactional database checks passed for own-profile reads, cross-user rejection, anonymous rejection, unconfirmed-account rejection, grade/stream constraints and role/grade immutability. No users or profile rows remained after tests. Supabase security advisor returned no findings.
- Password HTTP testing timed out from this environment; successful signup/login, recovery and actual email delivery remain unverified until SMTP/templates are configured and an inbox test is completed.
- Landing source, global marketing styles and crystal scene are preserved. Learning activity data is still demonstration content, isolated per account in browser-tab storage.
