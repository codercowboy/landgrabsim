## Linting Tasks

These are tasks Claude should perform periodically at Jason's request as a linting/housekeeping pass.

----

### Copyright Headers

Check all .py files in the project for a copyright header matching the template in misc/copyright-template.txt.
For each file that is missing one or has an outdated header, show Jason the file path and proposed change,
and wait for his confirmation before making the edit. Do not batch the changes — confirm each file individually.

---

### Bot Spec Coverage

Check that every bot class defined in `js/game.js` (the `BOT_DEFS` array) has a corresponding entry in `misc/bots-spec.md`.
Report any bot types that are missing a spec entry and prompt Jason to add one before continuing.
