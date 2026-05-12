class LawnmowerBot {
	constructor(game, col, row, color) {
		this.game = game;
		this.col = col;
		this.row = row;
		this.color = color;
		this.dead = false;
		this.sweepDc = Math.random() < 0.5 ? 1 : -1;
		this.nudgeDr = 1;
	}

	isOwnCell(col, row) {
		return this.game.cells[row] && this.game.cells[row][col] === this;
	}

	tryDiagonal() {
		if (Math.random() >= 0.1) return false;
		const diags = [[-1,-1],[1,-1],[-1,1],[1,1]];
		for (let i = diags.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[diags[i], diags[j]] = [diags[j], diags[i]];
		}
		for (const [ddc, ddr] of diags) {
			if (this.game.canMoveTo(this.col + ddc, this.row + ddr, this)) {
				this.game.moveBotTo(this, this.col + ddc, this.row + ddr);
				return true;
			}
		}
		return false;
	}

	makeMove() {
		const fwdC = this.col + this.sweepDc;
		const fwdR = this.row;
		const canFwd = this.game.canMoveTo(fwdC, fwdR, this);

		// Forward cell is new territory — keep sweeping
		if (canFwd && !this.isOwnCell(fwdC, fwdR)) {
			this.game.moveBotTo(this, fwdC, fwdR);
			return true;
		}

		// Forward is own-color or blocked — nudge inward and reverse sweep
		if (this.tryDiagonal()) return true;

		const nudgeR = this.row + this.nudgeDr;
		if (this.game.canMoveTo(this.col, nudgeR, this)) {
			this.sweepDc = -this.sweepDc;
			this.game.moveBotTo(this, this.col, nudgeR);
			return true;
		}

		// Primary nudge blocked — flip and try the other vertical direction
		this.nudgeDr = -this.nudgeDr;
		const nudgeR2 = this.row + this.nudgeDr;
		if (this.game.canMoveTo(this.col, nudgeR2, this)) {
			this.sweepDc = -this.sweepDc;
			this.game.moveBotTo(this, this.col, nudgeR2);
			return true;
		}

		// Both nudge directions blocked — push through own cells if possible
		if (canFwd) {
			this.game.moveBotTo(this, fwdC, fwdR);
			return true;
		}

		// Last resort: reverse sweep direction
		const bwdC = this.col - this.sweepDc;
		if (this.game.canMoveTo(bwdC, this.row, this)) {
			this.sweepDc = -this.sweepDc;
			this.game.moveBotTo(this, bwdC, this.row);
			return true;
		}

		return false;
	}
}
