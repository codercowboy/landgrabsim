## Todo

---

### Task 1: Project bootstrapping file

Create a dedicated project-bootstrapping file (separate from project-methodology.md) that Claude runs once at the very start of a new project — not on every session, just the first time.

- Figure out a mechanism in CLAUDE.md to trigger this only at the beginning (e.g. a sentinel file Claude creates after bootstrapping completes, so it knows not to re-run it)
- The bootstrapping file should include a checklist of essential files Claude must create or verify exist when starting from a skeleton copied from a previous project, so nothing gets silently missing (like misc/memory/MEMORY.md, notes-for-next-time.md, etc.)
- Bootstrapping should check whether a git repo exists in the project directory and remind Jason to create one if not

---