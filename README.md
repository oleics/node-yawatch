yawatch
=======

Yet another file tree watcher/monitor that just works.

Usage Example
-------------

```js
var monitor = require('yawatch').createMonitor();

monitor.stat([
  '/tmp/test.txt',
  '/tmp/folder'
], function(err) {
  if(err) throw err;
  
  monitor
    .on('create', function(pathname, statObject) {
      // Handle new file or folder
    })
    .on('change', function(pathname, statObject, previousStatObject) {
      // Handle changed file or folder
    })
    .on('remove', function(pathname, statObject) {
      // Handle removed file or folder
    })
    .on('/tmp/test.txt', function(event, statObject, previousStatObject) {
      // Handle event for a specific file or folder
    })
    .on('*', function(event, pathname, statObject, previousStatObject) {
      // Handle any event for any file or folder
      // previousStatObject might be undefined
    })
  ;
});
```

API
---

.createMonitor()

monitor.stat(array || string, callback)

MIT License
-----------

Copyright (c) 2012 Oliver Leics <oliver.leics@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
