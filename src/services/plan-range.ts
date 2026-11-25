import type { PlayPlan } from '../types/catalog'
import { localMidnight } from './normalize'

export const PLAN_RANGE_LIMIT = 366

export function dateInputText(at: number): string {
  const date = new Date(at)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseDateInput(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return Number.NaN
  const [year, month, day] = value.split('-').map((part) => Number(part))
  const date = new Date(year, (month || 1) - 1, day || 1)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return Number.NaN
  }
  return date.getTime()
}

export function calendarDays(start: number, end: number): number[] | 'too-long' {
  const days: number[] = []
  const cursor = new Date(start)
  while (cursor.getTime() <= end) {
    days.push(cursor.getTime())
    if (days.length > PLAN_RANGE_LIMIT) return 'too-long'
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export type RangePreview =
  | { status: 'ready'; total: number; added: number; skipped: number }
  | { status: 'dates'; total: number }
  | { status: 'invalid' }
  | { status: 'inverted' }
  | { status: 'too-long' }

export function explainPlanRange(
  startAt: number,
  endAt: number,
  existingDays: Set<number> | null,
): RangePreview {
  const start = Number.isFinite(startAt) ? localMidnight(startAt) : Number.NaN
  const end = Number.isFinite(endAt) ? localMidnight(endAt) : Number.NaN
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { status: 'invalid' }
  if (end < start) return { status: 'inverted' }
  const days = calendarDays(start, end)
  if (days === 'too-long') return { status: 'too-long' }
  if (!existingDays) return { status: 'dates', total: days.length }
  let skipped = 0
  for (const day of days) {
    if (existingDays.has(day)) skipped += 1
  }
  return { status: 'ready', total: days.length, added: days.length - skipped, skipped }
}

export function newerPlanFirst(a: string, b: string): number {
  const left = planRank(a)
  const right = planRank(b)
  if (left.time !== right.time) return right.time - left.time
  if (left.serial !== right.serial) return right.serial - left.serial
  if (a === b) return 0
  return a < b ? 1 : -1
}

function planRank(id: string): { time: number; serial: number } {
  const match = /^p-(\d+)(?:-(\d+))?$/.exec(id)
  if (!match) return { time: 0, serial: 0 }
  return {
    time: Number(match[1]),
    serial: match[2] ? Number(match[2]) : 0,
  }
}

export function freshPlans(days: number[], taken: Set<number>, nextId: () => string): PlayPlan[] {
  const fresh: PlayPlan[] = []
  for (const day of days) {
    if (taken.has(day)) continue
    fresh.push({ id: nextId(), at: day, played: false })
  }
  return fresh
}
