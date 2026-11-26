<template>
  <view class="screen" :style="screenStyle">
  <NavMenu title="游玩排期" current="schedule" />
  <view class="page" @click="heldId = ''">
    <text class="title">游玩排期</text>
    <SlidePick
      :options="filters"
      :value="filter"
      :track="theme.tabBg"
      :thumb="theme.tabActiveBg"
      :active="theme.tabActiveText"
      :muted="theme.muted"
      :accent="theme.accent"
      @pick="filter = $event"
    />

    <view v-if="formMode" id="plan-form" class="form" @click.stop>
      <text class="form-title">{{ formMode === 'move' ? '改期' : '安排游玩' }}</text>
      <SlidePick
        v-if="formMode === 'create'"
        :options="planModes"
        :value="planForm.mode"
        :track="theme.tabBg"
        :thumb="theme.tabActiveBg"
        :active="theme.tabActiveText"
        :muted="theme.muted"
        :accent="theme.accent"
        @pick="planForm.setMode"
      />
      <scroll-view v-if="formMode === 'create'" class="game-scroll" scroll-x enable-flex>
        <view
          v-for="item in library"
          :key="item.id"
          class="game-pick"
          :class="{ on: item.id === pickedId }"
          @click="pickedId = item.id"
        >
          <image v-if="item.coverImage" class="game-cover" :src="item.coverImage" mode="aspectFill" />
          <view v-else class="game-cover" :style="{ background: item.coverColor }" />
          <text class="game-name">{{ item.title }}</text>
          <text class="game-platform">{{ labels[item.platform] }}</text>
        </view>
      </scroll-view>
      <view v-else class="locked-game">
        <text class="locked-name">{{ movingGame?.title }}</text>
        <text v-if="movingGame" class="game-platform">{{ labels[movingGame.platform] }}</text>
      </view>
      <text v-if="formMode === 'create' && !library.length" class="hint">
        先往游戏库添加一款游戏
      </text>
      <text
        v-if="formMode === 'create' && !library.length"
        class="link"
        @click="goAdd"
      >
        去添加
      </text>
      <template v-if="formMode === 'move' || planForm.mode === 'day'">
        <picker mode="date" :value="formMode === 'move' ? planDate : planForm.dayText" @change="onDate">
          <view class="date">{{ formMode === 'move' ? planDate : planForm.dayText }}</view>
        </picker>
      </template>
      <template v-else>
        <text class="hint">开始日期</text>
        <picker mode="date" :value="planForm.startText" @change="onStart">
          <view class="date">{{ planForm.startText }}</view>
        </picker>
        <text class="hint">结束日期</text>
        <picker mode="date" :value="planForm.endText" @change="onEnd">
          <view class="date">{{ planForm.endText }}</view>
        </picker>
        <text v-if="formView.total != null" class="hint">共 {{ formView.total }} 天</text>
        <text v-if="formView.added != null" class="hint">新增 {{ formView.added }} 天，跳过 {{ formView.skipped }} 天</text>
      </template>
      <text v-if="formMode === 'create' && formView.reason" class="hint">{{ formView.reason }}</text>
      <view class="form-actions">
        <text class="muted" @click="closeForm">取消</text>
        <text
          class="link"
          :style="{ color: createBlocked ? theme.muted : theme.accent }"
          @click="submitForm"
        >{{ formMode === 'move' ? '保存改期' : '加入排期' }}</text>
      </view>
    </view>

    <text v-if="!allRows.length" class="hint">还没有排期</text>
    <text v-else-if="filter === 'open' && !upcoming.length && !past.length" class="hint">没有未游玩的排期</text>
    <text v-else-if="filter === 'played' && !upcoming.length && !past.length" class="hint">没有已游玩的排期</text>

    <view v-if="showTodayEmpty" class="hint">今天还没有安排</view>

    <view v-for="(day, index) in upcoming" :key="day" class="day-row">
      <view class="day-side">
        <view class="rail">
          <view v-if="index < upcoming.length - 1" class="rail-line" />
          <view class="rail-dot" />
        </view>
        <view class="day-copy">
          <text v-if="dayMark(day)" class="day-flag">{{ dayMark(day) }}</text>
          <text class="day-label">{{ monthDay(day) }}</text>
          <text v-if="showYear(day)" class="day-year">{{ yearOf(day) }}</text>
        </view>
      </view>
      <view class="day-cards">
        <view
          v-for="row in rowsOn(day)"
          :key="row.plan.id"
          class="card"
          @click="openGame(row)"
          @touchstart.stop="holdStart(row.plan.id, $event)"
          @touchmove.stop="holdMove"
          @touchend="holdEnd"
          @touchcancel="holdLeave"
          @mousedown.stop="holdStart(row.plan.id, $event)"
          @mousemove="holdMove"
          @mouseup="holdEnd"
          @mouseleave="holdLeave"
        >
          <image v-if="row.game.coverImage" class="cover" :src="row.game.coverImage" mode="aspectFill" />
          <view v-else class="cover" :style="{ background: row.game.coverColor }" />
          <view class="card-copy">
            <text class="card-title">{{ row.game.title }}</text>
            <text class="card-platform">{{ labels[row.game.platform] }}</text>
            <text v-if="day < today && !row.plan.played" class="soft">还没玩</text>
            <view class="card-actions" @click.stop>
              <text @click="toggle(row)">{{ row.plan.played ? '已游玩' : '玩过了' }}</text>
              <text @click="openMove(row)">改期</text>
              <text v-if="day < today && !row.plan.played" @click="moveToday(row)">移到今天</text>
            </view>
            <view v-if="heldId === row.plan.id" class="card-actions" @click.stop>
              <text class="danger" @click="remove(row)">删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <text v-if="past.length" class="section">之前的安排</text>
    <view v-for="(day, index) in past" :key="'p' + day" class="day-row">
      <view class="day-side">
        <view class="rail">
          <view v-if="index < past.length - 1" class="rail-line" />
          <view class="rail-dot" />
        </view>
        <view class="day-copy">
          <text class="day-label">{{ monthDay(day) }}</text>
          <text v-if="showYear(day)" class="day-year">{{ yearOf(day) }}</text>
        </view>
      </view>
      <view class="day-cards">
        <view
          v-for="row in rowsOn(day)"
          :key="row.plan.id"
          class="card"
          @click="openGame(row)"
          @touchstart.stop="holdStart(row.plan.id, $event)"
          @touchmove.stop="holdMove"
          @touchend="holdEnd"
          @touchcancel="holdLeave"
          @mousedown.stop="holdStart(row.plan.id, $event)"
          @mousemove="holdMove"
          @mouseup="holdEnd"
          @mouseleave="holdLeave"
        >
          <image v-if="row.game.coverImage" class="cover" :src="row.game.coverImage" mode="aspectFill" />
          <view v-else class="cover" :style="{ background: row.game.coverColor }" />
          <view class="card-copy">
            <text class="card-title">{{ row.game.title }}</text>
            <text class="card-platform">{{ labels[row.game.platform] }}</text>
            <text v-if="!row.plan.played" class="soft">还没玩</text>
            <view class="card-actions" @click.stop>
              <text @click="toggle(row)">{{ row.plan.played ? '已游玩' : '玩过了' }}</text>
              <text @click="openMove(row)">改期</text>
              <text v-if="!row.plan.played" @click="moveToday(row)">移到今天</text>
            </view>
            <view v-if="heldId === row.plan.id" class="card-actions" @click.stop>
              <text class="danger" @click="remove(row)">删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view
      class="fab"
      :class="{ pressed: fabPressed }"
      @click.stop="openCreate"
      @touchstart="fabPressed = true"
      @touchend="fabPressed = false"
      @touchcancel="fabPressed = false"
      @mousedown="fabPressed = true"
      @mouseup="fabPressed = false"
      @mouseleave="fabPressed = false"
    >
      <text class="fab-plus">+</text>
      <text>排一期</text>
    </view>
  </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { onHide, onLoad, onShow } from '@dcloudio/uni-app'
import { useLongPress } from '../../composables/useLongPress'
import SlidePick from '../../components/SlidePick.vue'
import NavMenu from '../../components/NavMenu.vue'
import { planModes, usePlanRangeForm, isStoredGame } from '../../composables/usePlanRangeForm'
import {
  listMyGames,
  localMidnight,
  newerPlanFirst,
  parseDateInput,
  reloadFromStorage,
  reschedulePlayPlan,
  togglePlayPlan,
  removePlayPlan,
} from '../../services/catalog'
import type { Game, PlayPlan } from '../../types/catalog'
import { PLATFORM_LABELS } from '../../types/catalog'
import { libraryPlatform } from '../../services/library-theme'
import { getStoreTheme } from '../../theme/store'

type Row = { game: Game; plan: PlayPlan }

const theme = computed(() => getStoreTheme(libraryPlatform.value))
const screenStyle = computed(() => ({
  background: theme.value.pageBg,
  '--page': theme.value.pageBg,
  '--card': theme.value.cardBg,
  '--text': theme.value.text,
  '--muted': theme.value.muted,
  '--accent': theme.value.accent,
  '--on-accent': theme.value.tabActiveText,
}))

const labels = PLATFORM_LABELS
const filters = [
  { value: 'all', label: '全部' },
  { value: 'open', label: '未游玩' },
  { value: 'played', label: '已游玩' },
]
const filter = ref('all')
const library = ref<Game[]>([])
const today = ref(localMidnight())
const formMode = ref<'create' | 'move' | ''>('')
const pickedId = ref('')
const movingId = ref('')
const movingGameId = ref('')
const planDate = ref(dateText(Date.now()))
const heldId = ref('')
const planHold = useLongPress()
const fabPressed = ref(false)
const presetGameId = ref('')
const planForm = usePlanRangeForm()
const pickedGame = computed(() => library.value.find((game) => game.id === pickedId.value))
const formView = computed(() => planForm.describe(pickedGame.value))
const createBlocked = computed(() => formMode.value === 'create' && !!formView.value.reason)

const movingGame = computed(() => library.value.find((game) => game.id === movingGameId.value))

const grouped = computed(() => {
  const now = today.value
  const byDay = new Map<number, Row[]>()
  for (const game of library.value) {
    for (const plan of game.plans ?? []) {
      if (filter.value === 'open' && plan.played) continue
      if (filter.value === 'played' && !plan.played) continue
      const day = localMidnight(plan.at)
      const list = byDay.get(day) ?? []
      list.push({ game, plan })
      byDay.set(day, list)
    }
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => newerPlanFirst(a.plan.id, b.plan.id))
  }
  const days = [...byDay.keys()]
  return {
    byDay,
    upcoming: days.filter((day) => day >= now).sort((a, b) => a - b),
    past: days.filter((day) => day < now).sort((a, b) => b - a),
    any: days.length > 0,
  }
})

const upcoming = computed(() => grouped.value.upcoming)
const past = computed(() => grouped.value.past)
const allRows = computed(() => {
  const rows: Row[] = []
  for (const game of library.value) rows.push(...(game.plans ?? []).map((plan) => ({ game, plan })))
  return rows
})
const showTodayEmpty = computed(
  () => allRows.value.length > 0 && filter.value === 'all' && !grouped.value.byDay.has(today.value) && upcoming.value.length > 0,
)

function rowsOn(day: number) {
  return grouped.value.byDay.get(day) ?? []
}

function monthDay(day: number) {
  const date = new Date(day)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function yearOf(day: number) {
  return String(new Date(day).getFullYear())
}

function showYear(day: number) {
  return new Date(day).getFullYear() !== new Date(today.value).getFullYear()
}

function dayMark(day: number) {
  const tomorrow = new Date(today.value)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (day === today.value) return '今天'
  if (day === localMidnight(tomorrow)) return '明天'
  return ''
}

function dateText(at: number) {
  const date = new Date(at)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function refresh() {
  today.value = localMidnight()
  reloadFromStorage()
  library.value = listMyGames()
}

async function revealForm() {
  await nextTick()
  uni.pageScrollTo({ selector: '#plan-form', duration: 200 })
}

function openCreate() {
  refresh()
  heldId.value = ''
  formMode.value = 'create'
  pickedId.value = presetGameId.value || library.value[0]?.id || ''
  planForm.reset(today.value)
  revealForm()
}

function openMove(row: Row) {
  formMode.value = 'move'
  movingId.value = row.plan.id
  movingGameId.value = row.game.id
  planDate.value = dateText(row.plan.at)
  revealForm()
}

function closeForm() {
  formMode.value = ''
}

function onDate(event: { detail: { value: string } }) {
  const value = event.detail.value
  if (formMode.value === 'move') planDate.value = value
  else planForm.dayText = value
}

function onStart(event: { detail: { value: string } }) {
  planForm.startText = event.detail.value
}

function onEnd(event: { detail: { value: string } }) {
  planForm.endText = event.detail.value
}

function submitForm() {
  if (formMode.value === 'create') {
    const outcome = planForm.save(pickedGame.value)
    if (outcome.toast) uni.showToast({ title: outcome.toast, icon: 'none' })
    if (!outcome.close) return
    closeForm()
    refresh()
    return
  }
  const at = parseDateInput(planDate.value)
  if (!Number.isFinite(at)) {
    uni.showToast({ title: '请选择有效日期', icon: 'none' })
    return
  }
  const result = reschedulePlayPlan(movingGameId.value, movingId.value, at)
  if (!isStoredGame(result)) {
    if (result === 'duplicate') uni.showToast({ title: '这一天已经排过这款', icon: 'none' })
    else if (result === 'invalid') uni.showToast({ title: '请选择有效日期', icon: 'none' })
    else if (result === 'failed') uni.showToast({ title: '保存失败', icon: 'none' })
    else uni.showToast({ title: '没有这款游戏', icon: 'none' })
    return
  }
  closeForm()
  refresh()
}

function toggle(row: Row) {
  const result = togglePlayPlan(row.game.id, row.plan.id)
  if (!isStoredGame(result)) {
    uni.showToast({ title: result === 'failed' ? '保存失败' : '没有这款游戏', icon: 'none' })
    return
  }
  refresh()
}

function moveToday(row: Row) {
  const result = reschedulePlayPlan(row.game.id, row.plan.id, today.value)
  if (!isStoredGame(result)) {
    if (result === 'duplicate') uni.showToast({ title: '这一天已经排过这款', icon: 'none' })
    else if (result === 'invalid') uni.showToast({ title: '请选择有效日期', icon: 'none' })
    else uni.showToast({ title: result === 'failed' ? '保存失败' : '没有这款游戏', icon: 'none' })
    return
  }
  refresh()
}

function remove(row: Row) {
  removePlayPlan(row.game.id, row.plan.id)
  heldId.value = ''
  refresh()
}

function openGame(row: Row) {
  if (planHold.takeSuppressedClick()) return
  if (heldId.value) {
    heldId.value = ''
    return
  }
  uni.navigateTo({ url: `/pages/game/detail?id=${row.game.id}` })
}

function goAdd() {
  uni.navigateTo({ url: '/pages/game/edit?mode=create' })
}

function holdStart(id: string, event: TouchEvent | MouseEvent) {
  planHold.start(event, () => {
    heldId.value = id
  })
}

function holdMove(event: TouchEvent | MouseEvent) {
  planHold.move(event)
}

function holdEnd() {
  planHold.end()
}

function holdLeave() {
  holdEnd()
}

function clearHold() {
  planHold.reset()
  heldId.value = ''
}

onHide(clearHold)
onUnmounted(clearHold)

onLoad((query) => {
  presetGameId.value = String(query?.gameId ?? '')
  if (presetGameId.value) openCreate()
})

onShow(refresh)
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 28rpx 180rpx;
  background: var(--page);
  box-sizing: border-box;
  color: var(--text);
}

.title,
.form-title,
.section {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
}

.section {
  margin-top: 28rpx;
  font-size: 28rpx;
}

.form,
.card {
  background: var(--card);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-top: 20rpx;
}

.game-scroll {
  white-space: nowrap;
  margin-bottom: 16rpx;
}

.game-pick {
  display: inline-flex;
  flex-direction: column;
  width: 120rpx;
  margin-right: 16rpx;
  opacity: 0.55;
}

.game-pick.on {
  opacity: 1;
}

.game-cover,
.cover {
  width: 120rpx;
  height: 160rpx;
  border-radius: 8rpx;
  background: #111;
}

.cover {
  width: 96rpx;
  height: 128rpx;
  flex-shrink: 0;
}

.game-name,
.card-title,
.card-platform,
.soft,
.hint,
.date,
.muted,
.link {
  display: block;
  font-size: 24rpx;
}

.card {
  display: flex;
  gap: 16rpx;
}

.card-copy {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 28rpx;
  font-weight: 700;
}

.card-platform,
.soft,
.muted,
.hint {
  color: var(--muted);
  margin-top: 6rpx;
}

.card-actions,
.form-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 12rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--accent);
}

.danger {
  color: #e60012;
}

.day-row {
  display: flex;
  margin-top: 20rpx;
}

.day-side {
  width: 144rpx;
  flex-shrink: 0;
  position: relative;
  display: flex;
}

.rail {
  position: absolute;
  top: 8rpx;
  bottom: 0;
  right: 28rpx;
  width: 16rpx;
}

.rail-line {
  position: absolute;
  left: 7rpx;
  top: 16rpx;
  bottom: -28rpx;
  width: 2rpx;
  background: var(--muted);
  opacity: 0.45;
}

.rail-dot {
  position: absolute;
  left: 0;
  top: 8rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 999rpx;
  background: var(--accent);
}

.day-copy {
  padding-right: 36rpx;
}

.day-flag,
.day-label,
.day-year {
  display: block;
  font-size: 22rpx;
  color: var(--muted);
}

.day-cards {
  flex: 1;
  min-width: 0;
}

.link {
  color: var(--accent);
  font-weight: 700;
}

.date {
  margin-top: 12rpx;
  color: var(--text);
}

.fab {
  position: fixed;
  right: 36rpx;
  bottom: calc(32rpx + env(safe-area-inset-bottom));
  z-index: 20;
  min-width: 120rpx;
  height: 88rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: var(--accent);
  color: var(--on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  font-size: 26rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.28);
  animation: fabPulse 2.4s ease-in-out infinite;
  transition: transform 0.15s ease;
}

.fab.pressed {
  transform: scale(0.92);
  animation: none;
}

.fab-plus {
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1;
}

@keyframes fabPulse {
  0%,
  100% {
    box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.28);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 16rpx 36rpx rgba(0, 0, 0, 0.36);
    transform: scale(1.03);
  }
}
</style>
