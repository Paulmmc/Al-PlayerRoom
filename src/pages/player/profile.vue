<template>
  <view v-if="player" class="page">
    <view class="header">
      <view class="avatar" :style="{ backgroundColor: player.accent }">
        <text class="avatar-text">{{ player.initial }}</text>
      </view>
      <text class="name">{{ player.name }}</text>
      <text class="bio">{{ player.bio }}</text>
      <text class="count">游戏库 · {{ totalCount }} 款</text>
    </view>

    <view class="status-list">
      <view
        v-for="item in playStatuses"
        :key="item"
        class="status-row"
        @click="openStatus(item)"
      >
        <MarkIcon :name="item" :size="28" :color="player.accent" />
        <text class="status-count">{{ counts[item] }}</text>
      </view>
    </view>
  </view>
  <view v-else class="page empty">
    <text class="empty-text">玩家不存在</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
  countMyGamesByStatus,
  CURRENT_PLAYER_ID,
  getMe,
  getPlayer,
  reloadFromStorage,
} from '../../services/catalog'
import { requestHomeStatus } from '../../services/home-intent'
import type { Player, PlayStatus } from '../../types/catalog'
import { PLAY_STATUSES } from '../../types/catalog'
import MarkIcon from '../../components/MarkIcon.vue'

const player = ref<Player | undefined>()
const counts = ref(countMyGamesByStatus())
const playStatuses = PLAY_STATUSES

const totalCount = computed(
  () =>
    counts.value.playing +
    counts.value.backlog +
    counts.value.done +
    counts.value.shelved,
)

function refresh(id: string) {
  reloadFromStorage()
  const resolvedId = id || CURRENT_PLAYER_ID
  player.value = getPlayer(resolvedId) ?? getMe()
  counts.value = countMyGamesByStatus()
  if (player.value) {
    uni.setNavigationBarTitle({ title: player.value.name })
  }
}

let pageId = CURRENT_PLAYER_ID

onLoad((query) => {
  pageId = query?.id || CURRENT_PLAYER_ID
  refresh(pageId)
})

onShow(() => {
  refresh(pageId)
})

function openStatus(status: PlayStatus) {
  requestHomeStatus(status)
  uni.switchTab({ url: '/pages/home/index' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32rpx 28rpx 48rpx;
  background: #0f1219;
  box-sizing: border-box;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.avatar-text {
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
}

.name {
  color: #f2f4f8;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 10rpx;
}

.bio {
  color: #8a93a8;
  font-size: 26rpx;
  text-align: center;
  line-height: 1.5;
  padding: 0 24rpx;
  margin-bottom: 12rpx;
}

.count {
  color: #6b7388;
  font-size: 24rpx;
}

.status-list {
  background: #1a1f2e;
  border-radius: 16rpx;
  overflow: hidden;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.status-row:last-child {
  border-bottom: none;
}

.status-name {
  font-size: 30rpx;
  font-weight: 700;
}

.status-count {
  color: #f2f4f8;
  font-size: 32rpx;
  font-weight: 700;
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
