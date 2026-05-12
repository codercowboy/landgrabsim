## Project: Ronnie's Screenplay

Using `birdnetlib` to analyze audio recordings and identify a specific backyard bird from real-world recordings with heavy species overlap.

## Environment
- Python 3.11 via Homebrew on Mac — run everything on the Mac, NOT inside Docker
- Project directory: /Users/jason/Documents/code/claude/ronnies-blog
- Claude runs inside a Docker container; the Mac filesystem is the persistent layer

## Project structure
- `src/processaudio/process_audio.py` — main script, this is where the birdnetlib detection code goes
- `misc/` — context files, audio samples, throwaway examples
- `misc/ronnie.wav` — first audio sample to analyze
- `misc/python-example/` — throwaway learning files, can be deleted

## Current state
- venv created and birdnetlib 0.18.1 installed
- `process_audio.py` is empty, ready to write detection code
- src layout in place: `src/processaudio/` with `__init__.py`

## Next steps
1. Add microphone capture — record audio live from a mic and pipe it into the birdnetlib detection
2. Filter detections for the target species
3. Consider hi-pass / low-pass frequency filtering to isolate the target bird

## What we don't know yet
- Which bird Jason is looking for (he knows, but wants raw output first)
