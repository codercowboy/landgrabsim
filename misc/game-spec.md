## Game Specification — Land Grab Simulator

---

### Grid

- **Size**: 100 columns × 50 rows
- **Cell size**: 10×10 pixels (rendered as 8×8 with a 1px gap on each side)
- **Background color**: #555555 (unclaimed / "grey")

---

### Game Flow

1. On start (or "Run Again"), the grid is cleared and all active bots are spawned at random positions.
2. The game runs for **30 seconds** of wall-clock time, independent of the tick speed setting.
3. The game also ends early if all bots are dead before the 30 seconds elapse.
4. When the game ends, all bots are marked dead and the final board state is frozen.

---

### Tick System

- The game advances by a **tick** at a configurable interval (controlled by the speed slider).
- Speed options range from 5000ms/tick (slowest) to 4ms/tick (fastest), with 11 preset steps.
- Each bot has a `ticksPerMove` property. A bot only attempts a move when its internal `moveCooldown` counter reaches `ticksPerMove`. This allows bots to move at different effective rates independently of the global tick speed.
- Default `ticksPerMove` values:
  - Most single-cell bots: 10
  - Big Boy: 20
  - Scout: 30
  - Speed Boost powerup overrides any bot's `ticksPerMove` to 5

---

### Bot Movement

- Each tick, each living bot's `moveCooldown` increments by 1. When it equals `ticksPerMove`, the bot attempts a move and `moveCooldown` resets to 0.
- A bot **cannot** move to a cell owned by a different bot. It can move to unclaimed (null) cells or cells it already owns.
- When a bot moves to a cell, that cell becomes owned by that bot and is drawn in the bot's color.
- Ownership is never revoked — once a bot claims a cell, no other bot can take it.

---

### Death Conditions

A bot dies if either of the following is true after its move attempt:

1. **Cannot move**: `makeMove()` returns `false` (all valid moves are blocked).
2. **Stagnation**: The bot has gone **100 consecutive moves** without claiming any new (previously unclaimed) cell. The counter resets to 0 each time a new grey cell is claimed.

When all bots are dead, the game ends immediately (even before the 30-second clock expires).

---

### Scoring

- Each grid cell owned by a bot counts as **1 point** for that bot's team.
- Multi-cell bots (e.g., Big Boy's 2×2 footprint) accumulate 1 point per cell, so a full 2×2 block = 4 points.
- Scores are grouped by bot type (all instances of the same type share a score).
- Scores are displayed live during the game, sorted from highest to lowest. The leading score is highlighted.

---

### Powerups

- Powerups are placed on random unclaimed cells at the start of each game.
- A bot collects a powerup by moving onto its cell.
- Currently two powerup types:
  - **Speed Boost**: sets the collecting bot's `ticksPerMove` to 5 (faster movement). If the bot has teammates, all teammates receive the same speed boost. A visual indicator (▲) appears next to the bot's name in the panel.
  - **Multiball**: spawns one new bot of the same type at the collecting bot's current position. The new bot inherits the collector's current speed and joins its teammates network. Only one new bot is spawned regardless of team size.
- Powerup count and enabled state are configurable per powerup via the Powerups panel.

---

### Rendering

- The grid is drawn on an HTML5 Canvas element every tick.
- The canvas is cleared fully each frame to prevent artifacts.
- Bot position markers are drawn as white-bordered squares with a colored interior. Dead bots show a red X.
- A separate DOM overlay (`#powerup-overlay`) renders CSS-animated powerup blocks above the canvas using absolute positioning.
- Big Boy's 2×2 territory is rendered as a single joined block when all four cells are confirmed to belong to the same bot instance.

---

### UI Panels

- **Bot panel** (right side): one checkbox per bot type. Only checked bots spawn on the next run. Shows a ▲ indicator when a bot holds the Speed Boost.
- **Score panel** (below bot list): live score per bot type, sorted by score, leader highlighted.
- **Clock** (below scores): counts down from 30s. Above 10s shows whole seconds. At 10s and below, switches to seconds+milliseconds format, turns red, and flashes.
- **Powerup panel** (bottom): one checkbox per powerup type to enable/disable it for the next run.
- **Speed slider**: controls global tick interval. Changes take effect immediately.
- **Run Again button**: resets and restarts the simulation with the current bot/powerup selection.
