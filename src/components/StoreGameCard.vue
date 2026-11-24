<template>
  <!-- eShop: portrait poster shelf -->
  <view
    v-if="platform === 'switch'"
    class="eshop-card card-anim"
    :style="animStyle"
    @click="emit('open', game.id)"
  >
    <image
      v-if="cover"
      class="eshop-cover"
      :src="cover"
      mode="aspectFill"
    />
    <view
      v-else
      class="eshop-cover eshop-fallback"
      :style="{ backgroundColor: game.coverColor }"
    >
      <text class="fallback-text">{{ game.title }}</text>
    </view>
    <view class="eshop-body">
      <view class="title-row">
        <text class="eshop-title">{{ game.title }}</text>
        <text class="status-badge" :style="badgeStyle">{{ statusLabel }}</text>
      </view>
      <view class="eshop-tags">
        <text v-for="tag in game.tags.slice(0, 2)" :key="tag" class="eshop-tag">
          {{ tag }}
        </text>
        <text class="shelf-action shelf-action-eshop" @click.stop="emit('shelf', game.id)">
          {{ game.onShelf ? '展示中' : '书架展示' }}
        </text>
      </view>
    </view>
  </view>

  <!-- PS Store: wide media tile -->
  <view
    v-else-if="platform === 'ps5'"
    class="ps-card card-anim"
    :style="animStyle"
    @click="emit('open', game.id)"
  >
    <image
      v-if="cover"
      class="ps-cover"
      :src="cover"
      mode="aspectFill"
    />
    <view
      v-else
      class="ps-cover"
      :style="{ backgroundColor: game.coverColor }"
    />
    <view class="ps-gradient" />
    <view class="ps-body">
      <text class="ps-kicker">PS5</text>
      <view class="title-row">
        <text class="ps-title">{{ game.title }}</text>
        <text class="status-badge" :style="badgeStyle">{{ statusLabel }}</text>
      </view>
      <text class="ps-summary">{{ game.summary }}</text>
      <text class="shelf-action shelf-action-light" @click.stop="emit('shelf', game.id)">
        {{ game.onShelf ? '展示中' : '书架展示' }}
      </text>
    </view>
  </view>

  <!-- Steam: library row with capsule -->
  <view
    v-else
    class="steam-card card-anim"
    :style="animStyle"
    @click="emit('open', game.id)"
  >
    <image
      v-if="cover"
      class="steam-capsule"
      :src="cover"
      mode="aspectFill"
    />
    <view
      v-else
      class="steam-capsule steam-fallback"
      :style="{ backgroundColor: game.coverColor }"
    >
      <text class="fallback-text steam-fallback-text">{{ game.title.slice(0, 1) }}</text>
    </view>
    <view class="steam-body">
      <view class="title-row">
        <text class="steam-title">{{ game.title }}</text>
        <text class="status-badge" :style="badgeStyle">{{ statusLabel }}</text>
      </view>
      <text class="steam-tags">{{ game.tags.join(' · ') }}</text>
      <text class="steam-summary">{{ game.summary }}</text>
      <text class="shelf-action" @click.stop="emit('shelf', game.id)">
        {{ game.onShelf ? '展示中' : '书架展示' }}
      </text>
      <text
        v-if="removable"
        class="steam-delete"
        @click.stop="emit('remove', game.id)"
      >
        删除
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Game, Platform } from '../types/catalog'
import { STATUS_COLORS, STATUS_LABELS } from '../types/catalog'
import { gameCover } from '../services/catalog'

const props = withDefaults(
  defineProps<{
    game: Game
    platform: Platform
    index?: number
    removable?: boolean
  }>(),
  { index: 0, removable: false },
)

const emit = defineEmits<{
  open: [id: string]
  remove: [id: string]
  shelf: [id: string]
}>()

const cover = computed(() => gameCover(props.game))
const statusLabel = computed(() => STATUS_LABELS[props.game.status])
const badgeStyle = computed(() => ({
  background: STATUS_COLORS[props.game.status],
  color: props.game.status === 'shelved' ? '#ffffff' : '#1a1a1a',
}))

const animStyle = computed(() => ({
  animationDelay: `${Math.min(props.index, 8) * 50}ms`,
}))
</script>

<style scoped>
.card-anim {
  animation: cardIn 0.35s ease both;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(16rpx) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fallback-text {
  color: rgba(255, 255, 255, 0.92);
  font-size: 28rpx;
  font-weight: 700;
  text-align: center;
  padding: 16rpx;
}

.steam-fallback-text {
  font-size: 48rpx;
}

/* —— eShop —— */
.eshop-card {
  width: 100%;
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.status-badge {
  flex-shrink: 0;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.4;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
}

.eshop-cover {
  width: 100%;
  height: 360rpx;
  background: #ddd;
  display: block;
}

.eshop-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
}

.eshop-body {
  padding: 16rpx 18rpx 20rpx;
}

.eshop-title {
  flex: 1;
  min-width: 0;
  color: #1a1a1a;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 1.35;
}

.eshop-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 10rpx;
}

.eshop-tag {
  font-size: 20rpx;
  color: #e60012;
  background: #ffe8ea;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
}

/* —— PS Store —— */
.ps-card {
  position: relative;
  height: 360rpx;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  background: #1a1a1a;
}

.ps-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.ps-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.92) 0%,
    rgba(0, 0, 0, 0.55) 45%,
    rgba(0, 0, 0, 0.15) 100%
  );
}

.ps-body {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 36rpx 32rpx;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-sizing: border-box;
  max-width: 70%;
}

.ps-kicker {
  color: #0070d1;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  margin-bottom: 8rpx;
}

.ps-title {
  flex: 1;
  min-width: 0;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 700;
}

.ps-summary {
  color: #c8c8c8;
  font-size: 22rpx;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* —— Steam —— */
.steam-card {
  display: flex;
  background: #16202d;
  border-radius: 4rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
  border: 1px solid #2a475e;
}

.steam-capsule {
  width: 160rpx;
  height: 240rpx;
  flex-shrink: 0;
  background: #0e1621;
}

.steam-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
}

.steam-body {
  flex: 1;
  padding: 20rpx 22rpx;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.steam-title {
  flex: 1;
  min-width: 0;
  color: #66c0f4;
  font-size: 30rpx;
  font-weight: 700;
}

.steam-tags {
  color: #8f98a0;
  font-size: 22rpx;
  margin-bottom: 12rpx;
}

.steam-summary {
  color: #c7d5e0;
  font-size: 24rpx;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.steam-delete,
.shelf-action {
  display: inline-block;
  margin-top: 12rpx;
  color: #e60012;
  font-size: 24rpx;
  font-weight: 700;
}

.shelf-action {
  color: #66c0f4;
}

.shelf-action-eshop {
  color: #e60012;
}

.shelf-action-light {
  color: #8b9cff;
}
</style>
