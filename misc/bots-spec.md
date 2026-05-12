## Bot Specifications — Land Grab Simulator

Each bot entry covers: behavior, movement rules, death/special conditions, and any unique mechanics.

---

### Airport Line
**Color**: #4488ff (blue) | **Speed**: ticksPerMove 10 | **Size**: 1×1

Moves laterally (left or right) in a chosen direction until blocked by a wall or another bot's color. When blocked laterally, steps one cell vertically (up or down) and reverses lateral direction for the next lateral sweep.

**Vertical nudge logic**: prefers the vertical direction that leads to an unclaimed (grey) cell. If both or neither direction has a grey neighbor, picks randomly.

Repeats: sweep → nudge → sweep → nudge. Dies if it cannot move laterally or vertically when blocked.

---

### Chaos
**Color**: #ff8800 (orange) | **Speed**: ticksPerMove 10 | **Size**: 1×1

Every move, shuffles the four cardinal directions (up, down, left, right) randomly and takes the first one that is a valid move. No memory, no strategy. Dies only when completely surrounded.

---

### Lawnmower
**Color**: #44cc44 (green) | **Speed**: ticksPerMove 10 | **Size**: 1×1

Maintains a current direction index cycling clockwise through: up → right → down → left. Each move, tries to advance in the current direction. If the next cell is already owned by this bot, steps in the **opposite** direction instead (to avoid retracing). If neither works, rotates clockwise to the next direction and tries again. Cycles through all four directions before giving up.

---

### Genghis
**Color**: #cc2222 (red) | **Speed**: ticksPerMove 10 | **Size**: 1×1

Every move, performs a full scan of the entire grid to find the nearest unclaimed (grey) cell by Manhattan distance. Moves one step toward it: prefers the axis with greater separation first, then tries the other axis. If no unclaimed cells remain, dies.

---

### Big Boy
**Color**: #ffdd00 (yellow) | **Speed**: ticksPerMove 20 | **Size**: 2×2

Occupies a 2×2 block of cells at all times. Each move attempts to shift the entire 2×2 footprint one step in a randomly chosen cardinal direction, claiming four new cells and vacating the previous four. A move is only valid if all four destination cells are either unclaimed or owned by Big Boy.

Rendered as a single joined 18×18 block. Each of the four cells counts individually toward scoring (4 points per position).

---

### Hydra
**Color**: #aa44ff (purple) | **Speed**: ticksPerMove 10 | **Size**: 1×1

Moves like Chaos — random direction each turn. When completely blocked (all four cardinal directions are unavailable), instead of dying normally, it **spawns two new Hydra bots** at its current position and then dies. The spawned children behave identically and can also split when blocked.

---

### Scout
**Color**: #ff55cc (pink) | **Speed**: ticksPerMove 30 | **Count**: 3 bots per team | **Size**: 1×1

Spawns as a team of 3 bots at the same starting position. Each bot independently picks a random cardinal direction and moves in a straight line until blocked by a wall or a different color. When blocked, shuffles the remaining three directions and picks the first valid one.

Scouts treat cells owned by their own team (same color) as passable — they do not stop when entering teammate territory, though this does not count as claiming new land for stagnation purposes.

All three bots' cell counts are pooled into a single "Scout" score. If any scout collects the Speed Boost powerup, all three teammates receive the speed boost simultaneously.

---

### Bishop
**Color**: #00ccbb (teal) | **Speed**: ticksPerMove 10 | **Size**: 1×1

Moves exclusively diagonally (never laterally or vertically). Picks a random diagonal direction at spawn — one of: up-left, up-right, down-left, down-right — and keeps moving in that direction until blocked by a wall or another bot's color. When blocked, shuffles the other three diagonal directions and takes the first valid one. Dies if all four diagonals are blocked.

Due to diagonal-only movement, Bishop can only ever reach cells where `(col + row) % 2` matches its starting cell's parity — it covers at most half the grid.

---

### Drunk Jezzball
**Color**: #ff6644 (coral) | **Speed**: ticksPerMove 10 | **Count**: 2 bots per team | **Size**: 1×1

Spawns as a pair at the same starting position. One bot is designated the **leader**.

On spawn (and after each "stop"), the leader picks a random **axis** from four options:
- Left / Right (lateral)
- Up / Down (vertical)
- Up-left / Down-right (diagonal A)
- Up-right / Down-left (diagonal B)

The leader and its partner are assigned **opposite directions** along the chosen axis and immediately begin moving away from each other.

Each bot independently moves one step per tick in its assigned direction. When a bot hits a wall or another color, it sets itself as **stuck** and waits. When **both** bots are stuck, the leader picks a new axis and they set off again.

If a bot is stuck and waiting, its stagnation counter increments each tick — if stuck for 100 consecutive ticks, it dies. If one bot dies, the other continues briefly on its own until it stagnates.

Speed Boost on either bot propagates to the partner.
