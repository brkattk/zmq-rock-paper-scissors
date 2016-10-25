'use strict';

const zmq = require('zmq');
const Promise = require('bluebird');
const utils = require('./utils');
const ServerStateMachine = require('./server-state-machine');

const socket = zmq.socket('pair');

const GAMES = process.env.GAMES;
const PORT = process.env.PORT;

utils.getIP()
	.then(ip => {
		const address = `tcp://${ip}:${PORT}`;

		return new Promise((resolve, reject) => {
			socket.bind(address, err => {
				if (err) {
					return reject(err);
				}

				return resolve(address);
			});
		});
	})
	.then(address => {
		const state = ServerStateMachine.create({address, socket, gamesToPlay: GAMES});
		socket.on('accept', () => {
			state.connect();
		});
		socket.on('disconnect', () => {
			state.disconnect();
		});

		// begin receiving monitor events
		socket.monitor(500, 0);

		socket.on('message', message => {
			state.receiveMessage(message.toString());
		});

		return state;
	})
	.catch(err => {
		console.error(err);
	});
