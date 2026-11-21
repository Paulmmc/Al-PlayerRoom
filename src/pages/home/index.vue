<template>
  <view class="page" :style="pageStyle">
    <view class="hero">
      <text class="hero-title" :style="{ color: theme.text }">{{ theme.name }}</text>
      <text class="hero-sub" :style="{ color: theme.muted }">{{ theme.tagline }}</text>
    </view>

    <view class="platform-tabs" :style="{ background: theme.tabBg }">
      <view
        v-for="item in platforms"
        :key="item"
        class="tab"
        :style="tabStyle(item)"
        @click="selectPlatform(item)"
      >
        <text class="tab-text" :style="{ color: tabTextColor(item) }">
          {{ labels[item] }}
        </text>
      </view>
    </view>

    <view class="status-tabs">
      <view
        class="status-tab"
        :style="statusTabStyle('all')"
        @click="selectStatus('all')"
      >
        <text class="status-tab-text" :style="{ color: statusTabText('all') }">全部</text>
      </view>
      <view
        v-for="item in playStatuses"
        :key="item"
        class="status-tab"
        :style="statusTabStyle(item)"
        @click="selectStatus(item)"
      >
        <text class="status-tab-text" :style="{ color: statusTabText(item) }">
          {{ statusLabels[item] }}
        </text>
      </view>
    </view>

    <view :key="listKey" class="list-anim">
      <PackShelf
        v-if="useShelf && games.length"
        :games="games"
        :platform="shelfPlatform"
        :muted="theme.muted"
        :text="theme.text"
        :card-bg="theme.cardBg"
        :border-color="shelfBorder"
        :accent="theme.accent"
        @open="goGame"
        @remove="confirmRemove"
      />
    </view>

    <view v-if="!games.length" class="empty">
      <text class="empty-text" :style="{ color: theme.muted }">{{ emptyText }}</text>
      <text class="empty-action" :style="{ color: theme.accent }" @click="goAdd">
        添加一款游戏
      </text>
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
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PackShelf from '../../components/PackShelf.vue'
import {
  listMyGamesByPlatform,
  listMyGamesFiltered,
  PLATFORM_LABELS,
  PLATFORMS,
  reloadFromStorage,
  removeGame,
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
const games = ref<Game[]>(listMyGamesByPlatform('switch'))
const platformTotal = ref(games.value.length)
const listKey = ref(0)
const fabPressed = ref(false)

const theme = computed(() => getStoreTheme(platform.value))

const useShelf = computed(() => true)

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

function tabStyle(item: Platform) {
  const active = platform.value === item
  return {
    background: active ? theme.value.tabActiveBg : 'transparent',
  }
}

function tabTextColor(item: Platform) {
  return platform.value === item ? theme.value.tabActiveText : theme.value.muted
}

function applyNav() {
  const t = theme.value
  uni.setNavigationBarColor({
    frontColor: t.navText === 'white' ? '#ffffff' : '#000000',
    backgroundColor: t.navBg,
  })
  uni.setNavigationBarTitle({ title: t.name })
}

const emptyText = computed(() => {
  if (platformTotal.value === 0 || statusFilter.value === 'all') {
    return '该平台暂无游戏'
  }
  return `这个平台还没有${STATUS_LABELS[statusFilter.value]}的游戏`
})

function statusTabStyle(item: 'all' | PlayStatus) {
  const active = statusFilter.value === item
  const color = item === 'all' ? theme.value.accent : STATUS_COLORS[item]
  return {
    background: active ? color : 'transparent',
    borderColor: active ? color : theme.value.muted,
  }
}

function statusTabText(item: 'all' | PlayStatus) {
  const active = statusFilter.value === item
  if (!active) return theme.value.muted
  return item === 'shelved' || item === 'all' ? '#ffffff' : '#1a1a1a'
}

function refresh(animate = false) {
  reloadFromStorage()
  const all = listMyGamesByPlatform(platform.value)
  platformTotal.value = all.length
  const status = statusFilter.value === 'all' ? undefined : statusFilter.value
  games.value = listMyGamesFiltered(platform.value, status)
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

.platform-tabs {
  display: flex;
  border-radius: 16rpx;
  padding: 6rpx;
  margin-bottom: 16rpx;
}

.status-tabs {
  display: flex;
  gap: 10rpx;
  margin-bottom: 28rpx;
}

.status-tab {
  flex: 1;
  height: 56rpx;
  border-radius: 999rpx;
  border-width: 2rpx;
  border-style: solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-tab-text {
  font-size: 22rpx;
  font-weight: 700;
}

.tab {
  flex: 1;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  transition: background 0.2s ease;
}

.tab-text {
  font-size: 26rpx;
  font-weight: 600;
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
