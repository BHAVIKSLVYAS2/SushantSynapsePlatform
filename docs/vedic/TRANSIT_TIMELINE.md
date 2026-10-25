# Calculated Rashifal change times

25 October 2026. Rashifal rule/presentation version `rashifal-gochar-5`.

The reading now includes a “Changes today”, “Changes tomorrow” or “Changes this
week” timeline in IST. These are **nominal model event times**, not predictions of
personal events, guaranteed favourable windows or certified physical timestamps.
The existing eight-observation daily / 56-observation weekly summary remains
sampled. Its counts are not converted into hours, probabilities or durations.

## Calculation and rule boundary

`packages/vedic/transit-crossings.mjs` searches angular boundaries with a maximum
30-minute grid. A central finite difference over ±30 seconds estimates direction;
opposite endpoint directions bracket a station, which is refined and inserted
into the grid. This detects a return crossing even when the original interval's
endpoint signs agree. Each resulting crossing bracket is bisected to at most
0.5 seconds. Longitude differences unwrap through the shortest signed arc, so
forward and reverse crossings through 360°/0° are supported.

The declared checked angular-rate limit is 24 degrees/day; excessive sampled
rates, invalid inputs and evaluation-budget exhaustion fail closed. This is a
bounded numerical search, **not a proof of continuous completeness**: extremely
short reversals/multiple stations entirely between knots are not certified.
Subsecond numerical convergence is not a physical timing error estimate. The
astronomy/source and classification-screening acceptance limits remain open.

`packages/vedic/rashifal-timeline.mjs` evaluates the in-house sidereal model for
all seven physical grahas and mean Rahu/Ketu. It searches three surfaces around
each sign boundary: the boundary itself and both edges of the existing
61-arcsecond classification screen. Thus entering/leaving the uncertainty screen
is calculated as well as the nominal sign ingress. There is no retrograde-strength
or speed interpretation added by labelling a crossing's direction.

For every event, the existing favourable-house/Vedha evaluator is run on the
lower and upper sides of its numerical bracket. The selected Moon sign supplies
its own before/after house counts and affected rule rows. Blocker changes can
affect a different graha from the one crossing; those reasons are retained.
Mercury H11 source disagreements and nodal Vedha still withhold final assessment.
No guessed rule is introduced to fill an unresolved result.

Periods are IST midnight to midnight, end-exclusive. Events whose brackets touch
the end are labelled boundary-uncertain; overlapping duplicates across adjacent
daily searches are removed for a weekly timeline. Stationary contacts that cannot
be resolved into a crossing are retained as withheld contacts. Partial/unavailable
searches are explicit and never rendered as “no changes”. A no-change message is
shown only when the declared search completed without an event.

## Runtime and privacy

Generic daily sky events are reused in a bounded 56-day memory cache and composed
for each selected Rashi. The reading cache still holds at most 120 entries and
now keys the timeline model too. Clear removes all three caches. No database,
external service, account, geolocation or birth detail is needed.

The production app bundles `rashifal-worker.mjs` and performs reading/timeline
calculation off the UI thread. Only sign, period, language, model versions and
the current instant are sent to it. Stale responses cannot overwrite newer
selections or a cleared reading. Where Worker construction is unavailable, the
same private calculation runs locally, including when Worker loading is blocked.
Numerical search failures are still withheld instead of fabricated. The shared header and
`connect-src 'none'` birth-page policy remain unchanged.

## Verification contract

- Synthetic forward/reverse wrap, sign and screen-edge roots have bounded brackets.
- A pair of return crossings inside one original interval is detected using its
  station; a tangency remains withheld and excessive rates fail closed.
- The 25 October 2026 Moon Pisces → Aries ingress agrees within one second with
  the separately implemented Panchang nakshatra transition solver. This is a
  consistency cross-check inside the same astronomy model, not independent
  physical certification.
- All twelve Rashis have their own relative houses and before/after rule results;
  no favourable nodal result bypasses unresolved-rule handling.
- No-change and half-open edge cases, admission failures and unavailable periods
  are tested. Browser checks cover all twelve signs, three periods/languages,
  mobile themes, Worker delivery, failure behavior and private processing.
- The retained 108-case `RASHIFAL_CALCULATION_RESULTS.json` now includes timeline
  status, crossing brackets, houses, affected rules and source hashes.

Source, traditional-rule and independent translation review remain pending.
