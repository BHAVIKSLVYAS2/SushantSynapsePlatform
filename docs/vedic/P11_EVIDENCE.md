# P11 birth Panchang, yearly Tithi candidates and naming

Date: 2026-10-24 (Asia/Kolkata). Implemented for the internal loopback preview;
public release remains gated. Package/lock version 0.11.0; no new dependency,
production data, public route/card, database/auth or Ritual Assist changes.

## Numerical ownership and admission

`packages/vedic/birth-panchang.mjs` normalizes birth input and composes existing
P05 place/instant Panchang. It requires exact minute input, rejects a transition
within that minute, existing near-model-boundary limbs and proximity to defining
sunrise. It shows civil Vara separately from sunrise Vara and the four instant
limbs/next transitions. Approximate/unknown input stays unavailable; no noon.
Screening is conservative candidate admission, not a P14 stability certificate.

`lunar-calendar.mjs` uses the same P05 apparent geocentric Sun/Moon phase, not a
separately mixed Moon-phase adapter. One-day knots check positive phase advance
below 24 degrees/day, unwrap selected phase crossings and bisect to <=0.5s TT
brackets. Searches cap at 400 days, 15 events and 1,400 evaluations. UTC is
derived through the pinned TT/civil inverse. Brackets describe numerical root
convergence, not physical uncertainty.

Amanta months run new-moon to new-moon. Naming follows the next solar sign after
the opening new moon; no sidereal solar ingress means Adhika. Two-ingress/Kshaya
months are typed MODEL_UNAVAILABLE; solar ingress proximity and numerical phase
bracket ambiguities are withheld. Search margins deliberately restrict month
queries to 1950-02-10 through 2098-11-20 UTC. The package's wider civil/planet
coverage does not imply month-search coverage. Birth month display additionally
requires admissible birth Panchang.

`observance-rule.mjs` is a small independent arithmetic policy primitive;
`birth-observance.mjs` separately composes place/birth/calendar primitives.
The caller must explicitly select `AMANTA_FIRST_SUNRISE_SKIP_MISSING_V1` and
`regular-only` or `include-adhika`. Rules select first sunrise when repeated,
select no date for a missing-at-sunrise Tithi, and expose interval and all matched
sunrise days. A sunrise within 300.5s of either root is boundary-uncertain with
no selected day. This screen includes numerical tolerance; it is not a certified
sunrise error bound. Missing/repeated refers to Tithi at local sunrise, distinct
from missing lunar months. Birth Adhika maps to the same named month under the
chosen explicit extra-month policy.

Annual queries support Gregorian 1951..2097, independent of the birth future-date
rule. They scan every target-Tithi interval with margins, retain the matching
Amanta month and evaluate sunrise at the selected Indian observance place
(sea level assumed and warned). Results can contain zero, one or two occurrences
in a Gregorian year. Purnimanta and alternative family/ritual birthday rules are
unavailable. These are named exploration candidates, not a prescribed regional
ritual calendar. No omitted/missing day is silently moved to a neighbouring day.

## Editorial names and application UI

App-owned `naming-data.mjs` holds a separately versioned Roman 27-by-4 naming
sound table, using the HTCS Bridgewater 2026–27 publisher variant. Regional
spellings are retained rather than silently merged into a universal rule.
Near-boundary Moon/minute inputs withhold the suggested sound; free catalogue
browsing remains possible. Naming is described as optional custom without
promises of health, wealth or destiny.

The deliberately small starter catalogue contains two Sanskrit-origin names,
Ravi and Tara, with short dictionary-sourced meanings, project Hindi/Gujarati
scripts and meaning translations. It is not a complete name database. Empty
syllable matches remain empty; no fabricated names or meanings. Search includes
name/meaning, script filters, optional sound filter and name-only copy. Editorial
corrections live outside the astronomical kernel (and require only app rebuilding,
not a kernel/model version change). Independent linguistic review remains open.

`tradition-view.mjs` adds localized en/hi/gu controls, current birth Panchang,
separate yearly year/place/rule/policy controls, status/intervals, source versions
and warnings. Rule choice starts empty. Editing candidate inputs clears stale
results/downloads; changing birth/language, clearing or navigation destroys the
panel and pending work. The initial observance place is visibly the selected
birthplace; searching requires a fresh explicit place choice. No geolocation.

ICS downloads are explicit, local, generic filenames and random UIDs. Only
selected candidate all-day dates and rule/policy are included; name, DOB/time,
place and birth profile are absent. DATE values represent Asia/Kolkata local
days, with exclusive following-day DTEND; description names the time zone.
CRLF/folding is bounded below RFC5545's 75-octet limit. Boundary-uncertain or
missing selections cannot create an event. Calendar dates remain sensitive and
the UI discloses candidate status. Short-lived object URLs are revoked; only
theme preferences persist. P10 report export retains its existing explicit chart/
Dasha whitelist; the new interactive panel is not serialized into that report.

## Sources and reference evidence

- [PAC 2026 phases](https://www.packolkata.gov.in/phasemoon.php): twelve manually
  transcribed original new-moon minute facts, with original IST labels retained
  in `tests/fixtures/vedic-calendar/published.json`. Root maximum residual is
  **35.368 seconds**, within the proposed 180s development screen. This is a
  twelve-event original-source spot check, not full-range ephemeris acceptance.
- [PAC regional calendars](https://packolkata.imd.gov.in/panchang/en/regional-calendars):
  Jyaishtha Adhika Sudi begins 17 May 2026; Nija Sudi begins 15 June. Two samples
  well inside those intervals match the implemented names/Adhika flags. The
  bright-fortnight naming matches Amanta here; this does not implement the
  publisher's complete northern/Purnimanta scheme or prove birthday selection.
- [PAC explanation](https://packolkata.imd.gov.in/panchang/en/explanation) supports
  Tithi/phase definitions and distinguishes lunar month endpoints; direct fetch
  failed, search-readable extract retained as a source pointer only.
- [Measurement of Time (bvmap.org)](https://bvmap.org/images/bvmap/publications/Measurement_of_Time_English.pdf),
  chapters 7–9, supports month/intercalation concepts in the search-readable
  publisher extract; direct PDF fetch returned 404. No full capture/hash claimed.
- [HTCS 2026–27 Panchangam](https://www.venkateswaratemple.org/flyer/2026_27_EnglishPanchangamFinal.pdf),
  PDF page 73 (zero-based 72), factual naming-sound table. Only 108 sound facts
  are selected, with attribution/variant; publisher prose, predictions, remedies
  and fear-based claims are not incorporated. This source's US timing tables are
  not Indian sunrise or observance goldens.
- Monier-Williams 1899 dictionary scans: [ravi, p.869](https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/MWScanpdf/mw0869-ravaNaka.pdf)
  and [tārā near p.443](https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/MWScanpdf/mw0444-tAramAkSika.pdf).
  Short factual word glosses/project transliterations, no bulk scraped name list
  or reproduced dictionary scan. Source attribution is retained per entry.

No raw publisher HTML/PDF archive hash is invented. Saved report records the
local factual fixture and implementation hashes. P05 sunrise residuals of
177–234 seconds remain unresolved; this phase does not retroactively pass that
gate, original IAE/Lagna or P14 acceptance. Month naming near Kshaya/ingresses,
independent birthday rule approval and full language review remain open.

## Verification

Seven focused Node checks pass: twelve PAC phase references, month samples/
coverage, missing/repeated/uncertain arithmetic policy, birth Vara/time admission,
zero/two annual matches, independent selected-sunrise Tithi re-evaluation,
108 naming cells, two meanings/filters and private ICS format. Actual local
workerd parity passes three months/phase roots/policy, 31 numbers, zero numeric
difference; low-level bundle 68,924 bytes excludes place directory. An initial
bundle test exposed place-directory retention; policy was split into its own
primitive and the final parity test passes.

All twelve focused Chrome checks pass (two P11 plus ten P07–P10 regressions),
including name-only clipboard, private ICS, explicit rule, stale/cancel/clear,
unknown-time withholding, script/language changes and 320px dark layout.
Gujarati mobile screenshot visually inspected.

Full isolated repository suite: **477/477 passed**, zero failures, 198.891s,
`.publish/vedic-p11-full-tests.log`, including all eight new Node/Worker checks.
The full suite ran with permission for its generated build hook; no deployment
or live-data test was performed. Focused Chrome 12/12 passed in 1.9m
(`.publish/vedic-p11-browser.log`), worker 1/1 in 3.135s
(`.publish/vedic-p11-worker.log`). Earlier seven focused Node checks are retained
in `.publish/vedic-p11-focused.log`; final full regression covers the refactored
policy primitive. Browser run preceded only that internal policy split; numeric
and UI behavior remained unchanged and final Node/Worker/full checks passed.

`P11_REFERENCE_RESULTS.json` regenerated after the split and offline `--check`
passed. Package/lock metadata, public static allowlist absence and whitespace
checks pass. Final screenshot `.publish/vedic-p11-traditions-320-gu.png` inspected.
No commands/preview servers remain running. All work remains local/uncommitted;
no production deployment/public beta or full source-acceptance claim.

Offline reproduction:

```powershell
node infrastructure/verify-vedic-calendar.cjs --check
node --test tests/vedic-calendar.test.js tests/vedic-calendar-worker.test.js
npx.cmd playwright test apps/rashifal-kundli/tests
node infrastructure/preview-vedic-birth.cjs
```

## Next: P12

Read master Rashifal/content requirements and P04/P11 evidence. Define a sourced,
versioned daily/tomorrow/weekly content convention with publication and timezone
boundaries, provenance and non-deterministic interpretation. Do not label generic
or generated prose as an independently verified prediction. Preserve private
birth-data separation, public app availability gates and Ritual Assist ownership.
