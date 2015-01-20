'use strict';

var _ = require('lodash');
var levelup = require('levelup');
var preconditions = require('preconditions').singleton();
var async = require('async');
var log = require('npmlog');
log.debug = log.verbose;

var Wallet = require('./model/wallet');

function CopayServer(opts) {
	opts = opts || {};
	this.db = opts.db || levelup(opts.dbPath || './db/copay.db', { valueEncoding: 'json' });
};


CopayServer.prototype.createWallet = function (opts, cb) {
	var self = this;

	self._fetchWallet(opts.id, function (err, wallet) {
		if (err) return cb(err);
		if (wallet) return cb('Wallet already exists');

		var wallet = new Wallet({
			id: opts.id,
			name: opts.name,
			m: opts.m,
			n: opts.n,
			pubKey: opts.pubKey,
		});
		
		self._storeWallet(wallet, cb);
	});
};

CopayServer.prototype.joinWallet = function (opts, cb) {
	var self = this;

	self._fetchWallet(opts.walletId, function (err, wallet) {
		if (err) return cb(err);
		if (!wallet) return cb('Wallet not found');
		if (_.find(wallet.copayers, { id: opts.copayerId })) return cb('Copayer already in wallet');

		// TODO: validate copayer's extended public key using the public key from this wallet
		// Note: use Bitcore.crypto.ecdsa .verify()

		var copayer = new Copayer({
			walletId: wallet.id,
			id: opts.copayerId,
			name: opts.copayerName,
			xPubKey: opts.xPubKey,
			xPubKeySignature: opts.xPubKeySignature,
		});
		
		self._storeCopayer(copayer, cb);
	});
};

CopayServer.prototype.getWallet = function (id, cb) {
	this._fetchWallet(id, cb);
};


CopayServer.prototype._fetchWallet = function (id, cb) {
	var wallet;
	var copayers = [];

	this.db.createReadStream({ gte: 'wallet-' + id, lt: 'wallet-' + id + '~' })
		.on('data', function (data) {
			if (data.key.indexOf('copayer-') != -1) {
				copayers.push(Copayer.fromObj(data.value));
			} else {
				wallet = Wallet.fromObj(data.value);
			}
		})
		.on('error', function (err) {
			if (err.notFound) return cb();
			return cb(err);
		})
		.on('end', function () {
			if (!wallet) return cb();
			wallet.copayers = copayers;
			return cb(null, wallet);
		});
};

CopayServer.prototype._storeWallet = function (wallet, cb) {
	this.db.put('wallet-' + wallet.id, wallet, cb);
};

CopayServer.prototype._storeCopayer = function (copayer, cb) {
	this.db.put('wallet-' + copayer.walletId + '-' + 'copayer-' + copayer.id, copayer, cb);
};


module.exports = CopayServer;
