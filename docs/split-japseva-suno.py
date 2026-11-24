"""Split a Suno batch into library-named WAV files at measured silent gaps."""

import argparse
from array import array
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import wave


def read_track_ids(manifest, batch):
    match = re.search(
        rf"^BATCH {re.escape(batch)}\b[^\n]*\nTRACKS: ([a-z0-9 /-]+)$",
        manifest.read_text(encoding="utf-8"),
        re.MULTILINE,
    )
    if not match:
        raise ValueError(f"Unknown batch {batch}")
    tracks = match.group(1).split(" / ")
    if len(set(tracks)) != len(tracks) or any(not re.fullmatch(r"[a-z0-9-]+", t) for t in tracks):
        raise ValueError("Invalid track IDs in manifest")
    return tracks


def detect_silence(audio, threshold_db, gap_seconds):
    rate = audio.getframerate()
    window = max(1, rate // 50)
    limit = (32768 * 10 ** (threshold_db / 20)) ** 2
    gaps = []
    quiet_start = None
    total = audio.getnframes()
    for start in range(0, total, window):
        samples = array("h", audio.readframes(window))
        if sys.byteorder != "little":
            samples.byteswap()
        quiet = sum(sample * sample for sample in samples) <= limit * len(samples)
        if quiet and quiet_start is None:
            quiet_start = start
        elif not quiet and quiet_start is not None:
            gaps.append((quiet_start, start))
            quiet_start = None
    if quiet_start is not None:
        gaps.append((quiet_start, total))
    return [(a, b) for a, b in gaps if b - a >= rate * gap_seconds]


def split(source, tracks, out, threshold_db, gap_seconds):
    with wave.open(str(source), "rb") as audio:
        if audio.getsampwidth() != 2:
            raise ValueError("Use 16-bit PCM WAV or convert it with FFmpeg")
        total = audio.getnframes()
        rate = audio.getframerate()
        gaps = detect_silence(audio, threshold_db, gap_seconds)
        if not total or gaps == [(0, total)]:
            raise ValueError("Audio contains no audible passage")
        inner = [(a, b) for a, b in gaps if a > 0 and b < total]
        if len(inner) != len(tracks) - 1:
            raise ValueError(f"Expected {len(tracks)-1} internal gaps, found {len(inner)}. No tracks written.")
        edge = round(rate * 0.12)
        first = max(0, gaps[0][1] - edge) if gaps and gaps[0][0] == 0 else 0
        last = min(total, gaps[-1][0] + edge) if gaps and gaps[-1][1] == total else total
        starts = [first] + [b - edge for _, b in inner]
        ends = [a + edge for a, _ in inner] + [last]
        paths = [out / f"{name}.wav" for name in tracks]
        if any(path.exists() for path in paths):
            raise ValueError("Output already exists. Choose an empty folder.")
        out.mkdir(parents=True, exist_ok=True)
        for path, start, end in zip(paths, starts, ends):
            audio.setpos(start)
            with wave.open(str(path), "wb") as target:
                target.setparams(audio.getparams())
                target.writeframes(audio.readframes(end - start))
        print(f"Saved {len(paths)} tracks in {out}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("batch", type=str.upper)
    parser.add_argument("audio", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--threshold-db", type=float, default=-45)
    parser.add_argument("--gap-seconds", type=float, default=1.6)
    args = parser.parse_args()
    if not -100 <= args.threshold_db < 0 or not 0.5 <= args.gap_seconds <= 10:
        parser.error("Use a threshold from -100 to below 0 dB and a gap from 0.5 to 10 seconds")
    try:
        tracks = read_track_ids(args.manifest, args.batch)
        with tempfile.TemporaryDirectory() as temp:
            source = args.audio
            ffmpeg = shutil.which("ffmpeg")
            if ffmpeg:
                source = Path(temp) / "decoded.wav"
                subprocess.run(
                    [ffmpeg, "-v", "error", "-i", str(args.audio), "-vn",
                     "-c:a", "pcm_s16le", str(source)],
                    check=True,
                )
            elif args.audio.suffix.lower() != ".wav":
                raise ValueError("Install FFmpeg for MP3 input, or supply a 16-bit PCM WAV")
            split(source, tracks, args.output, args.threshold_db, args.gap_seconds)
    except (OSError, ValueError, wave.Error, subprocess.CalledProcessError) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
