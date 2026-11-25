<template>
  <view v-if="game" class="page" :style="{ background: theme.pageBg }">
    <view class="hero-cover">
      <image
        v-if="cover"
        class="hero-image fade-in"
        :src="cover"
        mode="aspectFill"
      />
      <view
        v-else
        class="hero-image hero-fallback fade-in"
        :style="{ backgroundColor: game.coverColor }"
      />
      <view class="hero-mask" :style="maskStyle" />
      <view class="hero-meta">
        <text class="badge" :style="{ background: theme.accent }">{{ platformText }}</text>
        <text class="hero-title" :style="{ color: theme.id === 'switch' ? '#fff' : theme.text }">
          {{ game.title }}
        </text>
      </view>
    </view>

    <view class="panel fade-in-late" :style="{ background: theme.cardBg }">
      <text class="title" :style="{ color: theme.text }">{{ game.title }}</text>
      <view class="tags">
        <text
          v-for="tag in game.tags"
          :key="tag"
          class="tag"
          :style="tagStyle"
        >
          {{ tag }}
        </text>
      </view>
      <text class="summary" :style="{ color: theme.muted }">{{ game.summary }}</text>
      <view class="menus">
        <SlidePick
          :options="statusOptions"
          :value="game.status"
          :track="segTrack"
          :thumb="theme.tabActiveBg"
          :active="theme.tabActiveText"
          :muted="theme.muted"
          :accent="theme.accent"
          @pick="setStatus"
        />
        <SlidePick
          :options="shelfOptions"
          :value="game.onShelf ? 'on' : 'off'"
          :track="segTrack"
          :thumb="theme.tabActiveBg"
          :active="theme.tabActiveText"
          :muted="theme.muted"
          :accent="theme.accent"
          @pick="setShelf"
        />
      </view>
      <text class="plan-entry" :style="{ color: theme.accent }" @click="openPlan">安排游玩</text>
      <view v-if="planOpen" id="plan-form" class="journal-form" :style="{ background: theme.cardBg }">
        <SlidePick
          :options="planModes"
          :value="planForm.mode"
          :track="segTrack"
          :thumb="theme.tabActiveBg"
          :active="theme.tabActiveText"
          :muted="theme.muted"
          :accent="theme.accent"
          @pick="planForm.setMode"
        />
        <scroll-view class="plan-scroll" scroll-x enable-flex>
          <view
            v-for="item in library"
            :key="item.id"
            class="plan-game"
            :class="{ on: item.id === planGameId }"
            @click="planGameId = item.id"
          >
            <image v-if="item.coverImage" class="plan-cover" :src="item.coverImage" mode="aspectFill" />
            <text class="plan-name" :style="{ color: theme.text }">{{ item.title }}</text>
            <text class="plan-platform" :style="{ color: theme.muted }">{{ platformLabels[item.platform] }}</text>
          </view>
        </scroll-view>
        <template v-if="planForm.mode === 'day'">
          <picker mode="date" :value="planForm.dayText" @change="onPlanDate">
            <view class="journal-date" :style="{ color: theme.text }">{{ planForm.dayText }}</view>
          </picker>
        </template>
        <template v-else>
          <text class="plan-platform" :style="{ color: theme.muted }">开始日期</text>
          <picker mode="date" :value="planForm.startText" @change="onPlanStart">
            <view class="journal-date" :style="{ color: theme.text }">{{ planForm.startText }}</view>
          </picker>
          <text class="plan-platform" :style="{ color: theme.muted }">结束日期</text>
          <picker mode="date" :value="planForm.endText" @change="onPlanEnd">
            <view class="journal-date" :style="{ color: theme.text }">{{ planForm.endText }}</view>
          </picker>
          <text v-if="planView.total != null" class="plan-platform" :style="{ color: theme.muted }">共 {{ planView.total }} 天</text>
          <text v-if="planView.added != null" class="plan-platform" :style="{ color: theme.muted }">新增 {{ planView.added }} 天，跳过 {{ planView.skipped }} 天</text>
        </template>
        <text v-if="planView.reason" class="plan-platform" :style="{ color: theme.muted }">{{ planView.reason }}</text>
        <view class="journal-actions">
          <text class="journal-cancel" :style="{ color: theme.muted }" @click="planOpen = false">取消</text>
          <text
            class="journal-save"
            :style="{ color: planView.reason ? theme.muted : theme.accent }"
            @click="savePlan"
          >加入排期</text>
        </view>
      </view>
      <view class="note-box">
        <input
          class="note-input"
          type="text"
          v-model="note"
          maxlength="40"
          placeholder="写一句备注"
          placeholder-class="note-placeholder"
          confirm-type="done"
          :style="{ color: theme.text }"
          @blur="saveNote"
        />
      </view>
    </view>

    <view class="journal fade-in-late">
      <view class="journal-head">
        <text class="section-label" :style="{ color: theme.text }">手账</text>
        <text
          v-if="!journalOpen"
          class="journal-add"
          :style="{ color: theme.accent }"
          @click="openJournal()"
        >
          记一笔
        </text>
      </view>
      <text
        v-if="!game.journal.length && !journalOpen"
        class="journal-empty"
        :style="{ color: theme.muted }"
      >
        还没有记录
      </text>
      <view v-if="journalOpen || game.journal.length" class="axis">
        <view v-if="journalOpen" class="axis-row">
          <view class="axis-side">
            <text class="axis-date" :style="{ color: theme.muted }">{{ monthDayLabel(journalDate) }}</text>
            <view class="axis-rail">
              <view v-if="game.journal.length" class="axis-line" :style="{ background: theme.muted }" />
              <view class="axis-dot hollow" :style="{ borderColor: theme.accent }" />
            </view>
          </view>
          <view class="journal-form axis-card" :style="{ background: theme.cardBg }">
            <picker mode="date" :value="journalDate" @change="onJournalDate">
              <view class="journal-date" :style="{ color: theme.text }">{{ journalDate }}</view>
            </picker>
            <textarea
              class="journal-text"
              v-model="journalText"
              maxlength="200"
              placeholder="写今天玩到哪了"
              placeholder-class="note-placeholder"
              :style="{ color: theme.text }"
            />
            <view class="journal-photo" @click="pickJournalImage">
              <image
                v-if="journalImage"
                class="journal-photo-img"
                :src="journalImage"
                mode="aspectFill"
              />
              <text v-else class="journal-photo-hint" :style="{ color: theme.muted }">
                贴一张图（可选）
              </text>
            </view>
            <text v-if="journalImage" class="journal-clear" @click.stop="journalImage = ''">
              清除图片
            </text>
            <view class="journal-actions">
              <text class="journal-cancel" :style="{ color: theme.muted }" @click="closeJournal">
                取消
              </text>
              <text class="journal-save" :style="{ color: theme.accent }" @click="saveJournal">
                保存
              </text>
            </view>
          </view>
        </view>
        <view
          v-for="row in journalRows"
          :key="row.entry.id"
          class="axis-row"
        >
          <view class="axis-side">
            <text v-if="row.showDate" class="axis-date" :style="{ color: theme.muted }">
              {{ row.monthDay }}
            </text>
            <text v-if="row.showYear" class="axis-year" :style="{ color: theme.muted }">
              {{ row.year }}
            </text>
            <view class="axis-rail">
              <view
                v-if="!row.isLast"
                class="axis-line"
                :style="{ background: theme.muted }"
              />
              <view class="axis-dot" :style="{ background: theme.accent }" />
            </view>
          </view>
          <view
            class="axis-card"
            :style="{ background: theme.cardBg }"
            @touchstart="holdStart(row.entry.id, $event)"
            @touchmove="holdMove"
            @touchend="holdEnd"
            @touchcancel="holdEnd"
            @mousedown="holdStart(row.entry.id, $event)"
            @mousemove="holdMove"
            @mouseup="holdEnd"
            @mouseleave="holdCancel"
            @click="onJournalCardClick(row.entry.id)"
          >
            <image
              v-if="row.entry.image"
              class="journal-img"
              :src="row.entry.image"
              mode="aspectFill"
            />
            <text v-if="row.entry.text" class="journal-body" :style="{ color: theme.text }">
              {{ row.entry.text }}
            </text>
            <view v-if="heldJournalId === row.entry.id" class="journal-actions" @click.stop>
              <text :style="{ color: theme.accent }" @click="openJournal(row.entry)">编辑</text>
              <text class="journal-delete" @click="confirmRemoveJournal(row.entry.id)">删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <button
      class="edit-btn"
      :style="{ background: theme.accent, color: theme.id === 'steam' ? '#1b2838' : '#fff' }"
      @click="goEdit"
    >
      编辑
    </button>
    <button class="delete-btn" @click="confirmDelete">从游戏库删除</button>
  </view>
  <view v-else class="page empty" :style="{ background: '#0f1219' }">
    <text class="empty-text">游戏不存在</text>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useLongPress } from '../../composables/useLongPress'
import { planModes, usePlanRangeForm } from '../../composables/usePlanRangeForm'
import {
  addJournalEntry,
  gameCover,
  getGame,
  listMyGames,
  platformLabel,
  reloadFromStorage,
  removeGame,
  removeJournalEntry,
  setOnShelf,
  updateGame,
  updateJournalEntry,
} from '../../services/catalog'
import { getStoreTheme } from '../../theme/store'
import SlidePick from '../../components/SlidePick.vue'
import type { ChoiceOption } from '../../components/choice-menus'
import type { Game, JournalEntry, PlayStatus } from '../../types/catalog'
import { PLAY_STATUSES, PLATFORM_LABELS, STATUS_LABELS } from '../../types/catalog'

const gameId = ref('')
const game = ref<Game | undefined>()
const note = ref('')
const journalOpen = ref(false)
const planOpen = ref(false)
const planGameId = ref('')
const planForm = usePlanRangeForm()
const library = ref<Game[]>([])
const planGame = computed(() => library.value.find((item) => item.id === planGameId.value))
const planView = computed(() => planForm.describe(planGame.value))
const platformLabels = PLATFORM_LABELS
const heldJournalId = ref('')
const journalHold = useLongPress()
const editingJournalId = ref('')
const journalDate = ref(todayText())
const journalText = ref('')
const journalImage = ref('')
const shelfOptions: ChoiceOption[] = [
  { value: 'on', label: '上架', icon: 'shelfUp' },
  { value: 'off', label: '下架', icon: 'shelfDown' },
]
const statusOptions = PLAY_STATUSES.map((item) => ({
  value: item,
  label: STATUS_LABELS[item],
  icon: item,
}))
const segTrack = computed(() => theme.value.tabBg)

const theme = computed(() =>
  getStoreTheme(game.value?.platform ?? 'steam'),
)

const platformText = computed(() =>
  game.value ? platformLabel(game.value.platform) : '',
)

const cover = computed(() => (game.value ? gameCover(game.value) : ''))

const maskStyle = computed(() => {
  if (theme.value.id === 'switch') {
    return {
      background:
        'linear-gradient(transparent 30%, rgba(0,0,0,0.55) 100%)',
    }
  }
  if (theme.value.id === 'ps5') {
    return {
      background:
        'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 70%)',
    }
  }
  return {
    background:
      'linear-gradient(transparent 20%, rgba(27,40,56,0.95) 100%)',
  }
})

const tagStyle = computed(() => ({
  color: theme.value.id === 'switch' ? theme.value.accent : theme.value.muted,
  background: theme.value.id === 'switch' ? '#ffe8ea' : theme.value.pageBg,
}))

function todayText() {
  return formatJournalDay(Date.now())
}

function formatJournalDay(at: number) {
  const date = new Date(at)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function monthDayLabel(value: string) {
  const [year, month, day] = value.split('-')
  return `${Number(month)}/${Number(day)}`
}

const journalRows = computed(() => {
  const list = game.value?.journal ?? []
  const thisYear = new Date().getFullYear()
  return list.map((entry, index) => {
    const date = new Date(entry.at)
    const prev = index > 0 ? new Date(list[index - 1].at) : null
    const sameDay =
      !!prev &&
      prev.getFullYear() === date.getFullYear() &&
      prev.getMonth() === date.getMonth() &&
      prev.getDate() === date.getDate()
    return {
      entry,
      showDate: !sameDay,
      showYear: !sameDay && (prev ? prev.getFullYear() !== date.getFullYear() : date.getFullYear() !== thisYear),
      isLast: index === list.length - 1,
      monthDay: `${date.getMonth() + 1}/${date.getDate()}`,
      year: String(date.getFullYear()),
    }
  })
})

function holdStart(id: string, event: TouchEvent | MouseEvent) {
  journalHold.start(event, () => {
    heldJournalId.value = id
  })
}

function holdMove(event: TouchEvent | MouseEvent) {
  journalHold.move(event)
}

function holdEnd() {
  journalHold.end()
}

function holdCancel() {
  holdEnd()
}

function onJournalCardClick(id: string) {
  if (journalHold.takeSuppressedClick()) return
  if (heldJournalId.value === id) heldJournalId.value = ''
  else if (heldJournalId.value) heldJournalId.value = ''
}

function dayStamp(value: string) {
  const [year, month, day] = value.split('-').map((part) => Number(part))
  return new Date(year, (month || 1) - 1, day || 1).getTime()
}

function openJournal(entry?: JournalEntry) {
  editingJournalId.value = entry?.id ?? ''
  journalDate.value = formatJournalDay(entry?.at ?? Date.now())
  journalText.value = entry?.text ?? ''
  journalImage.value = entry?.image ?? ''
  journalOpen.value = true
}

function closeJournal() {
  journalOpen.value = false
  editingJournalId.value = ''
}

function onJournalDate(event: { detail: { value: string } }) {
  journalDate.value = event.detail.value
}

function fileToDataUrl(path: string): Promise<string> {
  // #ifdef H5
  return fetch(path)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(blob)
        }),
    )
  // #endif
  // #ifndef H5
  return Promise.resolve(path)
  // #endif
}

function pickJournalImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const path = res.tempFilePaths[0]
      if (!path) return
      try {
        journalImage.value = await fileToDataUrl(path)
      } catch {
        journalImage.value = path
      }
    },
  })
}

function saveJournal() {
  if (!game.value) return
  const text = journalText.value.trim()
  const image = journalImage.value
  if (!text && !image) {
    uni.showToast({ title: '写一句或贴一张图', icon: 'none' })
    return
  }
  const at = dayStamp(journalDate.value)
  const updated = editingJournalId.value
    ? updateJournalEntry(game.value.id, editingJournalId.value, { at, text, image })
    : addJournalEntry(game.value.id, { at, text, image })
  if (!updated) {
    uni.showToast({ title: '保存失败', icon: 'none' })
    return
  }
  game.value = updated
  closeJournal()
}

function confirmRemoveJournal(entryId: string) {
  if (!game.value) return
  uni.showModal({
    title: '删除记录',
    content: '确定删掉这一条手账吗？游戏还会留在库里。',
    confirmColor: '#e60012',
    success: (res) => {
      if (!res.confirm || !game.value) return
      if (!removeJournalEntry(game.value.id, entryId)) {
        uni.showToast({ title: '删除失败', icon: 'none' })
        return
      }
      reloadFromStorage()
      game.value = getGame(game.value.id)
    },
  })
}

function refresh() {
  if (!gameId.value) return
  reloadFromStorage()
  game.value = getGame(gameId.value)
  note.value = game.value?.note ?? ''
  if (game.value) {
    const t = getStoreTheme(game.value.platform)
    uni.setNavigationBarTitle({ title: game.value.title })
    uni.setNavigationBarColor({
      frontColor: t.navText === 'white' ? '#ffffff' : '#000000',
      backgroundColor: t.navBg,
    })
  }
}

onLoad((query) => {
  gameId.value = query?.id ?? ''
  refresh()
})

onShow(() => {
  refresh()
})

function setStatus(next: string) {
  if (!game.value || game.value.status === next) return
  const updated = updateGame(game.value.id, { status: next as PlayStatus })
  if (!updated) {
    uni.showToast({ title: '保存失败', icon: 'none' })
    return
  }
  game.value = updated
}

function openPlan() {
  reloadFromStorage()
  library.value = listMyGames()
  planGameId.value = game.value?.id ?? ''
  planForm.reset(Date.now())
  planOpen.value = true
  revealPlanForm()
}

async function revealPlanForm() {
  await nextTick()
  uni.pageScrollTo({ selector: '#plan-form', duration: 200 })
}

function onPlanDate(event: { detail: { value: string } }) {
  planForm.dayText = event.detail.value
}

function onPlanStart(event: { detail: { value: string } }) {
  planForm.startText = event.detail.value
}

function onPlanEnd(event: { detail: { value: string } }) {
  planForm.endText = event.detail.value
}

function savePlan() {
  const outcome = planForm.save(planGame.value)
  if (outcome.toast) uni.showToast({ title: outcome.toast, icon: 'none' })
  if (!outcome.close) return
  planOpen.value = false
}

function setShelf(next: string) {
  if (!game.value) return
  const on = next === 'on'
  if (game.value.onShelf === on) return
  const updated = setOnShelf(game.value.id, on)
  if (on && !updated) {
    uni.showToast({ title: '这个平台的书架最多 8 本', icon: 'none' })
    return
  }
  if (!updated) {
    uni.showToast({ title: '移出失败', icon: 'none' })
    return
  }
  game.value = updated
}
function saveNote() {
  if (!game.value) return
  const next = note.value.trim().slice(0, 40)
  note.value = next
  if (next === game.value.note) return
  const updated = updateGame(game.value.id, { note: next })
  if (!updated) {
    uni.showToast({ title: '保存失败', icon: 'none' })
    return
  }
  game.value = updated
}

function goEdit() {
  if (!gameId.value) return
  uni.navigateTo({ url: `/pages/game/edit?id=${gameId.value}` })
}

function confirmDelete() {
  if (!gameId.value) return
  uni.showModal({
    title: '删除游戏',
    content: '确定从游戏库中移除这款游戏吗？资料库里的条目不会被删掉。',
    confirmColor: '#e60012',
    success: (res) => {
      if (!res.confirm) return
      const ok = removeGame(gameId.value)
      if (!ok) {
        uni.showToast({ title: '删除失败', icon: 'none' })
        return
      }
      uni.showToast({ title: '已删除', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 350)
    },
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 48rpx;
  box-sizing: border-box;
}

.hero-cover {
  position: relative;
  height: 420rpx;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  display: block;
}

.hero-fallback {
  background: #2a3350;
}

.fade-in {
  animation: fadeIn 0.4s ease both;
}

.fade-in-late {
  animation: fadeIn 0.4s ease 0.08s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.hero-mask {
  position: absolute;
  inset: 0;
}

.hero-meta {
  position: absolute;
  left: 32rpx;
  right: 32rpx;
  bottom: 28rpx;
  z-index: 1;
}

.badge {
  display: inline-block;
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}

.hero-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
}

.panel {
  margin: 24rpx 28rpx 0;
  padding: 28rpx;
  border-radius: 16rpx;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.tag {
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
}

.summary {
  font-size: 28rpx;
  line-height: 1.6;
}

.status-row {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
}

.status-chip {
  flex: 1;
  height: 64rpx;
  border-radius: 12rpx;
  border-width: 2rpx;
  border-style: solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-chip-text {
  font-size: 24rpx;
  font-weight: 700;
}

.menus {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 20rpx;
}

.plan-entry {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.plan-scroll {
  white-space: nowrap;
  margin-bottom: 12rpx;
}

.plan-game {
  display: inline-flex;
  width: 140rpx;
  margin-right: 12rpx;
  opacity: 0.5;
}

.plan-game.on {
  opacity: 1;
}

.plan-cover {
  width: 140rpx;
  height: 80rpx;
  border-radius: 8rpx;
}

.plan-name {
  font-size: 22rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-box {
  margin-top: 20rpx;
  border-radius: 12rpx;
  background: rgba(127, 127, 127, 0.12);
  padding: 0 20rpx;
}

.note-input {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 28rpx;
  background: transparent;
}

.note-box :deep(uni-input),
.note-box :deep(.uni-input-wrapper),
.note-box :deep(.uni-input-input) {
  width: 100%;
  height: 72rpx !important;
  line-height: 72rpx;
  min-height: 72rpx;
}

.note-placeholder {
  color: #8a93a8;
}

.section {
  padding: 28rpx 28rpx 0;
}

.journal {
  padding: 28rpx 28rpx 0;
}

.journal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.axis-row {
  display: flex;
  align-items: stretch;
}

.axis-side {
  width: 144rpx;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  position: relative;
}

.axis-date,
.axis-year {
  width: 72rpx;
  font-size: 22rpx;
  line-height: 1.3;
  text-align: right;
  padding-top: 2rpx;
}

.axis-year {
  position: absolute;
  left: 0;
  top: 32rpx;
  width: 72rpx;
}

.axis-rail {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 72rpx;
}

.axis-line {
  position: absolute;
  left: 28rpx;
  top: 16rpx;
  bottom: -16rpx;
  width: 2rpx;
  opacity: 0.45;
}

.axis-dot {
  position: absolute;
  left: 20rpx;
  top: 8rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 999rpx;
}

.axis-dot.hollow {
  background: transparent;
  border-width: 2rpx;
  border-style: solid;
  box-sizing: border-box;
}

.axis-card {
  flex: 1;
  min-width: 0;
  margin: 0 0 20rpx;
  border-radius: 16rpx;
  padding: 16rpx;
  box-sizing: border-box;
}

.journal-add,
.journal-save,
.journal-cancel,
.journal-clear,
.journal-delete {
  font-size: 26rpx;
  font-weight: 700;
}

.journal-empty {
  display: block;
  font-size: 26rpx;
  margin-bottom: 12rpx;
}

.journal-form,
.journal-item {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.journal-date,
.journal-day {
  font-size: 24rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.journal-text {
  width: 100%;
  min-height: 140rpx;
  font-size: 28rpx;
  line-height: 1.5;
  background: transparent;
}

.journal-photo {
  margin-top: 12rpx;
  height: 180rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: rgba(127, 127, 127, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.journal-photo-img,
.journal-img {
  width: 100%;
  height: 180rpx;
}

.journal-img {
  display: block;
  margin-top: 12rpx;
  border-radius: 12rpx;
}

.journal-photo-hint {
  font-size: 24rpx;
}

.journal-clear {
  display: inline-block;
  margin-top: 12rpx;
  color: #e85a5a;
}

.journal-body {
  display: block;
  font-size: 28rpx;
  line-height: 1.5;
}

.journal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 28rpx;
  margin-top: 16rpx;
}

.journal-delete {
  color: #e85a5a;
}

.section-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.shots {
  white-space: nowrap;
  width: 100%;
}

.shot {
  display: inline-block;
  width: 420rpx;
  height: 236rpx;
  border-radius: 12rpx;
  margin-right: 16rpx;
  background: rgba(127, 127, 127, 0.2);
  vertical-align: top;
  animation: fadeIn 0.45s ease both;
}

.edit-btn {
  margin: 40rpx 28rpx 0;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.edit-btn::after {
  border: none;
}

.delete-btn {
  margin: 20rpx 28rpx 0;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  background: transparent;
  color: #e85a5a;
  border: 1px solid rgba(232, 90, 90, 0.45);
}

.delete-btn::after {
  border: none;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-text {
  color: #6b7388;
  font-size: 28rpx;
}
</style>
