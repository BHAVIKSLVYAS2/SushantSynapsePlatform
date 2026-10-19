# Android wrapper releases

## 1.0.2 — 19 October 2026

- Version code 3; same package and release certificate.
- Native API 30+ root consumes system-bar/cutout/keyboard insets after applying
  its padding, preventing WebView from applying them again as CSS safe areas.
  Addresses the reported blank area below the homepage bottom navigation.
- SDK build, alignment/signature, version metadata and download/print bridge
  checks pass. Real-device visual correction, keyboard, rotation and both Android
  navigation modes remain unverified. No website release required.
- APK: `.publish/android/Sushant-Synapse-Platform-1.0.2.apk`.
- SHA-256: `c580b5d030f3884742a7f1c1572891647e3613e80eb2730d3a02451bfa464a5e`.
- Install over 1.0.1 without uninstalling. User confirmed downloads in 1.0.1.

## 1.0.1 — 19 October 2026

- Version code 2; same package and signing certificate as 1.0.0.
- Fix generated downloads (including Donation Appreciation PDF/PNG): read
  retained Blob objects and decode data URLs directly instead of fetching URLs
  blocked by the website's `connect-src 'self'` policy. Native Save as, origin
  restrictions and the 32 MiB limit remain in effect.
- Regression reproduced with production CSP before the fix; bridge checks now
  pass with fetch disabled, PDF/PNG filenames/MIME/bytes, immediate URL cleanup,
  data downloads, chunks, repeat injection, printing and origin restriction.
- Signed APK: `.publish/android/Sushant-Synapse-Platform-1.0.1.apk`.
- SHA-256: `c69b0be6ea630773c2e227caad7351228401095cb3a2a732861c7dfbe8f9332f`.
- Signature verified with existing certificate. Real-device verification remains
  pending. Install over the existing app; no uninstall or website deployment needed.

## 1.0.0 — 19 October 2026

- Package: `com.sushantsynapse.platform`; version code: 1.
- App label: Sushant Synapse Platform; existing company icon.
- Live website wrapper with native offline/retry/network settings, exact-origin
  navigation, external links, upload picker, bounded file exports and printing.
- Android 8.0+ (API 26); target/compile SDK 36. APK size: 266,960 bytes.
- Signed APK: `.publish/android/Sushant-Synapse-Platform-1.0.0.apk`.
- APK SHA-256: `fbacf71f44c39a2eb3a86e2358c8987878fd311104950b61f1c75b0286d70336`.
- Signing certificate SHA-256:
  `8ed305f8cd3a4e1cabed90f51a6ec131a152f161a0f1faa93d1662b5003827f1`.
- SDK compilation, alignment, APK v2/v3 signature, package metadata, 26 Java
  navigation/filename checks and isolated Chrome export/print bridge checks pass.
- **Not yet tested on a real Android device/emulator.** Gradle build/lint is
  unverified because dependency download stalled; default SDK build succeeded.
- No website production change, business migration or app-store publication.

The APK hash describes the delivered file, not a promise of identical hashes on
rebuild (ZIP timestamps/signatures can differ). The certificate identity must
remain the same across updates. Back up the private key/config before distribution;
never include them with the APK. Follow [the maintenance guide](README.md) for
website-versus-APK decisions and the on-device verification checklist.
