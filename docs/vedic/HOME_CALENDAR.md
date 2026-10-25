# Homepage calendar feature

25 October 2026. The homepage's former Daily Satire teaser is replaced by a
wide Rashifal & Kundli feature panel. The ordinary app catalogue entry retains
its search/access behavior and now uses app-specific celestial artwork.

`apps/portal/frontend/home-vedic.js` observes the panel and dynamically imports
the app-owned bundled `home-calendar.mjs` only near the viewport. It calculates
on the device, refreshes each visible minute and on return, and reuses the shared
home language preference. It performs no calendar API call, geolocation request,
birth lookup, new persistence or business write. Static app links work without JS;
calendar failures show unavailable values rather than a stale invented date.

The app model reuses the existing nominal Panchang and Amanta-month kernels.
Displayed tithi is at the current geocentric instant, with the existing boundary
screen; it is not the tithi at a location's sunrise. Month naming and independent
astronomical acceptance remain preview status. The year is explicitly **Chaitra-year
Vikram Samvat**, not Gujarati Kartika-year Samvat. Thus October 2026 shows 2083;
the Gujarati convention still shows 2082 until its new year. Existing `term` and
`limbText` helpers own Hindi calendar names. Adhika Chaitra's unresolved regional
year boundary withholds the year. Unsupported dates/model boundaries fail closed.

Reference checks: [Drik Panchang, Ahmedabad](https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=1279233)
and [Vraj's 2026 Gujarati calendar](https://vraj.org/PDF_folder/2025/Vaishnav_Utsav_2026_Guj_Eng.pdf).
These establish regional naming/year differences, not independent acceptance of
our calculation model. No source content is copied or scraped at runtime.

Daily Satire's standalone collection renderer, homepage fetch/observer and links
are removed. `/satire-arena/daily` and its slash alias redirect 308 to the Arena
entry without an upstream editorial read on Workers. Published articles,
category pages, character biographies, editor permissions, stored records and
voting/results remain owned by Satire Arena. No editorial record is deleted.
