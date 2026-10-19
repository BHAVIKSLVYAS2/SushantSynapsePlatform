# Feedback & ideas

Public `/feedback` board for feature requests, bug reports and improvements.
Visitors search, filter/sort, suggest requests, add comments, vote/unvote, share
request links and report requests without signing in. Requests and comments are
public and labelled Community member; no account names or email addresses appear.

An HttpOnly/SameSite=Strict random browser cookie lasts one year. HTTPS uses a
Secure `__Host-` cookie. Only its SHA-256 identity is stored with votes/contributions;
raw cookies, IP addresses and account details are not board records. Votes are
one per browser identity, not verified people. Clearing cookies, changing browser
or reinstalling the Android app can create another identity. Website/host technical
logs are separate. Drafts stay in page memory; no local-storage business records.

Default Node uses the existing SQLite `settings` table; Workers uses the existing
D1 settings table. Version/transaction guards reject conflicting saves. No new
database, schema migration, public account registration or Chambers access.
The board is bounded at 200 requests, 30 comments/request, 5,000 votes/request,
1,000 reports/request and 900 KB total serialized state. Limits fail explicitly
without deleting older contributions. Node allows 12 writes/IP/minute; cloud uses
the existing public-write limiter (6/minute). Honeypot, request bounds, exact
Origin checks and strict validation apply. Browser identities do not prevent
deliberate multi-browser voting or all spam.

Default Node Owner can change request statuses and hide/show requests/comments.
Organisation mode requires active platform Super Admin, never a chamber Owner
or Master Admin alone. Hidden text is absent from public responses. Reports queue
for administrator review without automatically hiding content. Statuses describe
review/progress, not delivery commitments. No email/notification provider is added.

Run `node --test tests/feedback.test.js` and
`npx.cmd playwright test apps/feedback/tests` with isolated temporary workspaces.
Keep deployment status/evidence in the functionality ledger.
