
var yawatch = require('..'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf');

describe('Expected behavior for fs.rename', function() {
  var sandboxFolder = path.resolve('./sandbox'),
      monitor;
  
  beforeEach(function(next) {
    monitor = yawatch.createMonitor();
    rimraf(sandboxFolder, function(err) {
      if(err) return next(err);
      fs.mkdir(sandboxFolder, next);
    });
  });
  
  afterEach(function(next) {
    monitor.destroy();
    monitor = null;
    rimraf(sandboxFolder, next);
  });
  
  function testRename(from, to, exp, done) {
    monitor.stat(sandboxFolder, function(err) {
      if(err) return done(err);
      
      var index = 0;
      
      monitor.on('*', function(event, p) {
        // console.log();
        // console.log(event, p);
        
        if(index >= exp.length) {
          assert.ok(false, 'Monitor emitted more than the expected number of events.');
        }
        
        assert.equal(exp[index].event, event);
        assert.equal(exp[index].p, p);
        ++index;
        
        if(index === exp.length) {
          setTimeout(function() {
            done();
          }, 300);
        }
      });
      
      fs.rename(
        from,
        to,
        function(err) {
          if(err) return done(err);
        }
      );
    });
  }
  
  describe('a file', function() {
    
    it('one "remove"- and one "create"-event (in that order)', function(done) {
      fs.writeFile(path.join(sandboxFolder, 'test.txt'), 'test', function(err) {
        if(err) return done(err);
        
        testRename(
          path.join(sandboxFolder, 'test.txt'),
          path.join(sandboxFolder, 'test-renamed.txt'),
          [
            {event: 'remove', p: path.join(sandboxFolder, 'test.txt')},
            {event: 'create', p: path.join(sandboxFolder, 'test-renamed.txt')},
            // {event: 'change', p: sandboxFolder},
          ],
          done
        );
      });
    });
  });
  
  describe('a folder', function() {
    it('one "create"- and one "remove"-event (in that order)', function(done) {
      fs.mkdir(path.join(sandboxFolder, 'test'), function(err) {
        if(err) return done(err);
        
        testRename(
          path.join(sandboxFolder, 'test'),
          path.join(sandboxFolder, 'test-renamed'),
          [
            {event: 'create', p: path.join(sandboxFolder, 'test-renamed')},
            {event: 'remove', p: path.join(sandboxFolder, 'test')}
          ],
          done
        );
      });
    });
  });
});
