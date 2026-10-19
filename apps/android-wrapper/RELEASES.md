# Android wrapper releases

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
