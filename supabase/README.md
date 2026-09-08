# Account integration — pending project selection

The public site does not yet offer accounts. No Supabase project has been selected or modified, and schema.sql has not been applied or tested against a database.

Intended flow: sign in or create an account by email, pin/unpin jobs, and see a private My Profile / Pinned Jobs view. Supabase Auth owns the account; goodcompany_saved_jobs stores only that account's saved listings. Database row-level security must enforce ownership, independent of browser filtering. Keep job title, company and source link so saved roles remain identifiable after a directory refresh.

Before enabling:

1. Confirm the Supabase project/organization and any project costs with the owner.
2. Apply the prepared schema as a migration, then verify anonymous denial, user A/user B isolation, duplicate-pin prevention and unpinning. Run Supabase security advisors.
3. Configure the production Auth Site URL and allowed redirects for https://good-company-jess.vercel.app/. Configure a production email sender: Supabase's default email service is restricted and is not sufficient for general public signups.
4. Implement the account dialog, email sign-in/confirmation, session restoration, sign-out, pin controls, and profile view using the pinned Supabase SDK version. Use only a publishable browser key; never a service-role key.
5. Verify the full flow with authorized test accounts, including reload persistence, expired sessions, failed saves, cross-account isolation, and pin clicks that do not open job details. Publish all implementation changes to GitHub before production deployment.

Documentation: [Passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless), [Row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
