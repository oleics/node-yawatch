#!/usr/bin/env node

var optimist = require('optimist'),
    argv = optimist.usage(
      'Usage: yawatch [files or folders ...]',
      {
        'help': {
          description: 'Prints this help.',
          boolean: true
        },
        'exec': {
          description: 'Use exec instead of spawn to run the command.',
          boolean: true
        },
        'on-any': {
          description: 'Command to execute on any event.',
          string: true
        },
        'on-create': {
          description: 'Command to execute when a file/folder was created.',
          string: true
        },
        'on-change': {
          description: 'Command to execute when a file/folder did change.',
          string: true
        },
        'on-remove': {
          description: 'Command to execute when a file/folder was removed.',
          string: true
        },
        'append-event': {
          description: 'Append the event to the arguments of the command.',
          boolean: true
        },
        'append-path': {
          description: 'Append the pathname to the arguments of the command.',
          boolean: true
        },
      }
    ).argv,
    monitor = require('yawatch').createMonitor(),
    shellParse = require('shell-quote').parse,
    shellQuote = require('shell-quote').quote,
    spawn = require('child_process').spawn,
    exec = require('child_process').exec;

optimist.wrap(79);

// console.log(argv);

if(argv.help) {
  optimist.showHelp();
  process.exit(0);
}

// Prepare the files to watch

var files = argv._.slice(0);

if(files == null || files.length === 0) {
  process.stderr.write('Missing files or folders to watch.\n\n');
  process.stdout.write('Type "yawatch --help" for help.\n');
  process.exit(1);
}

// Prepare the commands to run

var commands = {
  '*': parseCommand(argv['on-any']),
  'create': parseCommand(argv['on-create']),
  'change': parseCommand(argv['on-change']),
  'remove': parseCommand(argv['on-remove'])
};

monitor.on('error-stat', function(err, p) {
  console.error(err.code, 'stat', p);
});

monitor.on('error-readdir', function(err, p) {
  console.error(err.code, 'readdir', p);
});

monitor.on('error-watch', function(err, p) {
  console.error(err.code, 'watch', p);
});

console.log('scanning... ');
monitor.stat(files, function(err) {
  if(err) throw err;
  
  console.log(
    'Found %s paths. Got %s stat-errors, %s readdir-errors and %s watch-errors.',
    monitor.numPaths,
    monitor.numStatErrors,
    monitor.numReaddirErrors,
    monitor.numWatchErrors
  );
  
  console.log('watching...');
  monitor.on('*', onAnyEvent);
});

function onAnyEvent(event, pathname, statObject, previousStatObject) {
  var found = false;
  
  Object.keys(commands).forEach(function(key) {
    if(commands[key]) {
      execCommand(commands[key], event, pathname, onCommandEnd);
      found = true;
    }
  });
  
  if(!found) {
    console.log(event, pathname);
  }
  
  function onCommandEnd(err) {
    if(err) throw err;
  }
}

function execCommand(cmd, event, pathname, cb) {
  var cmd = cmd.slice(0);
  
  if(argv['append-event']) {
    cmd.push(event);
  }
  
  if(argv['append-path']) {
    cmd.push(pathname);
  }
  
  if(argv.exec) {
    execProcess(cmd, cb);
  } else {
    spawProcess(cmd, cb);
  }
}

// Process

function parseCommand(command) {
  if(command == null) return false;
  return shellParse(command);
}

function execProcess(cmd, cb) {
  exec(shellQuote(cmd), function(err, stdout, stderr) {
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    if(err) return cb(err);
    cb();
  });
}

function spawProcess(cmd, cb) {
  var child = spawn(cmd[0], cmd.slice(1));
  
  child.stdout.on('data', function(data) {
    process.stdout.write(data);
  });
  
  child.stderr.on('data', function(data) {
    process.stderr.write(data);
  });
  
  child.on('exit', function(code, sig) {
    if(code) {
      return cb(new Error('child process exited with code ' + code + ', sig ' + sig));
    }
    
    cb();
  });
  
  return child;
}
