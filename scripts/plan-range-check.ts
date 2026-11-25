import { addPlayPlan, addPlayPlans, listMyGames, reloadFromStorage, reschedulePlayPlan, resetLibrary, togglePlayPlan } from '../src/services/catalog'
import { calendarDays, explainPlanRange, newerPlanFirst } from '../src/services/plan-range'

const failures: string[] = []

function check(name: string, ok: boolean) {
  if (!ok) failures.push(name)
}

function day(year: number, month: number, date: number) {
  return new Date(year, month - 1, date).getTime()
}

function ymd(at: number) {
  const date = new Date(at)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

resetLibrary()
const first = listMyGames()[0]
const second = listMyGames().find((game) => game.id !== first.id)!
const statusBefore = first.status
const shelfBefore = first.onShelf
const journalBefore = first.journal.length

const start = day(2026, 11, 25)
const end = day(2026, 12, 14)
const created = addPlayPlans(first.id, start, end)
check('20 days', created.status === 'saved' && created.status === 'saved' && created.added === 20 && created.skipped === 0)

let game = listMyGames().find((item) => item.id === first.id)!
const batch = (game.plans ?? []).filter((plan) => plan.at >= start && plan.at <= end)
check('20 records', batch.length === 20)
check('unique ids', new Set(batch.map((plan) => plan.id)).size === 20)
check('unplayed', batch.every((plan) => plan.played === false))
check('calendar steps', batch.map((plan) => ymd(plan.at)).join(',') === Array.from({ length: 20 }, (_, index) => {
  const date = new Date(2026, 10, 25)
  date.setDate(date.getDate() + index)
  return ymd(date.getTime())
}).join(','))

const kept = []
for (let index = 0; index < 5; index += 1) {
  const at = day(2033, 3, 1 + index)
  const one = addPlayPlan(first.id, at)
  if (typeof one !== 'object') throw new Error('seed day failed')
  const plan = one.plans?.find((item) => item.at === at)
  if (!plan) throw new Error('missing seeded day')
  togglePlayPlan(first.id, plan.id)
  kept.push(plan)
}
const overlap = addPlayPlans(first.id, day(2033, 3, 1), day(2033, 3, 20))
check('skip five', overlap.status === 'saved' && overlap.added === 15 && overlap.skipped === 5)
game = listMyGames().find((item) => item.id === first.id)!
for (const plan of kept) {
  const found = game.plans?.find((item) => item.id === plan.id)
  check(`keep ${plan.id}`, !!found && found.played === true && found.at === plan.at)
}
check('all duplicate', addPlayPlans(first.id, start, end).status === 'duplicate')
check('same day', addPlayPlans(first.id, day(2027, 1, 2), day(2027, 1, 2)).status === 'saved')
check('single duplicate', addPlayPlan(first.id, start) === 'duplicate')
check('inverted', addPlayPlans(first.id, end, start).status === 'inverted')
check('invalid', addPlayPlans(first.id, Number.NaN, end).status === 'invalid')
check('missing', addPlayPlans('missing-game', start, end).status === 'missing')

const leap = calendarDays(day(2024, 2, 28), day(2024, 3, 1))
check('leap', Array.isArray(leap) && leap.map(ymd).join(',') === '2024-2-28,2024-2-29,2024-3-1')
const yearEnd = calendarDays(day(2026, 12, 30), day(2027, 1, 2))
check('year', Array.isArray(yearEnd) && yearEnd.length === 4)
const spring = calendarDays(day(2026, 3, 7), day(2026, 3, 9))
check('dst dates', Array.isArray(spring) && spring.map(ymd).join(',') === '2026-3-7,2026-3-8,2026-3-9')
if (Array.isArray(spring) && process.env.TZ === 'America/New_York') {
  const gap = (spring[2] - spring[1]) / 3600000
  check('dst shorter day', gap === 23)
}

const longStart = day(2028, 1, 1)
const longEnd = new Date(2028, 0, 1)
longEnd.setDate(longEnd.getDate() + 365)
const fit = addPlayPlans(second.id, longStart, longEnd.getTime())
check('366', fit.status === 'saved' && fit.added === 366)
longEnd.setDate(longEnd.getDate() + 1)
check('367', addPlayPlans(second.id, longStart, longEnd.getTime()).status === 'too-long')

const extraStart = new Date(2029, 0, 1)
const extraEnd = new Date(2029, 0, 10)
check('another batch', addPlayPlans(second.id, extraStart.getTime(), extraEnd.getTime()).status === 'saved')
reloadFromStorage()
const reloaded = listMyGames().find((item) => item.id === second.id)!
check('kept over 366', (reloaded.plans ?? []).length === 376)

check('other game same day', addPlayPlans(second.id, start, start).status === 'saved')
game = listMyGames().find((item) => item.id === first.id)!
check('status untouched', game.status === statusBefore && game.onShelf === shelfBefore && game.journal.length === journalBefore)

const moved = game.plans?.find((plan) => plan.at === start)!
const movedId = moved.id
const played = moved.played
const shifted = reschedulePlayPlan(first.id, movedId, day(2030, 5, 1))
check('reschedule keeps id', typeof shifted === 'object' && shifted.plans?.some((plan) => plan.id === movedId && plan.played === played))

check('newer serial', newerPlanFirst('p-100-10', 'p-100-9') < 0)
check('newer time', newerPlanFirst('p-200', 'p-100-9') < 0)
check('old id', newerPlanFirst('p-100-1', 'p-100') < 0)

const preview = explainPlanRange(start, end, new Set([start]))
check('preview', preview.status === 'ready' && preview.added === 19 && preview.skipped === 1 && preview.total === 20)

globalThis.__failSave = true
const before = listMyGames().find((item) => item.id === first.id)!.plans!.length
const failed = addPlayPlans(first.id, day(2031, 1, 1), day(2031, 1, 3))
globalThis.__failSave = false
check('save failed', failed.status === 'failed')
check('memory rolled back', listMyGames().find((item) => item.id === first.id)!.plans!.length === before)
reloadFromStorage()
check('disk rolled back', listMyGames().find((item) => item.id === first.id)!.plans!.length === before)

let writes = 0
const original = uni.setStorageSync
uni.setStorageSync = (key: string, value: unknown) => {
  writes += 1
  original.call(uni, key, value)
}
addPlayPlans(first.id, day(2032, 2, 1), day(2032, 2, 4))
check('one write', writes === 1)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('plan range checks passed')
