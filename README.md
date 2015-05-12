git-repo-manager
----------------

Clone and update from remote git repositories, keeping a local bare repo to
reduce network accesses on future clones.

```javascript
var RepoManager = require('git-repo-manager')

var repos = new RepoManager()


var myrepo = repos.getRepo('https://github.com/npm/git-repo-manager')

myrepo.cloneTo('target/path/', function (er, headId) {
 …
})

myrepo.outOfDate(oldHeadId, function (er, outdated) {
  if (outdated) { … }
})
```

### new RepoManager(*repoDir*, *perms*)

*repoDir* is the directory in which bare repos will be kept.

If it is unset or empty then `path.resolve(os.tmpdir(), 'git-repo-manager')` will be used.

*perms* is an object, where all of these keys are optional:

* *uid* - default: process.getuid()
* *gid* - default: process.getgid()
* *mode* - 0777 & ~process.umask()

### RepoManager.setRepoDir(*repoDir*)

Set the direcotry that bare repos will be stored in, as in the constructor.

### RepoManager.setPerms(*perms*)

Set the permissions that folders should be created with, as in the constructor.

### RepoManager.getRepo(*giturl*)

Returns a new repo object representing *giturl*. This may or may not exist
yet in the *repoDir*.

## Windows Note

On Windows, all git commands are executed with `-c core.longpaths=true`

### Repo.cloneTo(*target*, *cb → function (er, headId)*)

Clone the repo to *target*. It is an error for *target* to already exist.

Only one clone operation will be executed at a time for a given bare mirror
in *repoDir*.  Additional clone calls will be queued and executed
sequentially in the order they were issued.

If you've never cloned this repo before then it will create a bare mirror in *repoDir*.

If you have cloned this repo before, then it will check to see if its copy
of the branch in this repo is out of date and if it is, it will run `git
fetch`.

In either case, once it has an up to date bare clone, it then clones that
with `--local`, `--shared` and `--depth=1`.

Finally it calls you back with the commitId of HEAD in the newly created repo.

### Repo.outOfDate(*committish*, *cb → function (er, isOutdated, localCommitId, remoteCommitId)*)

Check to see if *committish* is out of date when compared to the remote repository.

It determines the *localCommitId* by resolving the *committish* into using
`git rev-list -n1 <committish>`.

It determines the *remoteCommitId* with `git ls-remote --heads origin <branch>` where
the *branch* is a committish that was passed in with *giturl* when the Repo object was
constructed. If no branch was included at that time then **master** will be used.

If the local *repoDir* doesn't have a clone of this repo yet, then the answer is always yes.

If the *committish* isn't in the local clone then the answer is always yes.

Finally, `localCommitId !== remoteCommitId` is used to determine if the repo is out of date.

### git envirionment

Your current environment (`process.env`) is passed through to `git` with all of the vars
starting with `GIT_` removed, except for:

* GIT_ASKPASS
* GIT_PROXY_COMMAND
* GIT_SSH
* GIT_SSL_CAINFO
* GIT_SSL_NO_VERIFY

Further, `GIT_ASKPASS` will be defaulted to `echo` if its not otherwise set.
