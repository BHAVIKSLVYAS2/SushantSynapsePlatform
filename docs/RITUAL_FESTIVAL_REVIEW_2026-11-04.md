# Ritual Assist festival code review

Reviewed 2026-11-04 IST following the user's request to check the implementation,
commit and deploy it.

The runtime does not use a Gregorian date list, year-specific overrides, scraped
festival dates, random selection, runtime AI or an external festival API. Rules
use the selected city's local solar times, astronomical tithi intervals and the
existing Spica-aligned lunar-month convention. UI and ICS share the same event
types and explicit status. The festival checkbox defaults off.

## Findings and corrections

- **Holi:** the previous sunrise-Purnima-plus-one-day rule fitted 2026 but returned
  March 15 in 2025 and March 23 in 2027. This was an inadequate general rule.
  Removed its resolved-date status. Local Pradosh/following-day candidates remain
  visible for regional confirmation, including a candidate after Purnima ends.
  Holika Dahan, Bhadra and eclipse rules are not implemented; no candidate becomes
  an image-export or reminder date. No hardcoded year/date correction is added.
- **Janmashtami:** local-night midpoint is a Nishita approximation, not a complete
  Rohini/Smarta/Vaishnava selection policy. Always confirmation-only.
- **Onam:** replaced silent first-match selection with retained local-sunrise
  candidates. The existing Spica/Simha/Shravana calculation is a planning proxy;
  Kerala day-selection precedence is not implemented. Always confirmation-only.
- **Raksha Bandhan:** retained confirmation-only status because Bhadra exclusion
  is not calculated.
- **Competing festival periods:** if two civil days overlap a festival's relevant
  period, generic greatest-overlap selection cannot release a resolved date.
  Adhik/kshaya/uncertain month and existing five-minute boundary gates remain.
- **Makar Sankranti:** label now explicitly means the calculated solar ingress,
  without equating that civil date with Pongal. Added a midnight boundary guard.
  Punya Kaal-based observance-day selection is not implemented.
- **Navratri:** label explicitly says Sharad Navratri; this rule covers Ashwin,
  not Chaitra Navratri or the complete nine-day schedule.

Festival definitions and numerical astronomical constants are static rules, not
hardcoded annual dates. Remaining released dates are calculated planning dates,
not a certified regional Panchang. No practitioner certification is claimed.

## References checked

- [New Delhi Panchang, 4 March 2026](https://www.drikpanchang.com/panchang/day-panchang.html?date=04%2F03%2F2026).
- [Mypanchang Rangwali Holi 2027](https://www.mypanchang.com/dhuleti.php).
- [Uttarakhand Open University, Panchang and Muhurta, p. 298](https://uou.ac.in/sites/default/files/slm/MAJY-103.pdf): Rohini/Ashtami, Vijayadashami precedence and Bhadra-dependent Raksha Bandhan selection.

These references expose missing selection rules; they are not a runtime source
or independent certification of all cities/years.

## Verification

The new regression checks include published Holi dates for 2025/2026/2027 and
confirmation/export exclusion across 2025–2030 for Delhi and Kochi. Focused
Node/API suite: 30/30 pass. Browser, exact-config packaging, commit and release
results are recorded in the functionality ledger when complete.
