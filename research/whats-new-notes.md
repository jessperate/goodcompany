# What's new

Returning authenticated members see releases published after account creation and after their last acknowledged version. Existing members without a receipt see the September 13 career-tools release once. New members start with onboarding, not historical announcements.

Add each future user-facing launch to `releases.js` with an increasing integer version, actual UTC ship timestamp, date label, and concise feature descriptions/links. Retain past releases; unpublished future timestamps are excluded. A deployment alone does not create an announcement.

`account.js` emits `goodcompany-session-ready` after onboarding/invite/job redirects and pending-pin handling. `whats-new.js` waits for that event and a free modal slot on the directory or profile page. Escape, outside click, Close, Got it, and feature links acknowledge the displayed version. Footer “What's new” reopens the feed. Sign-out cancels pending UI. The modal uses native focus containment and the existing typefaces and retro window styling.

`supabase/updates.sql` stores private account receipts with owner-only RLS. An invoker RPC uses `greatest` so stale tabs cannot move receipt versions backward. Local account-specific receipts suppress repeats during failed writes and reconcile on the next visit. Failed initial reads do not interrupt browsing. No profile completion is needed for receipts.

Checks: `node --test tests/updates.test.cjs tests/career-session.test.cjs`; execute `tests/updates-access.sql` (rolled-back fixtures). Browser verification covers initial display, job-modal deferral, dismissal/reload, footer replay, and mobile layout.
