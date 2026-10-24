# Audio provenance

## Reaction voices — 24 October 2026

The following original short synthesized voice clips were generated locally
with Windows System.Speech, Microsoft David Desktop. They are not film dialogue
or recordings of the people depicted by the characters.

| Asset | Spoken phrase | Source text | Bytes | Duration |
| --- | --- | --- | ---: | ---: |
| `frontend/wow.wav` | Wow! | Wow! | 13,454 | 0.304 s |
| `frontend/ye-le.wav` | Ye le! | Yeh leh! (pronunciation spelling) | 20,474 | 0.463 s |
| `frontend/dishoom.wav` | Dishoom! | Dishoom! | 22,428 | 0.508 s |

The three sources use SSML prosody (pitch/rate respectively +18%/+12%,
+8%/+14%, -8%/+10%). Export format is 22,050 Hz mono PCM16 WAV. Leading/trailing
silence is trimmed with 25 ms/60 ms padding, peak normalized to 26,000/32,768,
and edges faded over 5 ms/15 ms. Total on-demand voice payload is 56,356 bytes.
No external speech service or browser-installed voice is needed at runtime.

Garland plays Wow; shoe plays Ye le; tomato plays Dishoom. Ink uses an original
Web Audio splash made from filtered noise and descending water-drop tones.
Applause retains the recording below and laughter retains its synthesized effect.
The shared sound controller loads only the chosen clip on a sound-enabled
interaction, deduplicates fetch/decode work, cancels pending playback on mute,
new reactions and page hiding, and falls back to the original synthesized effect
if an asset cannot load. Clips are not prefetched by ordinary page entry.

## Applause

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
