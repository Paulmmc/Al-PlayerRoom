<template>
  <view class="page" :style="pageStyle">
    <view class="search-bar">
      <input
        class="input"
        type="text"
        confirm-type="search"
        placeholder="搜索我的游戏标题、标签或平台"
        placeholder-class="placeholder"
        v-model="keyword"
        @confirm="refresh"
      />
    </view>

    <view class="status-tabs">
      <view
        class="status-tab"
        :class="{ on: statusFilter === 'all' }"
        @click="selectStatus('all')"
      >
        <text
          class="status-tab-text"
          :style="{ color: statusFilter === 'all' ? theme.tabActiveText : theme.muted }"
        >
          全部
        </text>
      </view>
      <view
        v-for="item in playStatuses"
        :key="item"
        class="status-tab"
        :class="{ on: statusFilter === item }"
        :style="statusFilter === item ? { background: statusColors[item], borderColor: statusColors[item] } : {}"
        @click="selectStatus(item)"
      >
        <text
          class="status-tab-text"
          :style="{ color: statusFilter === item ? (item === 'shelved' ? '#ffffff' : '#1a1a1a') : theme.muted }"
        >
          {{ statusLabels[item] }}
        </text>
      </view>
    </view>

    <view v-if="results.length" class="list" :class="{ 'list-eshop': eshopOnly }">
      <StoreGameCard
        v-for="game in results"
        :key="game.id + '-' + game.coverImage"
        :game="game"
        :platform="game.platform"
        removable
        @open="goGame"
        @remove="confirmRemove"
        @shelf="toggleShelf"
      />
    </view>
    <view v-else class="empty">
      <text class="empty-text">{{ emptyText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import StoreGameCard from '../../components/StoreGameCard.vue'
import { getGame, reloadFromStorage, removeGame, searchMyGames, setOnShelf } from '../../services/catalog'
import type { Game, PlayStatus } from '../../types/catalog'
import { PLAY_STATUSES, STATUS_COLORS, STATUS_LABELS } from '../../types/catalog'
import { applyLibraryNav, libraryPlatform } from '../../services/library-theme'
import { getStoreTheme } from '../../theme/store'

const keyword = ref('')
const statusFilter = ref<'all' | PlayStatus>('all')
const results = ref<Game[]>([])
const matchedCount = ref(0)
const playStatuses = PLAY_STATUSES
const statusLabels = STATUS_LABELS
const statusColors = STATUS_COLORS
const theme = computed(() => getStoreTheme(libraryPlatform.value))
const pageStyle = computed(() => ({
  background: theme.value.pageBg,
  '--card': theme.value.cardBg,
  '--text': theme.value.text,
  '--muted': theme.value.muted,
  '--accent': theme.value.accent,
  '--track': theme.value.tabBg,
}))

const eshopOnly = computed(
  () => results.value.length > 0 && results.value.every((g) => g.platform === 'switch'),
)

const emptyText = computed(() => {
  if (statusFilter.value !== 'all' && matchedCount.value > 0 && results.value.length === 0) {
    return `${STATUS_LABELS[statusFilter.value]}里没有匹配的游戏`
  }
  return '没有找到相关游戏'
})

function refresh() {
  reloadFromStorage()
  const matched = searchMyGames(keyword.value)
  matchedCount.value = matched.length
  results.value =
    statusFilter.value === 'all'
      ? matched
      : matched.filter((game) => game.status === statusFilter.value)
}

function selectStatus(item: 'all' | PlayStatus) {
  statusFilter.value = item
  refresh()
}

watch(keyword, () => {
  refresh()
})

onShow(() => {
  applyLibraryNav('搜索')
  refresh()
})

function toggleShelf(id: string) {
  const game = getGame(id)
  if (!game) return
  const updated = setOnShelf(id, !game.onShelf)
  if (!updated) {
    uni.showToast({ title: '这个平台的书架最多 8 本', icon: 'none' })
    return
  }
  refresh()
}

function goGame(id: string) {
  uni.navigateTo({ url: `/pages/game/detail?id=${id}` })
}

function confirmRemove(id: string) {
  uni.showModal({
    title: '删除游戏',
    content: '确定从游戏库中移除吗？资料库里的条目不会被删掉。',
    confirmColor: '#e60012',
    success: (res) => {
      if (!res.confirm) return
      if (!removeGame(id)) {
        uni.showToast({ title: '删除失败', icon: 'none' })
        return
      }
      refresh()
      uni.showToast({ title: '已删除', icon: 'success' })
    },
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 28rpx 48rpx;
  background: transparent;
  box-sizing: border-box;
}

.search-bar {
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
  border: 2rpx solid var(--track);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-tab.on {
  background: var(--accent);
  border-color: var(--accent);
}

.status-tab-text {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--text);
}

.input {
  height: 80rpx;
  padding: 0 28rpx;
  border-radius: 16rpx;
  background: var(--card);
  color: var(--text);
  font-size: 28rpx;
}

.placeholder {
  color: var(--muted);
}

.list-eshop {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.list-eshop :deep(.eshop-card) {
  width: calc(50% - 12rpx);
}

.empty {
  padding: 120rpx 0;
  display: flex;
  justify-content: center;
}

.empty-text {
  color: var(--muted);
  font-size: 28rpx;
}
</style>
