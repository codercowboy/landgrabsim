# Ronnie's Screenplay

## Session startup — read these files first
- `misc/memory/MEMORY.md` — persistent memory index, read this and any linked files that seem relevant
- `misc/notes-for-next-time.md` — remind Jason to read this at the start of the session
- `misc/linting-tasks.md` — remind Jason at the start of the session that we should consider running through these
- `misc/project-methodology.md` — how utilities in this project are structured, read before writing any new utility code

After reading the files listed above, scan all remaining `.md` and `.txt` files in `misc/` that weren't explicitly listed, so nothing important is missed going into the session.

## Memory
- Store all memory files in `misc/memory/` — NOT in the default Docker path (`/home/claude-pod/.claude/...`), which may be destroyed when the container is removed
- `misc/memory/MEMORY.md` is the index; add an entry there for every new memory file

## Key context
- This project is run on the Mac directly, not inside the Docker container

## Spelling
- If Jason misspells a word, silently use the correct spelling in any output. Do not call it out unless he explicitly asks with "(sp?)".

## Appending to files
- When asked to "add" something to a text file, append to the bottom unless told otherwise.

## Timestamps
- When writing a timestamp to a log file, first run `TZ="America/Los_Angeles" date` to get the current Pacific time and use that as the timestamp.

## Git
- Only create commits when explicitly asked. Do not commit automatically after edits.

## Code style
- Use tabs for indentation, not spaces

## Shell script conventions
- Jason's shell is bash (not zsh), version 3.2.57 — the ancient Apple-bundled version. Do NOT use bash 4+ syntax in scripts: no `${var,,}` or `${var^^}` for case conversion (use `tr` instead), no associative arrays, no `mapfile`. Stick to POSIX-compatible bash 3 syntax.

## About the user
See relationship-context.md for personal context about Jason.

## Project directory
`/Users/jason/Documents/code/claude/land-grab-sim`
