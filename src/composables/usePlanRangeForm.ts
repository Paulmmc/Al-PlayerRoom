import { reactive } from 'vue'
import {
  addPlayPlan,
  addPlayPlans,
  dateInputText,
  explainPlanRange,
  localMidnight,
  parseDateInput,
} from '../services/catalog'
import type { Game, PlayPlan } from '../types/catalog'

export const planModes = [
  { value: 'day', label: '单日' },
  { value: 'range', label: '连续日期' },
]

type PlanGame = { id: string; plans?: PlayPlan[] }

export function isStoredGame(result: unknown): result is Game {
  return !!result && typeof result === 'object' && 'platform' in result && 'title' in result
}

export function usePlanRangeForm() {
  let rangeInitialized = false
  const today = dateInputText(Date.now())
  const state = reactive({
    mode: 'day' as 'day' | 'range',
    dayText: today,
    startText: today,
    endText: today,
    saving: false,
  })

  function reset(at = Date.now()) {
    rangeInitialized = false
    const text = dateInputText(at)
    state.mode = 'day'
    state.dayText = text
    state.startText = text
    state.endText = text
    state.saving = false
  }

  function setMode(value: string) {
    if (value === 'range' && !rangeInitialized) {
      state.startText = state.dayText
      state.endText = state.dayText
      rangeInitialized = true
    }
    if (value === 'day' || value === 'range') state.mode = value
  }

  function describe(game: PlanGame | undefined) {
    if (state.mode === 'day') {
      if (!game) return { reason: '先选择一款游戏', total: null as number | null, added: null as number | null, skipped: null as number | null }
      if (!Number.isFinite(parseDateInput(state.dayText))) {
        return { reason: '请选择有效日期', total: null, added: null, skipped: null }
      }
      if (game.plans?.some((plan) => plan.at === parseDateInput(state.dayText))) {
        return { reason: '这一天已经排过这款', total: null, added: null, skipped: null }
      }
      return { reason: '', total: null, added: null, skipped: null }
    }
    const start = parseDateInput(state.startText)
    const end = parseDateInput(state.endText)
    const known = game ? new Set((game.plans ?? []).map((plan) => localMidnight(plan.at))) : null
    const explained = explainPlanRange(start, end, known)
    if (explained.status === 'invalid') return { reason: '请选择有效日期', total: null, added: null, skipped: null }
    if (explained.status === 'inverted') return { reason: '结束日期不能早于开始日期', total: null, added: null, skipped: null }
    if (explained.status === 'too-long') return { reason: '一次最多安排366天', total: null, added: null, skipped: null }
    if (!game) return { reason: '先选择一款游戏', total: explained.total, added: null, skipped: null }
    if (explained.status !== 'ready') return { reason: '没有这款游戏', total: null, added: null, skipped: null }
    return { reason: explained.added === 0 ? '这些日期都已安排过这款' : '', total: explained.total, added: explained.added, skipped: explained.skipped }
  }

  function save(game: PlanGame | undefined): { close: boolean; toast: string } {
    if (state.saving) return { close: false, toast: '' }
    const view = describe(game)
    if (view.reason || !game) return { close: false, toast: '' }
    state.saving = true
    try {
      if (state.mode === 'day') {
        const result = addPlayPlan(game.id, parseDateInput(state.dayText))
        if (isStoredGame(result)) return { close: true, toast: '' }
        if (result === 'duplicate') return { close: false, toast: '这一天已经排过这款' }
        if (result === 'invalid') return { close: false, toast: '请选择有效日期' }
        if (result === 'failed') return { close: false, toast: '保存失败' }
        return { close: false, toast: '没有这款游戏' }
      }
      const result = addPlayPlans(game.id, parseDateInput(state.startText), parseDateInput(state.endText))
      if (result.status === 'saved') {
        const toast = result.skipped > 0
          ? `新增${result.added}天，跳过${result.skipped}天`
          : `已安排${result.added}天`
        return { close: true, toast }
      }
      if (result.status === 'duplicate') return { close: false, toast: '这些日期都已安排过这款' }
      if (result.status === 'invalid') return { close: false, toast: '请选择有效日期' }
      if (result.status === 'inverted') return { close: false, toast: '结束日期不能早于开始日期' }
      if (result.status === 'too-long') return { close: false, toast: '一次最多安排366天' }
      if (result.status === 'failed') return { close: false, toast: '保存失败' }
      return { close: false, toast: '没有这款游戏' }
    } finally {
      state.saving = false
    }
  }

  return Object.assign(state, { reset, setMode, describe, save })
}
