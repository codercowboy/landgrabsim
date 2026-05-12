class BigBoyBot {
	constructor(game, col, row, color) {
		this.game = game;
		this.col = col;
		this.row = row;
		this.color = color;
		this.dead = false;
		this.size = 2;
		this.skipNext = false;
	}

	getNewCells(dc, dr) {
		const newCol = this.col + dc * 2;
		const newRow = this.row + dr * 2;
		return [
			[newCol,     newRow    ],
			[newCol + 1, newRow    ],
			[newCol,     newRow + 1],
			[newCol + 1, newRow + 1],
		];
	}

	canMove(dc, dr) {
		return this.getNewCells(dc, dr).every(([c, r]) => this.game.canMoveTo(c, r, this));
	}

	doMove(dc, dr) {
		const newCells = this.getNewCells(dc, dr);
		const claimedNew = newCells.some(([c, r]) => this.game.cells[r][c] === null);
		for (const [c, r] of newCells) {
			this.game.cells[r][c] = this;
		}
		this.movesSinceNewLand = claimedNew ? 0 : this.movesSinceNewLand + 1;
		this.col += dc * 2;
		this.row += dr * 2;
	}

	makeMove() {
		if (this.skipNext) {
			this.skipNext = false;
			return true;
		}
		this.skipNext = true;

		const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
		for (let i = dirs.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[dirs[i], dirs[j]] = [dirs[j], dirs[i]];
		}
		for (const [dc, dr] of dirs) {
			if (this.canMove(dc, dr)) {
				this.doMove(dc, dr);
				return true;
			}
		}
		return false;
	}
}
