const mem = {}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export const uni = {
  getStorageSync(key) {
    return mem[key]
  },
  setStorageSync(key, value) {
    if (global.__failSave) throw new Error('disk')
    mem[key] = clone(value)
  },
  removeStorageSync(key) {
    delete mem[key]
  },
}
