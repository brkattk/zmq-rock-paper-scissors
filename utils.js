'use strict';

const dns = require('dns');
const os = require('os');
const Promise = require('bluebird');

exports.getIP = () => {
	return new Promise((resolve, reject) => {
		dns.lookup(os.hostname(), (err, add) => {
			if (err) {
				return reject(err);
			}

			return resolve(add);
		});
	});
};
