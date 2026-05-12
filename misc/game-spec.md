## Game Specification — Land Grab Simulator

---

### Grid

- **Dimensions**: 100 columns × 50 rows (5,000 cells total)
- **Canvas size**: 1000×500 pixels (`COLS * CELL_SIZE` × `ROWS * CELL_SIZE`)
- **Cell size**: 10×10 pixels per cell, rendered as an 8×8 filled square with a 1px transparent gap on the right and bottom edge (so cells are visually separated)
- **Unclaimed cell color**: `#555555` (dark grey)
- **Background**: `#222222` canvas background, visible only through gaps

---

### Game Flow

1. A game starts automatically on page load.
2. Clicking **New Game** immediately restarts with the current saved settings — no confirmation.
3. Clicking **Settings** opens a modal where bot/powerup/game-length options can be configured. **OK** saves and closes; **Cancel** fully reverts any changes made while the modal was open (checkboxes and sliders are restored to their pre-open state). The game keeps running behind the modal.
4. On start, all timers and intervals from the previous game are cleared, the grid is wiped, bots are spawned, powerups are placed, and the clock begins.
5. The game ends when **either** of the following occurs:
   - The game-length timer expires (see Clock section).
   - All bots are simultaneously dead.
6. When the game ends, all bots are marked dead, all intervals are cleared, and the board freezes at its final state.

---

### Tick System

The core loop runs via `setInterval` at the **tick interval** — the global speed set by the speed slider. Every tick:
1. Each living bot's `moveCooldown` counter increments by 1.
2. When `moveCooldown >= ticksPerMove`, the bot attempts a move and `moveCooldown` resets to 0.
3. `render()` is called (redraws canvas + updates score panel).
4. If all bots are dead, the game stops.

**Speed slider** (11 steps, adjustable while a game is running):

| Index | Tick interval | Label  |
|-------|--------------|--------|
| 0     | 5000ms       | 5s     |
| 1     | 2000ms       | 2s     |
| 2     | 1000ms       | 1s     |
| 3     | 500ms        | 1/2s   |
| 4     | 250ms        | 1/4s   |
| 5     | 125ms        | 1/8s   |
| 6     | 62ms         | 1/16s  |
| 7     | 31ms         | 1/32s  |
| 8     | 16ms         | 1/64s  |
| 9     | 8ms          | 1/128s |
| 10    | 4ms          | 1/256s |

Default speed on page load: index 9 (8ms/tick). Changing speed via the slider takes effect immediately mid-game.

**`ticksPerMove` values by bot type** (default, before powerups):

| Bot              | ticksPerMove |
|------------------|-------------|
| Airport Line     | 10          |
| Chaos            | 10          |
| Lawnmower        | 10          |
| Genghis          | 10          |
| Big Boy          | 20          |
| Hydra            | 10          |
| Scout            | 30          |
| Bishop           | 10          |
| Drunk Jezzball   | 20          |

---

### Bot Movement and Cell Ownership

- A bot can move to a cell if it is **null** (unclaimed) or already owned by that exact bot instance.
- A bot **cannot** move to a cell owned by any other bot instance, including teammates (except Scout, which has custom same-color passthrough logic).
- When a bot moves to a cell via `moveBotTo()`, that cell's ownership is set to the bot and is never revoked by any other game mechanic (no ownership stealing).
- Big Boy moves its entire 2×2 footprint as a unit; all four destination cells must be available.

---

### Death Condition

A bot dies if `makeMove()` returns `false` — meaning it could find no valid move in any direction it tried. There is **no stagnation death** — bots that are temporarily stuck but not completely surrounded can keep trying indefinitely.

When all bots are dead the game ends (timers stop, board freezes).

---

### Spawning

On game start, `spawnBots()` processes each enabled bot definition:
1. A random starting position `(col, row)` is chosen, avoiding overlap with already-used cells (tracked in a `used` set).
2. For multi-bot teams (`count > 1`), `count` bot instances are created at the **same** starting position.
3. All bots in a group get a `teammates` array containing every other member of the group.
4. The first bot in the group gets `isLeader = true`. If the bot class defines `onGroupReady()`, it is called on the leader immediately after the group is linked (used by Drunk Jezzball to pick an initial axis).
5. The starting cell(s) are assigned to the last bot in the group.
6. Each spawned bot gets: `defIndex` (index into `BOT_DEFS`), `movesSinceNewLand = 0`, `ticksPerMove` from its def, `moveCooldown = 0`.

Mid-game spawns (Hydra children, Multiball) use `spawnMidGame()` or direct construction and push to `game.bots` without the position-finding logic.

---

### Scoring

- Each cell in the grid owned by a bot contributes **1 point** to that bot's type's score.
- Scores are grouped by `defIndex` — all instances of the same bot type (including Hydra children, Scout teammates, Multiball spawns) share a combined score.
- Big Boy's 2×2 footprint occupies 4 cells → 4 points.
- Scores are recalculated every render frame by scanning all 5,000 cells.
- The score panel shows all types with at least one owned cell, sorted highest to lowest. The type(s) tied for the highest score are highlighted (name white, score yellow).

---

### Powerups

Powerups are placed on random null cells at game start. The **count** slider (1–10, default 3) controls the total number of powerups placed across all enabled types. Each powerup slot is assigned a random type from the enabled types — so if both Speed Boost and Multiball are enabled and count is 6, the split is random (e.g., 4 speed + 2 multiball).

A bot collects a powerup the moment it moves onto the powerup's cell (`moveBotTo` calls `collectPowerup`). The powerup's `apply(bot)` function fires immediately and the powerup is removed from the board.

All powerups look **identical** on the grid — a rainbow-cycling 8×8 CSS-animated block — so bots cannot predict what they'll get. (Mystery box design.)

**Powerup types:**

#### Speed Boost
- Sets the collecting bot's `ticksPerMove` to **5** (roughly 2–4× faster than most bots).
- If the bot has a `teammates` array, all teammates also get `ticksPerMove = 5`.
- A ▲ indicator appears next to the bot type's name in the side panel. Cleared on next game start.

#### Multiball
- Spawns **one** new bot of the same type at the collecting bot's current cell.
- The new bot inherits the collector's current `ticksPerMove` (so if the team already has a Speed Boost, the new member starts fast).
- The new bot is added to every existing team member's `teammates` array, and receives all of them as its own teammates.
- Only one bot is spawned regardless of how many teammates already exist.
- The new bot is pushed to `game.bots` and begins acting immediately next tick.

#### instant death!!!
- Sets `bot.dead = true` on the collecting bot.
- Sets `dead = true` on every bot in `bot.teammates`.
- The entire team dies simultaneously on the tick the powerup is collected.

---

### Clock and Game Length

The clock runs on a 50ms `setInterval`, independent of the game tick speed. It is wall-clock time, not tick-count.

**Game length options** (set in Settings modal):

| Slider index | Duration  | Label |
|-------------|-----------|-------|
| 0           | 30 seconds | 30s  |
| 1           | 1 minute   | 1m   |
| 2           | 2 minutes  | 2m   |
| 3           | 5 minutes  | 5m   |
| 4           | No limit   | ∞    |

Default: 30 seconds.

**Clock display behavior:**
- `remaining > 10s`: shows whole seconds (e.g., `23s`), normal grey color.
- `remaining ≤ 10s`: shows seconds + two decimal places (e.g., `9.45s`), turns red, flashes via CSS animation.
- `remaining = 0` (timer expired): calls `endGame()`, display changes to `game over` in static red, no flash.
- `duration = ∞`: displays `∞`, no countdown, no timeout is set, game runs until all bots are dead.

---

### Rendering

Every render frame:
1. `ctx.clearRect()` wipes the entire canvas.
2. All 5,000 cells are scanned. Each cell is drawn as an 8×8 filled rect at `(col*10+1, row*10+1)` in the owning bot's color, or `#555555` if unclaimed.
3. **Big Boy special case**: when scanning, if a 2×2 block of cells all belong to the same bot instance with `size === 2`, a single 18×18 rect is drawn (spanning both cells minus the gap) and those four positions are marked visited to avoid redundant drawing.
4. Each bot's current position is drawn as a **marker**: a white-bordered square (full cell size minus 2px) with a colored inner square (inset 2px on each side).
   - **Alive**: white border, bot-color fill.
   - **Dead**: black border, bot-color fill, red X (two diagonal lines across the cell).
5. `updateScores()` is called to refresh the score panel DOM.
6. A DOM overlay (`#powerup-overlay`) sits above the canvas with `pointer-events: none` and contains one `<div class="powerup-block">` per active powerup, positioned with absolute `left`/`top` to align with the grid. Each block runs a `@keyframes rainbow-glow` CSS animation cycling through red → orange → yellow → green → blue → violet. Collected powerups have their DOM element removed immediately.

---

### UI Layout

```
[Title]

[Canvas (1000×500)]   [Side Panel]
[Speed slider]         Scores (live, sorted)
[New Game] [Settings]  Time (clock)

[Settings Modal — hidden by default]
  ┌─────────────────────────────────────┐
  │ Settings                            │
  │  Bots          │  Powerups          │
  │  [checkboxes]  │  [checkboxes]      │
  │                │  Count: [slider]   │
  │  Game Length: [slider] 30s…∞        │
  │            [Cancel]  [OK]           │
  └─────────────────────────────────────┘
```

- **Side panel**: sticky, shows Scores section (sorted by territory, leader highlighted) and Time section (countdown clock).
- **Settings modal**: semi-transparent dark overlay (`rgba(0,0,0,0.75)`), two-column layout (Bots left, Powerups right). Settings take effect on the next **New Game** click. Cancel restores pre-open state via a snapshot taken at modal-open time.
- **Speed slider**: takes effect immediately, even mid-game. Does not restart the game.
- **New Game**: starts a game immediately with current saved settings. No modal.
