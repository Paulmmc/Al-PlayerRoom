<template>
  <view class="page" :style="pageStyle">
    <view class="hero">
      <text class="hero-title" :style="{ color: theme.text }">{{ theme.name }}</text>
      <text class="hero-sub" :style="{ color: theme.muted }">{{ theme.tagline }}</text>
    </view>

    <view
      ref="platformSegEl"
      class="seg seg-wide"
      :style="{ background: theme.tabBg }"
      @pointerdown="onSegPointerDown('platform', $event)"
      @pointermove="onSegMove"
      @pointerup="onSegUp"
      @pointercancel="onSegUp"
      @touchstart="onSegTouchStart('platform', $event)"
      @touchmove="onSegMove"
      @touchend="onSegUp"
      @touchcancel="onSegUp"
    >
      <view class="seg-thumb" :class="{ grown: grownSeg === 'platform' }" :style="platformThumbStyle" />
      <view
        v-for="(item, index) in platforms"
        :key="item"
        class="seg-item"
        @click.stop="onItemClick('platform', index)"
      >
        <text class="seg-label" :style="platformTextStyle(item)">{{ labels[item] }}</text>
      </view>
    </view>

    <view
      ref="statusSegEl"
      class="seg seg-wide status-seg"
      :style="{ background: segTheme.track }"
      @pointerdown="onSegPointerDown('status', $event)"
      @pointermove="onSegMove"
      @pointerup="onSegUp"
      @pointercancel="onSegUp"
      @touchstart="onSegTouchStart('status', $event)"
      @touchmove="onSegMove"
      @touchend="onSegUp"
      @touchcancel="onSegUp"
    >
      <view class="seg-thumb" :class="{ grown: grownSeg === 'status' }" :style="statusThumbStyle" />
      <view class="seg-item" @click.stop="onItemClick('status', 0)">
        <text class="seg-label" :style="statusTextStyle('all')">全部</text>
      </view>
      <view
        v-for="(item, index) in playStatuses"
        :key="item"
        class="seg-item"
        @click.stop="onItemClick('status', index + 1)"
      >
        <text class="seg-label" :style="statusTextStyle(item)">{{ statusLabels[item] }}</text>
      </view>
    </view>

    <view class="block">
      <view v-if="shelfGames.length" :key="listKey" class="list-anim">
        <PackShelf
          :games="shelfGames"
          :platform="shelfPlatform"
          :muted="theme.muted"
          :text="theme.text"
          :card-bg="theme.cardBg"
          :border-color="shelfBorder"
          :accent="theme.accent"
          @open="goGame"
          @remove="confirmRemove"
          @unshelf="unshelf"
        />
      </view>
      <text v-else class="shelf-empty" :style="{ color: theme.muted }">
        从下面的列表选择书架展示
      </text>
    </view>

    <view class="block">
      <view class="block-head">
        <text class="block-title" :style="{ color: theme.text }">游戏列表</text>
        <view
          ref="viewSegEl"
          class="seg"
          :style="{ background: segTheme.track }"
          @pointerdown="onSegPointerDown('view', $event)"
          @pointermove="onSegMove"
          @pointerup="onSegUp"
          @pointercancel="onSegUp"
          @touchstart="onSegTouchStart('view', $event)"
          @touchmove="onSegMove"
          @touchend="onSegUp"
          @touchcancel="onSegUp"
        >
          <view class="seg-thumb" :class="{ grown: grownSeg === 'view' }" :style="viewThumbStyle" />
          <view class="seg-item" @click.stop="onItemClick('view', 0)">
            <text class="seg-text" :style="segTextStyle('icons')">大图标</text>
          </view>
          <view class="seg-item" @click.stop="onItemClick('view', 1)">
            <text class="seg-text" :style="segTextStyle('list')">列表</text>
          </view>
        </view>
      </view>
      <view class="library">
        <view v-if="listedGames.length && viewMode === 'icons'" class="icon-grid">
          <view v-for="game in listedGames" :key="game.id" class="icon-item">
            <image
              v-if="coverOf(game)"
              class="icon-cover"
              :src="coverOf(game)"
              mode="aspectFill"
              @click="goGame(game.id)"
            />
            <view
              v-else
              class="icon-cover icon-fallback"
              :style="{ background: game.coverColor }"
              @click="goGame(game.id)"
            >
              <text class="icon-fallback-text">{{ game.title }}</text>
            </view>
            <view class="icon-meta" @click="goGame(game.id)">
              <text class="icon-name" :style="{ color: theme.text }">{{ game.title }}</text>
              <text class="mini-badge" :style="badgeOf(game)">{{ statusLabels[game.status] }}</text>
            </view>
            <text
              class="show-btn"
              :style="{ color: theme.accent }"
              @click.stop="toggleShelf(game.id)"
            >
              {{ game.onShelf ? '展示中' : '书架展示' }}
            </text>
          </view>
        </view>
        <view v-else-if="listedGames.length" class="plain-list">
          <view
            v-for="game in listedGames"
            :key="game.id"
            class="plain-row"
            :style="{ background: theme.pageBg }"
          >
            <image
              v-if="coverOf(game)"
              class="plain-cover"
              :src="coverOf(game)"
              mode="aspectFill"
              @click="goGame(game.id)"
            />
            <view
              v-else
              class="plain-cover plain-color"
              :style="{ background: game.coverColor }"
              @click="goGame(game.id)"
            >
              <text class="plain-fallback">{{ game.title.slice(0, 1) }}</text>
            </view>
            <!-- #ifndef H5 -->
            <view
              class="plain-fade"
              :style="{ background: `linear-gradient(to right, transparent 32%, ${theme.pageBg} 78%)` }"
            />
            <!-- #endif -->
            <view class="plain-mid" @click="goGame(game.id)">
              <text class="plain-name" :style="{ color: theme.text }">{{ game.title }}</text>
              <text class="mini-badge" :style="badgeOf(game)">{{ statusLabels[game.status] }}</text>
            </view>
            <text
              class="show-btn"
              :style="{ color: theme.accent }"
              @click.stop="toggleShelf(game.id)"
            >
              {{ game.onShelf ? '展示中' : '书架展示' }}
            </text>
          </view>
        </view>
        <view v-else class="empty">
          <text class="empty-text" :style="{ color: theme.muted }">{{ listEmptyText }}</text>
          <text
            v-if="platformTotal === 0"
            class="empty-action"
            :style="{ color: theme.accent }"
            @click="goAdd"
          >
            添加一款游戏
          </text>
        </view>
      </view>
    </view>

    <view
      class="fab"
      :style="{ background: theme.accent, color: fabTextColor }"
      @click="goAdd"
      @touchstart="fabPressed = true"
      @touchend="fabPressed = false"
      @mousedown="fabPressed = true"
      @mouseup="fabPressed = false"
      @mouseleave="fabPressed = false"
      :class="{ pressed: fabPressed }"
    >
      <text class="fab-plus">+</text>
      <text class="fab-label">添加</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PackShelf from '../../components/PackShelf.vue'
import {
  gameCover,
  getGame,
  listMyGamesByPlatform,
  listMyGamesFiltered,
  listShelfGames,
  PLATFORM_LABELS,
  PLATFORMS,
  reloadFromStorage,
  removeGame,
  setOnShelf,
} from '../../services/catalog'
import { consumeHomeStatus } from '../../services/home-intent'
import { getStoreTheme } from '../../theme/store'
import type { Game, Platform, PlayStatus } from '../../types/catalog'
import { PLAY_STATUSES, STATUS_COLORS, STATUS_LABELS } from '../../types/catalog'

const platforms = PLATFORMS
const labels = PLATFORM_LABELS
const playStatuses = PLAY_STATUSES
const statusLabels = STATUS_LABELS
const platform = ref<Platform>('switch')
const statusFilter = ref<'all' | PlayStatus>('all')
const shelfGames = ref<Game[]>(listShelfGames('switch'))
const listedGames = ref<Game[]>([])
const platformTotal = ref(0)
const listKey = ref(0)
const fabPressed = ref(false)
const viewMode = ref<'icons' | 'list'>('list')

type SegId = 'platform' | 'status' | 'view'
type StatusItem = 'all' | PlayStatus

const platformSegEl = ref()
const statusSegEl = ref()
const viewSegEl = ref()
const grownSeg = ref<SegId | null>(null)
const segFloat = ref<Partial<Record<SegId, number>>>({})

const theme = computed(() => getStoreTheme(platform.value))

const shelfPlatform = computed(() => platform.value)

const shelfBorder = computed(() =>
  platform.value === 'switch' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
)

const pageStyle = computed(() => ({
  background: theme.value.pageBg,
}))

const fabTextColor = computed(() =>
  theme.value.id === 'steam' ? '#1b2838' : '#ffffff',
)

function applyNav() {
  const t = theme.value
  uni.setNavigationBarColor({
    frontColor: t.navText === 'white' ? '#ffffff' : '#000000',
    backgroundColor: t.navBg,
  })
  uni.setNavigationBarTitle({ title: t.name })
}

const listEmptyText = computed(() => {
  if (platformTotal.value === 0) return '该平台暂无游戏'
  return `列表里没有${STATUS_LABELS[statusFilter.value as PlayStatus]}的游戏`
})

const segTheme = computed(() => {
  if (platform.value === 'ps5') return { track: '#2c2c2e', thumb: '#3a3a3c' }
  if (platform.value === 'steam') return { track: '#0e1621', thumb: '#2a475e' }
  return { track: '#e5e5ea', thumb: '#ffffff' }
})

const statusItems: StatusItem[] = ['all', ...PLAY_STATUSES]

const platformIndex = computed(() => platforms.indexOf(platform.value))
const statusIndex = computed(() => Math.max(0, statusItems.indexOf(statusFilter.value)))
const viewIndex = computed(() => (viewMode.value === 'icons' ? 0 : 1))

function segCount(id: SegId) {
  if (id === 'platform') return platforms.length
  if (id === 'status') return statusItems.length
  return 2
}

function segCommitted(id: SegId) {
  if (id === 'platform') return platformIndex.value
  if (id === 'status') return statusIndex.value
  return viewIndex.value
}

function segPosition(id: SegId) {
  const floating = segFloat.value[id]
  return floating == null ? segCommitted(id) : floating
}

function segHighlight(id: SegId) {
  const count = segCount(id)
  return Math.max(0, Math.min(count - 1, Math.round(segPosition(id))))
}

function rgbOf(color: string) {
  const hex = color.replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex
  const value = Number.parseInt(full, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function colorAlong(colors: string[], pos: number, grown: boolean) {
  const max = Math.max(0, colors.length - 1)
  const clamped = Math.min(max, Math.max(0, pos))
  const index = Math.floor(clamped)
  const next = Math.min(max, index + 1)
  const amount = clamped - index
  const from = rgbOf(colors[index])
  const to = rgbOf(colors[next])
  const red = Math.round(from[0] + (to[0] - from[0]) * amount)
  const green = Math.round(from[1] + (to[1] - from[1]) * amount)
  const blue = Math.round(from[2] + (to[2] - from[2]) * amount)
  return `rgba(${red}, ${green}, ${blue}, ${grown ? 0.78 : 1})`
}

function thumbBox(id: SegId, colors: string[]) {
  const count = segCount(id)
  const pos = segPosition(id)
  const grown = grownSeg.value === id
  const following = grown && segFloat.value[id] != null
  return {
    background: colorAlong(colors, pos, grown),
    width: grown
      ? `calc((100% - 8rpx) / ${count} + 48rpx)`
      : `calc((100% - 8rpx) / ${count})`,
    height: grown ? 'calc(100% - 8rpx + 32rpx)' : 'calc(100% - 8rpx)',
    top: grown ? 'calc(4rpx - 16rpx)' : '4rpx',
    left: `calc(4rpx + (100% - 8rpx) / ${count} * ${pos} - ${grown ? '24rpx' : '0px'})`,
    transition: following
      ? 'width 0.25s ease, height 0.25s ease, top 0.25s ease'
      : 'left 0.25s ease, width 0.25s ease, height 0.25s ease, top 0.25s ease, background-color 0.25s ease',
    boxShadow: grown ? '0 4px 10px rgba(0, 0, 0, 0.16)' : '0 1px 3px rgba(0, 0, 0, 0.12)',
    zIndex: 0,
  }
}

const platformThumbStyle = computed(() =>
  thumbBox(
    'platform',
    platforms.map((item) => getStoreTheme(item).tabActiveBg),
  ),
)

const statusThumbStyle = computed(() =>
  thumbBox(
    'status',
    statusItems.map((item) => (item === 'all' ? theme.value.accent : STATUS_COLORS[item])),
  ),
)

const viewThumbStyle = computed(() => thumbBox('view', [segTheme.value.thumb, segTheme.value.thumb]))

function platformTextStyle(item: Platform) {
  const on = platforms[segHighlight('platform')] === item
  const activeTheme = getStoreTheme(platforms[segHighlight('platform')])
  return {
    color: on ? activeTheme.tabActiveText : theme.value.muted,
    fontWeight: on ? 600 : 400,
  }
}

function statusTextStyle(item: StatusItem) {
  const on = statusItems[segHighlight('status')] === item
  if (!on) return { color: theme.value.muted, fontWeight: 400 }
  return {
    color: item === 'all' || item === 'shelved' ? '#ffffff' : '#1a1a1a',
    fontWeight: 600,
  }
}

function segTextStyle(mode: 'icons' | 'list') {
  const on = (segHighlight('view') === 0 ? 'icons' : 'list') === mode
  return {
    color: on ? theme.value.text : theme.value.muted,
    fontWeight: on ? 600 : 400,
  }
}

function refresh(animate = false) {
  reloadFromStorage()
  const all = listMyGamesByPlatform(platform.value)
  platformTotal.value = all.length
  shelfGames.value = listShelfGames(platform.value)
  const status = statusFilter.value === 'all' ? undefined : statusFilter.value
  listedGames.value = all.filter((game) => !status || game.status === status)
  if (animate) {
    listKey.value += 1
  }
  applyNav()
}

function selectStatus(item: 'all' | PlayStatus) {
  if (statusFilter.value === item) return
  statusFilter.value = item
  refresh(true)
}

function selectPlatform(item: Platform) {
  if (platform.value === item) return
  platform.value = item
  refresh(true)
}

onShow(() => {
  const intent = consumeHomeStatus()
  if (intent) {
    statusFilter.value = intent
    const order: Platform[] = ['switch', 'ps5', 'steam']
    platform.value = order.find((item) => listMyGamesFiltered(item, intent).length > 0) ?? 'switch'
  }
  refresh(true)
})

function badgeOf(game: Game) {
  return {
    background: STATUS_COLORS[game.status],
    color: game.status === 'shelved' ? '#ffffff' : '#1a1a1a',
  }
}

function coverOf(game: Game) {
  return gameCover(game)
}

function commitSeg(id: SegId, index: number) {
  const next = Math.max(0, Math.min(segCount(id) - 1, index))
  if (next === segCommitted(id)) return
  if (id === 'platform') {
    selectPlatform(platforms[next])
    return
  }
  if (id === 'status') {
    selectStatus(statusItems[next])
    return
  }
  viewMode.value = next === 0 ? 'icons' : 'list'
}

type PointEvent = {
  pointerType?: string
  pointerId?: number
  clientX?: number
  clientY?: number
  currentTarget?: { getBoundingClientRect?: () => { left: number; width: number }; setPointerCapture?: (id: number) => void }
  target?: {
    getBoundingClientRect?: () => { left: number; width: number }
    closest?: (selector: string) => { getBoundingClientRect?: () => { left: number; width: number } } | null
  }
  touches?: Array<{ clientX?: number; clientY?: number; pageX?: number; pageY?: number }>
  changedTouches?: Array<{ clientX?: number; clientY?: number; pageX?: number; pageY?: number }>
}

let segKey: SegId | null = null
let segOrigin = 0
let segStartX = 0
let segStartY = 0
let segFromThumb = false
let segDecided = false
let segHorizontal = false
let segBox: { left: number; width: number } | null = null
let blockClick = false
let usingPointer = false

function eventPoint(event: PointEvent) {
  const touch = event.touches?.[0] || event.changedTouches?.[0]
  return {
    x: touch?.clientX ?? touch?.pageX ?? event.clientX ?? 0,
    y: touch?.clientY ?? touch?.pageY ?? event.clientY ?? 0,
  }
}

function segElement(id: SegId) {
  const inst =
    id === 'platform' ? platformSegEl.value : id === 'status' ? statusSegEl.value : viewSegEl.value
  const fromRef = inst?.$el ?? inst
  if (fromRef && typeof fromRef.getBoundingClientRect === 'function') {
    const rect = fromRef.getBoundingClientRect()
    if (rect && rect.width > 0) return fromRef as HTMLElement
  }
  if (typeof document === 'undefined') return null
  const index = id === 'platform' ? 0 : id === 'status' ? 1 : 2
  return (document.querySelectorAll('.seg')[index] as HTMLElement) || null
}

function eventBox(id: SegId) {
  const el = segElement(id)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  return { left: rect.left, width: rect.width }
}

function beginSeg(id: SegId, event: PointEvent) {
  const box = eventBox(id)
  if (!box || box.width <= 0) return
  const point = eventPoint(event)
  const count = segCount(id)
  const origin = segCommitted(id)
  const slot = box.width / count
  const local = point.x - box.left
  segKey = id
  segOrigin = origin
  segStartX = point.x
  segStartY = point.y
  segBox = box
  segDecided = false
  segHorizontal = false
  segFromThumb = local >= origin * slot && local < (origin + 1) * slot
  blockClick = true
  if (segFromThumb) {
    grownSeg.value = id
    segFloat.value = { ...segFloat.value, [id]: origin }
  }
  const node = event.currentTarget
  if (node?.setPointerCapture && event.pointerId != null) {
    try {
      node.setPointerCapture(event.pointerId)
    } catch {
      /* 合成事件没有真实指针时忽略 */
    }
  }
}

function hasPoint(event: PointEvent) {
  const touch = event.touches?.[0] || event.changedTouches?.[0]
  const x = touch?.clientX ?? touch?.pageX ?? event.clientX
  return typeof x === 'number' && !Number.isNaN(x)
}

function onSegPointerDown(id: SegId, event: PointEvent) {
  if (!hasPoint(event)) return
  usingPointer = true
  beginSeg(id, event)
}

function onSegTouchStart(id: SegId, event: PointEvent) {
  if (usingPointer || !hasPoint(event)) return
  beginSeg(id, event)
}

const nativeSegs: Array<{
  el: HTMLElement
  down: (event: PointerEvent) => void
  move: (event: PointerEvent) => void
  up: (event: PointerEvent) => void
}> = []

function bindNativeSegs() {
  const ids: SegId[] = ['platform', 'status', 'view']
  const nodes = typeof document === 'undefined' ? [] : document.querySelectorAll('.seg')
  ids.forEach((id, index) => {
    const el = nodes[index] as HTMLElement | undefined
    if (!el) return
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      usingPointer = true
      beginSeg(id, event)
    }
    const move = (event: PointerEvent) => onSegMove(event)
    const up = (event: PointerEvent) => onSegUp(event)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    nativeSegs.push({ el, down, move, up })
  })
}

function unbindNativeSegs() {
  nativeSegs.forEach(({ el, down, move, up }) => {
    el.removeEventListener('pointerdown', down)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
  })
  nativeSegs.length = 0
}

onMounted(bindNativeSegs)
onUnmounted(unbindNativeSegs)

function onSegMove(event: PointEvent) {
  if (!hasPoint(event)) return
  if (!segKey || !segFromThumb || !segBox) return
  const point = eventPoint(event)
  const dx = point.x - segStartX
  const dy = point.y - segStartY
  if (!segDecided) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
    segDecided = true
    segHorizontal = Math.abs(dx) > Math.abs(dy)
    if (!segHorizontal) {
      grownSeg.value = null
      const next = { ...segFloat.value }
      delete next[segKey]
      segFloat.value = next
      segFromThumb = false
      return
    }
  }
  if (!segHorizontal) return
  const slot = segBox.width / segCount(segKey)
  const next = Math.max(0, Math.min(segCount(segKey) - 1, segOrigin + dx / slot))
  segFloat.value = { ...segFloat.value, [segKey]: next }
}

function finishSeg(event: PointEvent) {
  if (!segKey) return
  const id = segKey
  const origin = segOrigin
  const fromThumb = segFromThumb
  const horizontal = segHorizontal
  const point = eventPoint(event)
  let landed = origin
  if (fromThumb && horizontal && segFloat.value[id] != null) {
    landed = Math.round(segFloat.value[id] as number)
  } else if (!fromThumb) {
    const box = segBox
    if (box && box.width > 0) {
      const local = Math.max(0, Math.min(box.width - 1, point.x - box.left))
      landed = Math.floor(local / (box.width / segCount(id)))
    }
  }
  const nextFloat = { ...segFloat.value }
  delete nextFloat[id]
  segFloat.value = nextFloat
  grownSeg.value = null
  segKey = null
  segFromThumb = false
  segHorizontal = false
  usingPointer = false
  if (landed !== origin) commitSeg(id, landed)
}

function onSegUp(event: PointEvent) {
  if (!hasPoint(event)) return
  finishSeg(event)
}

function onItemClick(id: SegId, index: number) {
  if (blockClick) {
    blockClick = false
    return
  }
  commitSeg(id, index)
}

function toggleShelf(id: string) {
  const game = getGame(id)
  if (!game) return
  if (game.onShelf) {
    unshelf(id)
    return
  }
  const updated = setOnShelf(id, true)
  if (!updated) {
    uni.showToast({ title: '这个平台的书架最多 8 本', icon: 'none' })
    return
  }
  refresh(true)
}

function unshelf(id: string) {
  if (!setOnShelf(id, false)) {
    uni.showToast({ title: '移出失败', icon: 'none' })
    return
  }
  refresh(false)
}

function goGame(id: string) {
  uni.navigateTo({ url: `/pages/game/detail?id=${id}` })
}

function confirmRemove(id: string) {
  uni.showModal({
    title: '删除游戏',
    content: '确定从当前平台的游戏库中移除吗？资料库里的条目不会被删掉。',
    confirmColor: '#e60012',
    success: (res) => {
      if (!res.confirm) return
      if (!removeGame(id)) {
        uni.showToast({ title: '删除失败', icon: 'none' })
        return
      }
      refresh(false)
      uni.showToast({ title: '已删除', icon: 'success' })
    },
  })
}

function goAdd() {
  uni.navigateTo({
    url: `/pages/game/edit?mode=create&platform=${platform.value}`,
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32rpx 28rpx 160rpx;
  box-sizing: border-box;
}

.hero {
  margin-bottom: 24rpx;
}

.hero-title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.hero-sub {
  font-size: 26rpx;
}

.platform-tabs,
.status-tabs {
  display: none;
}

.seg.seg-wide {
  width: 100%;
  margin-bottom: 16rpx;
}

.status-seg {
  margin-bottom: 28rpx;
}

.seg-label {
  font-size: 24rpx;
}

.shelf-empty {
  display: block;
  padding: 28rpx 0 8rpx;
  font-size: 26rpx;
}

.block {
  margin-bottom: 12rpx;
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.block-title {
  font-size: 30rpx;
  font-weight: 700;
}

.seg {
  position: relative;
  width: 240rpx;
  height: 64rpx;
  padding: 4rpx;
  box-sizing: border-box;
  border-radius: 999rpx;
  display: flex;
  flex-shrink: 0;
  touch-action: pan-y;
}

.seg-thumb {
  position: absolute;
  border-radius: 999rpx;
  box-sizing: border-box;
}

/* #ifdef H5 */
.seg-thumb.grown {
  -webkit-backdrop-filter: blur(4rpx) saturate(1.5);
  backdrop-filter: blur(4rpx) saturate(1.5);
}
/* #endif */

.seg-item {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seg-text {
  font-size: 22rpx;
}

.library {
  touch-action: pan-y;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.icon-item {
  width: calc((100% - 32rpx) / 3);
}

.icon-cover,
.plain-cover {
  background: #1a1a1a;
}

.icon-cover {
  width: 100%;
  height: 220rpx;
  border-radius: 12rpx;
  display: block;
}

.icon-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx;
  box-sizing: border-box;
}

.icon-fallback-text,
.plain-fallback {
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  text-align: center;
}

.icon-meta,
.plain-mid {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
  min-width: 0;
}

.icon-name,
.plain-name {
  flex: 1;
  min-width: 0;
  font-size: 22rpx;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-badge {
  flex-shrink: 0;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 1.3;
  padding: 2rpx 8rpx;
  border-radius: 999rpx;
}

.show-btn {
  display: inline-block;
  margin-top: 8rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.plain-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.plain-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  height: 168rpx;
  padding: 0 20rpx 0 58%;
  box-sizing: border-box;
  border-radius: 24rpx;
  overflow: hidden;
}

.plain-cover {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: left center;
}

/* #ifdef H5 */
.plain-cover {
  -webkit-mask-image: linear-gradient(to right, #000 32%, transparent 78%);
  mask-image: linear-gradient(to right, #000 32%, transparent 78%);
}
/* #endif */

.plain-fade {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.plain-color {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 28rpx;
  box-sizing: border-box;
}

.plain-color .plain-fallback {
  font-size: 40rpx;
}

.plain-mid {
  position: relative;
  z-index: 2;
  flex: 1;
  margin-top: 0;
}

.plain-row .show-btn {
  position: relative;
  z-index: 2;
  margin-top: 0;
  flex-shrink: 0;
}

.list-anim {
  animation: fadeSlide 0.3s ease both;
}

@keyframes fadeSlide {
  from {
    opacity: 0;
    transform: translateY(12rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty {
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.empty-text {
  font-size: 28rpx;
}

.empty-action {
  font-size: 28rpx;
  font-weight: 600;
}

.fab {
  position: fixed;
  right: 36rpx;
  bottom: calc(140rpx + env(safe-area-inset-bottom));
  z-index: 20;
  min-width: 120rpx;
  height: 88rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
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

.fab-label {
  font-size: 26rpx;
  font-weight: 700;
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
