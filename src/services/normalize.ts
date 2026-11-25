import { catalogGames } from '../data/game-catalog'
import { seedGames } from '../data/catalog'
import type { Game, JournalEntry, PlayPlan, PlayStatus } from '../types/catalog'
import { CURRENT_PLAYER_ID, PLAY_STATUSES } from '../types/catalog'

export function localMidnight(input: number | Date = Date.now()): number {
  const date = input instanceof Date ? input : new Date(input)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function isCustomCover(coverImage?: string): boolean {
  if (!coverImage) return false
  return (
    coverImage.startsWith('data:') ||
    coverImage.startsWith('blob:') ||
    coverImage.startsWith('wxfile:') ||
    coverImage.startsWith('file:')
  )
}

export function normalizeNote(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, 40)
}

export function isPlayStatus(value: unknown): value is PlayStatus {
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

export function normalizeJournal(value: unknown): JournalEntry[] {
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

export function normalizePlans(value: unknown): PlayPlan[] {
  if (!Array.isArray(value)) return []
  const byDay = new Map<number, PlayPlan>()
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Partial<PlayPlan>
    if (!item.id) continue
    const at = typeof item.at === 'number' && Number.isFinite(item.at) ? localMidnight(item.at) : NaN
    if (!Number.isFinite(at)) continue
    byDay.set(at, {
      id: String(item.id),
      at,
      played: item.played === true,
    })
  }
  return [...byDay.values()]
}

export function normalizeGame(game: Game & { screenshots?: unknown }): Game {
  const { screenshots: _dropped, ...rest } = game
  return {
    ...rest,
    tags: [...(game.tags || [])],
    coverImage: resolveCover(game),
    status: resolveStatus(game),
    note: normalizeNote(game.note),
    journal: normalizeJournal(game.journal),
    plans: normalizePlans((game as Game).plans),
    onShelf:
      typeof game.onShelf === 'boolean' ? game.onShelf : resolveStatus(game) === 'playing',
    shelfAt: typeof game.shelfAt === 'number' && Number.isFinite(game.shelfAt) ? game.shelfAt : 0,
  }
}

export function cloneSeed(): Game[] {
  return seedGames.map((game) => normalizeGame(game))
}

export function mergeWithSeed(stored: Game[]): Game[] {
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
        plans: game.plans === undefined ? seed.plans : normalizePlans(game.plans),
        onShelf: typeof game.onShelf === 'boolean' ? game.onShelf : seed.onShelf,
        shelfAt:
          typeof game.shelfAt === 'number' && Number.isFinite(game.shelfAt)
            ? game.shelfAt
            : seed.shelfAt,
      })
    })

  const overlap = merged.some((game) => seedById.has(game.id))
  if (!overlap) {
    const userAdded = merged.filter((game) => game.id.startsWith('g-user-'))
    return userAdded.length ? [...cloneSeed(), ...userAdded] : cloneSeed()
  }

  for (const seed of seedGames) {
    if (!storedIds.has(seed.id)) {
      merged.push(normalizeGame(seed))
    }
  }
  return merged
}

export function unwrapStorage(raw: unknown): unknown {
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
