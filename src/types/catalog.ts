export type Platform = 'switch' | 'ps5' | 'steam'

export const CURRENT_PLAYER_ID = 'p-me'

export const PLATFORM_LABELS: Record<Platform, string> = {
  switch: 'Switch',
  ps5: 'PS5',
  steam: 'Steam',
}

export const PLATFORMS: Platform[] = ['switch', 'ps5', 'steam']

export type PlayStatus = 'backlog' | 'playing' | 'done' | 'shelved'

export const PLAY_STATUSES: PlayStatus[] = ['playing', 'backlog', 'done', 'shelved']

export const STATUS_LABELS: Record<PlayStatus, string> = {
  backlog: '想玩',
  playing: '在玩',
  done: '已通关',
  shelved: '搁置',
}

export const STATUS_COLORS: Record<PlayStatus, string> = {
  backlog: '#8b9cff',
  playing: '#3DDC97',
  done: '#E8B84A',
  shelved: '#6b7388',
}

export interface Player {
  id: string
  name: string
  bio: string
  /** Single letter used as avatar badge when no image is available */
  initial: string
  accent: string
}

export interface JournalEntry {
  id: string
  /** Local midnight timestamp for the entry's day */
  at: number
  /** Trimmed, at most 200 characters */
  text: string
  /** Empty string means no image. Album images follow the cover rules */
  image: string
}

export interface Game {
  id: string
  title: string
  summary: string
  tags: string[]
  platform: Platform
  playerId: string
  /** Fallback accent when image missing */
  coverColor: string
  /** Seed / default cover under /static/games */
  coverImage: string
  status: PlayStatus
  /** Player note, at most 40 characters */
  note: string
  journal: JournalEntry[]
}

export type GamePatch = Partial<
  Pick<
    Game,
    | 'title'
    | 'summary'
    | 'coverImage'
    | 'platform'
    | 'tags'
    | 'status'
    | 'note'
  >
>

export type AddGameInput = {
  title: string
  summary?: string
  platform: Platform
  coverImage?: string
  coverColor?: string
  tags?: string[]
  status?: PlayStatus
  note?: string
}

export type GamesByPlatform = Record<Platform, Game[]>
