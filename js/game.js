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
			bot.ticksPerMove = 5;
			if (bot.teammates) {
				for (const mate of bot.teammates) mate.ticksPerMove = 5;
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
				game.spawnMidGame(HydraBot, bot.col, bot.row, bot.color);
				game.spawnMidGame(HydraBot, bot.col, bot.row, bot.color);
				return;
			}
			const def = BOT_DEFS[bot.defIndex];
			if (!def) return;
			const newBot = new def.Class(game, bot.col, bot.row, bot.color);
			newBot.defIndex = bot.defIndex;
			newBot.movesSinceNewLand = 0;
			newBot.ticksPerMove = bot.ticksPerMove;
			newBot.moveCooldown = 0;
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
					bot.game.spawnMidGame(HydraBot, bot.col, bot.row, bot.color);
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
	}

	start() {
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

		const boardSizeSlider = document.getElementById('board-size');
		const boardSize = BOARD_SIZES[boardSizeSlider ? parseInt(boardSizeSlider.value, 10) : 0];
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
		for (const bot of this.bots) {
			if (!bot.dead) {
				bot.moveCooldown++;
				if (bot.moveCooldown >= bot.ticksPerMove) {
					bot.moveCooldown = 0;
					if (!bot.makeMove()) {
						bot.dead = true;
					}
				}
			}
		}

		this.render();

		if (this.bots.every(b => b.dead)) {
			clearInterval(this.interval);
			this.interval = null;
			clearTimeout(this.gameTimeout);
			this.gameTimeout = null;
			clearInterval(this.clockInterval);
			this.clockInterval = null;
		}
	}

	render() {
		const ctx = this.ctx;
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		const drawn = new Set();
		for (let r = 0; r < ROWS; r++) {
			for (let c = 0; c < COLS; c++) {
				if (drawn.has(r * COLS + c)) continue;
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
		} else if (bot.onFire) {
			const t = (Math.sin(Date.now() / 150) + 1) / 2;
			const g = Math.round(t * 255);
			const b = Math.round(Math.max(0, t * 2 - 1) * 255);
			ctx.fillStyle = `rgb(255,${g},${b})`;
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
		if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
		if (bot.onFire) return true;
		const cell = this.cells[row][col];
		return cell === null || cell === bot;
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

	spawnMidGame(Class, col, row, color) {
		const bot = new Class(this, col, row, color);
		bot.defIndex = BOT_DEFS.findIndex(d => d.Class === Class);
		bot.movesSinceNewLand = 0;
		bot.ticksPerMove = 20;
		bot.moveCooldown = 0;
		this.cells[row][col] = bot;
		this.bots.push(bot);
	}

	endGame() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
		clearInterval(this.clockInterval);
		this.clockInterval = null;
		for (const bot of this.bots) bot.dead = true;
		this.render();
		const el = document.getElementById('clock-display');
		if (el) {
			el.textContent = 'game over';
			el.classList.remove('clock-urgent');
			el.classList.add('clock-done');
		}
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

	setSpeed(speedMs) {
		this.currentSpeed = speedMs;
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = setInterval(() => this.tick(), this.currentSpeed);
		}
	}
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

const speedSlider = document.getElementById('speed');
const speedDisplay = document.getElementById('speed-display');

speedSlider.addEventListener('input', () => {
	const idx = parseInt(speedSlider.value, 10);
	speedDisplay.textContent = SPEED_LABELS[idx];
	game.setSpeed(SPEEDS[idx]);
});

const modalOverlay = document.getElementById('modal-overlay');

function snapshotSettings() {
	return {
		bots: Array.from(document.querySelectorAll('.bot-checkbox')).map(cb => cb.checked),
		powerups: Array.from(document.querySelectorAll('.powerup-checkbox')).map(cb => cb.checked),
		powerupCount: document.getElementById('powerup-count').value,
		gameLength: document.getElementById('game-length').value,
		gameMode: document.getElementById('game-mode').value,
		boardSize: document.getElementById('board-size').value,
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
	const gmSlider = document.getElementById('game-mode');
	gmSlider.value = snapshot.gameMode;
	document.getElementById('game-mode-display').textContent = MODE_LABELS[snapshot.gameMode];
	const bsSlider = document.getElementById('board-size');
	bsSlider.value = snapshot.boardSize;
	document.getElementById('board-size-display').textContent = BOARD_SIZES[snapshot.boardSize].label;
}

let settingsSnapshot = null;

document.getElementById('new-game').addEventListener('click', () => {
	game.start();
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

const gameModeSlider = document.getElementById('game-mode');
const gameModeDisplay = document.getElementById('game-mode-display');
gameModeSlider.addEventListener('input', () => {
	gameModeDisplay.textContent = MODE_LABELS[parseInt(gameModeSlider.value, 10)];
});

const boardSizeSlider = document.getElementById('board-size');
const boardSizeDisplay = document.getElementById('board-size-display');
boardSizeSlider.addEventListener('input', () => {
	boardSizeDisplay.textContent = BOARD_SIZES[parseInt(boardSizeSlider.value, 10)].label;
});

game.start();
