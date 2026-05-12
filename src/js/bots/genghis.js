class GenghisBot {
	constructor(game, col, row, color) {
		this.game = game;
		this.col = col;
		this.row = row;
		this.color = color;
		this.dead = false;
		this.lastCol = null;
		this.lastRow = null;
	}

	makeMove() {
		let bestCol = null;
		let bestRow = null;
		let bestDist = Infinity;

		for (let r = 0; r < ROWS; r++) {
			for (let c = 0; c < COLS; c++) {
				if (this.game.cells[r][c] === null) {
					const dist = Math.abs(c - this.col) + Math.abs(r - this.row);
					if (dist < bestDist) {
						bestDist = dist;
						bestCol = c;
						bestRow = r;
					}
				}
			}
		}

		if (bestCol === null) return false;

		const dc = Math.sign(bestCol - this.col);
		const dr = Math.sign(bestRow - this.row);

		const seen = new Set();
		const moves = [];
		for (const dir of [[dc, 0], [0, dr], [-dc, 0], [0, -dr]]) {
			const key = dir.join(',');
			if ((dir[0] !== 0 || dir[1] !== 0) && !seen.has(key)) {
				seen.add(key);
				moves.push(dir);
			}
		}

		const prevCol = this.lastCol;
		const prevRow = this.lastRow;

		for (const [mc, mr] of moves) {
			const nc = this.col + mc;
			const nr = this.row + mr;
			if (nc === prevCol && nr === prevRow) continue;
			if (this.game.canMoveTo(nc, nr, this)) {
				this.lastCol = this.col;
				this.lastRow = this.row;
				this.game.moveBotTo(this, nc, nr);
				return true;
			}
		}
		for (const [mc, mr] of moves) {
			if (this.game.canMoveTo(this.col + mc, this.row + mr, this)) {
				this.lastCol = this.col;
				this.lastRow = this.row;
				this.game.moveBotTo(this, this.col + mc, this.row + mr);
				return true;
			}
		}

		return false;
	}
}
