# Stress Buster integration review

Reviewed 19 October 2026. Source: `C:/Code/StressBuster`. Assessment only;
no source import, game build/run, integration, APK change or deployment performed.

## Conclusion

Feasible as an additional Take a Break activity, but the existing Android APK
cannot execute inside a web page. Two implementations are possible: export the
Unity project to Web, or adapt the game into browser-native JavaScript/Canvas.
The browser-native adaptation is the recommended fit for this platform's small,
mobile-first activities. This is an architectural recommendation, not a measured
performance comparison or an estimate that an equivalent port is trivial.

## What is actually present

- Unity 6.0 (`6000.0.40f1`), C#, 2D physics, runtime-created menus and UI.
- Android build source currently targets version 2.1.2/code 11, ARM64, Android
  9+, landscape. `Builds/Android/StressBuster-v2.1.2.apk` is 16,780,184 bytes;
  its build log reports success. There is also a Windows smoke build. Neither
  was executed during this review, and build success is not device verification.
- Playable Manager/Friend rivals, Easy/Normal/Hard AI, movement/jump/melee/grab/
  throw, 90-second arena, health, stress power mode, score/combo, results/rematch,
  and coins/XP stored with Unity PlayerPrefs.
- Wife/Girlfriend are premium-locked definitions. No live purchase integration;
  the customization screen is a shell, not a complete purchasable inventory.
- Actual illustrated assets exist in Resources/Art: Characters.png (2,342,613
  bytes), Items.png (1,868,804), OfficeArena.png (1,669,774). Character art was
  visually inspected. Effects generate audio tones in code. README/design notes
  describing portrait mode, placeholders and v1.1.0 are stale relative to source.
- Source review found no HTTP/socket/native-Java plugin dependency in gameplay
  scripts. Physics, UI and rendering depend extensively on Unity APIs.
- No explicit project/art reuse licence or provenance document was found among
  the project documentation and Assets. This does not establish who owns them;
  preserve/confirm existing asset provenance when importing.

## Integration choices

| Choice | What changes | Main tradeoff |
| --- | --- | --- |
| Browser-native activity | Reimplement physics/combat/AI in JavaScript/Canvas; adapt approved art; add a lazy-loaded Stress Buster tile | Best fit with existing Take a Break structure, but requires gameplay reimplementation and balancing |
| Unity Web export | Install Unity Web Build Support, add a Web build path and host the generated runtime/assets on a dedicated route | Reuses C# gameplay; download size, WebView/mobile performance and hosting policies need a prototype |
| Link to separate Android APK | Offer a download/open action | Separate installation; does not make the game playable inside Take a Break |

Unity Web Build Support is not installed in the inspected Unity editor (only
AndroidPlayer/windowsstandalonesupport), and no Web export was found in Builds.
Unity 6 supports mobile web/browser and WebView deployment in principle, subject
to browser requirements; this does not verify this game's wrapper compatibility.
Reference: [Unity 6 Web browser compatibility](https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-browsercompatibility.html).

## Concrete adaptation work

For either web approach: add a Take a Break tile and stable game URL, lazy-load
only when opened, provide Back to activities and responsive landscape-friendly
controls, pause on hidden/focus loss, unlock sound after user interaction, support
reduced motion/mute, and test touch multitasking, keyboard and small screens.
No account, server business records, payment provider or licence migration is
needed for a free game. Persistent optional game progress must be clearly separate
from Chambers/business persistence; browser progress will not automatically import
the standalone APK's PlayerPrefs.

For a Unity export, desktop keyboard input currently compiles only under
UNITY_EDITOR/UNITY_STANDALONE, so Web needs a conditional/input change. Forced
landscape/fullscreen needs browser handling. Hosting must explicitly allowlist
Web assets with correct MIME/compression and narrowly scoped WebAssembly/CSP
support; do not relax the platform-wide private-page policy. Measure the actual
Web build instead of treating the Android APK's size as a Web download estimate.

The initial adaptation should keep a clearly defined free feature set; do not
present premium hooks as connected purchases. Recheck runtime content assumptions:
four character cells are used for five player/opponent identities, and the clamp
currently makes Wife/Girlfriend share the final cell. The highlighted nearest
object and Grab's first available overlap are not guaranteed to select the same
object. Validate gameplay/rewards/cleanup rather than relying on existing build
logs or claims of production readiness.

With a browser-based implementation on the existing origin, ordinary game updates
would normally reach the platform wrapper without a new APK. That remains subject
to real-device compatibility testing. Bundling native Unity into the wrapper would
instead require a larger native integration and a new APK; it is not the proposed
website integration.
