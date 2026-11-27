export type RootPage = 'home' | 'schedule' | 'profile'
export type RootMotion = 'forward' | 'back' | 'fade'

const order: Record<RootPage, number> = {
  home: 0,
  schedule: 1,
  profile: 2,
}

let enterMotion: RootMotion = 'fade'
const leaveListeners = new Set<(motion: 'forward' | 'back') => void>()

export function onRootLeave(listener: (motion: 'forward' | 'back') => void) {
  leaveListeners.add(listener)
  return () => {
    leaveListeners.delete(listener)
  }
}

export function consumeEnterMotion(): RootMotion {
  const next = enterMotion
  enterMotion = 'fade'
  return next
}

export function goRootPage(from: RootPage, to: RootPage, url: string) {
  if (from === to) return
  const motion: 'forward' | 'back' = order[to] > order[from] ? 'forward' : 'back'
  enterMotion = motion
  leaveListeners.forEach((listener) => listener(motion))
  setTimeout(() => {
    uni.reLaunch({ url })
  }, 220)
}
