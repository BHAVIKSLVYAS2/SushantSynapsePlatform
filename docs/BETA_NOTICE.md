# Beta notice and first-visit acknowledgement

The shared footer-adjacent notice reads:

> This platform is in beta. Some content may be AI-assisted, automatically generated or experimental and can contain errors. Verify important information.

An explicit WhatsApp link prepares a general issue/content/licensing draft for
`+91 78741 66009`. It does not send a message, attach files, or insert account
details, record data, the current URL or query parameters. The user chooses what
to include and whether to send it in WhatsApp.

On a first visit, the English/Hindi dialog explains possible failures and
inaccuracies, third-party terms and incomplete reviews, and the need to verify
important information and reuse rights. Its checkbox starts unchecked; the
continue button requires that affirmative action. “Not now — read information”
opens the terms page without acknowledging. Terms, privacy, third-party notices
and contact pages are accessible before acknowledgement. The footer remains
readable without JavaScript; the dialog itself requires JavaScript.

The acknowledgement remembers only notice version `2026-10-19.1` under
`synapse-beta-acknowledgement` in local storage, with session storage as fallback.
If both are blocked, only the current document remembers acceptance and later
navigation asks again. Changing the notice version asks again. Review and forget
controls remain available. This is a browser UI preference, not a security
boundary, account entitlement, server-verified consent audit, cookie manager or
permission for unrelated data processing. Existing app/service behavior retains
its own controls and privacy disclosures.

The text does not waive visitor rights or certify third-party licences. An
acknowledgement cannot perform the operator's licence/permissions review.
Known dependency and source notices remain at `/legal/third-party-notices`.
The [Open Source Initiative FAQ](https://opensource.org/faq) explains the role of
software licences; the [India Code text of the DPDP Act](https://www.indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf)
sets out purpose-specific personal-data consent. This feature makes no claim of
legal clearance or statutory compliance certification.

Ownership: `packages/ui/beta-html.cjs` injects static markup and assets;
`beta-notice.js` owns the dialog and device preference; `beta-notice.css` owns
responsive themed presentation. Node composition, Cloudflare export (including
guarded administration) and generated Arena HTML share the same injection.
Non-HTML responses and APIs are unchanged. Existing browser workflow fixtures
explicitly represent returning visitors; dedicated beta tests start unacknowledged
and exercise the real controls, without a runtime test bypass.

See the functionality ledger for implementation, test and deployment evidence.
