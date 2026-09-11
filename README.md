# Current account update

Real Supabase authentication and protected student profiles are now connected. SMTP sender and OTP email templates still require owner configuration before enrollment works end to end. See [Authentication setup](docs/AUTHENTICATION.md). Learning activities remain demonstration content with local progress. The earlier phase notes below are historical.

# TIPIX — Frontend and student workspace

A cinematic, responsive educational frontend built with React, Vite, TypeScript, Tailwind CSS, React Router, React Three Fiber, Three.js, and GSAP ScrollTrigger.

## Run

Use Node.js 22 or later.

```sh
npm ci
npm run dev
```

The development server uses port 4173. For production:

```sh
npm run build
npm run preview
```

Deploy `dist/` to a static host with SPA fallback to `index.html` for direct route loading.

## Included

- Scroll-linked instanced crystals with depth and pointer response. No background video or central rotating object.
- Landing page, course explorer, school overview, login, registration, and password recovery frontend.
- Class filters, subject previews, horizontally scrolling chapter examples, and interactive practice demonstration.
- Frontend form validation with explicit pending-backend messaging. No account creation, password storage, authentication requests, or fake success.
- Responsive layouts, focus states, reduced-motion support, a static WebGL fallback, and scene cleanup on route changes.
- An illustrative dashboard. Every displayed statistic is sample data, not an actual learner record.

## Student workspace update

Login/signup now include a three-step student form and a separate preview entry into `/app/dashboard`. The workspace includes grade-specific courses, lessons, practice, exams, submissions, concept progress, rankings, flashcards, projects, local doubt drafts, profile, and settings. Preview progress stays in the browser tab. No real account is created. See `docs/ACCOUNT-PAGES.md` and `docs/STUDENT-WORKSPACE.md`.

Run `npm run test:profile` and `npm run test:workspace` for the grade and data-contract checks.

## Scope

This is Phase 1 only. There is no connected database, authentication, saved learning progress, real examination system, school administration, AI service, or code execution provider. Do not use this frontend as a production student data system.

No environment variables are required for Phase 1. See `.env.example` and `docs/ARCHITECTURE.md` for the future integration contract. Never put server secrets in a `VITE_` variable.

See `docs/REFERENCE.md` for the observed Mercury reference and visual limitations, and `docs/VERIFICATION.md` for validation results.
