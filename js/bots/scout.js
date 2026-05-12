class ScoutBot {
	constructor(game, col, row, color) {
		this.game = game;
		this.col = col;
		this.row = row;
		this.color = color;
		this.dead = false;
		this.size = 1;
		this.teammates = [];
		const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
		[this.dc, this.dr] = dirs[Math.floor(Math.random() * 4)];
	}

	canMoveTo(col, row) {
		if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
		const game = this.game;
		if (game.gameMode === 2 && game.activeBounds) {
			const b = game.activeBounds;
			if (col < b.minCol || col > b.maxCol || row < b.minRow || row > b.maxRow) return false;
		}
		if (this.onFire) return true;
		const cell = game.cells[row][col];
		const passable = cell === null || cell === this || cell.color === this.color;
		if (!passable && game.gameMode === 2 && cell !== null && !cell.dead) {
			if (!game.damagedThisTick.has(this)) {
				game.damagedThisTick.add(this);
				this.health -= 5;
				if (this.health <= 0) {
					this.health = 0;
					for (const b of this.game.bots) {
						if (b.defIndex === this.defIndex) b.dead = true;
					}
				}
			}
		}
		return passable;
	}

	makeMove() {
		const nc = this.col + this.dc;
		const nr = this.row + this.dr;
		if (this.canMoveTo(nc, nr)) {
			this.game.moveBotTo(this, nc, nr);
			return true;
		}
		const alts = [[0,-1],[0,1],[-1,0],[1,0]].filter(
			([dc, dr]) => !(dc === this.dc && dr === this.dr)
		);
		for (let i = alts.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[alts[i], alts[j]] = [alts[j], alts[i]];
		}
		for (const [dc, dr] of alts) {
			if (this.canMoveTo(this.col + dc, this.row + dr)) {
				this.dc = dc;
				this.dr = dr;
				this.game.moveBotTo(this, this.col + dc, this.row + dr);
				return true;
			}
		}
		return false;
	}
}
