# Loading review — 16 October 2026

Measured against production; selected optimisations implemented locally.
These changes have not been deployed.

## Measurements

Chrome at 390 × 844, 150 ms simulated latency, 1.6 Mbps download and four-times
CPU slowdown. Production was read without changing records. These are single
lab observations, not a Lighthouse score or real-user Core Web Vitals report.

| Live page | LCP | CLS | Initial auth requests |
| --- | ---: | ---: | ---: |
| Home, cold browser cache | 8.94 s | 0.139 | 2 |
| Home, repeat visit | 1.68 s | 0.136 | 2 |
| Confessions, cold browser cache | 6.23 s | 0.060 | 1 |
| News, cold browser cache | 1.32 s | 0.728 | 1 |

The first homepage document response took 2.33 s; the others took about 0.10 s.
This does not establish a persistent backend problem. News paints early but
has substantial startup layout movement; its LCP alone does not mean it is ready.

## Implemented locally

- Aligned the shared header's imported premium stylesheet URL with the main
  direct link. Both cascade positions remain; only the duplicate fetch is removed.
- Shared the initial auth promise between portal and header. Subsequent boot
  and visibility checks remain fresh; nothing is stored across navigations or
  in persistent storage. HTTP authentication cache protections remain unchanged.
- Kept the existing anonymous-home DOM instead of rebuilding it after auth.
  Sign-in/out rendering, finder, theme controls and unavailable-workspace handling
  remain functional, including when the backend is unavailable.
- Added responsive News artwork and lazy below-the-fold comic images. Original
  artwork remains available, with the same dimensions/aspect ratio and attribution.

| Image | Original bytes | 768px bytes | 1280px bytes |
| --- | ---: | ---: | ---: |
| News desk | 444,738 | 95,532 | 217,382 |
| Chai comic | 415,764 | 102,918 | 220,248 |

The two 768px copies total 198,450 bytes versus 860,502 originally: 77% smaller.
Higher-density displays can select larger variants. Original files were retained.

Controlled local before/after runs used isolated temporary SQLite databases and
blocked external resources equally. Home auth requests fell from two to one;
premium CSS requests fell from two to one. News selected the 95,532-byte cover
instead of the 444,738-byte original at this viewport/pixel density. Local LCP
was 4.77 → 4.16 s on Home and 2.14 → 1.80 s on News. These single-run timing
differences are directional, not a guarantee for every visitor.

Verification: six Chrome workflows passed, covering initial DOM/auth reuse,
fresh account state after sign-in/out, mobile themes, no-JavaScript home,
backend outage, News generation/comic artwork and print behaviour.

## Next priorities

1. Stabilise News loading layout and shared-header installation. Layout shifts
   remain measurable and were not fully addressed in this pass.
2. Review ad startup timing. The two largest Google scripts transferred about
   259 KB in the live cold run, over half the measured resource transfer. Ads,
   consent and security policies were not changed.
3. Introduce content-hashed asset filenames before longer browser cache lifetimes.
   Current dated URLs are not consistently changed on every release. Extending
   caching now risks stale code; private APIs should retain their protections.

Raw ignored artifacts: `.publish/loading-audit-live.json`,
`.publish/loading-before.json`, `.publish/loading-after.json`.
