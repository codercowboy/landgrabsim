class BishopBot {
	constructor(game, col, row, color) {
		this.game = game;
		this.col = col;
		this.row = row;
		this.color = color;
		this.dead = false;
		this.size = 1;
		const dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
		[this.dc, this.dr] = dirs[Math.floor(Math.random() * 4)];
	}

	makeMove() {
		const nc = this.col + this.dc;
		const nr = this.row + this.dr;
		if (this.game.canMoveTo(nc, nr, this)) {
			this.game.moveBotTo(this, nc, nr);
			return true;
		}
		const alts = [[1,1],[1,-1],[-1,1],[-1,-1]].filter(
			([dc, dr]) => !(dc === this.dc && dr === this.dr)
		);
		for (let i = alts.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[alts[i], alts[j]] = [alts[j], alts[i]];
		}
		for (const [dc, dr] of alts) {
			if (this.game.canMoveTo(this.col + dc, this.row + dr, this)) {
				this.dc = dc;
				this.dr = dr;
				this.game.moveBotTo(this, this.col + dc, this.row + dr);
				return true;
			}
		}
		return false;
	}
}
