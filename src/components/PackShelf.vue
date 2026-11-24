<template>
  <view class="shelf-wrap">
    <view
      class="shelf"
      :class="'shelf-' + platform"
      @touchstart="onGestureStart"
      @mousedown="onGestureStart"
      @pointerdown="onGestureStart"
      @pointercancel="onGestureCancel"
    >
      <view class="track" :class="{ dragging }" :style="trackStyle">
        <CasePack
          v-for="(game, index) in games"
          :key="game.id"
          :game="game"
          :platform="platform"
          :focus="index === focusIndex"
          :side="sideOf(index)"
          :nudge="nudge"
          @select="onSelect(index)"
          @open="onOpen"
        />
      </view>
    </view>

    <text class="shelf-hint" :style="{ color: muted }">← 滑动选择 →</text>

    <view
      v-if="focusGame"
      class="focus-info"
      :style="{ background: cardBg, borderColor: borderColor }"
    >
      <view class="focus-copy" @click="onOpen(focusGame.id)">
        <view class="focus-title-row">
          <text class="focus-name" :style="{ color: text }">{{ focusGame.title }}</text>
          <text class="status-badge" :style="badgeStyle">{{ statusLabel }}</text>
        </view>
        <text class="focus-meta" :style="{ color: muted }">
          {{ platformLabel }} · {{ tagsLine }}
        </text>
      </view>
      <text
        class="focus-unshelf"
        :style="{ color: muted }"
        @click.stop="onUnshelf(focusGame.id)"
      >
        取消展示
      </text>
      <text
        class="focus-delete"
        :style="{ color: accent || '#e60012' }"
        @click.stop="onRemove(focusGame.id)"
      >
        删除
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import CasePack from './CasePack.vue'
import { PLATFORM_LABELS } from '../services/catalog'
import type { Game, Platform } from '../types/catalog'
import { STATUS_COLORS, STATUS_LABELS } from '../types/catalog'

const props = defineProps<{
  games: Game[]
  platform: Platform
  muted?: string
  text?: string
  cardBg?: string
  borderColor?: string
  accent?: string
}>()

const emit = defineEmits<{
  open: [id: string]
  remove: [id: string]
  unshelf: [id: string]
}>()

const focusIndex = ref(0)
const startX = ref(0)
const dragX = ref(0)
const tracking = ref(false)
const dragging = ref(false)
const didSwipe = ref(false)
let swipeGuardTimer: ReturnType<typeof setTimeout> | null = null

const pitch = computed(() =>
  props.platform === 'ps5' ? 194 : props.platform === 'steam' ? 186 : 178,
)
const half = computed(() =>
  props.platform === 'ps5' ? 88 : props.platform === 'steam' ? 84 : 80,
)

const nudge = computed(() => {
  const n = dragX.value / 140
  return Math.max(-1, Math.min(1, n))
})

const trackStyle = computed(() => ({
  transform: `translateX(calc(-${focusIndex.value * pitch.value + half.value}px + ${dragX.value}px))`,
}))

function sideOf(index: number): 'left' | 'center' | 'right' {
  if (index < focusIndex.value) return 'left'
  if (index > focusIndex.value) return 'right'
  return 'center'
}

watch(
  () => props.platform,
  () => {
    focusIndex.value = 0
  },
)

watch(
  () => props.games.length,
  (len) => {
    if (focusIndex.value >= len) {
      focusIndex.value = Math.max(0, len - 1)
    }
  },
)

const focusGame = computed(() => props.games[focusIndex.value] ?? null)

const platformLabel = computed(() => {
  if (props.platform === 'switch') return 'Switch 卡带盒'
  if (props.platform === 'ps5') return 'PS5 光盘盒'
  return 'Steam 游戏盒'
})

const statusLabel = computed(() =>
  focusGame.value ? STATUS_LABELS[focusGame.value.status] : '',
)

const badgeStyle = computed(() => {
  if (!focusGame.value) return {}
  const status = focusGame.value.status
  return {
    background: STATUS_COLORS[status],
    color: status === 'shelved' ? '#ffffff' : '#1a1a1a',
  }
})

const tagsLine = computed(() => {
  const tags = focusGame.value?.tags ?? []
  return tags.length ? tags.slice(0, 2).join(' · ') : PLATFORM_LABELS[props.platform]
})

function eventX(e: unknown): number {
  const ev = e as {
    clientX?: number
    pageX?: number
    touches?: Array<{ clientX?: number; pageX?: number }>
    changedTouches?: Array<{ clientX?: number; pageX?: number }>
    detail?: { x?: number; clientX?: number }
  }
  const t = ev.changedTouches?.[0] || ev.touches?.[0]
  if (t) {
    return t.clientX ?? t.pageX ?? 0
  }
  if (typeof ev.clientX === 'number') return ev.clientX
  if (typeof ev.pageX === 'number') return ev.pageX
  if (typeof ev.detail?.clientX === 'number') return ev.detail.clientX
  if (typeof ev.detail?.x === 'number') return ev.detail.x
  return 0
}

function armSwipeGuard() {
  didSwipe.value = true
  if (swipeGuardTimer) clearTimeout(swipeGuardTimer)
  swipeGuardTimer = setTimeout(() => {
    didSwipe.value = false
    swipeGuardTimer = null
  }, 280)
}

function detachWindowListeners() {
  if (typeof window === 'undefined') return
  window.removeEventListener('mouseup', onWindowUp)
  window.removeEventListener('pointerup', onWindowUp)
  window.removeEventListener('touchend', onWindowUp)
  window.removeEventListener('mousemove', onWindowMove)
  window.removeEventListener('pointermove', onWindowMove)
  window.removeEventListener('touchmove', onWindowMove)
}

function onWindowMove(e: Event) {
  if (!tracking.value) return
  const dx = eventX(e) - startX.value
  const atStart = focusIndex.value <= 0 && dx > 0
  const atEnd = focusIndex.value >= props.games.length - 1 && dx < 0
  dragX.value = atStart || atEnd ? dx * 0.28 : dx
  if (Math.abs(dx) > 8) dragging.value = true
}

function onWindowUp(e: Event) {
  onGestureEnd(e)
}

function onGestureStart(e: unknown) {
  tracking.value = true
  dragging.value = false
  dragX.value = 0
  startX.value = eventX(e)
  if (typeof window !== 'undefined') {
    window.addEventListener('mouseup', onWindowUp)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('touchend', onWindowUp)
    window.addEventListener('mousemove', onWindowMove)
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('touchmove', onWindowMove, { passive: true })
  }
}

function onGestureCancel() {
  tracking.value = false
  dragging.value = false
  dragX.value = 0
  detachWindowListeners()
}

function onGestureEnd(e: unknown) {
  if (!tracking.value) return
  tracking.value = false
  detachWindowListeners()
  const dx = eventX(e) - startX.value
  const commit = Math.abs(dx) > 48
  if (commit && dx < 0 && focusIndex.value < props.games.length - 1) {
    focusIndex.value += 1
    armSwipeGuard()
  } else if (commit && dx > 0 && focusIndex.value > 0) {
    focusIndex.value -= 1
    armSwipeGuard()
  } else if (Math.abs(dx) > 8) {
    armSwipeGuard()
  }
  dragging.value = false
  dragX.value = 0
}

onBeforeUnmount(() => {
  detachWindowListeners()
  if (swipeGuardTimer) clearTimeout(swipeGuardTimer)
})

function onSelect(index: number) {
  if (didSwipe.value) return
  focusIndex.value = index
}

function onOpen(id: string) {
  if (didSwipe.value) return
  emit('open', id)
}

function onRemove(id: string) {
  if (didSwipe.value) return
  emit('remove', id)
}

function onUnshelf(id: string) {
  if (didSwipe.value) return
  emit('unshelf', id)
}
</script>

<style scoped>
.shelf-wrap {
  width: 100%;
}

.shelf {
  position: relative;
  height: 276px;
  margin: 0 -8rpx 4rpx;
  overflow: hidden;
  perspective: 900px;
  perspective-origin: 50% 70%;
  user-select: none;
  cursor: grab;
  touch-action: none;
}

.shelf-switch {
  height: 286px;
}

.shelf-steam {
  height: 268px;
}

.track {
  position: absolute;
  left: 0;
  bottom: 8px;
  display: flex;
  align-items: flex-end;
  gap: 18px;
  width: max-content;
  margin-left: 50%;
  transform-style: preserve-3d;
  transition: transform 0.48s cubic-bezier(0.22, 1, 0.36, 1);
}

.track.dragging {
  transition: none;
}

.shelf:active {
  cursor: grabbing;
}

.shelf-hint {
  display: block;
  text-align: center;
  font-size: 22rpx;
  margin: 0 0 20rpx;
  letter-spacing: 0.08em;
}

.focus-info {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.focus-copy {
  flex: 1;
  min-width: 0;
}

.focus-delete,
.focus-unshelf {
  flex-shrink: 0;
  font-size: 24rpx;
  font-weight: 700;
  padding: 8rpx 12rpx;
}

.focus-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.focus-name {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 650;
}

.status-badge {
  flex-shrink: 0;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.4;
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
}

.focus-meta {
  display: block;
  font-size: 22rpx;
}
</style>
