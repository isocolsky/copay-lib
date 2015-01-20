'use strict';

var _ = require('lodash');
var $ = require('preconditions').singleton();
var async = require('async');
var log = require('npmlog');
log.debug = log.verbose;

var Storage = require('./storage');
var Wallet = require('./model/wallet');
var Copayer = require('./model/copayer');

function CopayServer(opts) {
	opts = opts || {};
	this.storage = new Storage(opts);
};


CopayServer.prototype.createWallet = function (opts, cb) {
	var self = this;

	self.getWallet({ id: opts.id }, function (err, wallet) {
		if (err) return cb(err);
		if (wallet) return cb('Wallet already exists');

		var wallet = new Wallet({
			id: opts.id,
			name: opts.name,
			m: opts.m,
			n: opts.n,
			pubKey: opts.pubKey,
		});
		
		self.storage.storeWallet(wallet, cb);
	});
};

CopayServer.prototype.getWallet = function (opts, cb) {
	var self = this;

	self.storage.fetchWallet(opts.id, function (err, wallet) {
		if (err || !wallet) return cb(err);
		if (opts.includeCopayers) {
			self.storage.fetchCopayers(wallet.id, function (err, copayers) {
				if (err) return cb(err);
				wallet.copayers = copayers || [];
				return cb(null, wallet);
			});
		} else {
			return cb(null, wallet);
		}
	});
};


CopayServer.prototype.joinWallet = function (opts, cb) {
	var self = this;

	self.getWallet({ id: opts.walletId, includeCopayers: true }, function (err, wallet) {
		if (err) return cb(err);
		if (!wallet) return cb('Wallet not found');
		if (_.find(wallet.copayers, { id: opts.id })) return cb('Copayer already in wallet');
		if (wallet.copayers.length == wallet.n) return cb('Wallet full');

		// TODO: validate copayer's extended public key using the public key from this wallet
		// Note: use Bitcore.crypto.ecdsa .verify()

		var copayer = new Copayer({
			walletId: wallet.id,
			id: opts.id,
			name: opts.name,
			xPubKey: opts.xPubKey,
			xPubKeySignature: opts.xPubKeySignature,
		});
		
		self.storage.storeCopayer(copayer, function (err) {
			if (err) return cb(err);
			if (wallet.copayers.length < wallet.n - 1) return cb();

			wallet.status = 'complete';
			self.storage.storeWallet(wallet, cb);
		});
	});
};






module.exports = CopayServer;
