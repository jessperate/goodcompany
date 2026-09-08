# Good Company accounts

Project: `eodrqcucaersbpxxessa` (good company).

The `create_goodcompany_saved_jobs` migration has been applied. `schema.sql` documents its schema; do not rerun it on the existing project.

The site uses Supabase JS 2.116.0, vendored under `vendor/`, with a public publishable key. No service-role credentials are included. Email magic links create accounts or sign returning users in. The Auth Site URL is `https://good-company-jess.vercel.app/`.

Pinned jobs are private: authenticated users can read, insert, and delete only rows belonging to their auth user ID. Anonymous access is revoked. Saved title, company, and source URL remain available if the directory later removes a listing. Sign-out clears the in-memory shortlist.

## Remaining launch requirement

Custom SMTP is not configured as of September 8, 2026. Supabase's default mail service is restricted; configure a verified sender and production email provider under Authentication > Emails > SMTP Settings before enabling public onboarding. Keep email confirmation enabled. A real inbox sign-in/return/pin/reload/unpin/sign-out test remains pending email setup.

## Verification

Existing directory/filter tests pass. Transactional database checks tested owner read, rejection of cross-user read/insert, cross-user delete isolation, and anonymous grants, rolling back all test records. The Supabase security advisor returned no lints. Browser preview verified signed-out pin opens the account dialog without opening job details, and reported no console errors.
