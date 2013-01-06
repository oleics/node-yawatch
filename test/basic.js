
var yawatch = require('..'),
    assert = require('assert');

describe('yawatch', function() {
  describe('.createMonitor()', function() {
    it('returns the monitor-object that is an EventEmitter-instance', function() {
      var monitor = yawatch.createMonitor();
      assert.ok(monitor);
      assert.ok(monitor instanceof require('events').EventEmitter);
    });
    
    describe('monitor', function() {
      describe('events', function() {
        describe('create', function() {
        });
      });
    });
  });
});