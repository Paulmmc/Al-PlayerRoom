<template>
  <view
    class="pack"
    :class="[
      'pack-' + platform,
      { focus, 'is-left': side === 'left', 'is-right': side === 'right', 'is-mp': isMp },
    ]"
    :style="{ '--nudge': String(nudge) }"
    @click.stop="$emit('select')"
  >
    <view class="pack-shadow" />
    <!-- #ifndef MP -->
    <view class="pack-spine">
      <view class="spine-state">
        <MarkIcon :name="game.status" :size="24" color="#ffffff" />
      </view>
      <text class="spine-title">{{ spineLabel }}</text>
      <view v-if="platform === 'switch'" class="spine-mark" />
    </view>
    <view class="pack-top" />
    <view class="pack-page" />
    <!-- #endif -->
    <!-- #ifdef MP -->
    <view class="pack-spine-flat">
      <view class="spine-state">
        <MarkIcon :name="game.status" :size="24" color="#ffffff" />
      </view>
      <text class="spine-title">{{ spineLabel }}</text>
    </view>
    <!-- #endif -->
    <view class="pack-face" @click.stop="onFaceClick">
      <view class="pack-art">
        <image class="pack-img" :src="game.coverImage" mode="aspectFill" />
      </view>
      <view v-if="platform === 'switch'" class="pack-banner">
        <text class="banner-text">NINTENDO SWITCH</text>
        <view class="banner-mark" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Game, Platform } from '../types/catalog'
import MarkIcon from './MarkIcon.vue'

const props = withDefaults(
  defineProps<{
    game: Game
    platform: Platform
    focus?: boolean
    side?: 'left' | 'center' | 'right'
    /** -1..1，滑动过程中的倾斜 */
    nudge?: number
  }>(),
  { nudge: 0, focus: false, side: 'center' },
)

const emit = defineEmits<{
  select: []
  open: [id: string]
}>()

let isMp = false
// #ifdef MP
isMp = true
// #endif

const spineLabel = computed(() => props.game.title.slice(0, 22))

function onFaceClick() {
  if (props.focus) {
    emit('open', props.game.id)
  } else {
    emit('select')
  }
}
</script>

<style scoped>
.spine-state {
  position: absolute;
  top: 4px;
  left: 50%;
  z-index: 3;
  transform: translateX(-50%);
}

.pack {
  position: relative;
  flex-shrink: 0;
  transform-style: preserve-3d;
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0.78;
  filter: saturate(0.92) brightness(0.97);
  z-index: 1;
  will-change: transform, opacity;
}

.pack.focus {
  opacity: 1;
  filter: none;
  z-index: 4;
}

.pack-img {
  display: block;
  width: 100%;
  height: 100%;
}

.pack-shadow {
  position: absolute;
  left: 8%;
  right: 4%;
  bottom: -6px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0.35) 0%,
    transparent 70%
  );
  pointer-events: none;
  opacity: 0.55;
}

.pack.focus .pack-shadow {
  opacity: 0.85;
  left: 4%;
  right: 0;
  height: 14px;
}

/* —— Switch 105×170×11 → 160×258, spine 17 —— */
.pack-switch {
  --spine-d: 17px;
  --nudge: 0;
  width: 160px;
  height: 258px;
  transform: rotateY(calc(18deg - var(--nudge) * 14deg)) rotateX(4deg) translateZ(-12px) scale(0.88);
}

.pack-switch.is-right {
  transform: rotateY(calc(-18deg - var(--nudge) * 14deg)) rotateX(4deg) translateZ(-12px) scale(0.88);
}

.pack-switch.focus {
  transform: rotateY(calc(-6deg - var(--nudge) * 12deg)) rotateX(3deg) translateZ(24px) scale(1);
}

.pack-switch .pack-spine {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--spine-d);
  height: 100%;
  transform-origin: left center;
  transform: rotateY(-90deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0 10px;
  box-sizing: border-box;
  background: linear-gradient(
    90deg,
    #7a0008 0%,
    #e60012 38%,
    #ff2a38 52%,
    #c40010 100%
  );
  border-radius: 1px 0 0 1px;
  color: #fff;
  backface-visibility: hidden;
}

.pack-switch .spine-title {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  max-height: 78%;
  overflow: hidden;
}

.pack-switch .spine-mark {
  width: 10px;
  height: 10px;
  border-radius: 1px;
  background: #fff;
  box-shadow: inset 0 0 0 1.5px #e60012;
  flex-shrink: 0;
}

.pack-switch .pack-page {
  position: absolute;
  top: 0;
  right: 0;
  width: var(--spine-d);
  height: 100%;
  transform-origin: right center;
  transform: rotateY(90deg);
  background: linear-gradient(90deg, #d8d4cc 0%, #f2efe8 40%, #c8c2b8 100%);
  backface-visibility: hidden;
}

.pack-switch .pack-top {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: var(--spine-d);
  transform-origin: top center;
  transform: rotateX(90deg);
  background: linear-gradient(180deg, #f6f4f0 0%, #e8e4dc 55%, #cfc9c0 100%);
  backface-visibility: hidden;
}

.pack-switch .pack-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  border-radius: 2px;
  overflow: hidden;
  background: #eee;
  border: 1.5px solid rgba(230, 230, 235, 0.95);
  box-shadow:
    0 18px 32px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  transform: translateZ(0.6px);
  backface-visibility: hidden;
}

.pack-switch .pack-art {
  flex: 1;
  min-height: 0;
  background: #1a1a1a;
  overflow: hidden;
}

.pack-switch .pack-banner {
  height: 13%;
  min-height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 12px;
  background: linear-gradient(180deg, #f01824 0%, #e60012 55%, #c40010 100%);
}

.banner-text {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #fff;
  white-space: nowrap;
}

.banner-mark {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background: #fff;
  position: relative;
  flex-shrink: 0;
}

.banner-mark::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 1px;
  background: #e60012;
}

/* —— PS5 135×170×15 → 176×222, spine 20 —— */
.pack-ps5 {
  --spine-d: 20px;
  --nudge: 0;
  width: 176px;
  height: 222px;
  transform: rotateY(calc(16deg - var(--nudge) * 12deg)) rotateX(4deg) translateZ(-12px) scale(0.88);
}

.pack-ps5.is-right {
  transform: rotateY(calc(-16deg - var(--nudge) * 12deg)) rotateX(4deg) translateZ(-12px) scale(0.88);
}

.pack-ps5.focus {
  transform: rotateY(calc(6deg - var(--nudge) * 10deg)) rotateX(2deg) translateZ(24px) scale(1);
}

.pack-ps5 .pack-spine {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--spine-d);
  height: 100%;
  transform-origin: left center;
  transform: rotateY(-90deg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 0;
  box-sizing: border-box;
  background: linear-gradient(
    90deg,
    #071018 0%,
    #152238 30%,
    #3a6a9a 62%,
    rgba(90, 150, 210, 0.9) 100%
  );
  color: #d6e8ff;
  backface-visibility: hidden;
}

.pack-ps5 .spine-title {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  max-height: 88%;
  overflow: hidden;
}

.pack-ps5 .pack-page {
  position: absolute;
  top: 0;
  right: 0;
  width: var(--spine-d);
  height: 100%;
  transform-origin: right center;
  transform: rotateY(90deg);
  background: linear-gradient(
    90deg,
    rgba(40, 70, 110, 0.95) 0%,
    rgba(100, 150, 200, 0.75) 45%,
    rgba(60, 100, 150, 0.9) 100%
  );
  backface-visibility: hidden;
}

.pack-ps5 .pack-top {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: var(--spine-d);
  transform-origin: top center;
  transform: rotateX(90deg);
  background: linear-gradient(
    180deg,
    rgba(160, 200, 240, 0.55) 0%,
    rgba(50, 90, 140, 0.85) 100%
  );
  backface-visibility: hidden;
}

.pack-ps5 .pack-face {
  position: absolute;
  inset: 0;
  border-radius: 2px 3px 3px 2px;
  overflow: hidden;
  box-shadow:
    0 18px 34px rgba(0, 0, 0, 0.4),
    inset 0 0 0 2.5px rgba(90, 140, 190, 0.55),
    inset 0 0 0 1px rgba(180, 210, 240, 0.35);
  transform: translateZ(0.6px);
  backface-visibility: hidden;
}

.pack-ps5 .pack-art {
  position: absolute;
  inset: 3px;
  border-radius: 1px;
  overflow: hidden;
  background: #0a1220;
}

/* —— Steam 168×240, spine 18 —— */
.pack-steam {
  --spine-d: 18px;
  --nudge: 0;
  width: 168px;
  height: 240px;
  transform: rotateY(calc(16deg - var(--nudge) * 12deg)) rotateX(4deg) translateZ(-12px) scale(0.88);
}

.pack-steam.is-right {
  transform: rotateY(calc(-16deg - var(--nudge) * 12deg)) rotateX(4deg) translateZ(-12px) scale(0.88);
}

.pack-steam.focus {
  transform: rotateY(calc(6deg - var(--nudge) * 10deg)) rotateX(2deg) translateZ(24px) scale(1);
}

.pack-steam .pack-spine {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--spine-d);
  height: 100%;
  transform-origin: left center;
  transform: rotateY(-90deg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 0;
  box-sizing: border-box;
  background: linear-gradient(90deg, #171a21 0%, #2a475e 100%);
  color: #c7d5e0;
  backface-visibility: hidden;
}

.pack-steam .spine-title {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  max-height: 88%;
  overflow: hidden;
}

.pack-steam .pack-page {
  position: absolute;
  top: 0;
  right: 0;
  width: var(--spine-d);
  height: 100%;
  transform-origin: right center;
  transform: rotateY(90deg);
  background: linear-gradient(90deg, #101820 0%, #2a475e 100%);
  backface-visibility: hidden;
}

.pack-steam .pack-top {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: var(--spine-d);
  transform-origin: top center;
  transform: rotateX(90deg);
  background: linear-gradient(180deg, #2a475e 0%, #171a21 100%);
  backface-visibility: hidden;
}

.pack-steam .pack-face {
  position: absolute;
  inset: 0;
  border-radius: 2px;
  overflow: hidden;
  background: #0e1621;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.45);
  transform: translateZ(0.6px);
  backface-visibility: hidden;
}

.pack-steam .pack-art {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #0e1621;
}

/* —— MP 2.5D fallback —— */
.pack.is-mp.pack-switch,
.pack.is-mp.pack-ps5,
.pack.is-mp.pack-steam {
  transform: scale(0.9);
  display: flex;
  flex-direction: row;
}

.pack.is-mp.focus {
  transform: scale(1.05);
}

.pack.is-mp .pack-spine-flat {
  position: relative;
  width: 12px;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
}

.pack.is-mp.pack-switch .pack-spine-flat {
  width: 17px;
  background: #e60012;
  color: #fff;
}

.pack.is-mp.pack-ps5 .pack-spine-flat {
  width: 20px;
  background: linear-gradient(180deg, #152238, #3a6a9a);
  color: #d6e8ff;
}

.pack.is-mp.pack-steam .pack-spine-flat {
  width: 18px;
  background: #1b2838;
  color: #c7d5e0;
}

.pack.is-mp .pack-face {
  position: relative;
  flex: 1;
  transform: none;
}

.pack.is-mp .pack-shadow {
  display: none;
}
</style>
