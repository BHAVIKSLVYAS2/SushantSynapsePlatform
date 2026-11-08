# Booking and Chambers review demo

Created 8 November 2026. Fictional data only. App fixes are released separately
from this localhost demo; its accounts do not exist on the production website.

## Access

- Booking sign-in: `http://127.0.0.1:3190/signin?next=pandit-booking`
- Chambers: `http://127.0.0.1:3190/advocate`, using the Operator account.
- Generated usernames/passwords are stored privately in the ignored
  `.publish/pandit-demo-local-access.json`, never this document or published assets.
- Sign out using My account / Sign in before switching roles, or use separate
  browser profiles. The server is bound to this computer's loopback interface.

## Booking walkthrough

The three roles are Operator, Customer and Pandit. Three labelled sample services
and a fictional Ahmedabad provider are available. Published windows are 09:00–18:00
IST on 13, 14 and 15 November 2026.

1. Customer: open My bookings. Samples are Requested (13 November), Confirmed
   (14 November) and Cancelled (15 November). The confirmed sample includes
   preparation and a Pandit message. Search by date to start another request.
2. Operator: open the Requested sample, enter the agreed demo scope and confirm.
   Customer and Pandit can refresh to see the confirmation. This is a fictional
   request, with no service delivery or payment collection.
3. Pandit: only confirmed bookings appear. Review the private dummy venue,
   preparation and conversation. Changes to the public profile require review.
4. Try messages, preparation, cancellation or a reschedule proposal. A reschedule
   needs the other party's agreement and must satisfy availability/conflict rules.
5. Completion/no-show cannot be recorded before the ceremony ends. The app
   explains this instead of fabricating completed history. Business-rule tests
   separately verify completion using isolated test-clock fixtures.

## Chambers walkthrough

Operator access includes one fictional client/matter, one past hearing awaiting
an outcome, a future hearing, two tasks and a sample invoice. The Overview now
surfaces the missing outcome. Record its outcome and next date in one save.
Open the matter and use its section shortcuts to jump to history/documents/fees.
No real records, documents, clients or money are involved.

## Persistence and live provisioning

The demo runs default Node/SQLite against a newly created OS-temporary DATA_DIR.
It is separate from production Workers/D1 and the repository's real data folder.
The data persists across a demo-server restart; do not replace or reset it. The
private `.publish/pandit-demo-local-server.json` records its process and data path.

If the computer/server restarts, run from the repository in PowerShell:

```powershell
$demoInfo = Get-Content .publish/pandit-demo-local-server.json -Raw | ConvertFrom-Json
$env:DATA_DIR = $demoInfo.dataDir
$env:PORT = '3190'
$env:HOST = '127.0.0.1'
$env:DATABASE_PROVIDER = 'sqlite'
$env:ORG_ADMIN_PREVIEW = '0'
node server/index.js
```

To create a live demo, the app-owned `seed-demo.mjs` tool requires existing
Super Admin authentication and uses normal audited governance/booking APIs. It
creates a separate labelled organisation with a 30-day licence, refuses duplicate
demo state and restricts the Pandit/Customer accounts from Chambers. Administrator
authentication is still pending; production was not seeded during this session.
