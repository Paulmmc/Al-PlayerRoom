<template>
  <view class="choice" :class="{ open }">
    <view v-if="open" class="mask" @click="emit('close')" />
    <view class="current" @click.stop="emit('toggle')">
        <MarkIcon v-if="current.icon" :name="current.icon" :size="28" :color="accent" />
      <text class="current-label" :style="{ color: accent }">{{ current.label }}</text>
      <MarkIcon name="chevron" :size="22" :color="accent" />
    </view>
    <view v-if="open" class="list" :style="{ background: menuBg }">
      <view
        v-for="item in options"
        :key="item.value"
        class="option"
        @click.stop="emit('pick', item.value)"
      >
        <MarkIcon v-if="item.icon" :name="item.icon" :size="28" :color="accent" />
        <text class="option-label" :style="{ color: item.value === value ? accent : text }">
          {{ item.label }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkIcon from './MarkIcon.vue'
import type { ChoiceOption } from './choice-menus'

const props = defineProps<{
  open: boolean
  value: string
  options: ChoiceOption[]
  accent: string
  text: string
  menuBg: string
}>()

const emit = defineEmits<{
  toggle: []
  close: []
  pick: [value: string]
}>()

const current = computed(
  () => props.options.find((item) => item.value === props.value) ?? props.options[0],
)
</script>

<style scoped>
.choice {
  position: relative;
  z-index: 5;
}

.choice.open {
  z-index: 30;
}

.mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
}

.current,
.option {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.current {
  min-height: 72rpx;
}

.current-label,
.option-label {
  font-size: 28rpx;
  font-weight: 700;
}

.list {
  position: absolute;
  left: 0;
  right: 0;
  top: 76rpx;
  z-index: 21;
  border-radius: 16rpx;
  padding: 8rpx 0;
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.18);
}

.option {
  padding: 18rpx 20rpx;
}
</style>
