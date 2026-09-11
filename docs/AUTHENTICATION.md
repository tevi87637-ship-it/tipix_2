# TIPIX authentication

## Implemented

Supabase email/password signup and login, numeric email confirmation, resend cooldown and loading locks, recovery-code verification and password reset, persisted sessions, sign-out, guarded student routes, and a private persisted student profile. The application uses Vite: configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY at build time. No SMTP, service-role, or secret credentials belong in frontend code.

Account forms have no marketing headline or footer. The existing charcoal/blue theme now uses a compact glass card. Signup remains three steps so students can carefully choose and review their class and stream. Small windows, large font settings, validation errors or an on-screen keyboard may still need scrolling; content is never clipped to force a viewport fit.

The Supabase project was verified active, with email authentication enabled, signup enabled and automatic email confirmation disabled. No real student accounts existed at inspection. A public Auth settings request succeeded. The invalid-password HTTP request timed out from this environment, so successful/failed password flows remain unverified end to end. Database authorization was tested directly. No email delivery or successful signup has been claimed without an inbox test.

## Email setup still required by the owner

The connector can manage this project's database but does not expose Auth SMTP/template settings. The supplied publishable key does not authorize changing these settings. No SMTP credentials were supplied. Do these steps directly in Supabase; never paste an app password into chat, GitHub or a VITE_ variable.

1. For tipixcompany@gmail.com, enable Google 2-Step Verification and create an app password if the account supports it.
2. In Supabase Authentication → Email → SMTP Settings, set sender email and SMTP username to tipixcompany@gmail.com, sender name TIPIX, host smtp.gmail.com, port 587 (TLS), and the Gmail app password as the SMTP password.
3. In Authentication → Email Templates → Confirm signup, paste supabase/templates/confirmation.html. For Reset password, paste supabase/templates/recovery.html. Both contain {{ .Token }} and no confirmation link. Templates are prepared in this repository, not applied to the hosted Auth configuration.
4. Keep email confirmation enabled. Set a short OTP expiry (for example 600 seconds), six-digit OTPs, a 60-second resend interval, and a server password minimum of at least eight characters to match the client. Configure Auth rate limits and CAPTCHA for public enrollment; the current client handles rate-limit errors and duplicate clicks but is not an anti-abuse service.
5. Set the Auth Site URL to the TIPIX deployment. Test with an inbox you control: signup, code confirmation, password login, recovery code, new password, sign-out, expired code and resend. Do not disable email confirmation to work around delivery errors.

Without those settings, the existing Supabase mailer may reject recipients or send its default link email. The TIPIX application does not silently switch to link verification. Email delivery from the requested Gmail sender is not yet enabled or tested. Gmail account sending limits are not a measured production authentication capacity guarantee.

Sources verified September 10, 2026:
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/reference/javascript/auth-verifyotp
- https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier
- https://support.google.com/accounts/answer/185833
- https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app

## Data and access model

public.tipix_student_profiles stores name, self-reported school/city, grade, stream, a server-default student role and creation time. Auth owns email and password handling. Profiles are inserted only after confirmed email ownership; RLS and a narrowly scoped private verification helper enforce confirmed-account and row ownership checks. Anonymous reads, cross-user inserts, client role assignment and client updates are denied. Grade/stream values are checked by Postgres; the client cannot modify grade after creation. Metadata is only onboarding input, never a teacher/admin role or school-membership claim.

Private learning materials, school membership, teacher authorization, server-scored assessments and durable learning results are separate future backend work. Existing learning activities remain original demonstration content with local tab results, now partitioned by account ID. URL query parameters cannot select a different registered grade. Entering a school name does not grant access to that school's data.

The timestamped migration records the reviewed schema SQL and is registered in the remote migration history. The same migration can be applied to a new project. Transactional authorization tests are in supabase/tests/student_profiles.sql and leave no test users or rows behind.

## Remaining verification

No claim of 70 concurrent authentication requests or 500 active users. Load testing, delivery testing, configured CAPTCHA, production password policies and full browser end-to-end authentication remain release gates. The publishable key is safe for client use only because private tables are protected by grants and RLS; never replace it with an elevated key.
