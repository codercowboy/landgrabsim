# Specification: Jason's Game Of Life (aka Land Grab Simulator)

---

## Overview

A browser-based visual simulation inspired by Conway's Game Of Life. A grid of cells is populated by autonomous bots that move around and claim territory. Bots cannot enter territory claimed by other bots. The simulation runs until all bots are stuck and cannot move.

---

## Technology

- Vanilla JS, HTML, CSS — no frameworks, no build step
- Rendered on an HTML5 `<canvas>` element
- Single `index.html` entry point

---

## Grid

- 50 columns × 100 rows
- Each cell is 10×10 pixels
- Each cell has a 1px transparent border (gap showing canvas background — creates grid lines)
- Drawable interior per cell: 8×8 pixels (offset 1px from cell origin)
- Unclaimed cell fill color: grey (`#555555`)
- Canvas background color: dark, to make grid lines visible
- Total canvas size: 500×1000 pixels

---

## UI Controls

### Speed slider

- A range input below the grid labeled "Speed"
- 7 discrete steps (min=0, max=6), default at step 2 (1 second)
- Step-to-delay mapping:

| Step | Delay     | Display |
|------|-----------|---------|
| 0    | 5000ms    | 5s      |
| 1    | 2000ms    | 2s      |
| 2    | 1000ms    | 1s      |
| 3    | 500ms     | 1/2s    |
| 4    | 250ms     | 1/4s    |
| 5    | 125ms     | 1/8s    |
| 6    | 62ms      | 1/16s   |

- Changing the slider mid-game takes effect immediately (restarts the interval at the new speed)
- A text label next to the slider displays the current speed value

### Run Again button

- Labeled "Run Again"
- Resets and restarts the simulation from scratch: new random bot positions, fresh grid
- Works at any time — mid-game or after game over

---

## File Structure

```
index.html
css/
  style.css
js/
  game.js           — grid, game loop, rendering engine
  bots/
    lawnmower.js    — Lawnmower bot class
    chaos.js        — Chaos bot class
specification.md
```

New bots are added by creating a new file in `js/bots/` and adding a `<script>` tag in `index.html` before `game.js`.

---

## Bot Interface

Every bot class must implement this interface:

```
constructor(game, col, row, color)
  game   — reference to the Game object (for canMoveTo / moveBotTo calls)
  col    — starting column (0-indexed)
  row    — starting row (0-indexed)
  color  — CSS color string

Properties (set by constructor, readable by Game):
  this.col    — current column
  this.row    — current row
  this.color  — bot's color string
  this.dead   — boolean, initialized to false

makeMove() → boolean
  Called once per game tick by the game loop.
  Must move the bot exactly one cell if possible.
  Returns true if the bot moved, false if it cannot move at all.
  When false is returned, the game loop marks the bot dead and never calls makeMove() again.
```

Bots call `game.canMoveTo(col, row, this)` to check a cell and `game.moveBotTo(this, col, row)` to execute a move. Bots do not directly modify the cells array.

---

## Game API (available to bots)

```
game.canMoveTo(col, row, bot) → boolean
  Returns true if the cell at (col, row) is within bounds AND is either
  unclaimed (null) or claimed by this bot. Returns false otherwise.

game.moveBotTo(bot, col, row)
  Updates bot.col, bot.row, and marks cells[row][col] = bot.
  Does NOT clear the previous cell — territory is permanent.
```

---

## Cell Ownership

- `cells[row][col]` is `null` (unclaimed) or a bot reference (claimed by that bot)
- When a bot moves to a cell, that cell is permanently set to that bot (territory is never lost)
- A bot may re-enter cells it has previously claimed
- A bot may not enter cells claimed by a different bot

---

## Bot Rendering

Bots are drawn on top of the cell layer each frame, at their current `col`/`row` position.

**Live bot:**
- 8×8 white filled square at the cell's interior origin
- 4×4 bot-color filled square centered inside (2px white border all around)

**Dead bot:**
- 8×8 black filled square at the cell's interior origin
- 4×4 bot-color filled square centered inside (2px black border all around)
- Red X drawn corner-to-corner across the full 8×8 area, lineWidth 1.5

---

## Render Order (per frame)

1. Draw all cells (grey for unclaimed, bot color for claimed)
2. Draw all bot markers on top

---

## Game Loop

```
setInterval(tick, currentSpeed)

tick():
  for each bot (in order):
    if not dead:
      result = bot.makeMove()
      if result is false:
        bot.dead = true
  render()
  if all bots are dead:
    stop the interval
```

The game does not automatically restart when over — the player clicks "Run Again."

---

## Bot: Lawnmower

**Name:** Lawnmower
**Color:** Blue (`#4488ff`)

**Behavior:** Sweeps laterally (left/right) until blocked, then nudges one step vertically and reverses lateral direction. A classic lawnmower pattern.

**Initial state:**
- Lateral direction: randomly left or right

**Each tick (makeMove):**
1. Try to move one step in the current lateral direction
2. If that cell is available → move there, return true
3. If blocked → try to nudge vertically:
   - Pick a random vertical direction (up or down) to try first
   - If that cell is available → move there, reverse lateral direction, return true
   - If that cell is also blocked → try the other vertical direction
   - If that cell is available → move there, reverse lateral direction, return true
   - If both vertical directions are blocked → return false (bot dies)

**Judgment calls:**
- Lateral direction reverses on any block (wall or enemy territory), not just walls
- Vertical direction is chosen randomly each time a nudge is needed (not remembered)
- A nudge and a lateral move are separate ticks — each call to makeMove() moves exactly one cell

---

## Bot: Chaos

**Name:** Chaos
**Color:** Green (`#44cc44`)

**Behavior:** Moves one step in a random direction each tick. If blocked, tries another random direction until it finds one that works or exhausts all options.

**Each tick (makeMove):**
1. Shuffle all four directions randomly (up, down, left, right)
2. Try each in shuffled order
3. First available direction → move there, return true
4. If all four are blocked → return false (bot dies)

**Note:** Shuffling all four directions before trying is functionally equivalent to the described "try random, retry if blocked" behavior, and avoids any possibility of infinite loops.

---

## Initial Bot Placement

- Each bot is placed at a random cell on the grid
- No two bots may start on the same cell
- The starting cell is immediately claimed by that bot (cells[row][col] = bot)

---

## Game End

- The game ends when all bots have `dead === true`
- No winner announcement or scoring in the initial implementation
- The interval is cleared; the grid remains frozen in its final state
- The player clicks "Run Again" to start over

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Bot placed at corner or edge on spawn | Valid — canMoveTo handles bounds checking |
| Two bots attempt to move to the same cell | Not possible — each bot moves sequentially in the same tick; first bot claims the cell, second bot's canMoveTo returns false for that cell |
| Lawnmower nudge blocked both directions at start | Bot dies immediately |
| Chaos surrounded on first move | Bot dies immediately |
| Speed slider changed while game is over | Stored as currentSpeed; used on next "Run Again" |
| "Run Again" clicked mid-game | Clears existing interval, resets all state, starts fresh |

---

## Open Questions / Future Work

- No scoring or win condition display in v1
- Only two bots in v1; more added later via new files in `js/bots/`
- No pause button in v1
- No bot labels or legend in v1
