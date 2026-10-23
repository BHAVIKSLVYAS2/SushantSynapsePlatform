# Audio provenance

`frontend/applause.mp3` is the low-quality MP3 preview of **Small applause**
by **Breviceps**, Freesound sound 462362, published 4 March 2019.

- Source: https://freesound.org/people/Breviceps/sounds/462362/
- Download: https://cdn.freesound.org/previews/462/462362_9159316-lq.mp3
- Licence: CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/
- Retrieved: 23 October 2026; 36,360 bytes. Recording of a small group applauding.

The app hosts the file itself. Playback uses 1.6 seconds starting at 0.15s,
with a short attack, 0.2s fade-out and the existing output limiter. The file is
unchanged. Bytes load when a sound-enabled interaction calls `prepareSound`,
never merely from importing the module or entering the ordinary arena chooser.
No runtime dependency on Freesound is required.
