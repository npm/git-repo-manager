Provides a simple API for running the git command line tool in a cross
platform safe way.

```
var git = require('git-repo-manager/git.js')

git.hasGit(function (er, gitExists) {
  …
})

var repo = 'git://github.com/npm/git-repo-manager'
var checkoutdir = 'git-repo-manager'
git.exec('clone', [repo, checkoutdir], function (er, stdout, stderr) {
  …
})
git.in(checkoutdir).exec(…)
```

### git.exec(*cmd*, *args*, *options*, *cb → function (er, stdout, stderr)*)

The copy of git that will be used is located using
[`which`](https://www.npmjs.com/package/which).

If no copy can be located then the callback will be run with an error with
`er.code === 'ENOGIT'`

*cmd* is the git subcommand you want to execute, eg `clone`, `rev-parse`, etc.

*args* is an array of arguments to pass to that command.

*options* is the optional. It is the options object to pass to
`child_process.execFile`.

If you didn't include an `env` key in an options object then a copy of your
current environment (`process.env`) will be passed through with all of vars
starting with `GIT_` removed, except for:

* GIT_ASKPASS
* GIT_PROXY_COMMAND
* GIT_SSH
* GIT_SSL_CAINFO
* GIT_SSL_NO_VERIFY

Further, `GIT_ASKPASS` will be defaulted to `echo`.

### git.in(*dir*).exec(*cmd*, *args*, *options*, *cb → function (er, stdout, stderr)*)

As with `git.exec`, except that it will execute the git command in *dir*. This is
functionally the same as passing `cwd: *dir` in the options object.

### git.hasGit(*cb → function (er, gitExists)*)

*gitExists* will be true if we can find a copy of git to run, otherwise false.
