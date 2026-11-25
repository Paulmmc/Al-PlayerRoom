<template>
  <view class="mark" :style="{ width: size + 'rpx', height: size + 'rpx', color }">
    <!-- #ifndef MP -->
    <svg class="mark-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path v-if="name === 'backlog'" fill="currentColor" d="M6 3.2h12a1 1 0 0 1 1 1V21l-7-3.6L5 21V4.2a1 1 0 0 1 1-1z" />
      <path v-else-if="name === 'playing'" fill="currentColor" d="M8 4.8v14.4L19.2 12 8 4.8z" />
      <path
        v-else-if="name === 'done'"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M5 12.4 9.4 17 19 7.2"
      />
      <g v-else-if="name === 'shelved'" fill="currentColor">
        <rect x="6" y="3.5" width="3.4" height="17" rx="1" />
        <rect x="14.6" y="3.5" width="3.4" height="17" rx="1" />
      </g>
      <g v-else-if="name === 'shelf'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
        <path d="M4 4.2h16v15.6H4z" />
        <path d="M4 9.6h16M4 15h16M9 4.2v5.4M15 9.6v5.4" />
      </g>
      <g v-else-if="name === 'shelfUp'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6.5h16" />
        <path d="M12 18.5V10" />
        <path d="M8 13.5 12 9.5l4 4" />
      </g>
      <g v-else-if="name === 'shelfDown'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6.5h16" />
        <path d="M12 9.5v8.5" />
        <path d="M8 14.5 12 18.5l4-4" />
      </g>
      <path
        v-else-if="name === 'shelfOn'"
        fill="currentColor"
        d="M3.5 3.4h17v17.2h-17V3.4zm1.8 1.7v4.2h3.6V5.1H5.3zm5.2 0v4.2h3.6V5.1h-3.6zm5.2 0v4.2h2.8V5.1h-2.8zM5.3 11.1v4h3.6v-4H5.3zm5.2 0v4h3.6v-4h-3.6zm5.2 0v4h2.8v-4h-2.8zM5.3 17.1v1.8h13.4v-1.8H5.3z"
      />
      <path
        v-else
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 9.2 12 15l6-5.8"
      />
    </svg>
    <!-- #endif -->
    <!-- #ifdef MP -->
    <view class="mp" :class="'mp-' + name" />
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: 'backlog' | 'playing' | 'done' | 'shelved' | 'shelf' | 'shelfOn' | 'shelfUp' | 'shelfDown' | 'chevron'
    size?: number
    color?: string
  }>(),
  { size: 28, color: 'currentColor' },
)
</script>

<style scoped>
.mark {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mark-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.mp {
  width: 70%;
  height: 70%;
  background: currentColor;
}

.mp-playing {
  width: 0;
  height: 0;
  background: transparent;
  border-style: solid;
  border-width: 0.35em 0 0.35em 0.55em;
  border-color: transparent transparent transparent currentColor;
}

.mp-done {
  width: 0.45em;
  height: 0.75em;
  background: transparent;
  border-right: 0.14em solid currentColor;
  border-bottom: 0.14em solid currentColor;
  transform: rotate(40deg);
}

.mp-shelved {
  width: 0.7em;
  height: 0.85em;
  background: transparent;
  border-left: 0.16em solid currentColor;
  border-right: 0.16em solid currentColor;
}

.mp-shelf,
.mp-shelfOn {
  width: 0.8em;
  height: 0.7em;
  background: transparent;
  border: 0.12em solid currentColor;
  box-shadow: inset 0 0.28em 0 currentColor, inset 0 -0.22em 0 currentColor;
}

.mp-shelfOn {
  background: currentColor;
}

.mp-shelfUp,
.mp-shelfDown {
  width: 0.7em;
  height: 0.7em;
  background: transparent;
  border-top: 0.12em solid currentColor;
  border-right: 0.12em solid currentColor;
}

.mp-shelfUp {
  transform: rotate(-45deg) translateY(0.15em);
  box-shadow: 0 -0.42em 0 -0.08em currentColor;
}

.mp-shelfDown {
  transform: rotate(135deg) translateY(0.15em);
  box-shadow: 0 -0.42em 0 -0.08em currentColor;
}
.mp-chevron {
  width: 0.4em;
  height: 0.4em;
  background: transparent;
  border-right: 0.12em solid currentColor;
  border-bottom: 0.12em solid currentColor;
  transform: rotate(45deg) translateY(-0.1em);
}

.mp-backlog {
  border-radius: 0.08em 0.08em 0 0;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%);
}
</style>
