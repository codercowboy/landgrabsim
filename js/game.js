const COLS = 100;
const ROWS = 50;
const CELL_SIZE = 10;

const SPEEDS = [5000, 2000, 1000, 500, 250, 125, 62, 31, 16, 8, 4];
const SPEED_LABELS = ['5s', '2s', '1s', '1/2s', '1/4s', '1/8s', '1/16s', '1/32s', '1/64s', '1/128s', '1/256s'];

const BOT_DEFS = [
	{ Class: AirportLineBot, name: 'Airport Line', color: '#4488ff', size: 1 },
	{ Class: ChaosBot,       name: 'Chaos',        color: '#ff8800', size: 1 },
	{ Class: LawnmowerBot,   name: 'Lawnmower',    color: '#44cc44', size: 1 },
	{ Class: GenghisBot,     name: 'Genghis',      color: '#cc2222', size: 1 },
	{ Class: BigBoyBot,      name: 'Big Boy',      color: '#ffdd00', size: 2 },
	{ Class: HydraBot,       name: 'Hydra',        color: '#aa44ff', size: 1 },
];

class Game {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		canvas.width = COLS * CELL_SIZE;
		canvas.height = ROWS * CELL_SIZE;
		this.cells = null;
		this.bots = [];
		this.interval = null;
		this.currentSpeed = SPEEDS[9];
	}

	start() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}

		this.cells = Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
		const activeDefs = BOT_DEFS.filter((_, i) => {
			const cb = document.querySelector(`.bot-checkbox[data-index="${i}"]`);
			return cb ? cb.checked : true;
		});
		this.bots = this.spawnBots(activeDefs);
		this.render();
		this.interval = setInterval(() => this.tick(), this.currentSpeed);
	}

	spawnBots(defs) {
		const used = new Set();
		return defs.map(({ Class, color, size = 1 }) => {
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
			const bot = new Class(this, col, row, color);
			bot.movesSinceNewLand = 0;
			for (let dr = 0; dr < size; dr++) {
				for (let dc = 0; dc < size; dc++) {
					this.cells[row+dr][col+dc] = bot;
				}
			}
			return bot;
		});
	}

	tick() {
		for (const bot of this.bots) {
			if (!bot.dead) {
				if (!bot.makeMove() || bot.movesSinceNewLand >= 100) {
					bot.dead = true;
				}
			}
		}

		this.render();

		if (this.bots.every(b => b.dead)) {
			clearInterval(this.interval);
			this.interval = null;
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
		} else {
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(x, y, w, h);
			ctx.fillStyle = bot.color;
			ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
		}
	}

	canMoveTo(col, row, bot) {
		if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
		const cell = this.cells[row][col];
		return cell === null || cell === bot;
	}

	moveBotTo(bot, col, row) {
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
		bot.movesSinceNewLand = 0;
		this.cells[row][col] = bot;
		this.bots.push(bot);
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
		`;
		list.appendChild(label);
	});
}

const canvas = document.getElementById('grid');
const game = new Game(canvas);
buildBotPanel();

const speedSlider = document.getElementById('speed');
const speedDisplay = document.getElementById('speed-display');

speedSlider.addEventListener('input', () => {
	const idx = parseInt(speedSlider.value, 10);
	speedDisplay.textContent = SPEED_LABELS[idx];
	game.setSpeed(SPEEDS[idx]);
});

document.getElementById('run-again').addEventListener('click', () => game.start());

game.start();
