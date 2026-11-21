import type { PlayStatus } from '../types/catalog'

let pending: PlayStatus | null = null

export function requestHomeStatus(status: PlayStatus): void {
  pending = status
}

export function consumeHomeStatus(): PlayStatus | null {
  const status = pending
  pending = null
  return status
}
