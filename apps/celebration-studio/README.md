# Celebration Studio

A free public browser tool at `/celebration-studio` for birthday cards, invitations, anniversary greetings, festival wishes, thank-you cards and fun posters. Suggested English/Hindi wording is editable. Applying a suggestion replaces only the headline/message, preserving the recipient, event details, host and photo. Four designs (Confetti, Elegant, Bloom, Bold), six palettes and square 1080 x 1080 or vertical 1080 x 1920 output are included.

Preview and PNG export use the same canvas renderer. Text wraps on word/grapheme boundaries and shrinks within bounded sizes; export is disabled when wording does not fit. Shorten it, remove the photo or choose vertical output. System fonts support browser shaping; actual fonts may vary by device. Card colours are design palettes and do not change with the editor's light/dark theme.

Optional PNG/JPEG/WebP photos are limited to 5 MB and 24 megapixels, resized locally to at most 1600 pixels on the longest side, and cropped centrally. There is no remote image URL or upload endpoint. File loads use version guards and local data URLs compatible with the existing image security policy; invalid images cannot enable a stale export. Removal clears the photo and cancels pending loads.

Download produces a lossless PNG. Share uses native file sharing when supported and explicitly invoked; cancellation keeps the card. Unsupported/rejected sharing falls back to a PNG download for manual attachment. No automatic delivery or WhatsApp integration is claimed. Output includes a small Sushant Synapse attribution.

All text/photo state is transient tab memory. Refresh clears the card. Only shared theme preference is persisted; no API, database, card history, cloud sync, runtime dependency or paid service is introduced. The public Cloudflare routes bypass the laptop origin; opening the hosted page requires internet. No service worker/offline install is added. Deployment status is recorded in docs/FUNCTIONALITY_LEDGER.md.

Checks: `node --test tests/celebration-studio.test.js`; `npx.cmd playwright test apps/celebration-studio/tests`. Browser tests use isolated temporary DATA_DIRs and never touch live records.
