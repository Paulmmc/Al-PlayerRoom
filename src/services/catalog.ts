import { mePlayer, seedGames } from '../data/catalog'
import { catalogGames } from '../data/game-catalog'
import type {
  AddGameInput,
  Game,
  GamePatch,
  GamesByPlatform,
  Platform,
  PlayStatus,
  Player,
} from '../types/catalog'
import {
  CURRENT_PLAYER_ID,
  PLATFORM_LABELS,
  PLATFORMS,
} from '../types/catalog'
import {
  findMyGameIndex,
  getGames,
  reloadFromStorage,
  replaceGame,
  saveGames,
  setGames,
} from './game-store'
import { isPlayStatus, normalizeGame, normalizeNote } from './normalize'

export { addJournalEntry, removeJournalEntry, updateJournalEntry } from './journal'
export {
  addPlayPlan,
  addPlayPlans,
  explainPlanRange,
  newerPlanFirst,
  removePlayPlan,
  reschedulePlayPlan,
  togglePlayPlan,
} from './plans'
export { dateInputText, parseDateInput } from './plan-range'
export { localMidnight } from './normalize'
export { reloadFromStorage, resetLibrary } from './game-store'

const COVER_COLORS = [
  '#2F6B4A',
  '#C43B3B',
  '#6B4A1B',
  '#2B4A6F',
  '#8B3A1A',
  '#1A1F3A',
  '#7C5CFF',
  '#2EC4B6',
]

export function listMyGames(): Game[] {
  return getGames().filter((game) => game.playerId === CURRENT_PLAYER_ID)
}

/** 资料库：仅该平台的正例种子 + game-catalog（封面按平台循环本地图） */
export function listCatalogByPlatform(platform: Platform): Game[] {
  const ownedNames = new Set(
    seedGames.filter((game) => game.platform === platform).map((game) => game.title),
  )
  const fromSeed = seedGames.filter((game) => game.platform === platform)
  const fromDb = catalogGames.filter(
    (game) => game.platform === platform && !ownedNames.has(game.title),
  )
  return [...fromSeed, ...fromDb]
}

export function listGames(): Game[] {
  return listMyGames()
}

export function getGame(id: string): Game | undefined {
  return listMyGames().find((game) => game.id === id)
}

export function getPlayer(id: string): Player | undefined {
  if (id === CURRENT_PLAYER_ID || !id) {
    return mePlayer
  }
  return id === mePlayer.id ? mePlayer : undefined
}

export function getMe(): Player {
  return mePlayer
}

export function listGamesByPlayer(playerId: string): Game[] {
  if (playerId !== CURRENT_PLAYER_ID) {
    return []
  }
  return listMyGames()
}

export function listMyGamesFiltered(platform: Platform, status?: PlayStatus): Game[] {
  return listMyGames().filter(
    (game) => game.platform === platform && (!status || game.status === status),
  )
}

export function countMyGamesByStatus(): Record<PlayStatus, number> {
  const counts: Record<PlayStatus, number> = {
    playing: 0,
    backlog: 0,
    done: 0,
    shelved: 0,
  }
  for (const game of listMyGames()) {
    counts[game.status] += 1
  }
  return counts
}

export function listMyGamesByPlatform(platform: Platform): Game[] {
  return listMyGamesFiltered(platform)
}

export function listShelfGames(platform: Platform): Game[] {
  return listMyGames()
    .filter((game) => game.platform === platform && game.onShelf)
    .sort((a, b) => b.shelfAt - a.shelfAt)
}

export function setOnShelf(id: string, on: boolean): Game | undefined {
  let index = findMyGameIndex(id)
  if (index < 0) {
    reloadFromStorage()
    index = findMyGameIndex(id)
    if (index < 0) return undefined
  }
  const current = getGames()[index]
  if (on) {
    if (current.onShelf) return current
    const occupied = getGames().filter(
      (game) =>
        game.playerId === CURRENT_PLAYER_ID &&
        game.platform === current.platform &&
        game.onShelf,
    ).length
    if (occupied >= 8) return undefined
    return replaceGame(index, { ...current, onShelf: true, shelfAt: Date.now() })
  }
  return replaceGame(index, { ...current, onShelf: false, shelfAt: 0 })
}

export function listGamesByPlatform(platform: Platform): Game[] {
  return listMyGamesByPlatform(platform)
}

export function listGamesByPlayerGrouped(playerId: string): GamesByPlatform {
  const owned = listGamesByPlayer(playerId)
  return {
    switch: owned.filter((game) => game.platform === 'switch'),
    ps5: owned.filter((game) => game.platform === 'ps5'),
    steam: owned.filter((game) => game.platform === 'steam'),
  }
}

export function listMyGamesGrouped(): GamesByPlatform {
  return listGamesByPlayerGrouped(CURRENT_PLAYER_ID)
}

export function platformLabel(platform: Platform): string {
  return PLATFORM_LABELS[platform]
}

export function gameCover(game: Game): string {
  return game.coverImage || ''
}

export function searchMyGames(keyword: string): Game[] {
  const q = keyword.trim().toLowerCase()
  const mine = listMyGames()
  if (!q) {
    return mine
  }

  return mine.filter((game) => {
    const label = PLATFORM_LABELS[game.platform].toLowerCase()
    const haystack = [
      game.title,
      game.summary,
      ...game.tags,
      game.platform,
      label,
      game.note,
      ...game.journal.map((entry) => entry.text),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function searchGames(keyword: string): Game[] {
  return searchMyGames(keyword)
}

export function updateGame(id: string, patch: GamePatch): Game | undefined {
  const index = getGames().findIndex(
    (game) => game.id === id && game.playerId === CURRENT_PLAYER_ID,
  )
  if (index < 0) {
    reloadFromStorage()
    const retry = getGames().findIndex(
      (game) => game.id === id && game.playerId === CURRENT_PLAYER_ID,
    )
    if (retry < 0) {
      return undefined
    }
    return commitUpdate(retry, patch)
  }
  return commitUpdate(index, patch)
}

function commitUpdate(index: number, patch: GamePatch): Game {
  const current = getGames()[index]
  const nextTitle =
    patch.title !== undefined
      ? String(patch.title).trim() || current.title
      : current.title
  const nextPlatform = patch.platform || current.platform
  let onShelf = current.onShelf
  let shelfAt = current.shelfAt
  if (nextPlatform !== current.platform && current.onShelf) {
    const occupied = getGames().filter(
      (game) =>
        game.id !== current.id &&
        game.playerId === CURRENT_PLAYER_ID &&
        game.platform === nextPlatform &&
        game.onShelf,
    ).length
    if (occupied >= 8) {
      onShelf = false
      shelfAt = 0
    }
  }
  const next: Game = {
    ...current,
    ...patch,
    title: nextTitle,
    summary:
      patch.summary !== undefined
        ? String(patch.summary).trim()
        : current.summary,
    tags: patch.tags ? [...patch.tags] : [...current.tags],
    coverImage:
      patch.coverImage !== undefined ? patch.coverImage : current.coverImage,
    status:
      patch.status !== undefined && isPlayStatus(patch.status)
        ? patch.status
        : current.status,
    note: patch.note !== undefined ? normalizeNote(patch.note) : current.note,
    onShelf,
    shelfAt,
  }
  return replaceGame(index, next)
}

export function addGame(input: AddGameInput): Game {
  const games = getGames()
  const color = COVER_COLORS[games.length % COVER_COLORS.length]
  const game = normalizeGame({
    id: `g-user-${Date.now()}`,
    title: input.title.trim(),
    summary: (input.summary ?? '').trim(),
    tags: input.tags?.length ? [...input.tags] : ['自定义'],
    platform: input.platform,
    playerId: CURRENT_PLAYER_ID,
    coverColor: input.coverColor || color,
    coverImage: input.coverImage || '',
    status: isPlayStatus(input.status) ? input.status : 'backlog',
    note: normalizeNote(input.note),
    journal: [],
    plans: [],
    onShelf: false,
    shelfAt: 0,
  })
  setGames([...games, game])
  saveGames()
  return game
}

export function removeGame(id: string): boolean {
  const games = getGames()
  const next = games.filter(
    (game) => !(game.id === id && game.playerId === CURRENT_PLAYER_ID),
  )
  if (next.length === games.length) {
    return false
  }
  setGames(next)
  saveGames()
  return true
}

export { PLATFORMS, PLATFORM_LABELS, CURRENT_PLAYER_ID }
