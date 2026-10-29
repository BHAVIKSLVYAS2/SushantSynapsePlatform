# Pandit Booking implementation progress

Updated 2026-10-29 (Asia/Kolkata). First managed pilot implemented and locally
verified. Not deployed; no production migrations or business-data changes.

| Workstream | State | Evidence / remaining work |
| --- | --- | --- |
| Platform ownership and route | Implemented and locally verified | App-owned code, package manifest, shared shell/themes, Node and Workers routes, catalogue and account navigation |
| SQL persistence | Implemented and locally verified | Additive workspace table, bounded pilot aggregate, versioned atomic saves; SQLite and offline D1 restore drills |
| Organisation access and licensing | Implemented and locally verified | Explicit customer/staff assignments, separate client seats, live licence/membership checks; no Super Admin business bypass |
| Puja details and Pandit service areas | Implemented and locally verified | Services, preparation, samagri, terms, city/areas/radius, approval and explicit availability windows |
| Booking and preparation | Implemented and locally verified | Request, confirm, cancel/decline, reschedule agreement, checklist, completion/no-show |
| Communication and concerns | Implemented and locally verified | In-app messages, reports/resolution, moderated completed-booking reviews; on-open/refresh reminders within 24 hours |
| Security and concurrency tests | Passed local checks | Cross-user/org, role revocation, client seat boundaries, privacy, atomic conflicts, malformed input and stale-response DOM clearing |
| Browser journeys and responsive themes | Passed 3 Chrome workflows | Isolated Node/SQLite fixture; operator/Pandit/customer journey, stale-response/expiry, visitor discovery; 320/390/768/1440px light/dark plus system theme |
| External delivery and scheduled reminders | Not connected | Computed in-app reminders only; background scheduler and provider transport pending |
| Public onboarding and identity | Restricted pilot | Manual invitation/contact checks; MFA/provider verification and recovery review pending |
| Additional planned features | Pending | Photo uploads, weekly recurring availability, replacement agreement, exports, retention jobs, complete Hindi/Gujarati |
| Production cutover | Not performed | Production dry-run build passes; migration 0009 prepared. Live pre/post recovery and restricted operational/security review still required |

See `apps/pandit-booking/README.md` for actual role mapping and pilot capacity.
The original full scope remains in `docs/PANDIT_BOOKING_PLAN.md`; this progress
file records implemented increments without declaring unfinished work complete.

Verification evidence under ignored `.publish/`:

- `pandit-api-final.log`: 14/14 app and cutover/recovery checks, including real
  workerd/D1, concurrent confirmations, assignment revocation, customer seat
  limits, forged staff role denial and new/pre-0009 offline recovery.
- `pandit-security-final.log`: 12/12 final app checks pass, including an additional
  slow-body Node revocation regression. The fixture streams byte chunks like an
  HTTP request; revoking access before body completion leaves persisted data intact.
- `pandit-browser-final.log`: 3/3 real Chrome workflows; mobile screenshot
  `pandit-booking-mobile.png` visually reviewed. No page errors.
- `pandit-full-tests.log`: initial full suite 558/576. One generated catalogue
  mismatch and two schema expectations were corrected; 15 existing build-hook
  failures came from a Windows generated-file write restriction.
  `pandit-regression-rerun.log`: all 23 affected catalogue/Cloudflare/schema
  checks pass after rebuild and a permission-enabled rerun. No unresolved
  failures from that full run remain.
- `pandit-production-build.log`: existing production configuration dry-run
  builds the Worker and 1,179 allowlisted frontend assets; no deployment.

Run `npm.cmd run test:pandit` and
`npx.cmd playwright test apps/pandit-booking/tests/browser.spec.js` for app checks.
All fixtures use disposable temporary SQLite or isolated D1, never runtime data.
