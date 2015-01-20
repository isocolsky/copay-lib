'use strict';

var _ = require('lodash');
var levelup = require('levelup');
var $ = require('preconditions').singleton();
var async = require('async');
var log = require('npmlog');
log.debug = log.verbose;

var Wallet = require('./model/wallet');
var Copayer = require('./model/copayer');

var Storage = function (opts) {
	opts = opts || {};
	this.db = opts.db || levelup(opts.dbPath || './db/copay.db', { valueEncoding: 'json' });
};


Storage.prototype.fetchWallet = function (id, cb) {
	this.db.get('wallet-' + id, function (err, data) {
		if (err) {
			if (err.notFound) return cb();
			return cb(err);
		}
		return cb(null, Wallet.fromObj(data));
	});
};

Storage.prototype.fetchCopayers = function (walletId, cb) {
	var copayers = [];
	var key = 'wallet-' + walletId + '-copayer-';
	this.db.createReadStream({ gte: key, lt: key + '~' })
		.on('data', function (data) {
			copayers.push(Copayer.fromObj(data.value));
		})
		.on('error', function (err) {
			if (err.notFound) return cb();
			return cb(err);
		})
		.on('end', function () {
			return cb(null, copayers);
		});
};


Storage.prototype.storeWallet = function (wallet, cb) {
	this.db.put('wallet-' + wallet.id, wallet, cb);
};

Storage.prototype.storeCopayer = function (copayer, cb) {
	this.db.put('wallet-' + copayer.walletId + '-copayer-' + copayer.id, copayer, cb);
};

Storage.prototype._dump = function (opts) {
  this.db.readStream(opts)
    .on('data', console.log);
};

module.exports = Storage;
