class LawnmowerBot {
	constructor(game, col, row, color) {
		this.game = game;
		this.col = col;
		this.row = row;
		this.color = color;
		this.dead = false;
		this.dirs = [
			[ 0, -1],  // up
			[ 1,  0],  // right
			[ 0,  1],  // down
			[-1,  0],  // left
		];
		this.dirIndex = Math.floor(Math.random() * 4);
	}

	isOwnCell(col, row) {
		return this.game.cells[row] && this.game.cells[row][col] === this;
	}

	makeMove() {
		for (let i = 0; i < 4; i++) {
			const [dc, dr] = this.dirs[this.dirIndex];
			const nextCol = this.col + dc;
			const nextRow = this.row + dr;

			if (this.game.canMoveTo(nextCol, nextRow, this)) {
				if (this.isOwnCell(nextCol, nextRow)) {
					const oppIndex = (this.dirIndex + 2) % 4;
					const [odc, odr] = this.dirs[oppIndex];
					const oppCol = this.col + odc;
					const oppRow = this.row + odr;
					if (this.game.canMoveTo(oppCol, oppRow, this) && !this.isOwnCell(oppCol, oppRow)) {
						this.dirIndex = oppIndex;
						this.game.moveBotTo(this, oppCol, oppRow);
						return true;
					}
					// opposite is also own territory — just push forward, no reversal
				}
				this.game.moveBotTo(this, nextCol, nextRow);
				return true;
			}

			this.dirIndex = (this.dirIndex + 1) % 4;
		}
		return false;
	}
}
