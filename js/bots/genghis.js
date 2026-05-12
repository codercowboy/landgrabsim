class GenghisBot {
	constructor(game, col, row, color) {
		this.game = game;
		this.col = col;
		this.row = row;
		this.color = color;
		this.dead = false;
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

		const moves = [];
		if (dc !== 0) moves.push([dc, 0]);
		if (dr !== 0) moves.push([0, dr]);
		if (dc !== 0 && dr !== 0) {
			moves.push([0, dr]);
			moves.push([dc, 0]);
		}
		moves.push([-dc, 0], [0, -dr]);

		for (const [mc, mr] of moves) {
			if (mc === 0 && mr === 0) continue;
			if (this.game.canMoveTo(this.col + mc, this.row + mr, this)) {
				this.game.moveBotTo(this, this.col + mc, this.row + mr);
				return true;
			}
		}

		return false;
	}
}
