
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var fs = require('fs');

module.exports = {
  createMonitor: createMonitor
};

function equalStats(a, b) {
  if(a && !b) return false;
  if(b && !a) return false;
  // if(a.atime.getTime() != b.atime.getTime()) return false;
  if(a.mtime.getTime() != b.mtime.getTime()) return false;
  if(a.ctime.getTime() != b.ctime.getTime()) return false;
  return equalValues(['mode', 'size'], a, b);
}

function equalValues(keys, a, b) {
  for(var i=0; i<keys.length; i++) {
    var key = keys[i];
    if(a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

function emitFileEvent(em, event, p, stats) {
  em.emit(p, event, stats.current, stats.previous);
  em.emit(event, p, stats.current, stats.previous);
  em.emit('*', event, p, stats.current, stats.previous);
}

function createMonitor() {
  var em = new EventEmitter(),
      stats = {},
      watchers = {},
      debug = false;
  
  em.stat = stat;
  em.reset = reset;
  em.destroy = destroy;
  
  em.numPaths = 0;
  em.numStatErrors = 0;
  em.numReaddirErrors = 0;
  em.numWatchErrors = 0;
  
  function _listFolder(p, skip) {
    return Object.keys(stats).filter(function(sp) {
      return sp !== p && sp.slice(0, p.length) === p && skip.indexOf(sp) === -1;
    });
  }
  
  function stat(p, cb) {
    if(cb == null) cb = function() {};
    
    if(typeof p !== 'string') {
      var pending = p.length;
      p.forEach(function(p) {
        stat(p, function() {
          if(!--pending) return cb();
        });
      });
      if(!pending) cb();
      return;
    }
    
    p = path.resolve(p);
    debug && console.log('\nstating', p);
    
    fs.stat(p, function(err, s) {
      
      if(err) {
        if(stats[p]) {
          unwatch(p);
          emitFileEvent(em, 'remove', p, stats[p]);
          delete stats[p];
        } else {
          ++em.numStatErrors;
          em.emit('error-stat', err, p);
        }
        return cb();
      }
      
      if(stats[p]) {
        if(!equalStats(s, stats[p].current)) {
          stats[p] = {
            previous: stats[p].current,
            current: s
          };
          emitFileEvent(em, 'change', p, stats[p]);
        }
      } else {
        stats[p] = {
          previous: s,
          current: s
        };
        emitFileEvent(em, 'create', p, stats[p]);
      }
      
      if(s.isDirectory()) {
        walk(p, function(err, paths) {
          debug && console.log('\nstated', p, paths, listFolder(p, paths));
          _listFolder(p, paths).forEach(function(sp){stat(sp);});
          watch(p);
          cb();
        });
      } else {
        watch(p);
        cb();
      }
    });
  }
  
  function walk(p, cb) {
    var paths = [];
    debug && console.log('\nwalking', p);
    fs.readdir(p, function(err, files) {
      if(err) {
        ++em.numReaddirErrors;
        em.emit('error-readdir', err, p);
        return cb(null, paths);
      }
      
      var pending = files.length;
      
      files.forEach(function(file) {
        if(file.slice(0, 1) === '.') {
          --pending;
          return;
        }
        
        var sp = path.join(p, file);
        paths.push(sp);
        
        stat(sp, function(err) {
          if(err) return cb(err);
          
          if(!--pending) return cb(null, paths);
        });
      });
      
      if(!pending) return cb(null, paths);
    });
  }
  
  function watch(p) {
    if(watchers[p]) return;
    ++em.numPaths;
    watchers[p] = true;
    try {
      watchers[p] = fs.watch(p, {}, function(event, filename) {
        debug && console.log('\nwatcher event:', event, filename, p);
        // unwatch(p);
        stat(p, function() {});
      }).on('error', function(err) {
        debug && console.log('\nerror-watch', p);
        ++em.numWatchErrors;
        em.emit('error-watch', err, p);
        unwatch(p);
        stat(p, function() {});
      });
      debug && console.log('\nwatching', p);
    } catch(err) {
      ++em.numWatchErrors;
      em.emit('error-watch', err, p);
      unwatch(p);
    }
  }
  
  function unwatch(p) {
    if(!watchers[p])
      return;
    if(watchers[p] !== true)
      watchers[p].close();
    delete watchers[p];
    --em.numPaths;
    debug && console.log('\nunwatching', p);
  }
  
  function reset() {
    Object.keys(watchers).forEach(unwatch);
    stats = {};
    em.removeAllListeners();
    em.numPaths = 0;
    em.numStatErrors = 0;
    em.numReaddirErrors = 0;
  }
  
  function destroy() {
    Object.keys(watchers).forEach(unwatch);
    watchers = null;
    stats = null;
    em.removeAllListeners();
    em = null;
  }
  
  return em;
}