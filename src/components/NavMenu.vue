<template>
  <view class="shell">
    <view class="nav" :style="{ paddingTop: statusBar + 'px', background: background }">
      <view class="row">
        <view class="side">
          <view class="btn" @click.stop="open = !open">
            <view class="line" :style="{ background: color }" />
            <view class="line" :style="{ background: color }" />
            <view class="line" :style="{ background: color }" />
          </view>
        </view>
        <text class="title" :style="{ color }">{{ title }}</text>
        <view class="side" />
      </view>
    </view>
    <view v-if="open" class="mask" @click="open = false" />
    <view
      v-if="open"
      class="menu"
      :style="{ top: statusBar + 48 + 'px', background: theme.cardBg }"
      @click.stop
    >
      <view
        v-for="item in items"
        :key="item.key"
        class="item"
        @click="go(item)"
      >
        <text :style="{ color: item.key === current ? theme.accent : theme.text, fontWeight: item.key === current ? 700 : 400 }">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getStoreTheme } from '../theme/store'
import { libraryPlatform } from '../services/library-theme'

const props = defineProps<{
  title: string
  current: 'home' | 'schedule' | 'profile'
}>()

const theme = computed(() => getStoreTheme(libraryPlatform.value))
const background = computed(() => theme.value.navBg)
const color = computed(() => (theme.value.navText === 'white' ? '#ffffff' : '#000000'))

const open = ref(false)
const statusBar = ref(0)

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

function go(item: (typeof items)[number]) {
  open.value = false
  if (item.key === props.current) return
  uni.reLaunch({ url: item.url })
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
}

.menu {
  position: fixed;
  left: 12px;
  z-index: 43;
  min-width: 196px;
  padding: 8px 0;
  border-radius: 14px;
  background: #1a1f2e;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
}

.item {
  height: 44px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  color: #e8edf5;
  font-size: 15px;
}

.item.on {
  color: #8b9cff;
  font-weight: 700;
}
</style>
