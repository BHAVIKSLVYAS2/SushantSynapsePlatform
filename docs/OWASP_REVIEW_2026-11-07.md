# OWASP review — 7 November 2026

Historical review snapshot, retained with the 14 November source-cleanup commit.
Its findings/measurements are dated; this commit does not implement or claim
resolution of the separate security/performance recommendations below.

Scope: targeted local source review of production Workers/D1 routing, shared
authentication, organisation boundaries, document handling and Picksy. This is
not an exhaustive penetration test or verification of the current live deployment.
No runtime fixes, deployment, production requests or business-data writes made.
Framework: https://top10.owasp.org/2025/

## Findings requiring attention

1. **Medium: unexpected error details reach clients.** `server/edge-index.mjs:114`
   returns unknown exception messages as HTTP 400; `server/index.js:166` has a
   similar fallback. A local fake database throwing a diagnostic marker caused
   edgeApi to return that exact marker. Existing D1/R2 message filtering covers
   selected strings, not all infrastructure errors. Use typed validation errors,
   generic 500 responses for unknown failures, and redacted server diagnostics.
   OWASP A10 exceptional conditions / A02 misconfiguration.

2. **Medium: password verification endpoint has no dedicated throttle.**
   `packages/auth/edge.mjs:25` limits login, but line 33 verifies current passwords
   on every authenticated password-change request without that limiter. A stolen
   session could repeatedly guess the current password; repeated synchronous
   scrypt also consumes CPU. Add per-account plus IP throttling before hashing,
   a small auth-body limit, and sanitized failure events. Login currently limits
   IP only; account-based protection is a further hardening opportunity.
   OWASP A07 authentication failures. Source-confirmed; no brute-force traffic sent.

3. **Medium, policy-dependent: global editorial authority still uses legacy Owner.**
   Organisation mode permits arena-editorial and arena-metrics through the fallback
   dispatcher. Their services authorize `user.role === 'Owner'`, without checking
   active platform_super_admins or a dedicated publisher grant. Local direct-service
   calls with a synthetic legacy Owner returned 200 for draft-library and aggregate
   reads. Source also permits editorial PUT after the same Owner check. This is
   not a demonstrated tenant escape: organisation app roles are separate from
   global user.role. Decide whether retained global Owners should publish global
   content; otherwise require an explicit platform publisher/Super Admin capability.
   OWASP A01 access control. No live identities tested or content changed.

4. **Operational gap: security monitoring is not demonstrated.** Production config
   sets observability.enabled=false. Business audit entries exist, but the reviewed
   login/password rejection paths do not persist security failure events. External
   WAF/logging/alerting may exist and was not inspected. Verify it before deciding
   whether to enable sampled, redacted Worker logs and failed-auth alerts. Never
   log passwords, session tokens, private documents or full request bodies.
   OWASP A09 logging and alerting failures; not a proven absence of all monitoring.

## Controls observed

Secure/HttpOnly/SameSite=Strict production session cookies; random session tokens
stored as hashes; salted scrypt passwords; password changes revoke prior sessions;
origin/host and cross-site checks; streamed body-size limits; parameterized inspected
queries; explicit organisation routing; scoped document ownership before reads;
attachment downloads with octet-stream/nosniff; CSP and common response protections.
Picksy renders options as SVG/text and validates imported lists. No injection was
confirmed there in this targeted review.

## Verification and limitations

- Nine existing organisation-policy/client-access checks passed with isolated data.
- Three launch-readiness checks passed for response protections, legal composition
  and encoded internal-path rejection (12 focused checks total).
- Local synthetic probes reproduced legacy Owner service access and unknown-error
  disclosure without using production or modifying application records.
- Current npm dependency advisory status is **unverified**. The initial audit could
  not reach the registry; escalation was rejected by automatic approval review
  because npm audit exports dependency metadata. No workaround attempted. The
  earlier 6 November zero-advisory result is historical, not a fresh result.
- No exhaustive DOM-XSS/SQL injection/SSRF scan, live authorization test, WAF review,
  secret-history audit or independent security certification was performed.
