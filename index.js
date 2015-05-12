'use strict'
var os = require('os')
var fs = require('fs')
var path = require('path')
var normalizeGitUrl = require('normalize-git-url')
var mkdirp = require('mkdirp')
var iferr = require('iferr')
var validate = require('aproba')
var uniqueFilename = require('unique-filename')
var git = require('./git.js')
var lock = require('./lock.js')

module.exports = RepoManager

function fileExists (filePath, cb) {
  validate('SF', arguments)
  fs.stat(filePath, function (er) { cb(!er) })
}

function ifExists (thenDo, elseDo) {
  return function (exists) {
    exists ? thenDo() : elseDo()
  }
}

function RepoManager (repoDir, perms) {
  this.setRepoDir(repoDir || path.resolve(os.tmpdir(), 'git-repo-manager'))
  this.perms = {
    uid: process.getuid(),
    gid: process.getgid(),
    mode: parseInt('0777', 8) & (~process.umask())
  }
  this.setPerms(perms)
}
RepoManager.prototype = {}

RepoManager.prototype.getRepo = function (giturl) {
  return new Repo(this, giturl)
}

RepoManager.prototype.setRepoDir = function (newrepo) {
  this.repoDir = newrepo
  this.templateDir = path.join(this.repoDir, '_templates')
}

RepoManager.prototype.setPerms = function (newperms) {
  if (!newperms) return
  if (newperms.uid != null) this.perms.uid = newperms.uid
  if (newperms.gid != null) this.perms.gid = newperms.gid
  if (newperms.mode != null) this.perms.mode = newperms.mode
}

RepoManager.prototype.getBarePath = function (giturl) {
  return uniqueFilename(this.repoDir, giturl.replace(/[^a-zA-Z0-9]+/g, '-'), giturl)
}

function makeWithPerms (dir, perms, cb) {
  var permfs = {
    stat: fs.stat,
    mkdir: function (dir, mode, cb) {
      fs.mkdir(dir, mode, iferr(cb, function (er) {
        fs.chown(dir, perms.uid, perms.gid, cb)
      }))
    }
  }
  mkdirp(dir, {mode: perms.mode, fs: permfs}, cb)
}

RepoManager.prototype.ensureTemplateDirExists = function (cb) {
  var mgr = this
  fileExists(mgr.templateDir, function (exists) {
    exists ? cb() : makeWithPerms(mgr.templateDir, mgr.perms, cb)
  })
}

function Repo (mgr, giturl) {
  var normalized = normalizeGitUrl(giturl)
  this.url = normalized.url
  this.branch = normalized.branch
  this.mgr = mgr
  this.barePath = mgr.getBarePath(this.url)
}
Repo.prototype = {}

function valueFromStdout (pattern, cb) {
  return function (er, stdout, stderr) {
    if (er) return cb(er)
    var matches = stdout.match(pattern)
    cb(null, matches ? matches[1] : null)
  }
}

Repo.prototype.outOfDate = function (refCommit, cb) {
  validate('SF', arguments)
  var repo = this

  fileExists(repo.barePath, ifExists(lookupCommitId, function () {
    cb(null, true)
  }))
  function lookupCommitId () {
    git.in(repo.barePath).exec('rev-list', ['-n1', refCommit], valueFromStdout(/(\S+)/, iferr(cb, getLatest)))
  }
  var commitId
  function getLatest (resolved) {
    if (!resolved) return cb(null, true)
    commitId = resolved
    git.in(repo.barePath).exec('ls-remote', ['--heads', 'origin', repo.branch], valueFromStdout(/(\S+)/, iferr(cb, checkCommit)))
  }
  function checkCommit (latestCommit) {
    cb(null, commitId !== latestCommit, commitId, latestCommit)
  }
}

Repo.prototype.cloneTo = function (target, cb) {
  validate('SF', arguments)
  var repo = this
  var resolvedTarget = path.resolve(target)

  lock('clone-from-' + repo.barePath, function (unlock) {
    fileExists(resolvedTarget, function (exists) {
      if (exists) {
        unlockAndReturn(new Error("Can't clone to " + resolvedTarget + ' as it already exists'))
      } else {
        repo.mgr.ensureTemplateDirExists(iferr(unlockAndReturn, ensureBareRepoExists))
      }
    })
    function ensureBareRepoExists () {
      fileExists(repo.barePath, ifExists(ensureUpdated, function () {
        git.exec('clone', ['--mirror', '--template=' + repo.templateDir, repo.url, repo.barePath], ensureUpdated)
      }))
    }
    function ensureUpdated () {
      repo.outOfDate(repo.branch, iferr(unlockAndReturn, function (isOutOfDate) {
        if (isOutOfDate) {
          git.in(repo.barePath).exec('fetch', ['--all'], cloneToWorking)
        } else {
          cloneToWorking()
        }
      }))
    }
    function cloneToWorking () {
      git.exec('clone', ['-ls', '--depth=1', '--template=' + repo.templateDir, '-b', repo.branch, repo.barePath, resolvedTarget], iferr(unlockAndReturn, getHeadId))
    }
    function getHeadId () {
      git.in(resolvedTarget).exec('rev-parse', ['HEAD'], valueFromStdout(/(\S+)/, unlockAndReturn))
    }
    function unlockAndReturn () {
      unlock()
      cb.apply(null, arguments)
    }
  })
}
