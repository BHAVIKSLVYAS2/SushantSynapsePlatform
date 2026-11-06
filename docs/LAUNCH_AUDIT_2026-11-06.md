# Platform launch audit — 6 November 2026

## Follow-up: compact offline place data

The browser directory now uses a generated lossless column/dictionary format.
Every field of all 3,786 records and all metadata reconstruct exactly; Node's
canonical data and synchronous lookup API remain intact. No city is omitted,
rounded or fetched from another provider. Browser-only mapping avoids changing
the Node backend. Saved IDs and offline/privacy behaviour are preserved.

The directory bundle drops from 1,246,676 to 573,242 bytes. Four-screen unique JS
drops from 1,892,633 to 1,219,214 bytes (35.6% decoded), while aggregate gzip drops
from 475,401 to 443,644 bytes (6.7%). Most benefit is reduced JavaScript parsing
and decoded payload; this is not a 35.6% compressed-network saving. The recorded
three-sample uncompressed Matching LCP falls from 11.540s to 8.072s under the
existing lab throttle. These measurements have machine/network variability.

Fourteen focused directory/privacy/Ritual/static checks, 22 edge/export checks,
21 normalization/birth/directory checks, eight astrology browser workflows and
three Ritual location workflows pass. The isolated actual Worker parity check
passes with zero difference across 329 numbers. An initial combined check had a
consumed-response-body error; the isolated rerun passes without code changes.
Deployment and compressed-production evidence are recorded in the ledger.

Scope: the repository and existing organisation-enabled Workers/D1 release.
Checks use disposable local databases. Production verification is read-only;
no migrations, account changes, recovery exports or business writes are needed.
This is an engineering launch audit, not an independent penetration test or a
guarantee that no vulnerabilities exist.

## Findings and changes

- npm reported six vulnerable dependency packages across production and tooling.
  Compatible lockfile updates fix them without changing direct dependency ranges.
  The final full npm audit reports zero known vulnerabilities. The production
  MSAL advisory concerns the optional Node SQL/Azure dependency chain, not the
  D1 password sign-in implementation. Reference:
  https://github.com/advisories/GHSA-xcx6-jx8p-x3h5
- Edge response protections were inconsistent across pages, API errors and asset
  branches. One response helper now applies nosniff, framing protection, a
  one-year HTTPS HSTS policy and a restricted Permissions Policy. APIs and errors
  are no-store; immutable successful assets, page CSP, cookies and stricter
  astrology privacy headers remain intact. Geolocation remains available to the
  same origin for explicit location detection.
- Encoded internal build paths are rejected before asset routing, including
  `_pages`, `_edge` and `_organisations`. Regression tests check encoded paths
  without touching storage.
- The four astrology screens repeated their common data/engine/UI dependencies.
  Standard ESM code splitting and an explicit generated chunk allowlist reduce
  their aggregate unique JavaScript from 6,209,476 to 1,892,633 bytes, a 69.5%
  reduction across those screens. Shared chunks use the existing transitive
  fingerprint/cache pipeline, with preload hints to avoid import discovery
  waterfalls. Worker source minification is enabled in the production config.
- Shared legal composition injected its stylesheet twice when adding language
  support. It now composes one stylesheet and one language runtime. Existing
  CSS cascade ordering is preserved; selectors used only by other responsive,
  theme, modal or print states were not deleted based on one coverage sample.
- Astrology initially placed its footer near the top, then pushed it below a
  large form. A reserved first-screen region and a visible loading status keep
  the layout stable. News now places reading controls in their final position,
  avoids flashing obsolete empty content, and shows a nonblocking loading status
  outside the document flow. Its retry action remains interactive.
- Navigation feedback waits until click dispatch finishes, so later handlers
  can cancel it. It is skipped/cleared offline, clears on return/input, has a
  bounded lifetime and respects reduced motion. It never delays native navigation.
- Reviewed pending canonical/footer metadata corrections are included. Local
  browser recordings and CLI artifacts are excluded from version control.

## Measurements and checks

Cold local Chrome lab: 390×844, 4× CPU slowdown, 100ms latency, 200KB/s download,
three samples per route, ads intercepted. These are local uncompressed asset
measurements, not production field Core Web Vitals. The recorded layout-shift
value is an unexpected-shift sum, not the official maximum session window.

| Route | Before median layout shift | After median layout shift |
| --- | ---: | ---: |
| Matching | 0.453 | 0.018 |
| News | 0.325 | 0.020 |

Matching's cold local LCP remains approximately 11.5 seconds under this
uncompressed throttle; shared directory/engine data is still substantial.
The split primarily improves repeated downloads across screens; it is not a
claim that the cold calculation screen now meets field LCP targets. News median
LCP is about 2.26 seconds in the final local sample. Live compressed delivery and
future field monitoring must be assessed separately.

Evidence: `.publish/frontend-performance/launch-before.json`,
`launch-after.json`, `launch-news-final.json`; `.publish/launch-audit-clean.json`.
Source scan checked 1,863 tracked files for private-key/AWS/GitHub token patterns
and found no matches. This is not an exhaustive secret scanner.

Focused checks pass: 20 security/static/generated-content checks; 23 edge,
public-export and bundle-budget checks; 17 Ritual calculation/validation checks;
four theme workflows; two News workflows; cancelled/native/back navigation,
reduced motion and pending/offline News recovery workflows.

The final complete `npm test` run passes **614/614**, zero failures, in 238.4s.
Log: `.publish/launch-test-green.log`. An earlier pass exposed an outdated public
alias assertion; the corrected test accepts only exact existing public aliases,
not arbitrary files under the shared calculation package.

The historical P17 Ritual fixture is retained. A separate launch fixture was
captured from already deployed source `507e0f7`, because festival/policy metadata
had changed since P17. Complete current outputs match that deployed baseline;
the original astronomical primitives and annual/Pitru dates still match P17.
No astronomical algorithm or calendar policy changes are part of this release.

## Boundaries and follow-up

The public advertising CSP follows Google's documented nonce integration and
retains its compatibility allowances; private and local-only screens keep their
stricter policies. Third-party advertising performance and provider outages are
not simulated as healthy integrations. Reference:
https://support.google.com/adsense/answer/16283098

## Production verification

Committed source `bcccf29` is live as Worker
`8bd34e7f-fa7f-428a-b7fb-ba6e8ef0a311`. The production dry run and deployment
pass with 1,242 public assets and Worker payload 4,314.92 KiB / 810.35 KiB gzip.
Five organisation checks pass against the exact compiled minified Worker using
disposable D1. Twenty live routes return 200, with no mobile overflow or page
exceptions; expected private API and internal-build-path rejections remain.
Four live asset hashes match the committed build. No production business writes
or database migrations were performed.

Single-sample compressed production diagnostics, using the same mobile throttle
and Light theme, show News LCP 3.216s → 1.692s and Matching 4.552s → 3.880s;
unexpected layout-shift sums fall to 0.020 and 0.018. These are individual
diagnostic samples, not repeatable medians or field-vitals certification. The
final sample uses a fresh context to avoid duplicate observer registration.
Matching's substantial first-load directory is still a performance follow-up.

Full-suite and production evidence is also recorded in the functionality ledger.
No claim of independent certification, perfect security or verified external
payments/court/message integrations is made.
