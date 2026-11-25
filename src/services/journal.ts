import type { Game, JournalEntry } from '../types/catalog'
import { findMyGameIndex, getGames, reloadFromStorage, replaceGame } from './game-store'
import { normalizeJournal } from './normalize'

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
  const current = getGames()[index]
  const entry: JournalEntry = {
    id: `j-${Date.now()}`,
    at: input.at,
    text,
    image,
  }
  return replaceGame(index, { ...current, journal: normalizeJournal([entry, ...current.journal]) })
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
  const current = getGames()[index]
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
  return replaceGame(index, { ...current, journal: normalizeJournal(next) })
}

export function removeJournalEntry(gameId: string, entryId: string): boolean {
  let index = findMyGameIndex(gameId)
  if (index < 0) {
    reloadFromStorage()
    index = findMyGameIndex(gameId)
    if (index < 0) return false
  }
  const current = getGames()[index]
  if (!current.journal.some((entry) => entry.id === entryId)) return false
  replaceGame(
    index,
    { ...current, journal: current.journal.filter((entry) => entry.id !== entryId) },
  )
  return true
}
