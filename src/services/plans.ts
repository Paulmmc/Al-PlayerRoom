import type { Game, PlayPlan } from '../types/catalog'
import { findMyGameIndex, getGames, reloadFromStorage, saveGames, setGames } from './game-store'
import { localMidnight, normalizePlans } from './normalize'
import { calendarDays, explainPlanRange, freshPlans } from './plan-range'

export { explainPlanRange, newerPlanFirst, dateInputText, parseDateInput } from './plan-range'

function planList(game: Game): PlayPlan[] {
  return game.plans ? [...game.plans] : []
}

function writePlans(index: number, plans: PlayPlan[]): Game | 'failed' {
  const before = getGames()
  const nextGame: Game = { ...before[index], plans: normalizePlans(plans) }
  setGames([...before.slice(0, index), nextGame, ...before.slice(index + 1)])
  try {
    saveGames()
  } catch {
    setGames(before)
    return 'failed'
  }
  return nextGame
}

function locateGame(gameId: string): number {
  let index = findMyGameIndex(gameId)
  if (index < 0) {
    reloadFromStorage()
    index = findMyGameIndex(gameId)
  }
  return index
}

let planSerial = 0

function nextPlanId() {
  planSerial += 1
  return `p-${Date.now()}-${planSerial}`
}

function planDay(at: number) {
  if (typeof at !== 'number' || !Number.isFinite(at)) return null
  const day = localMidnight(at)
  return Number.isFinite(day) ? day : null
}

export function addPlayPlan(gameId: string, at: number): Game | 'duplicate' | 'invalid' | 'failed' | undefined {
  const index = locateGame(gameId)
  if (index < 0) return undefined
  const day = planDay(at)
  if (day == null) return 'invalid'
  const plans = planList(getGames()[index])
  if (plans.some((plan) => plan.at === day)) return 'duplicate'
  return writePlans(index, [{ id: nextPlanId(), at: day, played: false }, ...plans])
}

export type PlanBatchResult =
  | { status: 'saved'; added: number; skipped: number }
  | { status: 'duplicate' | 'invalid' | 'inverted' | 'too-long' | 'missing' | 'failed' }

export function addPlayPlans(gameId: string, startAt: number, endAt: number): PlanBatchResult {
  const start = planDay(startAt)
  const end = planDay(endAt)
  if (start == null || end == null) return { status: 'invalid' }
  if (end < start) return { status: 'inverted' }
  const days = calendarDays(start, end)
  if (days === 'too-long') return { status: 'too-long' }
  const index = locateGame(gameId)
  if (index < 0) return { status: 'missing' }
  const existing = planList(getGames()[index])
  const taken = new Set(existing.map((plan) => plan.at))
  const fresh = freshPlans(days, taken, nextPlanId)
  if (!fresh.length) return { status: 'duplicate' }
  const written = writePlans(index, [...fresh, ...existing])
  if (written === 'failed') return { status: 'failed' }
  return { status: 'saved', added: fresh.length, skipped: days.length - fresh.length }
}

export function togglePlayPlan(gameId: string, planId: string): Game | 'failed' | undefined {
  const index = locateGame(gameId)
  if (index < 0) return undefined
  const plans = planList(getGames()[index])
  if (!plans.some((plan) => plan.id === planId)) return undefined
  return writePlans(
    index,
    plans.map((plan) => (plan.id === planId ? { ...plan, played: !plan.played } : plan)),
  )
}

export function reschedulePlayPlan(
  gameId: string,
  planId: string,
  at: number,
): Game | 'duplicate' | 'invalid' | 'failed' | undefined {
  const index = locateGame(gameId)
  if (index < 0) return undefined
  const plans = planList(getGames()[index])
  const current = plans.find((plan) => plan.id === planId)
  if (!current) return undefined
  const day = planDay(at)
  if (day == null) return 'invalid'
  if (current.at === day) return getGames()[index]
  if (plans.some((plan) => plan.id !== planId && plan.at === day)) return 'duplicate'
  return writePlans(
    index,
    plans.map((plan) => (plan.id === planId ? { ...plan, at: day } : plan)),
  )
}

export function removePlayPlan(gameId: string, planId: string): boolean {
  const index = locateGame(gameId)
  if (index < 0) return false
  const plans = planList(getGames()[index])
  if (!plans.some((plan) => plan.id === planId)) return false
  return writePlans(
    index,
    plans.filter((plan) => plan.id !== planId),
  ) !== 'failed'
}
