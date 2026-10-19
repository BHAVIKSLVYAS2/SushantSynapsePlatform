# Sushant Synapse Platform for Android

Maintained native Java/WebView wrapper for `https://apps.sushantsynapse.com/`.
App ID: `com.sushantsynapse.platform`; current version: 1.0.1 (version code 2).
Requires Android 8.0/API 26 or newer and an up-to-date Android System WebView.
The company icon is copied from `apps/portal/frontend/logo-adaptive-512.png`.
This is a direct-install APK project, not a Google Play publication.

## Website update or APK update?

| Change | Release another APK? |
| --- | --- |
| Website wording, CSS, app pages, business features, APIs | Usually no; reopen/reload the page to receive the deployed website |
| Roles, licences, user access, production app availability | No; existing server enforcement applies |
| Native offline screen, Android navigation, downloads, file picker, permissions | Yes |
| Launcher icon/name, package ID, minimum Android version, website origin, native security changes | Yes |
| Website begins using a browser feature absent from Android WebView | Test Android compatibility; a wrapper change may be needed |

The APK contains no website bundle, account credentials or business database.
Website changes deploy separately using the existing production release process.
An already open page receives changes on navigation/reload; it is not live-patched.
There is no automatic APK installer/updater. New signed APKs are installed by the
user. Keep the app ID and signing key, and increment `versionCode` for each APK
release; update `versionName` in `version.properties`. Both build paths and the
APK filename read that single version source. Do not change the app ID for an update.

## Connectivity and device behaviour

- A native branded screen asks users to check Wi-Fi/mobile data when Android
  reports no validated internet connection, including at cold startup. Retry and
  Network settings are available. Captive portals require completing network sign-in.
- Connection recovery waits for Retry; it never automatically replays writes.
  If an intact page is behind the offline screen, Retry reveals it without
  discarding its form. Failed navigation retries a GET, never a POST.
- Failed main-page loads and server 5xx responses show a separate unavailable
  message. TLS errors fail closed. Subresource/API failures keep website handling.
- First-party cookies/DOM storage support the existing sign-in and device-local
  tools. These remain Android app-private; Android backup is disabled. Clearing
  app storage/uninstalling removes sessions and device-local preferences/data.
- Only the exact production HTTPS origin navigates inside the WebView. External
  web/WhatsApp/email/telephone links open a suitable installed app. Unknown schemes,
  arbitrary intent URLs, cleartext internal loads and mixed content are blocked.
- Uploads use Android's document picker, with no broad storage/camera permission.
  Direct camera capture is not implemented; users can select existing photos/files.
- Blob/data exports and same-origin authenticated GET downloads use Save as via
  Android's document provider, up to 32 MiB per file, with no silent public-folder
  writes. HTTPS download redirects are rejected. Browser fallback is in the menu.
- `window.print()` and the native Print / Save PDF menu use Android print services.
  Complex popup/iframe printing, native file sharing, camera capture and all app
  workflows need on-device verification. Open in browser is available for browser
  features WebView does not support. No claim that every website app is verified.
- Android Back navigates within the website before exiting. Native chrome follows
  system light/dark colours; the website keeps its existing independent theme.

## Build and signing

Prerequisites: JDK 17+ (tested with 21), Android SDK platform 36/build-tools 36.0.0,
and the JDK's `javac`, `jar`, `keytool` commands on PATH. Set `ANDROID_HOME` if the
SDK is not in `%LOCALAPPDATA%/Android/Sdk`. The default build uses official SDK
tools directly (aapt2, D8, zipalign, apksigner), with no Maven downloads.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File apps/android-wrapper/build-apk.ps1
# Optional Gradle/Android Studio build, including Android lint:
powershell -NoProfile -ExecutionPolicy Bypass -File apps/android-wrapper/build-apk.ps1 -UseGradle
# Add -Offline to the Gradle build only when its dependencies are already cached.
```

The default script compiles, signs and verifies the release APK. Output:
`.publish/android/Sushant-Synapse-Platform-1.0.1.apk`. Source belongs here;
generated builds, local SDK paths, APKs and signing material are ignored by Git.
Open this folder in Android Studio for development (Gradle 8.14.3 / Android Gradle
plugin 8.13.0). The optional Gradle build downloads missing dependencies and runs
Android lint; the SDK-only build does not run lint. No Node business tests need
to use the live database for this native project.

First build creates a private release key and random password under
`.publish/android-signing/` (not the Android debug key). **Securely back up both
`platform-release.jks` and `signing.json` before distributing the APK.** Losing
the key prevents installing compatible updates over the distributed app.
Signing material is not included in the APK or repository. Move both together
when rebuilding on another machine; protect access to that private backup.

For installation, transfer the APK to Android, open it and allow installation
from that source when Android asks. This does not publish it to Google Play.
Do not distribute the signing directory with the APK.

## Verification and release checklist

Run `node apps/android-wrapper/test-bridge.cjs` and compile/run the standalone
`tests/NavigationPolicyTest.java` with `NavigationPolicy.java` into an ignored
temporary directory. `build-apk.ps1` runs `apksigner verify`; use `-UseGradle`
for Android lint when its build dependencies are available.
Run `npx.cmd playwright test apps/android-wrapper/tests` for the real Donation
Appreciation form with uploaded logo/signature, PDF and 300/600 DPI PNG exports
through the bridge under CSP, plus invalid-image validation. This uses a temporary
local SQLite workspace and intercepted HTTPS requests, never production records.
Use a separate `--output` directory if running another Playwright suite alongside it.
Record APK hash/certificate fingerprint and evidence in `docs/FUNCTIONALITY_LEDGER.md`.

Before wider distribution test a real device: install/update with the same key,
launch online and in airplane mode, disconnect/reconnect while editing a form,
Retry/network settings, sign-in/out and session persistence, Android Back, dark
theme/rotation, document/photo pickers, PNG/PDF/ZIP exports, Android print preview,
WhatsApp links, browser fallback and each intended website workflow. Use temporary
test accounts/workspaces for business writes. Do not demonstrate on user records.

References: [WebView](https://developer.android.com/reference/android/webkit/WebView),
[WebViewClient](https://developer.android.com/reference/android/webkit/WebViewClient),
[WebChromeClient](https://developer.android.com/reference/android/webkit/WebChromeClient).
