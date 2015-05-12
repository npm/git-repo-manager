A very simple locking mechanism.

```
var lock = require('git-repo-manager/lock.js')

lock('my-thing', function (unlock) {
  …
  unlock()
})
```

### lock(*key*, *cb → function (unlock)*)

Takes a lock on *key* and calls *cb* with a function to unlock that key.

If something already has a lock on *key* then it will wait until the lock
is available again before calling *cb*.
