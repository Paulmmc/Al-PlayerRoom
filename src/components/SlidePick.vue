<template>
  <view ref="rootEl" class="pick" :style="{ background: track }">
    <view class="thumb" :class="{ grown }" :style="thumbStyle" />
    <view
      v-for="(item, index) in options"
      :key="item.value"
      class="item"
      @click="onItemClick(index)"
    >
      <MarkIcon v-if="item.icon" :name="item.icon" :size="22" :color="index === highlight ? active : accent" />
      <text
        class="label"
        :style="{
          color: index === highlight ? active : muted,
          fontWeight: index === highlight ? 600 : 400,
        }"
      >
        {{ item.label }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import MarkIcon from './MarkIcon.vue'
import type { ChoiceOption } from './choice-menus'

const props = defineProps<{
  options: ChoiceOption[]
  value: string
  track: string
  thumb: string
  active: string
  muted: string
  accent: string
}>()

const emit = defineEmits<{
  pick: [value: string]
}>()

const rootEl = ref()
const grown = ref(false)
const floatAt = ref<number | null>(null)

const committed = computed(() => Math.max(0, props.options.findIndex((item) => item.value === props.value)))
const position = computed(() => (floatAt.value == null ? committed.value : floatAt.value))
const highlight = computed(() => {
  const max = Math.max(0, props.options.length - 1)
  return Math.max(0, Math.min(max, Math.round(position.value)))
})

function thumbPaint(grownNow: boolean) {
  if (!grownNow) return props.thumb
  const hex = props.thumb.replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex
  const value = Number.parseInt(full, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, 0.78)`
}

const thumbStyle = computed(() => {
  const count = Math.max(1, props.options.length)
  const pos = position.value
  const following = grown.value && floatAt.value != null
  return {
    background: thumbPaint(grown.value),
    width: grown.value ? `calc((100% - 8rpx) / ${count} + 48rpx)` : `calc((100% - 8rpx) / ${count})`,
    height: grown.value ? 'calc(100% - 8rpx + 32rpx)' : 'calc(100% - 8rpx)',
    top: grown.value ? 'calc(4rpx - 16rpx)' : '4rpx',
    left: `calc(4rpx + (100% - 8rpx) / ${count} * ${pos} - ${grown.value ? '24rpx' : '0px'})`,
    transition: following
      ? 'width 0.25s ease, height 0.25s ease, top 0.25s ease'
      : 'left 0.25s ease, width 0.25s ease, height 0.25s ease, top 0.25s ease',
    boxShadow: grown.value ? '0 4px 10px rgba(0, 0, 0, 0.16)' : '0 1px 3px rgba(0, 0, 0, 0.12)',
  }
})

type PointEvent = {
  pointerType?: string
  pointerId?: number
  clientX?: number
  clientY?: number
  button?: number
  currentTarget?: { setPointerCapture?: (id: number) => void }
  touches?: Array<{ clientX?: number; clientY?: number; pageX?: number; pageY?: number }>
  changedTouches?: Array<{ clientX?: number; clientY?: number; pageX?: number; pageY?: number }>
}

let origin = 0
let startX = 0
let startY = 0
let fromThumb = false
let decided = false
let horizontal = false
let tracking = false
let box: { left: number; width: number } | null = null
let blockClick = false
let usingPointer = false

function pointOf(event: PointEvent) {
  const touch = event.touches?.[0] || event.changedTouches?.[0]
  return {
    x: touch?.clientX ?? touch?.pageX ?? event.clientX ?? 0,
    y: touch?.clientY ?? touch?.pageY ?? event.clientY ?? 0,
  }
}

function hasPoint(event: PointEvent) {
  const touch = event.touches?.[0] || event.changedTouches?.[0]
  const x = touch?.clientX ?? touch?.pageX ?? event.clientX
  return typeof x === 'number' && !Number.isNaN(x)
}

function rootElement() {
  const inst = rootEl.value
  const fromRef = inst?.$el ?? inst
  if (fromRef && typeof fromRef.getBoundingClientRect === 'function') {
    const rect = fromRef.getBoundingClientRect()
    if (rect && rect.width > 0) return fromRef as HTMLElement
  }
  return null
}

function begin(event: PointEvent) {
  const el = rootElement()
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0) return
  const point = pointOf(event)
  const count = props.options.length
  const slot = rect.width / count
  const local = point.x - rect.left
  const start = committed.value
  origin = start
  startX = point.x
  startY = point.y
  box = { left: rect.left, width: rect.width }
  decided = false
  horizontal = false
  tracking = true
  fromThumb = local >= start * slot && local < (start + 1) * slot
  blockClick = true
  if (fromThumb) {
    grown.value = true
    floatAt.value = start
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

function move(event: PointEvent) {
  if (!hasPoint(event) || !tracking || !fromThumb || !box) return
  const point = pointOf(event)
  const dx = point.x - startX
  const dy = point.y - startY
  if (!decided) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
    decided = true
    horizontal = Math.abs(dx) > Math.abs(dy)
    if (!horizontal) {
      grown.value = false
      floatAt.value = null
      fromThumb = false
      return
    }
  }
  if (!horizontal) return
  const slot = box.width / props.options.length
  floatAt.value = Math.max(0, Math.min(props.options.length - 1, origin + dx / slot))
}

function finish(event: PointEvent) {
  if (!tracking) return
  const point = pointOf(event)
  let landed = origin
  if (fromThumb && horizontal && floatAt.value != null) {
    landed = Math.round(floatAt.value)
  } else if (!fromThumb && box && box.width > 0) {
    const local = Math.max(0, Math.min(box.width - 1, point.x - box.left))
    landed = Math.floor(local / (box.width / props.options.length))
  }
  grown.value = false
  floatAt.value = null
  tracking = false
  fromThumb = false
  horizontal = false
  usingPointer = false
  const next = props.options[landed]
  if (next && landed !== origin) emit('pick', next.value)
}

function onItemClick(index: number) {
  if (blockClick) {
    blockClick = false
    return
  }
  const next = props.options[index]
  if (next) emit('pick', next.value)
}

function bind(el: HTMLElement) {
  const down = (event: PointerEvent) => {
    if (event.button !== 0) return
    usingPointer = true
    begin(event as PointEvent)
  }
  const onMove = (event: PointerEvent) => move(event as PointEvent)
  const up = (event: PointerEvent) => {
    if (!hasPoint(event as PointEvent)) return
    finish(event as PointEvent)
  }
  const touchStart = (event: TouchEvent) => {
    if (usingPointer) return
    begin(event as unknown as PointEvent)
  }
  const touchMove = (event: TouchEvent) => move(event as unknown as PointEvent)
  const touchEnd = (event: TouchEvent) => finish(event as unknown as PointEvent)
  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  el.addEventListener('touchstart', touchStart, { passive: true })
  el.addEventListener('touchmove', touchMove, { passive: true })
  el.addEventListener('touchend', touchEnd)
  el.addEventListener('touchcancel', touchEnd)
  return () => {
    el.removeEventListener('pointerdown', down)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
    el.removeEventListener('touchstart', touchStart)
    el.removeEventListener('touchmove', touchMove)
    el.removeEventListener('touchend', touchEnd)
    el.removeEventListener('touchcancel', touchEnd)
  }
}

let unbind = () => {}

onMounted(() => {
  const el = rootElement()
  if (el) unbind = bind(el)
})

onUnmounted(() => {
  unbind()
})
</script>

<style scoped>
.pick {
  position: relative;
  width: 100%;
  height: 64rpx;
  padding: 4rpx;
  box-sizing: border-box;
  border-radius: 999rpx;
  display: flex;
  touch-action: pan-y;
}

.thumb {
  position: absolute;
  border-radius: 999rpx;
  box-sizing: border-box;
  z-index: 0;
}

.thumb.grown {
  /* #ifdef H5 */
  -webkit-backdrop-filter: blur(4rpx) saturate(1.5);
  backdrop-filter: blur(4rpx) saturate(1.5);
  /* #endif */
}

.item {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.label {
  font-size: 20rpx;
  line-height: 1.2;
}
</style>
