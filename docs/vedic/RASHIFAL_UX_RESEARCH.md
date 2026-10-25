# Rashifal UX research and design decisions

25 October 2026. Scope: mobile-first Rashifal; Kundli calculation and other
Vedic workflows remain independently owned. This is a public-source competitive
review, not an installed-app usability study or a market-size estimate.

## Evidence

| Product | Observed positioning and strengths | Implication for our experience |
| --- | --- | --- |
| [Astrotalk](https://play.google.com/store/apps/details?id=com.astrotalk) | Listing combines horoscopes, Kundli and paid chat/call consultations. Public reviews include both praise for convenience and concerns about per-minute cost. | Keep the daily task direct; avoid introducing consultation, wallet or purchasing distractions into reading. Reviews are individual reports, not representative defect rates. |
| [AstroSage](https://play.google.com/store/apps/details?id=com.ojassoft.astrosage) | Extensive Vedic tools, Moon-sign periods, Indian languages, chart exports and cloud storage. Listing also includes ads and purchases. | Retain depth and languages, but progressively disclose technical provenance so basic reading remains approachable. Do not copy its broad feature inventory into our daily screen. |
| [CHANI tour](https://chaninicholas.zendesk.com/hc/en-us/articles/8711720295187-A-Tour-of-the-CHANI-App) and [product](https://www.chani.com/app) | Distinct Today/Week entry points, reflection practices, readable editorial content. Uses Western rising-sign content. | Adopt a clear daily/weekly hierarchy and thoughtful reading rhythm; explicitly retain our Vedic Moon-sign convention. |
| [Co–Star FAQ](https://www.costarastrology.com/faq/) and [privacy](https://www.costarastrology.com/privacy) | Birth-based personalised/social experience, account onboarding and chart explanation. | Our simpler known-sign task can remain account-free; explain what it uses without implying full birth-chart personalisation. |

No competitor artwork, copy, scores or proprietary interpretation is reused.
Product descriptions are provider claims; this review does not validate astrology.

## Problems found in our first redesign

1. At 390px the shared preview warning/header occupies substantial height before
   the task starts. Keep a visible preview indicator; move complete explanation
   into an accessible disclosure.
2. Twelve sign cards stay above the reading after every selection. Collapse the
   visual picker after selection and offer a clear way to change it; keep native
   selection accessible and avoid silently remembering a sign.
3. A newcomer may know a Sun sign but not their Chandra Rashi. Explain the
   distinction and link to the existing private-on-device Kundli tool. Never
   silently substitute a western sign or guess from their name.
4. Raw UTC retrieval, catalogue metadata and calculation identifiers interrupt
   the reading. Keep human-readable IST period context prominent; retain exact
   dates and metadata inside the existing explanation disclosure.
5. Readers need to find Career, Money or Relationships without scanning every
   paragraph. Add compact topic links with keyboard-accessible destinations.

## Design and scope

Use a quieter app bar, a more expressive celestial hero, native vector-like CSS
Moon artwork, clear hierarchy, touch-sized controls and token-based materials.
Keep English/Hindi/Gujarati, light/dark/system, reduced-motion behavior, no
third-party requests, existing five sections and deterministic prompt IDs.
No new predictive scores, lucky remedies, AI chat, notifications, journals,
birth storage, external APIs, accounts, schema or business-state persistence.

## Acceptance

- A selected/remembered sign presents the reading without the full visual picker.
- Change-sign disclosure and native select remain usable; clear resets selection
  and saved preference; no storage opt-in is inferred.
- Topic links navigate to correct headings without removing any section.
- Exact dates, pending review status and provenance remain inspectable.
- Layout stays within 320/390/768/1440px in all supported themes and languages.
- Production privacy headers and request isolation remain intact.

Success metrics for a later consented usability study: time to first reading,
correct Moon-sign understanding, topic-find success and change-sign completion.
No analytics instrumentation or superiority claim is implied by implementation.
