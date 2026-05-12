class AirportLineBot {
	constructor(game, col, row, color) {
		this.game = game;
		this.col = col;
		this.row = row;
		this.color = color;
		this.dead = false;
		this.lateralDir = Math.random() < 0.5 ? -1 : 1;
	}

	makeMove() {
		if (this.game.canMoveTo(this.col + this.lateralDir, this.row, this)) {
			this.game.moveBotTo(this, this.col + this.lateralDir, this.row);
			return true;
		}

		const upGrey   = this.game.cells[this.row - 1] && this.game.cells[this.row - 1][this.col] === null;
		const downGrey = this.game.cells[this.row + 1] && this.game.cells[this.row + 1][this.col] === null;

		let vertDirs;
		if (upGrey && !downGrey) {
			vertDirs = [-1, 1];
		} else if (downGrey && !upGrey) {
			vertDirs = [1, -1];
		} else {
			const first = Math.random() < 0.5 ? -1 : 1;
			vertDirs = [first, -first];
		}
		for (const vDir of vertDirs) {
			if (this.game.canMoveTo(this.col, this.row + vDir, this)) {
				this.game.moveBotTo(this, this.col, this.row + vDir);
				this.lateralDir = -this.lateralDir;
				return true;
			}
		}

		return false;
	}
}
