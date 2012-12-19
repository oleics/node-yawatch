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
    .on('create', function(pathname, statObj) {
      // Handle new file or folder
    })
    .on('change', function(pathname, statObj, previousStatObj) {
      // Handle changed file or folder
    })
    .on('remove', function(pathname, statObj) {
      // Handle removed file or folder
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