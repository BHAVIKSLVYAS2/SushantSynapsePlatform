# Promotional demo player

Open `/showcase` to watch eleven looping scenes: Team Mixer, Moment Studio, Timetable Lite, Ritual Assist, Take a Break/Pocket Pause, Decision Wheel, Chambers, DIGITAL SAMAJ, Tournament Lite, BatchFee Lite and a platform invitation. Workspace scenes link to sign-in and state their access requirements; paid checkout and published pricing are not configured, so no price or subscription availability is advertised. Every workflow is labelled **Demonstration · Sample data**. These are illustrative native HTML/CSS presentations rather than recordings or live app actions. No account, booking, transaction, ad impression or lead is created. There are no invented usage statistics, earnings or promised sponsorship results.

Use Play/Pause, Previous/Next, Restart or a named scene. Scene length can be 8, 12 or 20 seconds. Space toggles playback, left/right arrows change scenes and F requests full screen when focus is outside ordinary controls. Full screen has its own pause/next/exit buttons. Hidden tabs pause elapsed time, and focused scene links pause playback so a visitor can follow them. Reduced-motion preference starts paused on a completed illustrative scene with transitions disabled.

`/showcase?screen=1` removes the introduction and partnership sections for a larger display. Keep a browser open on this URL to loop through the presentation; Exit display restores the page. Full screen requires a user gesture and browser support. The presentation contains no sound, stream or video provider. It is an HTML player, not a video export or a remote-managed signage service.

HTML player download has been removed. Use the hosted page or display mode; initial assets require internet.

Ownership is portal frontend only. Both page routes bypass Cloudflare origin checks; the Node static allowlist serves local development. Tests in `apps/portal/tests/showcase/browser.spec.js` use a temporary DATA_DIR and cover all eleven scenes, playback/pause, timings, keyboard navigation, fullscreen, display mode, light/dark/responsive layouts, a real downloaded file in an offline browser, reduced motion and no-JavaScript guidance. Source implementation uses fixed sample strings and no visitor-authored HTML.

Sponsorship forms open combined WhatsApp drafts; enquiry downloads are unavailable.
