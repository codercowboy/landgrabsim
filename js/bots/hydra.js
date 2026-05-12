class HydraBot {
	constructor(game, col, row, color) {
		this.game = game;
		this.col = col;
		this.row = row;
		this.color = color;
		this.dead = false;
	}

	makeMove() {
		const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
		for (let i = dirs.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[dirs[i], dirs[j]] = [dirs[j], dirs[i]];
		}
		for (const [dc, dr] of dirs) {
			if (this.game.canMoveTo(this.col + dc, this.row + dr, this)) {
				this.game.moveBotTo(this, this.col + dc, this.row + dr);
				return true;
			}
		}
		this.game.spawnMidGame(HydraBot, this.col, this.row, this.color);
		this.game.spawnMidGame(HydraBot, this.col, this.row, this.color);
		return false;
	}
}
