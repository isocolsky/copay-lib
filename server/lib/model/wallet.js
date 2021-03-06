'use strict';

var _ = require('lodash');

function Wallet(opts) {
	opts = opts || {};

	this.id = opts.id;
	this.name = opts.name;
	this.m = opts.m;
	this.n = opts.n;
	this.status = 'pending';
	this.publicKeyRing = [];
};

Wallet.fromObj = function (obj) {
	var x = new Wallet();

	x.id = obj.id;
	x.name = obj.name;
	x.m = obj.m;
	x.n = obj.n;
	x.status = obj.status;
	x.publicKeyRing = obj.publicKeyRing;
	return x;
};

module.exports = Wallet;
