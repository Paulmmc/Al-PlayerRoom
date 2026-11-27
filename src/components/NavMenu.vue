<template>
  <view class="shell">
    <view class="nav" :style="{ paddingTop: statusBar + 'px', background: background }">
      <view class="row">
        <view class="side">
          <view class="btn" :class="{ open }" @click.stop="toggle">
            <view class="line" :style="{ background: color }" />
            <view class="line" :style="{ background: color }" />
            <view class="line" :style="{ background: color }" />
          </view>
        </view>
        <text class="title" :style="{ color }">{{ title }}</text>
        <view class="side" />
      </view>
    </view>
    <view v-if="panel" class="mask" :class="{ on: open }" @click="close" />
    <view
      v-if="panel"
      class="menu"
      :class="{ on: open }"
      :style="{ top: statusBar + 48 + 'px', background: theme.cardBg }"
      @click.stop
    >
      <view
        v-for="(item, index) in items"
        :key="item.key"
        class="item"
        :style="{ transitionDelay: open ? `${60 + index * 40}ms` : '0ms' }"
        @click="go(item)"
      >
        <text
          :style="{
            color: item.key === current ? theme.accent : theme.text,
            fontWeight: item.key === current ? 700 : 400,
          }"
        >{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { getStoreTheme } from '../theme/store'
import { libraryPlatform } from '../services/library-theme'
import { goRootPage } from '../services/root-transition'
import type { RootPage } from '../services/root-transition'

const props = defineProps<{
  title: string
  current: RootPage
}>()

const theme = computed(() => getStoreTheme(libraryPlatform.value))
const background = computed(() => theme.value.navBg)
const color = computed(() => (theme.value.navText === 'white' ? '#ffffff' : '#000000'))

const open = ref(false)
const panel = ref(false)
const statusBar = ref(0)
let closeTimer: ReturnType<typeof setTimeout> | null = null

try {
  statusBar.value = uni.getSystemInfoSync().statusBarHeight || 0
} catch {
  statusBar.value = 0
}

const items = [
  { key: 'home' as const, label: '游戏库', url: '/pages/home/index' },
  { key: 'schedule' as const, label: '排期', url: '/pages/schedule/index' },
  { key: 'profile' as const, label: '我的', url: '/pages/player/profile' },
]

function toggle() {
  if (open.value) close()
  else show()
}

function show() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  panel.value = true
  nextTick(() => {
    open.value = true
  })
}

function close() {
  open.value = false
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    if (!open.value) panel.value = false
    closeTimer = null
  }, 200)
}

function go(item: (typeof items)[number]) {
  close()
  if (item.key === props.current) return
  goRootPage(props.current, item.key, item.url)
}
</script>

<style scoped>
.shell {
  position: relative;
  z-index: 40;
}

.nav {
  position: relative;
  z-index: 42;
}

.row {
  height: 44px;
  display: flex;
  align-items: center;
}

.side {
  width: 88px;
  flex-shrink: 0;
}

.btn {
  width: 44px;
  height: 44px;
  margin-left: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  padding-left: 10px;
  box-sizing: border-box;
}

.line {
  width: 18px;
  height: 2px;
  border-radius: 1px;
  transition: transform 0.22s ease, opacity 0.18s ease;
  transform-origin: center;
}

.btn.open .line:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.btn.open .line:nth-child(2) {
  opacity: 0;
  transform: scaleX(0.4);
}

.btn.open .line:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

.title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 41;
  background: rgba(0, 0, 0, 0.18);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.mask.on {
  opacity: 1;
}

.menu {
  position: fixed;
  left: 12px;
  z-index: 43;
  min-width: 196px;
  padding: 8px 0;
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  opacity: 0;
  transform: translateY(-10px) scale(0.96);
  transform-origin: top left;
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}

.menu.on {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

.item {
  height: 44px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  font-size: 15px;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.menu.on .item {
  opacity: 1;
  transform: none;
}
</style>
