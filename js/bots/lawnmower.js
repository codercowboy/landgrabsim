class LawnmowerBot {
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

		const vertDirs = Math.random() < 0.5 ? [-1, 1] : [1, -1];
		for (const vDir of vertDirs) {
			if (this.game.canMoveTo(this.col, this.row + vDir, this)) {
				this.game.moveBotTo(this, this.col, this.row + vDir);
				this.lateralDir = -this.lateralDir;
				return true;
			}
		}

		if (this.game.canMoveTo(this.col - this.lateralDir, this.row, this)) {
			this.game.moveBotTo(this, this.col - this.lateralDir, this.row);
			this.lateralDir = -this.lateralDir;
			return true;
		}

		return false;
	}
}
