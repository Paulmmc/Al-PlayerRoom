import type { Game } from '../types/catalog'
import { CURRENT_PLAYER_ID } from '../types/catalog'
import { cloneSeed, mergeWithSeed, unwrapStorage } from './normalize'

const STORAGE_KEY = 'playerroom.games'

let games: Game[] = loadGames()
persist()

function loadGames(): Game[] {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    const parsed = unwrapStorage(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return cloneSeed()
    }
    return mergeWithSeed(parsed as Game[])
  } catch {
    return cloneSeed()
  }
}

function persist() {
  uni.setStorageSync(STORAGE_KEY, games)
}

export function getGames(): Game[] {
  return games
}

export function setGames(next: Game[]) {
  games = next
}

export function saveGames() {
  persist()
}

export function findMyGameIndex(id: string): number {
  return games.findIndex(
    (game) => game.id === id && game.playerId === CURRENT_PLAYER_ID,
  )
}

export function reloadFromStorage(): void {
  games = loadGames()
}

export function replaceGame(index: number, next: Game): Game {
  games = [...games.slice(0, index), next, ...games.slice(index + 1)]
  persist()
  return next
}

export function resetLibrary(): void {
  games = cloneSeed()
  uni.removeStorageSync(STORAGE_KEY)
}
