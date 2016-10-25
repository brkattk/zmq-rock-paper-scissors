'use strict';

const debug = require('debug')('rps');
const machina = require('machina');
const Game = require('./game');

const ROCK = 'rock';
const PAPER = 'paper';
const SCISSORS = 'scissors';

const ServerStateMachine = machina.Fsm.extend({
	initialize: function (options) {
		debug('initialize');

		options = Object.assign({
			gamesToPlay: 3
		}, options);

		this.gamesToPlay = options.gamesToPlay;
		this.address = options.address;
		this.socket = options.socket;
		this.games = [];
		this.currentGame = null;
	},
	namespace: 'rock-paper-scissors',
	initialState: 'awaitingConnection',

	getScore: function () {
		return `${this.serverWins()}\\${this.clientWins()}`;
	},
	serverWins: function () {
		return this.games.reduce(function (wins, game) {
			if (game.getWinner() === 'me') {
				++wins;
			}
			return wins;
		}, 0);
	},
	clientWins: function () {
		return this.games.reduce(function (wins, game) {
			if (game.getWinner() === 'you') {
				++wins;
			}
			return wins;
		}, 0);
	},

	states: {
		awaitingConnection: {
			_onEnter: function () {
				debug('state change: awaitingConnection');
				console.info(`Games to play: ${this.gamesToPlay}`);
				console.info(`Socket: ${this.address}`);
			},
			connect: function () {
				this.transition('awaitingMove');
			}
		},

		playingAgain: {
			_onEnter: function () {
				debug('state change: playingAgain');
				this.handle('newGame');
			},
			newGame: 'awaitingMove'
		},

		awaitingMove: {
			_onEnter: function () {
				debug('state change: awaitingMove');
				// start a new game
				this.currentGame = new Game();
				this.games.push(this.currentGame);
			},
			shoot: function (args) {
				const move = args.move;
				this.currentGame.client = move;

				this.socket.send(this.currentGame.server);

				// this is where the game progresses
				if (this.games.length < this.gamesToPlay) {
					this.transition('playingAgain');
				} else {
					this.transition('finished');
				}
			},
			_onExit: function () {
				// send game result remote
				// print out game result local
				console.info(`Game: ${this.games.length}`);
				console.info(`Me: ${this.currentGame.server}`);
				console.info(`You: ${this.currentGame.client}`);
				console.info(`Winner: ${this.currentGame.getWinner()}`);
				console.info(`Score: ${this.getScore()}`);
			}
		},

		finished: {
			_onEnter: function () {
				debug('state change: finished');
				// print out overall games results
				const clientWins = this.clientWins();
				const serverWins = this.serverWins();

				let overallWinner = 'Tie';
				if (clientWins > serverWins) {
					overallWinner = 'You';
				} else if (clientWins < serverWins) {
					overallWinner = 'Me';
				}
				console.info(`Overall Winner: ${overallWinner}`);

				// send remote 'end'
				this.socket.send('end');
			},
			disconnect: function () {
				// transition to awaitingConnection
				this.transition('awaitingConnection');
			},
			_onExit: function () {
				// Reset the game;
				this.games.splice(0, this.games.length);
				this.currentGame = null;
			}
		}
	},

	connect: function () {
		debug('connect');
		this.handle('connect');
	},

	receiveMessage: function (message) {
		debug(`receiveMessage: ${message}`);
		switch (message) {
			case ROCK:
			case PAPER:
			case SCISSORS:
				this.handle('shoot', {move: message});
				break;
			default:
				debug(`unknown message`);
		}
	},

	disconnect: function () {
		debug('disconnect');
		this.handle('disconnect');
	}
});

exports.create = options => {
	return new ServerStateMachine(options);
};
