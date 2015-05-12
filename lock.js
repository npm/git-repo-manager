'use strict'

var locks = {}
module.exports = function (key, cb) {
  if (!locks[key]) locks[key] = []
  locks[key].push(cb)
  if (locks[key].length === 1) {
    process.nextTick(function () {
      cb(unlock(key))
    })
  }
}

function unlock (key) {
  return function () {
    locks[key].shift()
    if (locks[key].length) locks[key][0](unlock(key))
  }
}
