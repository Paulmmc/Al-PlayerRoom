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
  JournalEntry,
} from '../types/catalog'

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
import {
  CURRENT_PLAYER_ID,
  PLATFORM_LABELS,
  PLATFORMS,
  PLAY_STATUSES,
} from '../types/catalog'

const STORAGE_KEY = 'playerroom.games'

let games: Game[] = loadGames()
// Rewrite storage into the new schema while keeping edits
persist()

function isCustomCover(coverImage?: string): boolean {
  if (!coverImage) return false
  return (
    coverImage.startsWith('data:') ||
    coverImage.startsWith('blob:') ||
    coverImage.startsWith('wxfile:') ||
    coverImage.startsWith('file:')
  )
}

function normalizeNote(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, 40)
}

function isPlayStatus(value: unknown): value is PlayStatus {
  return PLAY_STATUSES.includes(value as PlayStatus)
}

function resolveStatus(game: Game): PlayStatus {
  if (isPlayStatus(game.status)) return game.status
  const seed = seedGames.find((item) => item.id === game.id)
  if (seed && isPlayStatus(seed.status)) return seed.status
  return 'backlog'
}

function resolveCover(game: Game): string {
  const cover = game.coverImage || ''
  if (isCustomCover(cover)) return cover
  if (cover.startsWith(`/static/games/${game.id}/`)) return cover
  const title = game.title.trim()
  const match = catalogGames.find(
    (item) => item.platform === game.platform && item.title.trim() === title,
  )
  if (!match) return cover
  const file = game.platform === 'steam' ? 'capsule.jpg' : 'cover.jpg'
  return `/static/games/${match.id}/${file}`
}

function normalizeJournal(value: unknown): JournalEntry[] {
  if (!Array.isArray(value)) return []
  const entries: JournalEntry[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Partial<JournalEntry>
    if (!item.id) continue
    const text = typeof item.text === 'string' ? item.text.trim().slice(0, 200) : ''
    const image = typeof item.image === 'string' ? item.image : ''
    if (!text && !image) continue
    const at = typeof item.at === 'number' && Number.isFinite(item.at) ? item.at : Date.now()
    entries.push({ id: String(item.id), at, text, image })
  }
  entries.sort((a, b) => b.at - a.at)
  return entries.slice(0, 30)
}

function normalizeGame(game: Game & { screenshots?: unknown }): Game {
  const { screenshots: _dropped, ...rest } = game
  return {
    ...rest,
    tags: [...(game.tags || [])],
    coverImage: resolveCover(game),
    status: resolveStatus(game),
    note: normalizeNote(game.note),
    journal: normalizeJournal(game.journal),
  }
}

function cloneSeed(): Game[] {
  return seedGames.map((game) => normalizeGame(game))
}

function mergeWithSeed(stored: Game[]): Game[] {
  const seedById = new Map(seedGames.map((game) => [game.id, game]))
  const storedIds = new Set(stored.map((game) => game.id))

  const merged = stored
    .filter(
      (game) =>
        game.playerId === CURRENT_PLAYER_ID && !String(game.id).startsWith('g-test-'),
    )
    .map((game) => {
      const seed = seedById.get(game.id)
      if (!seed) {
        return normalizeGame({
          ...game,
          coverImage: game.coverImage || '',
        })
      }
      return normalizeGame({
        ...seed,
        title: game.title || seed.title,
        summary: game.summary ?? seed.summary,
        platform: game.platform || seed.platform,
        tags: game.tags?.length ? game.tags : seed.tags,
        coverImage: isCustomCover(game.coverImage)
          ? game.coverImage!
          : seed.coverImage,
        status: isPlayStatus(game.status) ? game.status : seed.status,
        note: game.note === undefined ? seed.note : normalizeNote(game.note),
        journal: game.journal === undefined ? seed.journal : normalizeJournal(game.journal),
      })
    })

  const overlap = merged.some((game) => seedById.has(game.id))
  if (!overlap) {
    const userAdded = merged.filter((game) => game.id.startsWith('g-user-'))
    return userAdded.length ? [...cloneSeed(), ...userAdded] : cloneSeed()
  }

  // Keep user order; append any brand-new seed titles not in storage
  for (const seed of seedGames) {
    if (!storedIds.has(seed.id)) {
      merged.push(normalizeGame(seed))
    }
  }
  return merged
}

function unwrapStorage(raw: unknown): unknown {
  if (raw == null || raw === '') {
    return null
  }
  let value: unknown = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  // uni H5 may persist as { type: 'object', data: [...] }
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return (value as { data: unknown[] }).data
  }
  return value
}

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

export function listMyGames(): Game[] {
  return games.filter((game) => game.playerId === CURRENT_PLAYER_ID)
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

export function reloadFromStorage(): void {
  games = loadGames()
}

export function updateGame(id: string, patch: GamePatch): Game | undefined {
  const index = games.findIndex(
    (game) => game.id === id && game.playerId === CURRENT_PLAYER_ID,
  )
  if (index < 0) {
    // Storage may be newer than in-memory after HMR / multi-instance
    reloadFromStorage()
    const retry = games.findIndex(
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
  const current = games[index]
  const nextTitle =
    patch.title !== undefined
      ? String(patch.title).trim() || current.title
      : current.title
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
  }
  games = [...games.slice(0, index), next, ...games.slice(index + 1)]
  persist()
  return next
}

export function addGame(input: AddGameInput): Game {
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
  })
  games = [...games, game]
  persist()
  return game
}

function findMyGameIndex(id: string): number {
  return games.findIndex(
    (game) => game.id === id && game.playerId === CURRENT_PLAYER_ID,
  )
}

export function addJournalEntry(
  gameId: string,
  input: { at: number; text: string; image?: string },
): Game | undefined {
  const text = typeof input.text === 'string' ? input.text.trim() : ''
  const image = typeof input.image === 'string' ? input.image : ''
  if (!text && !image) return undefined
  let index = findMyGameIndex(gameId)
  if (index < 0) {
    reloadFromStorage()
    index = findMyGameIndex(gameId)
    if (index < 0) return undefined
  }
  const current = games[index]
  const entry: JournalEntry = {
    id: `j-${Date.now()}`,
    at: input.at,
    text,
    image,
  }
  return writeJournal(index, normalizeJournal([entry, ...current.journal]))
}

export function updateJournalEntry(
  gameId: string,
  entryId: string,
  patch: { at?: number; text?: string; image?: string },
): Game | undefined {
  let index = findMyGameIndex(gameId)
  if (index < 0) {
    reloadFromStorage()
    index = findMyGameIndex(gameId)
    if (index < 0) return undefined
  }
  const current = games[index]
  const found = current.journal.find((entry) => entry.id === entryId)
  if (!found) return undefined
  const text = patch.text !== undefined ? patch.text.trim() : found.text
  const image = patch.image !== undefined ? patch.image : found.image
  if (!text && !image) return undefined
  const next = current.journal.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          at: patch.at !== undefined ? patch.at : entry.at,
          text,
          image,
        }
      : entry,
  )
  return writeJournal(index, normalizeJournal(next))
}

export function removeJournalEntry(gameId: string, entryId: string): boolean {
  let index = findMyGameIndex(gameId)
  if (index < 0) {
    reloadFromStorage()
    index = findMyGameIndex(gameId)
    if (index < 0) return false
  }
  const current = games[index]
  if (!current.journal.some((entry) => entry.id === entryId)) return false
  writeJournal(
    index,
    current.journal.filter((entry) => entry.id !== entryId),
  )
  return true
}

function writeJournal(index: number, journal: JournalEntry[]): Game {
  const next: Game = { ...games[index], journal }
  games = [...games.slice(0, index), next, ...games.slice(index + 1)]
  persist()
  return next
}

export function removeGame(id: string): boolean {
  const before = games.length
  games = games.filter(
    (game) => !(game.id === id && game.playerId === CURRENT_PLAYER_ID),
  )
  if (games.length === before) {
    return false
  }
  persist()
  return true
}

export function resetLibrary(): void {
  games = cloneSeed()
  uni.removeStorageSync(STORAGE_KEY)
}

export { PLATFORMS, PLATFORM_LABELS, CURRENT_PLAYER_ID }
