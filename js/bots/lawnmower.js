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

	makeMove() {
		for (let i = 0; i < 4; i++) {
			const [dc, dr] = this.dirs[this.dirIndex];
			if (this.game.canMoveTo(this.col + dc, this.row + dr, this)) {
				this.game.moveBotTo(this, this.col + dc, this.row + dr);
				return true;
			}
			this.dirIndex = (this.dirIndex + 1) % 4;
		}
		return false;
	}
}
