# JapSeva practice audio — 15 November 2026

Implemented locally; not committed or deployed.

The previous flow exposed counted playback only in the learning library. The
practice action left the request to reach meaning/audio, so people could not
listen and count in one place. Adding another player inside the counter render
would also interrupt audio when that render was replaced after every tap.

The revised flow keeps client/mantra context, playback and the counter in the
same practice destination. Play mantra on repeat and Pause mantra are direct
actions. Repeat target, reset, speed and recording attribution share one Audio
settings disclosure. Longer meaning/pronunciation content is inline below the
counter controls. Open text/meaning disclosures survive counting and language
changes. The learning library remains a separate browsing destination.

Design plan: retain existing light/dark/deep semantic tokens and the requested
counter treatment; keep client and mantra left aligned; make repeat/pause one
compact row above the counter; keep learning/settings secondary. The added audio
panel uses sentence-case labels, no new palette, font download or decorative
animation. Reviewed the actual mobile screenshot after implementation and moved
expanded meaning below counting controls to keep that primary task accessible.

External skill review: searched the web and inspected Anthropic's official
[frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design).
Installed with the system skill-installer into the user's Codex skills directory.
The skill is available on the next turn; its source guidance was read directly
for this pass. Focused on deliberate hierarchy, restraint, consistent action
names and screenshot critique. No external skill code is bundled in the app.

Implementation:

- The existing audio element/session is moved into a persistent practice host
  outside the counter's redraw subtree. Tapping +1 does not move, replace,
  restart or pause that element. There is still only one player per recording.
- Leaving practice, switching requests or hiding the page stops playback. The
  original player is restored to the library. Playing another recording pauses
  the previous one.
- Audio repeats remain separate from client japa and certificate eligibility.
  This distinction is stated beside playback. No storage/schema changes.
- Exact normalized Sanskrit text and mantra ID must match the verified library
  recording. Edited/custom text and entries without recordings show a concise
  unavailable message while the counter remains usable.
- Repeat settings and status use English/Hindi/Gujarati. A completed target
  opens settings when Play is pressed so the next action is visible.

Verification:

- All five existing model checks pass.
- All nine prior browser workflows pass after the final UI refinements.
- Added a permanent browser regression for practice playback continuity across
  taps/language changes, separate audio target completion, unchanged japa and
  certificate eligibility, and stopping/restoring the player on navigation.
  It passes independently: ten browser workflows verified in total.
- CLI checks 27 language/theme/width cases, same audio-node identity during
  taps, inline meaning persistence, repeat target completion, pause, playing
  during a language change, exit while playing, correct request recordings,
  missing recordings and edited-text rejection.
- Production build exports 707 assets; whitespace check passes. Verification
  uses Chrome, isolated test storage and synthetic local records; no production
  business writes or deployment were performed.

Evidence: `.publish/japseva-practice-audio-{model,browser-final,regression,build}.log`,
`.publish/japseva-current-audio-final-review.log`, and
`output/playwright/japseva-current-practice-audio.png`.
