
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

function createMonitor() {
  var em = new EventEmitter(),
      errors = {},
      stats = {},
      watchers = {};
  
  em.stat = stat;
  
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
    
    fs.stat(p, function(err, s) {
      
      if(err) {
        if(stats[p]) {
          unwatch(p);
          em.emit('remove', p, stats[p].current);
          em.emit(p, 'remove', stats[p].current);
          delete stats[p];
        } else {
          errors[p] = err;
        }
        return cb();
      }
      
      if(stats[p]) {
        if(!equalStats(s, stats[p].current)) {
          stats[p] = {
            previous: stats[p].current,
            current: s
          };
          em.emit('change', p, stats[p].current, stats[p].previous);
          em.emit(p, 'change', stats[p].current, stats[p].previous);
        }
      } else {
        stats[p] = {
          previous: s,
          current: s
        };
        em.emit('create', p, stats[p].current);
        em.emit(p, 'create', stats[p].current);
      }
      
      if(s.isDirectory()) {
        walk(p, function() {
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
    fs.readdir(p, function(err, files) {
      if(err) {
        ++em.numErrors;
        errors[p] = err;
        return cb();
      }
      
      var pending = files.length;
      
      files.forEach(function(file) {
        if(file.slice(0, 1) === '.') {
          --pending;
          return;
        }
        
        stat(path.join(p, file), function(err) {
          if(err) return cb(err);
          
          if(!--pending) return cb();
        });
      });
      
      if(!pending) return cb();
    });
  }
  
  function watch(p) {
    if(watchers[p]) return;
    watchers[p] = true;
    try {
      watchers[p] = fs.watch(p, {}, function(event, filename) {
        // unwatch(p);
        stat(p, function() {});
      }).on('error', function() {
        unwatch(p);
        stat(p, function() {});
      });
    } catch(err) {
      unwatch(p);
    }
  }
  
  function unwatch(p) {
    if(!watchers[p])
      return;
    if(watchers[p] !== true)
      watchers[p].close();
    delete watchers[p];
  }
  
  return em;
}