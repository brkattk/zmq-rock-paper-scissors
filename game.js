'use strict';

const TIE = 'tie';
const CLIENT = 'you';
const SERVER = 'me';
const ROCK = 'rock';
const PAPER = 'paper';
const SCISSORS = 'scissors';
const SHOTS = {
	0: ROCK,
	1: PAPER,
	2: SCISSORS
};
const STRATEGIES = {
	r: () => {
		const shot = Math.floor(Math.random() * 3);
		return SHOTS[shot];
	}
};

class Game {
	constructor(options) {
		options = Object.assign({strategy: 'r'}, options);
		this.strategy = options.strategy;
		this.server = this.getMove();
		this.client = null;
	}
	getWinner() {
		if (!this.server || !this.client) {
			throw new Error('Missing shot(s)');
		}

		if (this.server === ROCK && this.client === PAPER) {
			return CLIENT;
		} else if (this.server === SCISSORS && this.client === PAPER) {
			return SERVER;
		} else if (this.server === PAPER && this.client === ROCK) {
			return SERVER;
		} else if (this.server === SCISSORS && this.client === ROCK) {
			return CLIENT;
		} else if (this.server === PAPER && this.client === SCISSORS) {
			return CLIENT;
		} else if (this.server === ROCK && this.client === SCISSORS) {
			return SERVER;
		}

		return TIE;
	}
	getMove() {
		if (this.server) {
			return this.server;
		}

		this.server = STRATEGIES[this.strategy]();
		return this.server;
	}
}

module.exports = Game;
