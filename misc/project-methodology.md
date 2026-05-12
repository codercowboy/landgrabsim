## Project Methodology

### Overview

Each utility in this project is a small, single-purpose, unix-style command. Utilities are independent of each other and can be used standalone.

---

## Development workflow

Follow these steps in order when creating a new utility:

1. **Create the skeleton** — directory, wrapper script, `initial_setup.sh`, `pyproject.toml`, `src/__init__.py`, and the Python stub with `usage()` and the no-arg/help-arg checks.

2. **Write the specification** (`specification.md` in the project's folder) using the 'Specification workflow' below in this file. 

3. **Verify** — before writing any code, review the specification and raise any gaps, ambiguities, or potential problems. Ask clarifying questions. Jason is not always a perfect communicator, so this step exists to catch missing edge cases, conflicting requirements, or anything that would cause a problem mid-implementation. Always number your questions so Jason can refer to them by number in his responses.

4. **Implement** — once the spec is agreed upon and verified, write the code using the 'Implementation workflow' below in this file.

5. Write / update readme.md for the project. TODO: we need to specify this workflow granularly in this doc, let's do that when we get to this step. Broadly, we will have a section at the top that says how to install and run the tool with very simple instructions to run it quickly without a heavy amount of brainwork on the user's behalf to run it the first time, then we will have a section with more descriptive detail of what the tool does and how it works, then we will have a section about error scenarios, then we will have a section mentioning the license, then we will have a section that documents authorship of the tool. 

---

## Dependencies

Prefer shallow dependency trees. Before adding any library, enumerate its full chain of transitive
dependencies (Python packages and any required system libraries). If a simpler alternative exists
with fewer dependencies — including just using the standard library — prefer it unless the heavier
option provides a clear, necessary benefit.

Work through dependency choices during specification, not during implementation. By the time code
is being written, library decisions should already be settled.

---

## Specification workflow

A specification (`specification.md`) is written before any implementation code. It is the agreed-upon
contract for what the utility does and how it behaves. The steps, roughly in order:

1. **Arguments first** — define every argument the utility accepts: name, short form, accepted values,
   defaults, and whether it is required or optional. This forces clarity about the interface before
   any implementation details are considered. Once all arguments are drafted, do a dedicated pass
   reviewing every short form: check for conflicts, ensure the abbreviation is intuitive, and confirm
   that arguments without a short form are intentionally omitted rather than forgotten.

2. **Evaluate dependencies** — for each library the utility will use, enumerate its full transitive
   dependency chain (see Dependencies section above). Document library choices and the reasoning
   behind them under an "Architectural decisions" section in the spec.

3. **Implementation details** — describe how the utility works internally: the algorithm, data flow,
   library usage, and any non-obvious behavior.

4. **Edge cases** — define behavior for: empty or missing inputs, invalid argument values, conflicting
   arguments, filesystem errors, and any ambiguous behavior that could be interpreted multiple ways.
   Every ambiguity gets a defined answer before coding begins. For each failure mode, explicitly
   define: the user-facing error message (specific, not generic), whether retry applies, what
   happens to any partial output, and what the tool does next. For tools with retry logic, think
   through recovery scenarios in detail — what does the user see and experience during each type
   of failure and recovery?

5. **Unit review** — do a dedicated pass over every argument that involves a time, size, or
   quantity value. For each one, confirm: what unit does the user provide (seconds, milliseconds,
   bytes, frames)? What unit does the underlying library or Python API expect? Document any
   conversion in the spec so it is not left as an implementation surprise. A common example:
   user-facing arguments are in seconds; some internal APIs use milliseconds or frames.

6. **Verify** — review the completed spec for gaps, contradictions, or missing edge cases before
   writing any code. This is step 3 in the Development workflow above.

7. **Post-mortem** — after the specification is complete, review this workflow and update these steps
   if anything was missing, out of order, or could have gone smoother. The workflow improves by
   reflecting on each spec as it's finished.

The spec is a living document during the specification phase — expect multiple passes. Once
implementation begins, changes to the spec should be deliberate and explicit, not casual.

---

## Error messages

Prefer specific error messages over generic ones. The user should always know exactly what went
wrong. Examples:

- "Buffer overrun — audio data was lost" not "Recording failure"
- "Microphone disconnected" not "Recording error"
- "Disk full" not "Could not write file"

This applies throughout: argument validation errors, runtime errors, and retry messages all benefit
from specificity. If you know what went wrong, say it.

---

## Implementation workflow

These steps follow after the specification is complete and verified.

1. **Re-read the spec** — before writing any code, read the full specification fresh. Catch anything
   that was glossed over during writing.

2. **Pin dependencies** — look up the current latest version of each library decided during
   specification, pin those exact versions in `pyproject.toml`, then run `initial_setup.sh` on
   the Mac to create the venv and install them. Version numbers are determined here, not during
   the specification phase.

3. **Copyright header and imports** — add the copyright header from `misc/copyright-template.txt`
   and all import statements before writing any logic.

4. **Argument parsing first** — implement `usage()` and `__init__()` (argument parsing and
   validation) before touching core logic. The argument layer is the contract surface — get it right
   before building anything on top of it.

5. **Smoke test the argument layer** — run the tool with: no args, `--help`, invalid args, and any
   single-exit flags like `-L` and `-V`. Verify all error messages and exit behavior match the spec.
   Jason runs the script on the Mac and pipes output back for review.

6. **Implement core logic** — write `run()` and any supporting methods. Follow the algorithm defined
   in the spec step by step.

7. **Test the golden path** — run the tool with a valid, typical set of arguments and verify output
   matches expectations end to end.

8. **Work through edge cases** — go through the edge cases section of the spec one by one and verify
   each behaves correctly.

9. **Update the spec for any deliberate changes** — if implementation revealed that a spec decision
   was wrong or incomplete, update the spec to reflect the actual agreed behavior. Changes should be
   explicit, not silent.

10. **Post-mortem** — review and update this methodology document for anything learned during
    implementation: steps that were missing, out of order, or took longer than expected. Also revisit
    the specification workflow — implementation often reveals things that should have been caught
    earlier, and those belong in the spec steps too.

---

## Distribution

When a utility is ready to be shared beyond this project, Python offers several distribution paths.
The right choice depends on the audience.

### For developer/technical audiences: PyPI

PyPI (Python Package Index) is the central repository — equivalent to Maven Central or npm. Users
run `pip install yourpackage` to install. Requires Python and pip to be installed on the user's
machine. Two distribution formats:

- **Wheel (`.whl`)** — the modern standard. Pre-built, no compilation needed on install. A wheel
  is a ZIP file with a specific structure that pip unpacks and installs directly. Pure-Python wheels
  work on any platform; wheels with C extensions are platform-specific. This is the closest Python
  equivalent to a JAR.
- **Source distribution (sdist)** — a tarball of source code that the user's machine builds on
  install. Older and less common now, but still used as a fallback when no wheel is available.

### For non-technical end users: standalone executables

These tools bundle the Python script, all dependencies, and the Python interpreter itself into a
single executable. No Python installation required on the user's machine.

- **PyInstaller** — the most common choice. Produces a single executable or a folder. Works on
  Mac, Windows, and Linux. Output is platform-specific — you build on Mac to produce a Mac binary.
- **Nuitka** — compiles Python to C, then to a native binary. Faster runtime and smaller output
  than PyInstaller, but more complex build process.
- **py2app** — macOS-specific. Produces a `.app` bundle that behaves like a native Mac application.

### For this project

Each utility in this project currently runs as a script invoked directly by the user with Python.
Distribution format decisions are made per-utility, documented in the utility's specification.

---

### Directory structure per utility

Each utility lives in its own subdirectory (e.g. `bird-detector/`) and contains:

- `initial_setup.sh` — creates the venv and installs dependencies
- `<utility-name>.sh` — the main wrapper script (e.g. `bird-detector.sh`)
- `run-example.sh` — demonstrates a typical usage of the utility
- `pyproject.toml` — Python dependencies for this utility only
- `src/<utility-name>.py` — the Python implementation

### Wrapper script conventions

The wrapper script (e.g. `bird-detector.sh`) is a bash script that:

1. Checks that Python 3.11 is installed, and exits with a clear error if not
2. Activates the local venv
3. Runs the Python implementation
4. Deactivates the venv

The wrapper is what a user (or another script) calls to invoke the utility.

### run-example.sh

Each utility has a `run-example.sh` that demonstrates a concrete, working example of the utility in action. It should be runnable immediately after `initial_setup.sh` with no additional configuration.

### Python implementation

The Python script is the actual logic. It should behave like a unix command:

- Accept inputs (files, flags, stdin where appropriate)
- Produce clean output to stdout
- Be usable in a pipeline if it makes sense

#### Python file structure

Every Python implementation must follow this order:

1. **Copyright header** — from `misc/copyright-template.txt`
2. **Import statements**
3. **Implementation class** — named after the utility (e.g. `AudioRecorder`, `BirdDetector`), containing:
   - `usage()` as a `@staticmethod` — takes an optional `error` argument, always exits after printing
   - `__init__(self, args)` — takes the raw arguments array, parses and validates all args, calls `ClassName.usage("reason")` on any invalid input
   - Implementation methods
   - `run(self)` — executes the work: prints config summary, runs the logic, prints elapsed time
4. **`if __name__ == "__main__":` block** — script entry point only, contains:
   - No-arg and help-flag checks that call `ClassName.usage()`
   - Instantiation and call to `run()`

This structure keeps the class fully importable and testable. The `__main__` block is skipped when the file is imported as a module.

#### Usage output format

The `usage()` output must follow this structure in order:

1. **Usage line** — `USAGE: <utility-name>.sh [arguments]`
2. **Quick reference** — one line per argument, terse summary
3. **Argument details** — one section per argument with full description, accepted values, defaults, and notes
4. **Examples** — concrete usage examples
5. **Footer** — copyright line and source location (GitHub URL once available)

#### Invoking usage()

Every tool must call `usage()` in these cases:
- No arguments are passed
- Any argument is a variant of: `-?`, `--?`, `-help`, `--help`

#### usage() function

Every Python implementation must define a `usage()` function as the first function in the file. It takes a single argument `error`:

- Always prints the usage information for the utility
- Always exits after printing
- If `error` is empty/None, exits after printing usage with no additional output
- If `error` is provided, prints a blank line after usage, then: `Error: <error contents>`

Example structure:

    def usage(error=None):
        print("Usage: bird-detector.sh <audio-file>")
        print("")
        print("  Analyzes an audio file and prints detected bird species.")
        if error:
            print("")
            print(f"Error: {error}")
        exit(1)
