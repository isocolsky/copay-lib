'use strict';

var chai = require('chai');
var sinon = require('sinon');
var should = chai.should();
var levelup = require('levelup');
var memdown = require('memdown');

var Wallet = require('../lib/model/wallet');
var Copayer = require('../lib/model/copayer');
var CopayServer = require('../lib/server');

var db;
var server;

describe('Copay server', function() {
  beforeEach(function() {
    db = levelup(memdown, { valueEncoding: 'json' });
  });

  describe('#getWallet', function() {
    beforeEach(function() {
      server = new CopayServer({
        db: db,
      });
    });

    it('should get existing wallet', function (done) {
      var w1 = new Wallet({
        id: '123',
        name: 'my wallet',
        m: 2,
        n: 3,
        pubKey: 'dummy',
      });
      var w2 = new Wallet({
        id: '234',
        name: 'my wallet 2',
        m: 3,
        n: 4,
        pubKey: 'dummy',
      });

      db.batch([{
        type: 'put',
        key: 'wallet-123',
        value: w1,
      }, {
        type: 'put',
        key: 'wallet-234',
        value: w2,
      }]);

      server.getWallet('123', function (err, wallet) {
        should.not.exist(err);
        wallet.id.should.equal('123');
        wallet.name.should.equal('my wallet');
        wallet.status.should.equal('pending');
        wallet.copayers.length.should.equal(0);
        done();
      });
    });

    it('should return undefined when requesting non-existing wallet', function (done) {
      var w1 = new Wallet({
        id: '123',
        name: 'my wallet',
        m: 2,
        n: 3,
        pubKey: 'dummy',
      });
      var w2 = new Wallet({
        id: '234',
        name: 'my wallet 2',
        m: 3,
        n: 4,
        pubKey: 'dummy',
      });

      db.batch([{
        type: 'put',
        key: 'wallet-123',
        value: w1,
      }, {
        type: 'put',
        key: 'wallet-234',
        value: w2,
      }]);

      server.getWallet('345', function (err, wallet) {
        should.not.exist(err);
        should.not.exist(wallet);
        done();
      });
    });
  });

  describe('#creteWallet', function() {
    beforeEach(function() {
      server = new CopayServer({
        db: db,
      });
    });

    it('should create and store wallet', function(done) {
      var opts = {
        id: '123',
        name: 'my wallet',
        m: 2,
        n: 3,
        pubKey: 'dummy',
      };
      server.createWallet(opts, function(err) {
        should.not.exist(err);
        server.getWallet('123', function (err, wallet) {
          should.not.exist(err);
          wallet.id.should.equal('123');
          wallet.name.should.equal('my wallet');
          done();
        });
      });
    });

    it('should fail to recreate existing wallet', function(done) {
      var opts = {
        id: '123',
        name: 'my wallet',
        m: 2,
        n: 3,
        pubKey: 'dummy',
      };
      server.createWallet(opts, function(err) {
        should.not.exist(err);
        server.getWallet('123', function (err, wallet) {
          should.not.exist(err);
          wallet.id.should.equal('123');
          wallet.name.should.equal('my wallet');
          server.createWallet(opts, function(err) {
            should.exist(err);
            done();
          });
        });
      });
    });
  });
});
