<template>
  <view class="overlay" :style="sheetStyle" @touchmove.stop.prevent @click.self="close">
    <view class="sheet" :style="{ bottom: keyboardHeight + 'px', maxHeight: `calc(100vh - ${keyboardHeight + 20}px)` }" @click.stop>
      <view class="handle" />
      <view class="heading">
        <text>{{ movingPlan ? '改期' : '安排游玩' }}</text>
        <button class="close" aria-label="关闭排期面板" @click="close">×</button>
      </view>
      <scroll-view class="body" scroll-y @touchmove.stop>
        <template v-if="!movingPlan">
          <input v-model="keyword" class="search" placeholder="搜索游戏" :adjust-position="false" />
          <scroll-view class="games" scroll-y @touchmove.stop>
            <view v-for="item in matches" :key="item.id" class="game" @click="selectedId = item.id">
              <image v-if="item.coverImage" class="cover" :src="item.coverImage" mode="aspectFill" />
              <view v-else class="cover" :style="{ background: item.coverColor }" />
              <view class="game-copy">
                <text class="name">{{ item.title }}</text>
                <text class="muted">{{ PLATFORM_LABELS[item.platform] }}</text>
              </view>
              <text class="check" :class="{ selected: selectedId === item.id }">{{ selectedId === item.id ? '✓' : '○' }}</text>
            </view>
            <text v-if="library.length && !matches.length" class="hint">没有找到这款游戏</text>
            <view v-if="!library.length" class="hint">
              <text>先往游戏库添加一款游戏</text>
              <button class="link" @click="goAdd">去添加</button>
            </view>
          </scroll-view>
        </template>
        <text v-if="selectedGame" class="summary">{{ movingPlan ? '游戏' : '已选' }} · {{ selectedGame.title }}</text>
        <SlidePick v-if="!movingPlan" :options="planModes" :value="form.mode" v-bind="pickColors" @pick="form.setMode" />
        <template v-if="movingPlan || form.mode === 'day'">
          <picker mode="date" :value="form.dayText" @change="form.dayText = $event.detail.value">
            <view class="date"><text>日期</text><text>{{ form.dayText }}　›</text></view>
          </picker>
          <view class="shortcuts">
            <button :class="{ active: form.dayText === todayText }" @click="setDay(0)">今天</button>
            <button :class="{ active: form.dayText === tomorrowText }" @click="setDay(1)">明天</button>
            <picker mode="date" :value="form.dayText" @change="form.dayText = $event.detail.value"><view class="choose">选择日期</view></picker>
          </view>
        </template>
        <template v-else>
          <picker mode="date" :value="form.startText" @change="form.startText = $event.detail.value"><view class="date"><text>开始日期</text><text>{{ form.startText }}　›</text></view></picker>
          <picker mode="date" :value="form.endText" @change="form.endText = $event.detail.value"><view class="date"><text>结束日期</text><text>{{ form.endText }}　›</text></view></picker>
          <text v-if="preview.total != null" class="muted">共 {{ preview.total }} 天</text>
          <text v-if="preview.added != null" class="muted">新增 {{ preview.added }} 天，跳过 {{ preview.skipped }} 天</text>
        </template>
        <text v-if="blocked" class="hint">{{ blocked }}</text>
      </scroll-view>
      <view class="footer"><button class="submit" :disabled="!!blocked || saving" @click="save">{{ movingPlan ? '保存改期' : '加入排期' }}</button></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import SlidePick from './SlidePick.vue';
import { isStoredGame, planModes, usePlanRangeForm } from '../composables/usePlanRangeForm';
import { dateInputText, listMyGames, localMidnight, parseDateInput, reloadFromStorage, reschedulePlayPlan } from '../services/catalog';
import { libraryPlatform } from '../services/library-theme';
import { getStoreTheme } from '../theme/store';
import { PLATFORM_LABELS } from '../types/catalog';
import type { PlayPlan } from '../types/catalog';
const props = defineProps<{
  initialDate: number;
  gameId?: string;
  movingPlan?: PlayPlan;
}>();
const emit = defineEmits<{
  close: [
  ];
  saved: [
    message: string
  ];
}>();
reloadFromStorage();
const library = ref(listMyGames());
const selectedId = ref(props.gameId ?? '');
const keyword = ref('');
const saving = ref(false);
const keyboardHeight = ref(0);
const form = usePlanRangeForm();
form.reset(props.initialDate);
const theme = computed(() => getStoreTheme(libraryPlatform.value));
const sheetStyle = computed(() => ({
  '--card': theme.value.cardBg, '--text': theme.value.text, '--muted': theme.value.muted,
  '--accent': theme.value.accent, '--track': theme.value.tabBg, '--on-accent': theme.value.tabActiveText,
}));
const pickColors = computed(() => ({ track: theme.value.tabBg, thumb: theme.value.tabActiveBg, active: theme.value.tabActiveText, muted: theme.value.muted, accent: theme.value.accent }));
const matches = computed(() => library.value.filter((game) => game.title.toLowerCase().includes(keyword.value.trim().toLowerCase())));
const selectedGame = computed(() => library.value.find((game) => game.id === selectedId.value));
const preview = computed(() => form.describe(selectedGame.value));
const todayText = dateInputText(Date.now());
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowText = dateInputText(tomorrow.getTime());
const blocked = computed(() => {
  if (!props.movingPlan)
    return preview.value.reason;
  if (!selectedGame.value)
    return '没有这款游戏';
  const at = parseDateInput(form.dayText);
  if (!Number.isFinite(at))
    return '请选择有效日期';
  if (selectedGame.value.plans?.some((plan) => plan.id !== props.movingPlan!.id && plan.at === at))
    return '这一天已经排过这款';
  return '';
});
function close() {
  if (!saving.value)
    emit('close');
}
function setDay(offset: number) {
  const date = new Date(localMidnight());
  date.setDate(date.getDate() + offset);
  form.dayText = dateInputText(date.getTime());
}
function save() {
  if (blocked.value || saving.value)
    return;
  uni.hideKeyboard();
  saving.value = true;
  try {
    // Refresh the library so a stale open panel cannot overwrite newer arrangements.
    reloadFromStorage();
    library.value = listMyGames();
    if (props.movingPlan) {
      const result = reschedulePlayPlan(selectedId.value, props.movingPlan.id, parseDateInput(form.dayText));
      if (isStoredGame(result))
        emit('saved', '已保存改期');
      else
        uni.showToast({ title: result === 'duplicate' ? '这一天已经排过这款' : result === 'failed' ? '保存失败' : '原安排已不存在', icon: 'none' });
      return;
    }
    const outcome = form.save(selectedGame.value);
    if (outcome.close)
      emit('saved', outcome.toast || '已加入排期');
    else
      uni.showToast({ title: outcome.toast || form.describe(selectedGame.value).reason || '保存失败', icon: 'none' });
  }
  finally {
    saving.value = false;
  }
}
function goAdd() {
  emit('close');
  uni.navigateTo({ url: '/pages/game/edit?mode=create' });
}
function keyboardChange(event: {
  height: number;
}) {
  keyboardHeight.value = event.height;
}
// #ifdef H5
let previousOverflow = '';
let previousBodyOverflow = '';
const historyKey = `plan-sheet-${Date.now()}`;
const openingUrl = window.location.href;
function popState() { emit('close'); }
function keyDown(event: KeyboardEvent) { if (event.key === 'Escape')
  close(); }
function viewportChange() {
  keyboardHeight.value = Math.max(0, window.innerHeight - (window.visualViewport?.height ?? window.innerHeight));
}
// #endif
onMounted(() => {
  // #ifndef H5
  uni.onKeyboardHeightChange(keyboardChange);
  // #endif
  // #ifdef H5
  previousOverflow = document.documentElement.style.overflow;
  previousBodyOverflow = document.body.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  window.history.pushState({ ...window.history.state, planSheet: historyKey }, '');
  window.addEventListener('popstate', popState);
  window.addEventListener('keydown', keyDown);
  window.visualViewport?.addEventListener('resize', viewportChange);
  // #endif
});
onUnmounted(() => {
  // #ifndef H5
  uni.offKeyboardHeightChange(keyboardChange);
  // #endif
  // #ifdef H5
  document.documentElement.style.overflow = previousOverflow;
  document.body.style.overflow = previousBodyOverflow;
  window.removeEventListener('popstate', popState);
  window.removeEventListener('keydown', keyDown);
  window.visualViewport?.removeEventListener('resize', viewportChange);
  if (window.location.href === openingUrl && window.history.state?.planSheet === historyKey)
    window.history.back();
  // #endif
});
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0,0,0,.42);
  color: var(--text);
}

.sheet {
  position: absolute;
  left: 0;
  right: 0;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: var(--card);
  border-radius: 32rpx 32rpx 0 0;
  padding-top: 14rpx;
}

.handle {
  width: 76rpx;
  height: 8rpx;
  background: var(--muted);
  opacity: .4;
  border-radius: 8rpx;
  margin: 0 auto 12rpx;
}

.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28rpx 16rpx;
  font-size: 36rpx;
  font-weight: 700;
}

button {
  margin: 0;
  font-size: 26rpx;
  line-height: 1.5;
  padding: 14rpx 20rpx;
  border-radius: 16rpx;
  background: var(--track);
  color: var(--text);
}

button::after {
  border: none;
}

.close {
  background: transparent;
  color: var(--text);
  font-size: 44rpx;
  padding: 0 16rpx;
}

.body {
  min-height: 0;
  max-height: 65vh;
  box-sizing: border-box;
  padding: 0 28rpx;
}

.search {
  background: var(--track);
  border-radius: 16rpx;
  padding: 18rpx;
  font-size: 28rpx;
  color: var(--text);
}

.games {
  height: 280rpx;
  margin-top: 14rpx;
}

.game {
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 12rpx 0;
}

.cover {
  width: 72rpx;
  height: 86rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
}

.game-copy {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
}

.muted {
  display: block;
  font-size: 24rpx;
  color: var(--muted);
  margin-top: 6rpx;
}

.check {
  font-size: 38rpx;
  color: var(--muted);
  padding: 8rpx;
}

.check.selected, .link {
  color: var(--accent);
}

.summary {
  display: block;
  font-size: 24rpx;
  padding: 16rpx 0;
}

.date {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  padding: 22rpx 0;
  font-size: 26rpx;
}

.shortcuts {
  display: flex;
  gap: 12rpx;
  padding-bottom: 12rpx;
}

.shortcuts button, .shortcuts picker {
  flex: 1;
  text-align: center;
}

.choose {
  border-radius: 16rpx;
  background: var(--track);
  padding: 14rpx 6rpx;
  font-size: 26rpx;
  line-height: 1.5;
}

.shortcuts .active, .submit {
  background: var(--accent);
  color: var(--on-accent);
}

.hint {
  display: block;
  padding: 16rpx 0;
  font-size: 24rpx;
  color: var(--muted);
}

.footer {
  padding: 18rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
}

.submit {
  width: 100%;
  font-weight: 700;
}

.submit[disabled] {
  background: var(--track);
  color: var(--muted);
}
</style>
