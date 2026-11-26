# Audio to Video Studio

Open `/audio-to-video` from the public Create catalogue. Choose a recording
and cover, adjust the framing and export an MP4. Replace video cover accepts
an MP4 with an audio track. Lyric Video is available separately at `/lyric-video`.

The app paints the image, title, artist and logo once at export resolution.
The static encoder loops a one-second H.264 segment while muxing audio.
Animated exports derive the effect from the audio using FFmpeg filters.
Compatible original streams can be copied, with AAC as the fallback.
FFprobe supplies stream metadata and duration. The worker mounts source
files through WORKERFS and termination releases its in-memory filesystem.
Large exports need sufficient memory for the encoded output and video frames.

The platform build self-hosts the pinned FFmpeg.wasm 0.12.10 cores. The
browser fetches one gzip-compressed engine on Generate. Single-thread encoding
is the default. The optional threaded control requires an already isolated
browser context. The production platform uses its existing isolation settings.
The two cores declare GPL-2.0-or-later. License text and upstream build
source are linked from the editor. The lockfile pins package integrity.

Run `npx playwright test apps/audio-to-video/browser.spec.js` for the fixture
matrix and `node infrastructure/cloudflare/build.cjs --fullstack --organisations`
to generate the platform deployment assets.
