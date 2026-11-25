# Frontend runtime audit, 25 November 2026

Run these commands from the repository root with Chrome installed. The audit
serves the exported Cloudflare frontend on loopback and blocks external HTTP
requests. It uses fresh browser contexts and no application database.

```powershell
npm.cmd run build:ui
node infrastructure/cloudflare/build.cjs --fullstack --organisations
node infrastructure/cloudflare/audit-browser.cjs
```

The JSON report is written to `output/playwright/runtime-audit/report.json`.
The `--home-only` option writes `home.json` for a focused comparison. The
matrix covers 320, 768 and 1440 pixels in Light, Dark and Deep Black. It exercises
the first-visit acknowledgement, theme picker, app switcher and empty-search
state, and Home layout editing, pinning and filtering. The report lists actions
performed for each sample. The three largest public asset directories in the
export were Ritual Assist, Ritvayam and JapSeva, so the audit includes those
alongside Home, Moment Studio, Tournament Lite and BatchFee Lite.

Chrome records matched external stylesheet rule ranges across the matrix.
Candidates name selector lists that never matched an observed range for the
same asset. A match on any selector keeps the entire rule in play. The
candidate list is evidence for review. Authenticated views, result forms,
printing, uncommon media conditions and unvisited interaction states can all
use candidates from this list.

The former Home Ritvayam preview badge (`.home-vedic-preview`) and legacy text
icon (`.vedic-action-icon`) were absent from runtime coverage and their sole
tracked references were in the source and generated CSS. Their Home rules were
removed. The generated Home bundle changed from 185,809 to 184,986 bytes.
Dynamic drag, favourites, almanac and menu rules remain in the source.

## Browser measurements

Chrome 158 completed 72 baseline captures across eight routes and observed 25
external stylesheets. Home matched 1,021 rule ranges covering 69% of its
delivered stylesheet's UTF-16 code units. The two measured Ritvayam routes
matched 452 ranges covering 36% of their shared application stylesheet.
The rebuilt Home export then passed all nine width/theme configurations and
three app-switch navigations. Chrome loaded a 185,132-byte delivered Home
stylesheet after cache-URL rewriting, with both retired selector families absent.

The table uses the 320px Light sample from each route. Timing is in
milliseconds. The interaction column is the longest Event Timing entry
observed during the scripted visits, with a 16 ms reporting threshold. It is
a lab indicator for INP. CLS is the maximum layout-shift session window. The
trace columns are separate summed event durations for `V8.ParseProgram` and
`v8.parseOnBackgroundParsing`. Nested and concurrent V8 trace events can
overlap. The resource columns count decoded network payloads in decimal kB
and exclude inline assets, audio and fonts.

| Route | LCP | CLS | Interaction | Parse program | Background parse | Page load | JS kB | Image kB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 2660 | 1.000 | 1160 | 220 | 689 | 2788 | 1132 | 204 |
| Ritual Assist | 576 | 0.944 | 192 | 40 | 69 | 737 | 469 | 399 |
| Ritvayam Kundli | 1016 | 0.004 | 264 | 27 | 211 | 951 | 1603 | 202 |
| Ritvayam Rashifal | 1920 | 0.004 | 408 | 36 | 239 | 1909 | 1634 | 416 |
| JapSeva | 1608 | 0.390 | 192 | 26 | 111 | 1600 | 1556 | 54 |
| Moment Studio | 1904 | 0.173 | 288 | 26 | 41 | 1661 | 381 | 202 |
| Tournament Lite | 600 | 0.038 | 144 | 27 | 33 | 688 | 395 | 51 |
| BatchFee Lite | 704 | 0.232 | 192 | 27 | 58 | 988 | 402 | 51 |

From Home's app switcher, click-to-load took 510 ms to Ritual Assist at 320px,
697 ms to Kundli at 768px, and 1,657 ms to JapSeva at 1440px. Each is one
lab observation. These runs use an unthrottled local export and include the
first-visit acknowledgement where applicable. Production CDN timing,
authenticated pages, real-device samples and field Core Web Vitals remain
outside the capture.

Home's largest JS requests were its calendar module (710 kB) and the shared
language runtime (288 kB). Kundli and Rashifal loaded a 727 kB shared chart
chunk. JapSeva requested 573 kB of chapter meanings. The largest measured
image totals were Rashifal (416 kB) and Ritual Assist (399 kB).

## Generated delivery assets

Two forced organisation-mode frontend builds produced identical SHA-256
digests for 720 exported and generated files. Rebuilding from the current
source produced no unexpected changes to the tracked engine, language,
navigation, Tailwind or Home outputs before the CSS change. The Vedic build
removed 84 orphaned chunks from its staging directory, leaving seven current
chunks. Those old chunks were outside the export allowlist. A cached build
now also checks that every manifest chunk is present. Deleting one generated
manifest chunk and running the cached build recreated it byte-for-byte.

There were 94 groups of byte-identical JavaScript files in the export. Most
were canonical paths paired with immutable cache paths. The shared theme and
Nishi handoff also had byte-identical aliases. The theme alias supports the
older public asset path. Nishi handoff is imported by portal, JapSeva, Ritual
Assist and the Vedic source build. The audit preserves those URL contracts.

## Organisation and recovery dependencies

The common authorisation policy, app-role vocabulary and schema already live
in shared packages. Both administration adapters now use one implementation
of required text, seat limit and canonical UTC timestamp validation. Their
repository entry points still export the same public error type. Native SQLite
uses synchronous immediate transactions. D1 stages async operations and
commits a revision-guarded batch. The guarded Node assignment service serves
Chambers, while D1 uses the active app-role catalogue.

The retired Tournament and BatchFee route handlers are absent from live
composition. Compatibility tests and the SQL Server integration still import
their early Node adapters. Immutable migrations and the offline D1 recovery
export reference their historical ownership and event tables. The legacy
mapping tools and BatchFee's compatible JSON import also depend on historical
contracts. Those dependencies justify retaining the recovery and compatibility
code. The [historical workspace notes](RETIRED_SERVER_WORKSPACE_NOTES.md) retain
the retired licensing, staff and guarded preview descriptions.

## Verification

The focused CSS, organisation, recovery and Tournament suites passed 53 checks.
Home computed-style parity and delivery passed in Chrome after the comparison
fixture included the existing location-control stylesheet in cascade order.
The older no-op search test reported 1,045 mutation records for five repeated
input events with both the original and the pruned stylesheet. The almanac
recorded zero mutations in that test.
