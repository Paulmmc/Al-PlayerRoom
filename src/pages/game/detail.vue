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
      <view class="status-row">
        <view
          v-for="item in playStatuses"
          :key="item"
          class="status-chip"
          :style="statusChipStyle(item)"
          @click="setStatus(item)"
        >
          <text class="status-chip-text" :style="{ color: statusChipStyle(item).color }">
            {{ statusLabels[item] }}
          </text>
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
      <view v-if="journalOpen" class="journal-form" :style="{ background: theme.cardBg }">
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
      <view
        v-for="entry in game.journal"
        :key="entry.id"
        class="journal-item"
        :style="{ background: theme.cardBg }"
      >
        <text class="journal-day" :style="{ color: theme.muted }">
          {{ formatJournalDay(entry.at) }}
        </text>
        <text v-if="entry.text" class="journal-body" :style="{ color: theme.text }">
          {{ entry.text }}
        </text>
        <image
          v-if="entry.image"
          class="journal-img"
          :src="entry.image"
          mode="aspectFill"
        />
        <view class="journal-actions">
          <text :style="{ color: theme.accent }" @click="openJournal(entry)">改</text>
          <text class="journal-delete" @click="confirmRemoveJournal(entry.id)">删除</text>
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
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
  addJournalEntry,
  gameCover,
  getGame,
  platformLabel,
  reloadFromStorage,
  removeGame,
  removeJournalEntry,
  updateGame,
  updateJournalEntry,
} from '../../services/catalog'
import { getStoreTheme } from '../../theme/store'
import type { Game, JournalEntry, PlayStatus } from '../../types/catalog'
import { PLAY_STATUSES, STATUS_COLORS, STATUS_LABELS } from '../../types/catalog'

const gameId = ref('')
const game = ref<Game | undefined>()
const note = ref('')
const journalOpen = ref(false)
const editingJournalId = ref('')
const journalDate = ref(todayText())
const journalText = ref('')
const journalImage = ref('')
const playStatuses = PLAY_STATUSES
const statusLabels = STATUS_LABELS

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

function statusChipStyle(item: PlayStatus) {
  const active = game.value?.status === item
  const color = STATUS_COLORS[item]
  return {
    background: active ? color : 'transparent',
    borderColor: color,
    color: active ? '#1a1a1a' : theme.value.text,
  }
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

function setStatus(next: PlayStatus) {
  if (!game.value || game.value.status === next) return
  const updated = updateGame(game.value.id, { status: next })
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
