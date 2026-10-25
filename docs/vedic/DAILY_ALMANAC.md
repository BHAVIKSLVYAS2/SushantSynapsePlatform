# Ritvayam daily local timings

The displayed English brand is Ritvayam. Routes, IDs, birth-profile storage and
Hindi/Gujarati brand-script spellings are unchanged.

The reusable on-device panel appears in the home feature and on Rashifal. It
shows sunrise, sunset, moonrise and moonset for the displayed IST civil date
(midnight to midnight). An absent Moon event is explicitly shown, not replaced
by the next day's event. This differs from a sunrise-day Panchang, which may
list a next-day moonset. New Delhi is a labelled reference until the user chooses
an Indian city. Only that explicit city ID is stored locally; no location request,
server submission or saved birth-record inference is involved.

Calculations use the repository's Astronomy Engine 2.1.19, upper limb, standard
atmosphere, unobstructed horizontal horizon, sea-level observer, and existing
civil/TT conversion. Event roots are inverted through civilInstantFromTT;
AstroTime.date is not used as UTC. Terrain, weather and actual elevation can
change observed times. Output is an approximate preview, not certified Panchang.
The earlier sunrise/reference acceptance limitations remain.

Choghadiya follows the weekday day/night sequences published by
[Drik Panchang](https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html?lang=en):
eight equal intervals from sunrise to sunset and eight from sunset to the next
sunrise. Before sunrise, the active night belongs to the previous weekday and is
labelled previous night. Event facts still refer to the current civil date.
Intervals are half-open; exact sunset belongs to night and exact sunrise to day.
Displayed minutes are approximate; selection uses unrounded event milliseconds.
Vaar Vela, Kaal Vela, Kaal Ratri and Rahu Kaal overlays are not implemented and the
expanded schedule states that limitation. No auspiciousness guarantee is made.

The panel retains an always-visible current-period summary and an expandable
16-row schedule. Current rows carry aria-current="time", a border and a text
badge. One-second checks update only when a boundary/date changes; daily astronomy
is cached per mounted panel and city/date. Midnight, visibility/pageshow, language
changes, city changes and cross-tab storage changes refresh the display. Shared
header settings remain the only language/theme controls. No additional dependency.

Sources reviewed on 25 October 2026:

- [Astronomy Engine SearchRiseSet](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md#SearchRiseSet)
- [Drik Panchang sequences and method](https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html?lang=en)
- [Delhi published daily reference](https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=989920)

The last source displays Delhi sunrise 06:28 and sunset 17:42 IST on this date;
our roots agree within two minutes. Its Moonrise is 17:00 versus the engine's
16:56; that difference is recorded, not described as verified publisher agreement.
Its next-day Moonset is a different reporting window from our civil-day Moonset.
These comparisons are limited spot checks, not independent certification.

Verification: tests/vedic-daily-almanac.test.js checks all weekday starts,
equal/gapless divisions, exact boundaries, locality differences, lunar no-event
dates, input rejection and existing sunrise parity. Dedicated browser tests check
boundary highlighting, civil midnight/pre-sunrise handling, saved city reuse on
Rashifal, language changes, mobile themes and absence of page errors. The
functionality ledger records final local/export/live results.
