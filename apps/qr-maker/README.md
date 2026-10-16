# qr-maker

Creates static link/text QR PNGs using the existing MIT-licensed vendored QR encoder exposed at `/support-qr.mjs`. Four-module quiet zone, integer module sizing, 1,200 UTF-8 byte input limit, HTTP(S)-only link mode. Plain text is encoded literally and never executed. No API, history, account, tracking redirect or persistence. Browser coverage: `apps/qr-maker/tests/browser.spec.js`.

App-owned frontend, public registry entry and static allowlist. Shared presentation and download/copy helpers are in packages/ui/local-tools.*. No backend, database schema or provider setup is required. Deployed and live-verified on 2026-10-16; release details are in docs/FUNCTIONALITY_LEDGER.md.
