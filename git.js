'use strict'
var child_process = require('child_process')
var validate = require('aproba')
var which = require('which')
var iferr = require('iferr')

var VALID_VARIABLES = [
  'GIT_ASKPASS',
  'GIT_PROXY_COMMAND',
  'GIT_SSH',
  'GIT_SSL_CAINFO',
  'GIT_SSL_NO_VERIFY'
]

var filteredEnv
function getFilteredEnv () {
  // git responds to env vars in some weird ways in post-receive hooks
  // so don't carry those along.
  if (filteredEnv) return filteredEnv

  // allow users to override nour insistence on not prompting for
  // passphrases, but default to just failing when credentials
  // aren't available
  filteredEnv = { GIT_ASKPASS: 'echo' }

  for (var k in process.env) {
    if (!~VALID_VARIABLES.indexOf(k) && k.match(/^GIT/)) continue
    filteredEnv[k] = process.env[k]
  }
  return filteredEnv
}

var gitExec = exports.exec = function (cmd, args, options, cb) {
  if (!cb) {
    cb = options
    options = {}
  }
  if (!options) options = {}
  validate('SAOF', [cmd, args, options, cb])
  if (!options.env) options.env = getFilteredEnv()
  gitExecArgs(cmd, args, options, iferr(cb, function (execpath, fullArgs, options) {
    child_process.execFile(execpath, fullArgs, options, cb)
  }))
}

exports.in = function (wd) {
  return {
    exec: function (cmd, args, options, cb) {
      if (!cb) {
        cb = options
        options = {}
      }
      if (!options) options = {}
      options.cwd = wd
      gitExec(cmd, args, options, cb)
    }
  }
}

var gitpath

function whichGit (cb) {
  if (gitpath) return cb(null, gitpath)
  which('git', function (er, found) {
    if (er) {
      er.code = 'ENOGIT'
      return cb(er)
    }
    gitpath = found
    cb(null, gitpath)
  })
}

exports.hasGit = function (cb) {
  whichGit(function (er, gitpath) {
    cb(!!gitpath)
  })
}

function gitExecArgs (cmd, args, options, cb) {
  validate('SAOF', arguments)
  if (!gitpath) {
    return whichGit(iferr(cb, function () {
      gitExecArgs(cmd, args, options, cb)
    }))
  }

  var fullArgs = [cmd].concat(prefixGitArgs(), args || [])
  cb(null, gitpath, fullArgs, options)
}

function prefixGitArgs () {
  return process.platform === 'win32' ? ['-c', 'core.longpaths=true'] : []
}
