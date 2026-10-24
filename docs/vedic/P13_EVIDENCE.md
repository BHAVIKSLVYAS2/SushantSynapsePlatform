# P13 Astro Time Machine and Gochar foundations

Date: 2026-10-24 (Asia/Kolkata). Internal local-preview implementation. Public
release, independent astronomical/source acceptance and P14 stability remain open.
Package/lock 0.13.0, no new dependency. Existing P02–P12 numerical rules unchanged.

## Explicit exploration and feature availability

`packages/vedic/exploration-place.mjs` admits only explicit local date/time,
offline Indian place ID, matching Asia/Kolkata zone, profile, optional language
and finite elevation. It forces exact-minute `purpose=exploration` through P02;
no time is supplied from the date alone. Unsupported dates, invalid/extra fields,
coordinate overrides, time accuracy/purpose overrides and null/undefined explicit
height are rejected. Empty optional height alone is omitted and means assumed
sea level, with a warning. The instant is the start of the selected minute;
this nominal snapshot is not a whole-minute or uncertain-birth stability result.

Future exploration is allowed inside pinned civil/astronomy coverage. P04
geocentric positions and P05 observer/instant Panchang are reused unchanged.
Sunrise-dependent failures are typed independently: positions stay available
when a defining adjacent civil day cannot be resolved. Civil weekday and sunrise
weekday remain distinct. Modelled UT1, pre-1972 civil and future leap assumptions,
approximate coordinates, sunrise and source-acceptance warnings survive.

## Gochar definition and birth comparison

`gochar.mjs` is independent of places and birth admission. A reference sign counts
as 1, with successive zodiacal signs counting through 12. It supports explicitly
declared Moon or Lagna reference kinds. Each planet's nominal sidereal sign is
classified from unrounded longitude; within 61 arcseconds of a sign boundary,
its count is withheld as near-model-boundary. This proposed screen is not a
certified model error bound. Manual reference signs are user declarations, not
validated birth signs or a new exploration Lagna calculation.

Endpoint comparison matches bodies by identity and returns shortest signed
angular differences in [-180,180). Oppositions use -180 by definition. This is
not travelled angular distance, velocity, retrograde status or continuous motion.
No aspects, benefic/malefic scores, event prediction, Sade Sati/Dhaiya periods or
continuous ingress timeline is inferred from two positions. Those rules are
outside this foundations increment.

`birth-gochar.mjs` separately validates optional birth fields with forced birth
purpose and explicit current time. It rejects purpose overrides, future births,
approximate/unknown time and private extra fields. Birth Moon references use a
121-arcsecond minute/model sign screen; Lagna references reuse P06's existing
stricter birth-chart admission. A reference withheld by those screens does not
invent a sign. Nominal per-body endpoint comparison can remain available when a
reference is withheld. Source acceptance and P14 stability are not implied by
admitted input. The exploration profile cannot weaken birth admission.

App-owned `exploration-report.mjs` always preserves an independently available
exploration snapshot when optional birth comparison fails. It exposes a safe
diagnostic, without birth details in errors/logs. References are opt-in: no
comparison by default, manual Moon/Lagna signs, or the current validated private
birth input. No cached/shared birth report, request body or persistent profile.

## Local interface and privacy

`time-machine-view.mjs` provides blank required date/time/place inputs, optional
height, source/precision notices, an explicit local/UTC/place review and a second
calculation action. Current IST time is filled only by an explicit button. Previous/
next-day controls retain time/place while invalidating review/results; they do
not silently calculate. Editing search clears the chosen city ID. Changing any
input clears stale output and cancels queued work. Language changes rerender
numeric results unchanged in the standalone component. P09's outer birth-language
rebuild clears the nested exploration, preserving its existing privacy lifecycle.

Available positions, next-limb Panchang changes, civil/sunrise Vara, relative
counts and birth endpoint tables use visible numeric values with focusable scoped
horizontal scroll. Rounding to four decimals does not affect sign assignments.
Manual reference source and endpoint limitations are visible. en/hi/gu controls
and labels share numeric data; original source/place/technical labels are retained
with disclosure. Independent language review remains pending.

The component runs both in a standalone loopback preview (default 4180) and below
P09 birth results for optional comparison. It does not create a second HTML form
inside the birth flow. Clear, outer birth edits, pagehide/history restoration and
destroy remove input/review/results and cancel work. Only shared theme preferences
persist; no exploration/birth storage, URLs, network calls, analytics or location
permission. Names are never requested or passed to the new modules.

P10's private report remains the final results child, so print CSS excludes the
Time Machine and its exploration/comparison fields. The P10 download whitelist
is unchanged; Time Machine/birth comparison is not silently added to exported
reports. Existing P07–P12 previews/features remain separate. The shared dev
harness serves fixed local assets with no-store/CSP connect-src none; no public
static mapping, app card, server API, SQLite/auth/schema, Ritual Assist or
production/live-data change is added.

## Numerical evidence and verification

Saved `P13_REFERENCE_RESULTS.json` checks all 144 reference/sign combinations
against an independently rotated zodiac, six hand-specified wrap/opposition
fixtures, three synthetic place/date snapshots (including an unavailable
sunrise edge) and two private birth references. Snapshot astronomy/Panchang
equal existing P04/P05 outputs at the resolved instant. This is integration and
definition evidence, not new independent astronomical goldens; earlier physical
reference gates remain open.

Six new Node checks pass: explicit/future admission, direct P04/P05 composition
and partial observer coverage, all counts/near-boundary withholding, endpoint
angles/body matching, private birth admission and optional-failure/locale parity.
Actual local workerd core check passes three historical/current/future snapshots,
840 numeric comparisons, maximum difference 2.546585164964199e-11. The 81,987-byte
minified core bundle excludes places. It checks core geometry/snapshot/Panchang/
comparison, not a production HTTP adapter or production CPU budget.

All eighteen focused Chrome checks pass (three new P13 plus fifteen P07–P12),
including explicit review, future exploration, optional reference, unknown birth
withholding, 320/390/1440 light/dark/system overflow, en/hi/gu numeric parity,
ambiguous places, stale edits, print isolation, no requests/storage/URLs, clear
during calculation and history privacy. Gujarati review/results screenshots
visually inspected.

Full isolated repository suite **491/491 passed**, zero failures, 192.655s
(`.publish/vedic-p13-full-tests.log`), including six new Node checks and one
workerd check. Test build hooks ran with permission for generated assets; no
production/live-data test or deployment occurred. Focused logs:
`.publish/vedic-p13-focused.log` (6/6), `vedic-p13-worker.log` (1/1), and
`vedic-p13-browser.log` (18/18, 1.7m). After final mean-node disclosure/Gochar model
provenance copy, all three P13 Chrome checks passed again in 22.5s
(`.publish/vedic-p13-browser-final.log`). No numerical changes followed the full
suite. Final screenshots: `.publish/vedic-p13-review-390-gu.png` and
`vedic-p13-results-390-gu.png`.

Saved numerical report regeneration and offline `--check`, package/lock version
agreement, absence from public static mappings and whitespace checks passed.
No commands/preview servers remain running; changes remain local/uncommitted.

Offline reproduction:

```powershell
node infrastructure/verify-vedic-gochar.cjs --check
node --test tests/vedic-exploration.test.js tests/vedic-gochar-worker.test.js
npx.cmd playwright test apps/rashifal-kundli/tests
node infrastructure/preview-vedic-time-machine.cjs
```

## Next: P14 birth-time sensitivity

Read master sensitivity/BI/KU requirements, P01 interval contracts and P06/P07/P08
boundary-screen limits. Implement explicit approximate/unknown interval analysis
with complete crossing searches, not endpoint-only or sparse-sample stability
inference. Preserve feature-specific unavailable states for Lagna, Moon sectors,
D9 and Dasha. Do not promote P13 hypothetical minute snapshots or conservative
screens into certified birth stability. Keep all existing privacy, source gates,
public-availability and Ritual Assist boundaries.
