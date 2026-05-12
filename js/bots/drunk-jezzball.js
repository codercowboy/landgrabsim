class DrunkJezzballBot {
	constructor(game, col, row, color) {
		this.game = game;
		this.col = col;
		this.row = row;
		this.color = color;
		this.dead = false;
		this.size = 1;
		this.isLeader = false;
		this.teammates = [];
		this.dc = 0;
		this.dr = 0;
		this.stuck = true;
	}

	get partner() {
		return this.teammates[0] || null;
	}

	onGroupReady() {
		this.chooseNewAxis();
	}

	chooseNewAxis() {
		const axes = [
			[[-1, 0], [1, 0]],
			[[0, -1], [0, 1]],
			[[-1,-1], [1, 1]],
			[[-1, 1], [1,-1]],
		];
		const pair = axes[Math.floor(Math.random() * axes.length)];
		if (Math.random() < 0.5) {
			[this.dc, this.dr] = pair[0];
			[this.partner.dc, this.partner.dr] = pair[1];
		} else {
			[this.dc, this.dr] = pair[1];
			[this.partner.dc, this.partner.dr] = pair[0];
		}
		this.stuck = false;
		this.partner.stuck = false;
	}

	makeMove() {
		if (!this.stuck) {
			const nc = this.col + this.dc;
			const nr = this.row + this.dr;
			if (this.game.canMoveTo(nc, nr, this)) {
				this.game.moveBotTo(this, nc, nr);
				return true;
			}
			this.stuck = true;
		}

		if (this.isLeader && this.partner && this.partner.stuck) {
			this.chooseNewAxis();
		} else {
			this.movesSinceNewLand++;
		}

		return true;
	}
}
