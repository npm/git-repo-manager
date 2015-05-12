'use strict'
var iferr = require('iferr')
var RepoManager = require('./index.js')

function throwEr (er) { throw er }

var args = process.argv.slice(2)
var command = args.shift()

function help (er) {
  if (er) console.error(er)
  console.error('Usage: git-repo-manager has-updates <repourl> <comittish>')
  console.error('  Tells you if the remote <repourl> is newer/different than <sha1>')
  console.error('Usage: git-repo-manager clone-to <repourl> <dest>')
  console.error('  Clones the remote <repourl> to <dest>, using a intermediary local bare')
  console.error('  git repo to reduce network traffic')
  console.error('')
  console.error('<repourl> is a valid URL that represents a git repository, optionally')
  console.error("with a #comittish added to the end. If no comittish is included, git's defaults are used.")
  process.exit(1)
}

if (!command) help()

if (args.length < 1) help()
var repoManager = new RepoManager()
var repo = repoManager.getRepo(args[0])

switch (command) {
  case 'has-updates':
    if (args.length !== 2) help()
    repo.outOfDate(args[1], iferr(throwEr, function (updated) {
      console.log(updated ? 'remote is newer' : 'repo is up to date')
    }))
    break
  case 'clone-to':
    if (args.length !== 2) help()
    repo.cloneTo(args[1], iferr(throwEr, function () {
      console.log(args[0], 'cloned to', args[1])
    }))
    break
  default:
    help()
}
