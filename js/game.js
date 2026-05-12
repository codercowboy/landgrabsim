const COLS = 100;
const ROWS = 50;
const CELL_SIZE = 10;

const SPEEDS = [5000, 2000, 1000, 500, 250, 125, 62, 31, 16, 8, 4];
const SPEED_LABELS = ['5s', '2s', '1s', '1/2s', '1/4s', '1/8s', '1/16s', '1/32s', '1/64s', '1/128s', '1/256s'];

const BOT_DEFS = [
	{ Class: AirportLineBot, color: '#4488ff' },
	{ Class: LawnmowerBot,  color: '#cc44cc' },
	{ Class: ChaosBot,     color: '#44cc44' },
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
		this.bots = this.spawnBots();
		this.render();
		this.interval = setInterval(() => this.tick(), this.currentSpeed);
	}

	spawnBots() {
		const used = new Set();
		return BOT_DEFS.map(({ Class, color }) => {
			let col, row;
			do {
				col = Math.floor(Math.random() * COLS);
				row = Math.floor(Math.random() * ROWS);
			} while (used.has(`${col},${row}`));
			used.add(`${col},${row}`);
			const bot = new Class(this, col, row, color);
			this.cells[row][col] = bot;
			return bot;
		});
	}

	tick() {
		for (const bot of this.bots) {
			if (!bot.dead) {
				if (!bot.makeMove()) {
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

		for (let r = 0; r < ROWS; r++) {
			for (let c = 0; c < COLS; c++) {
				const x = c * CELL_SIZE + 1;
				const y = r * CELL_SIZE + 1;
				const bot = this.cells[r][c];
				ctx.fillStyle = bot ? bot.color : '#555555';
				ctx.fillRect(x, y, 8, 8);
			}
		}

		for (const bot of this.bots) {
			this.drawBot(bot);
		}
	}

	drawBot(bot) {
		const ctx = this.ctx;
		const x = bot.col * CELL_SIZE + 1;
		const y = bot.row * CELL_SIZE + 1;

		if (bot.dead) {
			ctx.fillStyle = '#000000';
			ctx.fillRect(x, y, 8, 8);
			ctx.fillStyle = bot.color;
			ctx.fillRect(x + 2, y + 2, 4, 4);
			ctx.strokeStyle = '#ff0000';
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(x + 1, y + 1);
			ctx.lineTo(x + 7, y + 7);
			ctx.moveTo(x + 7, y + 1);
			ctx.lineTo(x + 1, y + 7);
			ctx.stroke();
		} else {
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(x, y, 8, 8);
			ctx.fillStyle = bot.color;
			ctx.fillRect(x + 2, y + 2, 4, 4);
		}
	}

	canMoveTo(col, row, bot) {
		if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
		const cell = this.cells[row][col];
		return cell === null || cell === bot;
	}

	moveBotTo(bot, col, row) {
		bot.col = col;
		bot.row = row;
		this.cells[row][col] = bot;
	}

	setSpeed(speedMs) {
		this.currentSpeed = speedMs;
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = setInterval(() => this.tick(), this.currentSpeed);
		}
	}
}

const canvas = document.getElementById('grid');
const game = new Game(canvas);

const speedSlider = document.getElementById('speed');
const speedDisplay = document.getElementById('speed-display');

speedSlider.addEventListener('input', () => {
	const idx = parseInt(speedSlider.value, 10);
	speedDisplay.textContent = SPEED_LABELS[idx];
	game.setSpeed(SPEEDS[idx]);
});

document.getElementById('run-again').addEventListener('click', () => game.start());

game.start();
