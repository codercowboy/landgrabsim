let COLS = 100;
let ROWS = 50;
const CELL_SIZE = 10;

const BOARD_SIZES = [
	{ cols: 100, rows: 50, label: 'large' },
	{ cols: 50,  rows: 50, label: 'medium' },
	{ cols: 25,  rows: 25, label: 'to the death!' },
];

const SPEEDS = [1000, 100, 15, 5, 1];
const SPEED_LABELS = ['Is this thing on?', 'Yawn', 'Normal', 'Fast', "Don't blink!"];

const GAME_LENGTHS = [30000, 60000, 120000, 300000, Infinity];
const GAME_LENGTH_LABELS = ['30s', '1m', '2m', '5m', '∞'];
const MODE_LABELS = ['boring', 'tournament', 'battle royale'];

const BOT_DEFS = [
	{ Class: AirportLineBot, name: 'Airport Line', color: '#4488ff', size: 1, ticksPerMove: 3 },
	{ Class: ChaosBot,       name: 'Chaos',        color: '#ff8800', size: 1, ticksPerMove: 3 },
	{ Class: LawnmowerBot,   name: 'Lawnmower',    color: '#44cc44', size: 1, ticksPerMove: 3 },
	{ Class: GenghisBot,     name: 'Genghis',      color: '#cc2222', size: 1, ticksPerMove: 3 },
	{ Class: BigBoyBot,      name: 'Big Boy',       color: '#ffdd00', size: 2, ticksPerMove: 6 },
	{ Class: HydraBot,       name: 'Hydra',        color: '#aa44ff', size: 1, ticksPerMove: 3 },
	{ Class: ScoutBot,       name: 'Scout',        color: '#ff55cc', size: 1, ticksPerMove: 3, count: 3 },
	{ Class: BishopBot,      name: 'Bishop',       color: '#00ccbb', size: 1, ticksPerMove: 3 },
	{ Class: DrunkJezzballBot, name: 'Drunk Jezzball', color: '#ff6644', size: 1, ticksPerMove: 7, count: 2 },
];

const POWERUP_DEFS = [
	{
		id: 'speed',
		name: 'Speed Boost',
		color: '#00ffcc',
		icon: '<span class="pu-icon pu-speed">▲</span>',
		count: 1,
		apply(bot) {
			bot.ticksPerMove = 1;
			if (bot.teammates) {
				for (const mate of bot.teammates) mate.ticksPerMove = 1;
			}
			if (bot.defIndex !== undefined) {
				const el = document.getElementById(`speed-indicator-${bot.defIndex}`);
				if (el) el.textContent = '▲';
			}
		},
	},
	{
		id: 'multiball',
		name: 'Multiball',
		color: '#ffaa00',
		icon: '<span class="pu-icon pu-multiball">🎱</span>',
		apply(bot) {
			const game = bot.game;
			if (bot instanceof HydraBot) {
				game.spawnMidGame(HydraBot, bot.col, bot.row, bot.color, bot.health);
				game.spawnMidGame(HydraBot, bot.col, bot.row, bot.color, bot.health);
				return;
			}
			const def = BOT_DEFS[bot.defIndex];
			if (!def) return;
			const newBot = new def.Class(game, bot.col, bot.row, bot.color);
			newBot.defIndex = bot.defIndex;
			newBot.movesSinceNewLand = 0;
			newBot.ticksPerMove = bot.ticksPerMove;
			newBot.moveCooldown = 0;
			if (game.gameMode === 2) newBot.health = bot.health;
			const team = [bot, ...(bot.teammates || [])];
			newBot.teammates = [...team];
			for (const member of team) {
				if (!member.teammates) member.teammates = [];
				member.teammates.push(newBot);
			}
			game.cells[bot.row][bot.col] = newBot;
			game.bots.push(newBot);
		},
	},
	{
		id: 'instant-death',
		name: 'instant death!!!',
		color: '#ff0000',
		icon: '<span class="pu-icon pu-death">✕</span>',
		apply(bot) {
			if (bot instanceof HydraBot) {
				for (let i = 0; i < 5; i++) {
					bot.game.spawnMidGame(HydraBot, bot.col, bot.row, bot.color, bot.health);
				}
				return;
			}
			bot.dead = true;
			for (const mate of (bot.teammates || [])) mate.dead = true;
		},
	},
	{
		id: 'fire',
		name: "He's on Fire!!",
		color: '#ff6600',
		icon: '<span class="pu-icon pu-fire">🔥</span>',
		apply(bot) {
			bot.onFire = true;
			if (bot.teammates) {
				for (const mate of bot.teammates) mate.onFire = true;
			}
		},
	},
	{
		id: 'territory-grab',
		name: 'Territory Grab',
		color: '#ffdd00',
		icon: '<span class="pu-icon pu-territory-grab">💥</span>',
		apply(bot) {
			const game = bot.game;
			const ab = game.activeBounds;
			const radius = 5;
			const rMin = Math.max(0, bot.row - radius);
			const rMax = Math.min(ROWS - 1, bot.row + radius);
			const cMin = Math.max(0, bot.col - radius);
			const cMax = Math.min(COLS - 1, bot.col + radius);
			for (let r = rMin; r <= rMax; r++) {
				for (let c = cMin; c <= cMax; c++) {
					if (Math.abs(r - bot.row) + Math.abs(c - bot.col) > radius) continue;
					if (ab && (c < ab.minCol || c > ab.maxCol || r < ab.minRow || r > ab.maxRow)) continue;
					if (game.cells[r][c] === null) game.cells[r][c] = bot;
				}
			}
		},
	},
	{
		id: 'freeze',
		name: 'Deep Freeze',
		color: '#88eeff',
		icon: '<span class="pu-icon pu-freeze">❄️</span>',
		apply(bot) {
			const game = bot.game;
			const collectorDefIndex = bot.defIndex;
			for (const b of game.bots) {
				if (!b.dead && b.defIndex !== collectorDefIndex) b.frozen = true;
			}
			if (game.freezeTimeout) clearTimeout(game.freezeTimeout);
			game.freezeTimeout = setTimeout(() => {
				for (const b of game.bots) b.frozen = false;
				game.freezeTimeout = null;
			}, 5000);
		},
	},
	{
		id: 'teleport',
		name: 'Teleport',
		color: '#cc88ff',
		icon: '<span class="pu-icon pu-teleport">🌀</span>',
		apply(bot) {
			const game = bot.game;
			const ab = game.activeBounds;
			const candidates = [];
			for (let r = 0; r < ROWS; r++) {
				for (let c = 0; c < COLS; c++) {
					if (game.cells[r][c] !== null) continue;
					if (ab && (c < ab.minCol || c > ab.maxCol || r < ab.minRow || r > ab.maxRow)) continue;
					candidates.push([c, r]);
				}
			}
			if (candidates.length === 0) return;
			const [c, r] = candidates[Math.floor(Math.random() * candidates.length)];
			game.moveBotTo(bot, c, r);
		},
	},
];

class Game {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		canvas.width = COLS * CELL_SIZE;
		canvas.height = ROWS * CELL_SIZE;
		this.cells = null;
		this.bots = [];
		this.powerups = new Map();
		this.powerupElements = new Map();
		this.collectedPowerups = new Map();
		this.interval = null;
		this.clockInterval = null;
		this.gameTimeout = null;
		this.gameStartTime = null;
		this.gameDuration = GAME_LENGTHS[0];
		this.currentSpeed = SPEEDS[2];
		this.gameMode = 0;
		this.tournamentWins = new Map();
		this.tournamentCumScore = new Map();
		this.tournamentRound = 0;
		this.tournamentTarget = 3;
		this.tournamentOver = false;
		this.activeBounds = null;
		this.shrinkInterval = null;
		this.damagedThisTick = new Set();
		this.brWinnerDefIndex = null;
		this.shimmerFrame = null;
		this.freezeTimeout = null;
	}

	start(resetTournament = true) {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
		if (this.clockInterval) {
			clearInterval(this.clockInterval);
			this.clockInterval = null;
		}
		if (this.gameTimeout) {
			clearTimeout(this.gameTimeout);
			this.gameTimeout = null;
		}
		if (this.shrinkInterval) {
			clearInterval(this.shrinkInterval);
			this.shrinkInterval = null;
		}
		if (this.shimmerFrame) {
			cancelAnimationFrame(this.shimmerFrame);
			this.shimmerFrame = null;
		}
		if (this.freezeTimeout) {
			clearTimeout(this.freezeTimeout);
			this.freezeTimeout = null;
		}
		this.brWinnerDefIndex = null;

		document.getElementById('tournament-overlay').classList.add('hidden');

		const modeRadio = document.querySelector('input[name="game-mode"]:checked');
		const newMode = modeRadio ? parseInt(modeRadio.value, 10) : 0;
		const shouldReset = resetTournament || newMode !== this.gameMode;
		this.gameMode = newMode;

		if (shouldReset || this.gameMode !== 1) {
			this.tournamentWins = new Map();
			this.tournamentCumScore = new Map();
			this.tournamentRound = 0;
			this.tournamentOver = false;
		}
		if (this.gameMode === 1) {
			this.tournamentRound++;
		}

		const scorePanelTitle = document.querySelector('.score-panel-title');
		if (scorePanelTitle) {
			scorePanelTitle.textContent = this.gameMode === 1 ? `round ${this.tournamentRound}` : 'Scores';
		}

		if (this.gameMode === 2) {
			this.activeBounds = { minCol: 0, maxCol: COLS - 1, minRow: 0, maxRow: ROWS - 1 };
			this.shrinkInterval = setInterval(() => this.shrinkPerimeter(), 10000);
		} else {
			this.activeBounds = null;
		}
		this.damagedThisTick = new Set();

		const boardSizeRadio = document.querySelector('input[name="board-size"]:checked');
		const boardSize = BOARD_SIZES[boardSizeRadio ? parseInt(boardSizeRadio.value, 10) : 0];
		COLS = boardSize.cols;
		ROWS = boardSize.rows;
		this.canvas.width  = COLS * CELL_SIZE;
		this.canvas.height = ROWS * CELL_SIZE;

		document.querySelectorAll('.speed-indicator').forEach(el => el.textContent = '');
		this.collectedPowerups = new Map();
		this.cells = Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
		const activeDefs = BOT_DEFS.filter((_, i) => {
			const cb = document.querySelector(`.bot-checkbox[data-index="${i}"]`);
			return cb ? cb.checked : true;
		});
		this.bots = this.spawnBots(activeDefs);
		this.placePowerups();
		this.render();
		this.interval = setInterval(() => this.tick(), this.currentSpeed);

		const lengthSlider = document.getElementById('game-length');
		this.gameDuration = GAME_LENGTHS[lengthSlider ? parseInt(lengthSlider.value, 10) : 0];

		this.gameStartTime = Date.now();
		this.clockInterval = setInterval(() => this.updateClock(), 50);
		this.updateClock();
		if (this.gameDuration !== Infinity) {
			this.gameTimeout = setTimeout(() => this.endGame(), this.gameDuration);
		}
	}

	spawnBots(defs) {
		const used = new Set();
		return defs.flatMap((def) => {
			const { Class, color, size = 1, ticksPerMove = 20, count = 1 } = def;
			let col, row;
			do {
				col = Math.floor(Math.random() * (COLS - size + 1));
				row = Math.floor(Math.random() * (ROWS - size + 1));
			} while (
				Array.from({ length: size }, (_, dr) =>
					Array.from({ length: size }, (_, dc) => `${col+dc},${row+dr}`)
				).flat().some(k => used.has(k))
			);
			for (let dr = 0; dr < size; dr++) {
				for (let dc = 0; dc < size; dc++) {
					used.add(`${col+dc},${row+dr}`);
					this.cells[row+dr][col+dc] = null;
				}
			}
			const group = [];
			for (let n = 0; n < count; n++) {
				const bot = new Class(this, col, row, color);
				bot.defIndex = BOT_DEFS.indexOf(def);
				bot.movesSinceNewLand = 0;
				bot.ticksPerMove = ticksPerMove;
				bot.moveCooldown = 0;
				if (this.gameMode === 2) bot.health = 100;
				group.push(bot);
			}
			if (group.length > 1) {
				for (const bot of group) {
					bot.teammates = group.filter(b => b !== bot);
				}
				group[0].isLeader = true;
				if (typeof group[0].onGroupReady === 'function') {
					group[0].onGroupReady();
				}
			}
			for (let dr = 0; dr < size; dr++) {
				for (let dc = 0; dc < size; dc++) {
					this.cells[row+dr][col+dc] = group[group.length - 1];
				}
			}
			return group;
		});
	}

	placePowerups() {
		this.powerups = new Map();
		this.powerupElements = new Map();
		const overlay = document.getElementById('powerup-overlay');
		overlay.innerHTML = '';

		const countSlider = document.getElementById('powerup-count');
		const totalCount = countSlider ? parseInt(countSlider.value, 10) : 3;

		const enabledDefs = POWERUP_DEFS.filter((_, i) => {
			const cb = document.querySelector(`.powerup-checkbox[data-index="${i}"]`);
			return cb ? cb.checked : true;
		});
		if (enabledDefs.length === 0) return;

		let placed = 0;
		let attempts = 0;
		while (placed < totalCount && attempts < 10000) {
			attempts++;
			const c = Math.floor(Math.random() * COLS);
			const r = Math.floor(Math.random() * ROWS);
			const key = `${c},${r}`;
			if (this.cells[r][c] === null && !this.powerups.has(key)) {
				const def = enabledDefs[Math.floor(Math.random() * enabledDefs.length)];
				this.powerups.set(key, def);
				const el = document.createElement('div');
				el.className = `powerup-block powerup-${def.id}`;
				el.style.left = (c * CELL_SIZE + 1) + 'px';
				el.style.top  = (r * CELL_SIZE + 1) + 'px';
				overlay.appendChild(el);
				this.powerupElements.set(key, el);
				placed++;
			}
		}
	}

	collectPowerup(bot, key) {
		if (this.powerups.has(key)) {
			const def = this.powerups.get(key);
			def.apply(bot);
			if (bot.defIndex !== undefined) {
				if (!this.collectedPowerups.has(bot.defIndex)) {
					this.collectedPowerups.set(bot.defIndex, new Set());
				}
				this.collectedPowerups.get(bot.defIndex).add(def.id);
			}
			this.powerups.delete(key);
			if (this.powerupElements.has(key)) {
				this.powerupElements.get(key).remove();
				this.powerupElements.delete(key);
			}
		}
	}

	tick() {
		this.damagedThisTick = new Set();

		for (const bot of this.bots) {
			if (!bot.dead && !bot.frozen) {
				bot.moveCooldown++;
				if (bot.moveCooldown >= bot.ticksPerMove) {
					bot.moveCooldown = 0;
					if (!bot.makeMove()) {
						bot.dead = true;
						if (this.gameMode === 2) {
							for (const b of this.bots) {
								if (b.defIndex === bot.defIndex) b.dead = true;
							}
							this.clearDefIndexCells(bot.defIndex);
						}
					}
				}
			}
		}

		this.render();

		if (this.gameMode === 2) {
			const aliveTypes = new Set(
				this.bots.filter(b => !b.dead && b.defIndex !== undefined).map(b => b.defIndex)
			);
			if (aliveTypes.size <= 1) this.endGame();
		} else if (this.bots.every(b => b.dead)) {
			this.endGame();
		}
	}

	render() {
		const ctx = this.ctx;
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		const drawn = new Set();
		const ab = this.activeBounds;
		for (let r = 0; r < ROWS; r++) {
			for (let c = 0; c < COLS; c++) {
				if (drawn.has(r * COLS + c)) continue;
				if (ab && (c < ab.minCol || c > ab.maxCol || r < ab.minRow || r > ab.maxRow)) continue;
				const bot = this.cells[r][c];
				const x = c * CELL_SIZE + 1;
				const y = r * CELL_SIZE + 1;
				if (
					bot && bot.size === 2 &&
					c + 1 < COLS && r + 1 < ROWS &&
					this.cells[r][c + 1] === bot &&
					this.cells[r + 1][c] === bot &&
					this.cells[r + 1][c + 1] === bot
				) {
					ctx.fillStyle = bot.color;
					ctx.fillRect(x, y, CELL_SIZE * 2 - 2, CELL_SIZE * 2 - 2);
					drawn.add(r * COLS + (c + 1));
					drawn.add((r + 1) * COLS + c);
					drawn.add((r + 1) * COLS + (c + 1));
				} else {
					ctx.fillStyle = bot ? bot.color : '#555555';
					ctx.fillRect(x, y, 8, 8);
				}
			}
		}

		for (const bot of this.bots) {
			if (this.gameMode === 2 && bot.dead) continue;
			this.drawBot(bot);
		}

		this.updateScores();
	}

	drawBot(bot) {
		const ctx = this.ctx;
		const s = bot.size || 1;
		const x = bot.col * CELL_SIZE + 1;
		const y = bot.row * CELL_SIZE + 1;
		const w = s * CELL_SIZE - 2;
		const h = s * CELL_SIZE - 2;

		if (bot.dead) {
			ctx.fillStyle = '#000000';
			ctx.fillRect(x, y, w, h);
			ctx.fillStyle = bot.color;
			ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
			ctx.strokeStyle = '#ff0000';
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(x + 1, y + 1);
			ctx.lineTo(x + w - 1, y + h - 1);
			ctx.moveTo(x + w - 1, y + 1);
			ctx.lineTo(x + 1, y + h - 1);
			ctx.stroke();
		} else if (this.brWinnerDefIndex !== null && bot.defIndex === this.brWinnerDefIndex) {
			const t = (Math.sin(Date.now() / 400) + 1) / 2;
			const g = Math.round(255 - t * 40);
			const b = Math.round(255 * (1 - t));
			ctx.fillStyle = `rgb(255,${g},${b})`;
			ctx.fillRect(x, y, w, h);
			ctx.fillStyle = bot.color;
			ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
		} else if (bot.onFire) {
			const t = (Math.sin(Date.now() / 150) + 1) / 2;
			const g = Math.round(t * 255);
			const b = Math.round(Math.max(0, t * 2 - 1) * 255);
			ctx.fillStyle = `rgb(255,${g},${b})`;
			ctx.fillRect(x, y, w, h);
			ctx.fillStyle = bot.color;
			ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
		} else if (bot.frozen) {
			const t = (Math.sin(Date.now() / 300) + 1) / 2;
			const r = Math.round(136 + t * 119);
			const g = Math.round(221 + t * 34);
			ctx.fillStyle = `rgb(${r},${g},255)`;
			ctx.fillRect(x, y, w, h);
			ctx.fillStyle = bot.color;
			ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
		} else {
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(x, y, w, h);
			ctx.fillStyle = bot.color;
			ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
		}
	}

	canMoveTo(col, row, bot) {
		if (bot.dead) return false;
		if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
		if (this.gameMode === 2 && this.activeBounds) {
			const b = this.activeBounds;
			if (col < b.minCol || col > b.maxCol || row < b.minRow || row > b.maxRow) return false;
		}
		if (bot.onFire) return true;
		const cell = this.cells[row][col];
		const sameType = cell !== null && cell.defIndex !== undefined && cell.defIndex === bot.defIndex;
		if (this.gameMode === 2 && cell !== null && cell !== bot && !cell.dead && !sameType) {
			if (!this.damagedThisTick.has(bot)) {
				this.damagedThisTick.add(bot);
				bot.health -= 5;
				if (bot.health <= 0) {
					bot.health = 0;
					for (const b of this.bots) {
						if (b.defIndex === bot.defIndex) b.dead = true;
					}
					this.clearDefIndexCells(bot.defIndex);
				}
			}
			return false;
		}
		return cell === null || cell === bot || sameType || (this.gameMode === 2 && cell !== null && cell.dead);
	}

	clearDefIndexCells(defIndex) {
		for (let r = 0; r < ROWS; r++) {
			for (let c = 0; c < COLS; c++) {
				if (this.cells[r][c] !== null && this.cells[r][c].defIndex === defIndex) {
					this.cells[r][c] = null;
				}
			}
		}
	}

	moveBotTo(bot, col, row) {
		const key = `${col},${row}`;
		this.collectPowerup(bot, key);
		if (this.cells[row][col] === null) {
			bot.movesSinceNewLand = 0;
		} else {
			bot.movesSinceNewLand++;
		}
		bot.col = col;
		bot.row = row;
		this.cells[row][col] = bot;
	}

	spawnMidGame(Class, col, row, color, health = 100) {
		const bot = new Class(this, col, row, color);
		bot.defIndex = BOT_DEFS.findIndex(d => d.Class === Class);
		bot.movesSinceNewLand = 0;
		bot.ticksPerMove = 20;
		bot.moveCooldown = 0;
		if (this.gameMode === 2) bot.health = health;
		this.cells[row][col] = bot;
		this.bots.push(bot);
	}

	endGame() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
		if (this.gameTimeout) {
			clearTimeout(this.gameTimeout);
			this.gameTimeout = null;
		}
		if (this.shrinkInterval) {
			clearInterval(this.shrinkInterval);
			this.shrinkInterval = null;
		}
		clearInterval(this.clockInterval);
		this.clockInterval = null;
		if (this.gameMode === 2) {
			const winnerTypes = [...new Set(
				this.bots.filter(b => !b.dead && b.defIndex !== undefined).map(b => b.defIndex)
			)];
			this.brWinnerDefIndex = winnerTypes.length === 1 ? winnerTypes[0] : null;
			const loserDefIndexes = new Set();
			for (const bot of this.bots) {
				if (bot.defIndex !== this.brWinnerDefIndex) {
					bot.dead = true;
					loserDefIndexes.add(bot.defIndex);
				}
			}
			for (const defIndex of loserDefIndexes) {
				this.clearDefIndexCells(defIndex);
			}
		} else {
			for (const bot of this.bots) bot.dead = true;
		}
		this.render();
		if (this.brWinnerDefIndex !== null) {
			const shimmer = () => {
				if (this.interval) return;
				this.render();
				this.shimmerFrame = requestAnimationFrame(shimmer);
			};
			this.shimmerFrame = requestAnimationFrame(shimmer);
		}

		if (this.gameMode === 1) {
			this.handleTournamentRoundEnd();
			return;
		}

		const el = document.getElementById('clock-display');
		if (el) {
			el.textContent = 'game over';
			el.classList.remove('clock-urgent');
			el.classList.add('clock-done');
		}
	}

	shrinkPerimeter() {
		const b = this.activeBounds;
		if (!b || this.gameMode !== 2) return;
		if (b.maxCol - b.minCol < 2 || b.maxRow - b.minRow < 2) return;

		b.minCol++;
		b.maxCol--;
		b.minRow++;
		b.maxRow--;

		const perimeterKilled = new Set();
		for (const bot of this.bots) {
			if (bot.dead) continue;
			const s = bot.size || 1;
			let outside = false;
			for (let dc = 0; dc < s && !outside; dc++) {
				for (let dr = 0; dr < s && !outside; dr++) {
					if (
						bot.col + dc < b.minCol || bot.col + dc > b.maxCol ||
						bot.row + dr < b.minRow || bot.row + dr > b.maxRow
					) outside = true;
				}
			}
			if (outside) perimeterKilled.add(bot.defIndex);
		}
		for (const bot of this.bots) {
			if (perimeterKilled.has(bot.defIndex)) bot.dead = true;
		}
		for (const defIndex of perimeterKilled) {
			this.clearDefIndexCells(defIndex);
		}

		this.render();

		const aliveTypes = new Set(
			this.bots.filter(bot => !bot.dead && bot.defIndex !== undefined).map(bot => bot.defIndex)
		);
		if (aliveTypes.size <= 1) this.endGame();
	}

	handleTournamentRoundEnd() {
		const roundScores = new Map();
		for (let r = 0; r < ROWS; r++) {
			for (let c = 0; c < COLS; c++) {
				const bot = this.cells[r][c];
				if (bot !== null && bot.defIndex !== undefined && bot.defIndex >= 0) {
					roundScores.set(bot.defIndex, (roundScores.get(bot.defIndex) || 0) + 1);
				}
			}
		}

		for (const [defIdx, score] of roundScores) {
			this.tournamentCumScore.set(defIdx, (this.tournamentCumScore.get(defIdx) || 0) + score);
		}

		let maxScore = 0;
		for (const score of roundScores.values()) {
			if (score > maxScore) maxScore = score;
		}

		const roundWinners = [];
		if (maxScore > 0) {
			for (const [defIdx, score] of roundScores) {
				if (score === maxScore) {
					roundWinners.push(defIdx);
					this.tournamentWins.set(defIdx, (this.tournamentWins.get(defIdx) || 0) + 1);
				}
			}
		}

		const tournamentWinners = [];
		for (const [defIdx, wins] of this.tournamentWins) {
			if (wins >= this.tournamentTarget) tournamentWinners.push(defIdx);
		}

		this.tournamentOver = tournamentWinners.length > 0;
		this.showTournamentPopup(this.tournamentOver, roundWinners, roundScores, tournamentWinners);
	}

	showTournamentPopup(isFinal, roundWinners, roundScores, tournamentWinners) {
		const title = document.getElementById('tournament-title');
		const champion = document.getElementById('tournament-champion');
		const roundResult = document.getElementById('tournament-round-result');
		const standings = document.getElementById('tournament-standings');
		const nextBtn = document.getElementById('tournament-next-btn');

		title.textContent = isFinal ? 'tournament over' : `round ${this.tournamentRound} complete`;

		if (isFinal) {
			const names = tournamentWinners.map(idx => BOT_DEFS[idx]?.name || '').join(' & ');
			champion.innerHTML = `<div class="tournament-champion-label">tournament champion</div><div class="tournament-champion-name">${names}</div>`;
			champion.classList.remove('hidden');
		} else {
			champion.innerHTML = '';
			champion.classList.add('hidden');
		}

		roundResult.innerHTML = '';
		const label = document.createElement('div');
		label.className = 'tournament-round-result-label';
		label.textContent = `round ${this.tournamentRound} winner${roundWinners.length !== 1 ? 's' : ''}`;
		roundResult.appendChild(label);

		if (roundWinners.length === 0) {
			const none = document.createElement('div');
			none.style.cssText = 'font-size:0.82em;color:#555555';
			none.textContent = 'no winner';
			roundResult.appendChild(none);
		} else {
			for (const defIdx of roundWinners) {
				const def = BOT_DEFS[defIdx];
				if (!def) continue;
				const row = document.createElement('div');
				row.className = 'tournament-winner-row';
				row.innerHTML = `<span class="t-col-swatch" style="background:${def.color}"></span><span style="color:#ffffff">${def.name}</span><span style="color:#666666;flex:1;text-align:right">${roundScores.get(defIdx) || 0} cells</span>`;
				roundResult.appendChild(row);
			}
		}

		standings.innerHTML = '';
		const allDefIdxs = new Set([...this.tournamentWins.keys(), ...this.tournamentCumScore.keys()]);
		const allEntries = [];
		for (const defIdx of allDefIdxs) {
			allEntries.push({
				defIdx,
				wins: this.tournamentWins.get(defIdx) || 0,
				cumScore: this.tournamentCumScore.get(defIdx) || 0,
			});
		}
		allEntries.sort((a, b) => b.wins - a.wins || b.cumScore - a.cumScore);
		const topWins = allEntries.length ? allEntries[0].wins : 0;

		const header = document.createElement('div');
		header.className = 'tournament-standings-header';
		header.innerHTML = `<span style="width:10px;flex-shrink:0"></span><span style="flex:1">bot</span><span class="t-col-wins">wins</span><span class="t-col-score">score</span>`;
		standings.appendChild(header);

		for (const { defIdx, wins, cumScore } of allEntries) {
			const def = BOT_DEFS[defIdx];
			if (!def) continue;
			const isLeader = wins > 0 && wins === topWins;
			const row = document.createElement('div');
			row.className = 'tournament-standings-row' + (isLeader ? ' t-leader' : '');
			const winStr = wins > 0 ? '★'.repeat(wins) : '—';
			row.innerHTML = `<span class="t-col-swatch" style="background:${def.color}"></span><span class="t-col-name">${def.name}</span><span class="t-col-wins">${winStr}</span><span class="t-col-score">${cumScore}</span>`;
			standings.appendChild(row);
		}

		nextBtn.textContent = isFinal ? 'new tournament' : 'next round';
		document.getElementById('tournament-overlay').classList.remove('hidden');
	}

	updateClock() {
		const el = document.getElementById('clock-display');
		if (!el) return;
		el.classList.remove('clock-done');
		if (this.gameDuration === Infinity) {
			el.textContent = '∞';
			el.classList.remove('clock-urgent');
			return;
		}
		const remaining = Math.max(0, this.gameDuration - (Date.now() - this.gameStartTime));
		if (remaining <= 10000) {
			el.textContent = (remaining / 1000).toFixed(2) + 's';
			el.classList.add('clock-urgent');
		} else {
			el.textContent = Math.ceil(remaining / 1000) + 's';
			el.classList.remove('clock-urgent');
		}
	}

	updateScores() {
		if (this.gameMode === 2) {
			this.updateBattleRoyaleScores();
			return;
		}

		const scores = new Map();
		for (let r = 0; r < ROWS; r++) {
			for (let c = 0; c < COLS; c++) {
				const bot = this.cells[r][c];
				if (bot !== null && bot.defIndex !== undefined && bot.defIndex >= 0) {
					scores.set(bot.defIndex, (scores.get(bot.defIndex) || 0) + 1);
				}
			}
		}

		const entries = [];
		for (const [defIdx, score] of scores) {
			entries.push({ defIdx, score });
		}
		entries.sort((a, b) => b.score - a.score);
		const maxScore = entries.length ? entries[0].score : 0;

		const list = document.getElementById('score-list');
		list.innerHTML = '';
		for (const { defIdx, score } of entries) {
			const def = BOT_DEFS[defIdx];
			if (!def) continue;
			const collected = this.collectedPowerups.get(defIdx) || new Set();
			const iconHtml = POWERUP_DEFS
				.filter(p => collected.has(p.id))
				.map(p => p.icon)
				.join('');
			const row = document.createElement('div');
			row.className = 'score-item' + (score === maxScore ? ' score-leader' : '');
			row.innerHTML = `<span class="bot-swatch" style="background:${def.color}"></span><span class="score-name">${def.name}</span>${iconHtml}<span class="score-value">${score}</span>`;
			list.appendChild(row);
		}
	}

	updateBattleRoyaleScores() {
		const allDefIndices = new Set(
			this.bots.filter(b => b.defIndex !== undefined).map(b => b.defIndex)
		);

		const healthSums = new Map();
		const healthCounts = new Map();
		for (const bot of this.bots) {
			if (!bot.dead && bot.defIndex !== undefined) {
				healthSums.set(bot.defIndex, (healthSums.get(bot.defIndex) || 0) + (bot.health || 0));
				healthCounts.set(bot.defIndex, (healthCounts.get(bot.defIndex) || 0) + 1);
			}
		}

		const entries = [];
		for (const defIdx of allDefIndices) {
			const count = healthCounts.get(defIdx) || 0;
			const avgHealth = count > 0 ? (healthSums.get(defIdx) || 0) / count : 0;
			entries.push({ defIdx, avgHealth, alive: count > 0 });
		}
		entries.sort((a, b) => b.avgHealth - a.avgHealth);
		const maxHealth = entries.length && entries[0].alive ? entries[0].avgHealth : 0;

		const list = document.getElementById('score-list');
		list.innerHTML = '';
		for (const { defIdx, avgHealth, alive } of entries) {
			const def = BOT_DEFS[defIdx];
			if (!def) continue;
			const collected = this.collectedPowerups.get(defIdx) || new Set();
			const iconHtml = POWERUP_DEFS
				.filter(p => collected.has(p.id))
				.map(p => p.icon)
				.join('');
			const isLeader = alive && avgHealth > 0 && avgHealth === maxHealth;
			const row = document.createElement('div');
			row.className = 'score-item' + (isLeader ? ' score-leader' : '');
			row.innerHTML = `<span class="bot-swatch" style="background:${def.color}"></span><span class="score-name">${def.name}</span>${iconHtml}<span class="score-value">${Math.round(avgHealth)}</span>${buildHealthBar(avgHealth)}`;
			list.appendChild(row);
		}
	}

	setSpeed(speedMs) {
		this.currentSpeed = speedMs;
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = setInterval(() => this.tick(), this.currentSpeed);
		}
	}
}

function buildHealthBar(health) {
	const boxes = [];
	if (health > 0) {
		let cls = 'hb-green';
		if (health <= 20) cls = 'hb-red hb-blink';
		else if (health <= 30) cls = 'hb-yellow';
		boxes.push(`<span class="health-box ${cls}"></span>`);
	}
	if (health > 40) {
		let cls = 'hb-green';
		if (health <= 50) cls = 'hb-red';
		else if (health <= 60) cls = 'hb-yellow';
		boxes.push(`<span class="health-box ${cls}"></span>`);
	}
	if (health > 70) {
		let cls = 'hb-green';
		if (health <= 80) cls = 'hb-red';
		else if (health <= 90) cls = 'hb-yellow';
		boxes.push(`<span class="health-box ${cls}"></span>`);
	}
	return `<span class="health-bar">${boxes.join('')}</span>`;
}

function buildBotPanel() {
	const list = document.getElementById('bot-list');
	BOT_DEFS.forEach((def, i) => {
		const label = document.createElement('label');
		label.className = 'bot-item';
		label.innerHTML = `
			<input type="checkbox" class="bot-checkbox" data-index="${i}" checked>
			<span class="bot-swatch" style="background:${def.color}"></span>
			<span class="bot-name">${def.name}</span>
			<span class="speed-indicator" id="speed-indicator-${i}"></span>
		`;
		list.appendChild(label);
	});
}

function buildPowerupPanel() {
	const list = document.getElementById('powerup-list');
	POWERUP_DEFS.forEach((def, i) => {
		const label = document.createElement('label');
		label.className = 'powerup-item';
		label.innerHTML = `
			<input type="checkbox" class="powerup-checkbox" data-index="${i}" checked>
			<span class="powerup-name">${def.name}</span>
			${def.icon || ''}
		`;
		list.appendChild(label);
	});
}

const canvas = document.getElementById('grid');
const game = new Game(canvas);
buildBotPanel();
buildPowerupPanel();

function initDefaultSettings() {
	document.querySelectorAll('.bot-checkbox').forEach(cb => cb.checked = false);
	const indices = BOT_DEFS.map((_, i) => i);
	for (let i = indices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[indices[i], indices[j]] = [indices[j], indices[i]];
	}
	indices.slice(0, 5).forEach(i => {
		const cb = document.querySelector(`.bot-checkbox[data-index="${i}"]`);
		if (cb) cb.checked = true;
	});

	const fireIdx = POWERUP_DEFS.findIndex(d => d.id === 'fire');
	if (fireIdx >= 0) {
		const cb = document.querySelector(`.powerup-checkbox[data-index="${fireIdx}"]`);
		if (cb) cb.checked = false;
	}

	const glSlider = document.getElementById('game-length');
	glSlider.value = 1;
	document.getElementById('game-length-display').textContent = GAME_LENGTH_LABELS[1];

	const bsRadio = document.querySelector('input[name="board-size"][value="1"]');
	if (bsRadio) bsRadio.checked = true;
}

initDefaultSettings();

const speedSlider = document.getElementById('speed');
const speedDisplay = document.getElementById('speed-display');

speedSlider.addEventListener('input', () => {
	const idx = parseInt(speedSlider.value, 10);
	speedDisplay.textContent = SPEED_LABELS[idx];
	game.setSpeed(SPEEDS[idx]);
});

const modalOverlay = document.getElementById('settings-overlay');

function snapshotSettings() {
	return {
		bots: Array.from(document.querySelectorAll('.bot-checkbox')).map(cb => cb.checked),
		powerups: Array.from(document.querySelectorAll('.powerup-checkbox')).map(cb => cb.checked),
		powerupCount: document.getElementById('powerup-count').value,
		gameLength: document.getElementById('game-length').value,
		gameMode: document.querySelector('input[name="game-mode"]:checked')?.value ?? '0',
		boardSize: document.querySelector('input[name="board-size"]:checked')?.value ?? '0',
	};
}

function restoreSettings(snapshot) {
	document.querySelectorAll('.bot-checkbox').forEach((cb, i) => cb.checked = snapshot.bots[i]);
	document.querySelectorAll('.powerup-checkbox').forEach((cb, i) => cb.checked = snapshot.powerups[i]);
	const pcSlider = document.getElementById('powerup-count');
	pcSlider.value = snapshot.powerupCount;
	document.getElementById('powerup-count-display').textContent = snapshot.powerupCount;
	const glSlider = document.getElementById('game-length');
	glSlider.value = snapshot.gameLength;
	document.getElementById('game-length-display').textContent = GAME_LENGTH_LABELS[snapshot.gameLength];
	const gmRadio = document.querySelector(`input[name="game-mode"][value="${snapshot.gameMode}"]`);
	if (gmRadio) gmRadio.checked = true;
	const bsRadio = document.querySelector(`input[name="board-size"][value="${snapshot.boardSize}"]`);
	if (bsRadio) bsRadio.checked = true;
}

let settingsSnapshot = null;

document.getElementById('new-game').addEventListener('click', () => {
	game.start();
});

document.getElementById('tournament-next-btn').addEventListener('click', () => {
	game.start(game.tournamentOver);
});

document.getElementById('settings').addEventListener('click', () => {
	settingsSnapshot = snapshotSettings();
	modalOverlay.classList.remove('hidden');
});

document.getElementById('modal-cancel').addEventListener('click', () => {
	if (settingsSnapshot) restoreSettings(settingsSnapshot);
	modalOverlay.classList.add('hidden');
});

document.getElementById('modal-ok').addEventListener('click', () => {
	modalOverlay.classList.add('hidden');
});

const whatOverlay = document.getElementById('what-overlay');
document.getElementById('what').addEventListener('click', () => {
	whatOverlay.classList.remove('hidden');
});
document.getElementById('what-ok').addEventListener('click', () => {
	whatOverlay.classList.add('hidden');
});

const powerupCountSlider = document.getElementById('powerup-count');
const powerupCountDisplay = document.getElementById('powerup-count-display');
powerupCountSlider.addEventListener('input', () => {
	powerupCountDisplay.textContent = powerupCountSlider.value;
});

const gameLengthSlider = document.getElementById('game-length');
const gameLengthDisplay = document.getElementById('game-length-display');
gameLengthSlider.addEventListener('input', () => {
	gameLengthDisplay.textContent = GAME_LENGTH_LABELS[parseInt(gameLengthSlider.value, 10)];
});

game.start();
