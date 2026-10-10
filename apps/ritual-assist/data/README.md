# Indian PIN code locations

`india-pincodes.json` is a derived offline snapshot of the [GeoNames India postal download](https://download.geonames.org/export/zip/IN.zip), retrieved 10 October 2026. GeoNames licenses this data under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). The JSON records the source-file SHA-256.

Each PIN uses median latitude/longitude of its listed postal places. Conflicting states or any listed coordinate more than 40 km from the median make the entry unusable. Out-of-range coordinates are excluded. Coordinates are approximate postal-area estimates, not validated addresses: even consistent entries can contain source errors. The [source README](https://download.geonames.org/export/zip/readme.txt) describes estimated coordinates and supplies no accuracy warranty. No fallback city or external geocoding request is used. Recheck local sunrise/Aparahna with an authoritative regional Panchang, particularly near a tithi boundary.

This file is server-only. Do not expose it through the frontend static allowlist. State-based Amanta/Purnimanta defaults are convenience labels; the family's explicit override takes precedence.
