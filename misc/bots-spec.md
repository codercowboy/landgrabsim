## Bot Specifications — Land Grab Simulator

Each entry covers: identity, movement algorithm (step by step), death condition, powerup interactions, and edge cases.

---

### Airport Line

**Class**: `AirportLineBot` | **File**: `js/bots/airport-line.js`
**Color**: `#4488ff` (blue) | **ticksPerMove**: 10 | **Size**: 1×1 | **Count per team**: 1

#### Behavior

Simulates a airport terminal moving walkway: sweeps left or right continuously, stepping vertically when it hits a wall or another bot.

#### State

| Property | Set at | Purpose |
|---|---|---|
| `lateralDir` | Constructor | `+1` (right) or `-1` (left), chosen randomly at spawn |

#### Movement Algorithm

Each tick:

1. **Attempt a lateral move** in the current `lateralDir` (i.e., `[this.col + lateralDir, this.row]`).
   - If that cell passes `canMoveTo`: move there, return `true`. No state change.
2. **Lateral is blocked** — attempt a vertical nudge to the cell directly above or below (same column):
   - Inspect the cells at `[this.col, this.row - 1]` (up) and `[this.col, this.row + 1]` (down).
   - Classify each as "grey" (unclaimed, `=== null`) or not.
   - **Direction preference**:
     - Up-grey only → try `[-1, +1]` (up first, then down as fallback).
     - Down-grey only → try `[+1, -1]` (down first, then up as fallback).
     - Both grey or neither grey → randomly choose which to try first (50/50).
   - For each candidate vertical direction in the ordered list: if `canMoveTo` passes, move there, **reverse `lateralDir`**, return `true`.
3. If no lateral and no vertical move succeeded: return `false` → **bot dies**.

#### Death Condition

Dies only when the lateral cell is blocked AND both vertical neighbors are also blocked.

#### Powerup Notes

- **Speed Boost**: `ticksPerMove` drops to 5 — sweeps faster.
- **Multiball**: spawns a second Airport Line at current position; it picks its own random `lateralDir` independently.
- **Instant death!!!**: kills this bot (and any teammates if multiball-spawned).

#### Edge Cases

- Vertical nudge checks for "grey" using a raw `=== null` test on the cell value, **not** `canMoveTo`. A cell owned by any bot (even this one) is not grey. This means the preference logic can favor a direction that is actually blocked; the fallback direction is tried if so.
- A bot reaching a corner may find both its lateral and its nudge directions blocked simultaneously, resulting in death.

---

### Chaos

**Class**: `ChaosBot` | **File**: `js/bots/chaos.js`
**Color**: `#ff8800` (orange) | **ticksPerMove**: 10 | **Size**: 1×1 | **Count per team**: 1

#### Behavior

Purely random. No memory, no strategy. Wanders until trapped.

#### Movement Algorithm

Each tick:

1. Start with direction array `[[0,-1],[0,1],[-1,0],[1,0]]` (up, down, left, right).
2. Fisher-Yates shuffle the array in-place.
3. Iterate through the shuffled directions; take the first one where `canMoveTo` returns `true`. Return `true`.
4. If no direction is valid: return `false` → **bot dies**.

#### Death Condition

Dies only when all four cardinal neighbors are blocked (wall or any other bot's color).

#### Powerup Notes

- **Speed Boost**: `ticksPerMove` drops to 5.
- **Multiball**: spawns another Chaos bot; the new one also shuffles independently.
- **Instant death!!!**: kills this bot immediately.

---

### Lawnmower

**Class**: `LawnmowerBot` | **File**: `js/bots/lawnmower.js`
**Color**: `#44cc44` (green) | **ticksPerMove**: 10 | **Size**: 1×1 | **Count per team**: 1

#### Behavior

Travels in a persistent direction, avoiding already-claimed cells by reversing; rotates clockwise when stuck.

#### State

| Property | Set at | Purpose |
|---|---|---|
| `dirIndex` | Constructor | Index into the direction array, initialized randomly (0–3) |

Direction array (fixed order):

| Index | Direction | `[dc, dr]` |
|---|---|---|
| 0 | Up | `[0, -1]` |
| 1 | Right | `[1, 0]` |
| 2 | Down | `[0, 1]` |
| 3 | Left | `[-1, 0]` |

#### Movement Algorithm

Each tick, up to 4 attempts (one per direction):

1. Read `[dc, dr]` from `dirs[dirIndex]`.
2. Compute `nextCol = this.col + dc`, `nextRow = this.row + dr`.
3. **If `canMoveTo(nextCol, nextRow)` is true**:
   - **If the target cell is already owned by this bot** (`isOwnCell` check):
     - Compute opposite direction index: `(dirIndex + 2) % 4`.
     - If `canMoveTo` in the opposite direction passes: set `dirIndex` to opposite, move there, return `true`.
     - Otherwise: fall through to rotation (do not move).
   - **If the target cell is not owned by this bot** (null or out-of-bounds-but-valid):
     - Move there, return `true`.
4. **If `canMoveTo` is false or we fell through**: rotate clockwise — `dirIndex = (dirIndex + 1) % 4`.
5. After 4 rotations with no successful move: return `false` → **bot dies**.

#### Death Condition

Dies when all four cardinal directions are either blocked (wall, other bot) or owned by itself (and their opposites are also blocked).

#### Powerup Notes

- **Speed Boost**: `ticksPerMove` drops to 5; the bot sweeps the grid faster.
- **Multiball**: spawns a second Lawnmower at current position with its own random `dirIndex`.

---

### Genghis

**Class**: `GenghisBot` | **File**: `js/bots/genghis.js`
**Color**: `#cc2222` (red) | **ticksPerMove**: 10 | **Size**: 1×1 | **Count per team**: 1

#### Behavior

Hunts the nearest unclaimed cell on every tick using a full grid scan and Manhattan distance.

#### Movement Algorithm

Each tick:

1. **Grid scan**: iterate all 5,000 cells (`r` from 0 to ROWS-1, `c` from 0 to COLS-1). Track the cell `(bestCol, bestRow)` with the smallest Manhattan distance `|c - this.col| + |r - this.row|` where `cells[r][c] === null`.
2. **If no null cell found**: return `false` → **bot dies** (the entire grid is claimed).
3. Compute `dc = Math.sign(bestCol - this.col)`, `dr = Math.sign(bestRow - this.row)`. Each is `-1`, `0`, or `+1`.
4. **Build move priority list**:
   - If `dc !== 0`: add `[dc, 0]` (column-axis step toward target).
   - If `dr !== 0`: add `[0, dr]` (row-axis step toward target).
   - If both `dc !== 0` and `dr !== 0`: also add `[0, dr]` and `[dc, 0]` again (effectively ensuring both forward directions appear).
   - Always append `[-dc, 0]` and `[0, -dr]` as last-resort backward moves.
5. Skip any `[0, 0]` entries (can occur if dc or dr is 0 and we appended their negatives).
6. Try each move in order: first passing `canMoveTo` wins — move there, return `true`.
7. If none pass: return `false` → **bot dies**.

#### Death Condition

Dies when unclaimed cells still exist but every cardinal neighbor is blocked, OR when the entire grid is claimed.

#### Notes

- The scan order (row-major, top-to-bottom, left-to-right) means ties in Manhattan distance resolve to the topmost-leftmost unclaimed cell.
- Move priority always puts the column-axis step before the row-axis step (not the axis with greater separation). Both forward directions are tried, then backward directions.

---

### Big Boy

**Class**: `BigBoyBot` | **File**: `js/bots/big-boy.js`
**Color**: `#ffdd00` (yellow) | **ticksPerMove**: 20 | **Size**: 2×2 | **Count per team**: 1

#### Behavior

Occupies and claims a 2×2 block of cells. Each move, the entire footprint jumps 2 cells in a randomly chosen cardinal direction, claiming 4 new cells. Old cells remain claimed permanently.

#### State

| Property | Set at | Purpose |
|---|---|---|
| `size` | Constructor | Always `2`; used by renderer to draw the joined block |
| `this.col`, `this.row` | Constructor / doMove | Top-left corner of the current 2×2 footprint |

#### Footprint

At any time, Big Boy occupies:
```
(col,   row),   (col+1, row)
(col,   row+1), (col+1, row+1)
```

#### New Cell Calculation (`getNewCells(dc, dr)`)

```
newCol = this.col + dc * 2
newRow = this.row + dr * 2

New footprint:
(newCol,   newRow),   (newCol+1, newRow)
(newCol,   newRow+1), (newCol+1, newRow+1)
```

Because `dc` and `dr` are either `-1`, `0`, or `+1` and the block is 2 wide/tall, multiplying by 2 places the new footprint immediately adjacent to (not overlapping) the current footprint.

#### Movement Algorithm

Each tick:

1. Start with direction array `[[0,-1],[0,1],[-1,0],[1,0]]` (up, down, left, right).
2. Fisher-Yates shuffle in-place.
3. For each direction `[dc, dr]`:
   - Compute the 4 destination cells via `getNewCells(dc, dr)`.
   - Call `canMoveTo` on all 4. If all pass: `doMove(dc, dr)`, return `true`.
4. If no direction works: return `false` → **bot dies**.

#### `doMove(dc, dr)`

1. For each of the 4 new cells: call `collectPowerup` (in case a powerup is there), then set `game.cells[r][c] = this`.
2. Update `this.col += dc * 2` and `this.row += dr * 2`.
3. Old 4 cells are **not** cleared — they remain owned by Big Boy indefinitely.

#### Scoring

Each of the 4 cells in every footprint Big Boy has ever occupied counts as 1 point. A bot that has taken 10 moves into new territory owns 40+ cells.

#### Rendering Special Case

During the render scan, when a 2×2 block of cells all belong to the same bot instance with `size === 2`, a single 18×18 rect is drawn instead of four separate 8×8 rects, and those four positions are skipped to avoid double-drawing.

#### Death Condition

Dies when all four possible 2×2 destination footprints are blocked (contain at least one cell owned by a different bot or out of bounds).

#### Powerup Notes

- **Speed Boost**: `ticksPerMove` drops to 5.
- **Multiball**: spawns a new Big Boy at current position; it also occupies a 2×2 and moves independently.
- **Instant death!!!**: kills this bot.

---

### Hydra

**Class**: `HydraBot` | **File**: `js/bots/hydra.js`
**Color**: `#aa44ff` (purple) | **ticksPerMove**: 10 | **Size**: 1×1 | **Count per team**: 1 (grows)

#### Behavior

Wanders randomly like Chaos. When completely blocked instead of dying, it splits into two children and then dies itself.

#### Movement Algorithm

Each tick:

1. Start with direction array `[[0,-1],[0,1],[-1,0],[1,0]]`.
2. Fisher-Yates shuffle in-place.
3. For each direction: if `canMoveTo` passes, move there, return `true`.
4. **If all four directions are blocked**:
   - Call `game.spawnMidGame(HydraBot, this.col, this.row, this.color)` twice → two new Hydra bots appear at this bot's current position.
   - Return `false` → this bot dies.

#### Spawning Details

`spawnMidGame` creates a new `HydraBot` instance at `(col, row)` and pushes it into `game.bots`. Each child starts fresh with `moveCooldown = 0`, no teammates, no isLeader. Children behave identically and can also split when blocked.

#### Death Condition

The parent dies via `makeMove()` returning `false` after spawning children. Children die normally (all four neighbors blocked, no more spawning unless they also get blocked — they do also spawn when blocked).

#### Powerup Notes

- **Speed Boost**: speeds up this Hydra instance. Children spawned afterward start with `ticksPerMove` from `def.ticksPerMove` (default 10), not the boosted value, because `spawnMidGame` uses the BOT_DEFS value. Children spawned via **Multiball** inherit the collector's current `ticksPerMove`.
- **Instant death!!!**: kills this instance only (no teammates array).

#### Notes

- Hydra children are not linked as teammates. No `teammates` array is maintained. Each child is fully independent.
- A cluster can grow without bound if each generation finds room to split before being cornered.

---

### Scout

**Class**: `ScoutBot` | **File**: `js/bots/scout.js`
**Color**: `#ff55cc` (pink) | **ticksPerMove**: 30 | **Size**: 1×1 | **Count per team**: 3

#### Behavior

Three bots spawn together and each independently charges in a straight line until blocked, then randomly picks a new direction. Scouts treat their own team's cells as passable.

#### State

| Property | Set at | Purpose |
|---|---|---|
| `dc`, `dr` | Constructor | Current direction vector |
| `teammates` | `spawnBots` group setup | Array of the other two Scout instances |
| `isLeader` | `spawnBots` | `true` for the first bot in the group |

Initial direction is chosen randomly from `[[0,-1],[0,1],[-1,0],[1,0]]` (up, down, left, right) for each bot independently.

#### Custom `canMoveTo(col, row)`

Scout overrides the global `canMoveTo` with its own method:

```
cell === null
|| cell === this           (own instance)
|| cell.color === this.color   (any teammate or multiball-spawned Scout)
```

Walls (out-of-bounds) still block. This allows Scouts to pass through territory owned by their own team.

#### Movement Algorithm

Each tick:

1. Compute `nc = this.col + this.dc`, `nr = this.row + this.dr`.
2. If `this.canMoveTo(nc, nr)` passes: move there, return `true`. Direction unchanged.
3. **Current direction is blocked**:
   - Build `alts`: the other three cardinal directions (all four minus the current `[this.dc, this.dr]`).
   - Fisher-Yates shuffle `alts`.
   - For each alt direction `[dc, dr]`:
     - If `this.canMoveTo(this.col + dc, this.row + dr)` passes: update `this.dc = dc`, `this.dr = dr`, move there, return `true`.
4. If no direction works: return `false` → **this Scout dies**. Other team members continue independently.

#### Scoring

All three bots' owned cells are pooled under the "Scout" type (same `defIndex`). Moving through teammate cells does not re-claim them — the cell remains owned by the original Scout.

#### Death Condition

An individual Scout dies when all four cardinal neighbors are blocked (by walls or non-Scout-colored cells). Other team members are unaffected.

#### Powerup Notes

- **Speed Boost**: sets `ticksPerMove = 5` on the collecting bot AND all bots in its `teammates` array — all three Scouts speed up simultaneously.
- **Multiball**: spawns a fourth Scout at the collecting bot's position. The new Scout is added to all existing Scouts' `teammates` arrays and receives all of them as its teammates. It picks its own random initial direction.
- **Instant death!!!**: kills the collecting Scout and all teammates — the entire three-bot team dies simultaneously.

---

### Bishop

**Class**: `BishopBot` | **File**: `js/bots/bishop.js`
**Color**: `#00ccbb` (teal) | **ticksPerMove**: 10 | **Size**: 1×1 | **Count per team**: 1

#### Behavior

Moves only diagonally. Charges in a chosen diagonal until blocked, then picks a new diagonal randomly.

#### State

| Property | Set at | Purpose |
|---|---|---|
| `dc`, `dr` | Constructor | Current diagonal direction; both are always `+1` or `-1` |

Initial direction chosen randomly from `[[1,1],[1,-1],[-1,1],[-1,-1]]`.

#### Movement Algorithm

Each tick:

1. Compute `nc = this.col + this.dc`, `nr = this.row + this.dr`.
2. If `game.canMoveTo(nc, nr, this)` passes: move there, return `true`. Direction unchanged.
3. **Current diagonal is blocked**:
   - Build `alts`: the other three diagonals (all four minus current).
   - Fisher-Yates shuffle `alts`.
   - For each alt `[dc, dr]`:
     - If `game.canMoveTo(this.col + dc, this.row + dr, this)` passes: update `this.dc = dc`, `this.dr = dr`, move there, return `true`.
4. If no diagonal works: return `false` → **bot dies**.

#### Parity Constraint

Because all moves change both `col` and `row` by ±1, the sum `col + row` alternates parity with every move. Bishop can only ever occupy cells where `(col + row) % 2` matches its starting cell. It will permanently leave roughly half the grid unreachable.

#### Death Condition

Dies when all four diagonal neighbors are blocked (by walls, out-of-bounds, or cells owned by any other bot).

#### Powerup Notes

- **Speed Boost**: `ticksPerMove` drops to 5 — charges diagonals faster.
- **Multiball**: spawns a second Bishop at current position with its own random initial diagonal.
- **Instant death!!!**: kills this bot immediately.

---

### Drunk Jezzball

**Class**: `DrunkJezzballBot` | **File**: `js/bots/drunk-jezzball.js`
**Color**: `#ff6644` (coral) | **ticksPerMove**: 20 | **Size**: 1×1 | **Count per team**: 2

#### Behavior

Two bots launch in opposite directions along a shared axis. When both are stopped, the leader picks a new axis and they launch again. The motion resembles a Jezzball line being drawn across the board.

#### State

| Property | Set at | Purpose |
|---|---|---|
| `isLeader` | `spawnBots` | `true` for the first bot in the pair |
| `teammates` | `spawnBots` | Array of length 1 containing the other bot |
| `dc`, `dr` | `chooseNewAxis` | Current direction vector (set before first move) |
| `stuck` | Constructor / `makeMove` | `true` = bot is waiting; `false` = bot is actively moving |

`get partner()` returns `this.teammates[0]` — a convenience alias.

#### Axes

`chooseNewAxis()` picks randomly from four axis pairs:

| Axis | Direction A | Direction B |
|---|---|---|
| Lateral | `[-1, 0]` (left) | `[1, 0]` (right) |
| Vertical | `[0, -1]` (up) | `[0, 1]` (down) |
| Diagonal A | `[-1, -1]` (up-left) | `[1, 1]` (down-right) |
| Diagonal B | `[-1, 1]` (down-left) | `[1, -1]` (up-right) |

One direction is assigned to the leader and the opposite to the partner (randomly swapped so either can go either way).

Both bots have `stuck` set to `false` after axis selection.

#### Initialization

`onGroupReady()` is called on the leader immediately after the group is linked by `spawnBots`. It calls `chooseNewAxis()`, which sets both bots' directions and clears both `stuck` flags. This happens before the first tick.

#### Movement Algorithm

Each tick (for each bot independently):

1. **If not stuck**:
   - Compute `nc = this.col + this.dc`, `nr = this.row + this.dr`.
   - If `canMoveTo(nc, nr, this)` passes: move there, return `true`.
   - Otherwise: set `this.stuck = true` (fall through to stuck logic).
2. **If stuck (including just-set)**:
   - If this bot `isLeader` AND `this.partner` exists AND `this.partner.stuck`:
     - Both bots are stopped → call `chooseNewAxis()` (a new axis is picked, both `stuck` cleared, new directions assigned).
   - Otherwise: increment `this.movesSinceNewLand++` (waiting for partner).
   - Return `true` (stuck bots do not die from returning false — they always return `true`).

#### Death Condition

`makeMove()` always returns `true`, so Drunk Jezzball bots **never die from movement failure**. They wait indefinitely until conditions change. The game ends from the timer or all-bots-dead (which cannot happen for Drunk Jezzball from movement alone).

If one bot's `partner` is null (e.g., the partner died from an instant death!!! powerup), the surviving bot becomes stuck permanently: it hits a wall, sets `stuck = true`, then each tick checks `partner.stuck` — but `partner` is null, so the condition `this.partner && this.partner.stuck` is false. The bot loops incrementing `movesSinceNewLand` forever.

#### Powerup Notes

- **Speed Boost**: sets `ticksPerMove = 5` on the collecting bot and its partner simultaneously.
- **Multiball**: spawns a third Drunk Jezzball at current position; the new bot joins the teammates arrays. With three bots, the leader's "both stuck" check (`this.partner.stuck`) only examines the first teammate — the third bot is linked but the axis-change trigger is only a two-bot check.
- **Instant death!!!**: kills the collecting bot and its partner — entire team dies.

#### Notes

- The axis-selection check only examines `this.partner` (i.e., `this.teammates[0]`). A Multiball-spawned third bot has no special role in triggering re-launch.
- Both bots move independently on each tick. There is no synchronization — one bot may have already moved multiple cells while the other is still approaching its wall, since they tick separately.
