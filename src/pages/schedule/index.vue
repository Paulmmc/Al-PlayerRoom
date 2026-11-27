<template>
  <view class="screen" :style="screenStyle">
    <NavMenu title="游玩排期" current="schedule" />
    <view class="page" :class="motionClass">
      <view class="controls">
        <SlidePick :options="views" :value="view" v-bind="pickColors" @pick="switchView" />
        <view class="date-nav">
          <template v-if="view === 'week'">
            <button class="arrow" aria-label="上一周" @click="shiftWeek(-7)">‹</button>
            <picker mode="date" :value="dateInputText(selectedDay)" @change="selectDate($event.detail.value)"><view class="month">{{ monthLabel }}</view></picker>
            <button class="arrow" aria-label="下一周" @click="shiftWeek(7)">›</button>
          </template>
          <picker v-else class="jump" mode="date" :value="dateInputText(today)" @change="jumpDate($event.detail.value)"><view>▦ 跳到日期</view></picker>
          <button class="today" @click="goToday">今天</button>
        </view>
        <view v-if="view === 'week'" class="week">
          <view v-for="day in weekDays" :key="day" class="week-day" :class="{ selected: day === selectedDay }" @click="selectDay(day)">
            <text class="weekday">{{ weekdays[(new Date(day).getDay() + 6) % 7] }}</text>
            <text class="day-number" :class="{ 'is-today': day === today }">{{ new Date(day).getDate() }}</text>
            <text class="day-count">{{ counts.get(day) || '—' }}</text>
          </view>
        </view>
        <SlidePick :options="filters" :value="filter" v-bind="pickColors" @pick="setFilter" />
      </view>
      <scroll-view class="list" scroll-y :scroll-top="scrollTop" :scroll-into-view="scrollTarget" @scroll="onScroll">
        <view class="list-content">
          <view v-for="day in visibleDays" :id="dayId(day)" :key="day" class="day-group">
            <view class="section-heading"><text>{{ dayLabel(day) }}</text><text class="muted">{{ rowsOn(day).length }}款游戏</text></view>
            <view v-for="row in rowsOn(day)" :key="row.game.id + row.plan.id" class="card" @longpress="more(row)">
              <image v-if="row.game.coverImage" class="cover" :src="row.game.coverImage" mode="aspectFill" @click="openGame(row)" />
              <view v-else class="cover" :style="{ background: row.game.coverColor }" @click="openGame(row)" />
              <view class="card-copy">
                <text class="card-title" @click="openGame(row)">{{ row.game.title }}</text>
                <text class="muted">{{ PLATFORM_LABELS[row.game.platform] }}</text>
                <text v-if="day < today && !row.plan.played" class="muted">还没玩</text>
                <view class="actions">
                  <button class="play" @click.stop="toggle(row)">{{ row.plan.played ? '撤销已游玩' : '玩过了' }}</button>
                  <button class="more" aria-label="更多排期操作" @click.stop="more(row)">···</button>
                </view>
              </view>
            </view>
          </view>
          <view v-if="view === 'week' && !rowsOn(selectedDay).length" class="empty">
            <text>{{ weekEmpty }}</text>
            <button v-if="!counts.get(selectedDay)" class="link" @click="openCreate">安排游玩</button>
          </view>
          <template v-if="view === 'all'">
            <text v-if="!upcoming.length" class="empty">{{ emptyUpcoming }}</text>
            <button v-if="upcoming.length > futureLimit" class="load" @click="futureLimit += 14">加载更多</button>
            <view id="future-end" />
            <button v-if="past.length" id="history-heading" class="history" @click="historyOpen = !historyOpen">之前的安排 {{ pastCount }} {{ historyOpen ? '⌃' : '⌄' }}</button>
            <template v-if="historyOpen">
              <view v-for="day in past.slice(0, pastLimit)" :id="dayId(day)" :key="day" class="day-group">
                <view class="section-heading"><text>{{ dayLabel(day) }}</text><text class="muted">{{ rowsOn(day).length }}款游戏</text></view>
                <view v-for="row in rowsOn(day)" :key="row.game.id + row.plan.id" class="card" @longpress="more(row)">
                  <image v-if="row.game.coverImage" class="cover" :src="row.game.coverImage" mode="aspectFill" @click="openGame(row)" />
                  <view v-else class="cover" :style="{ background: row.game.coverColor }" @click="openGame(row)" />
                  <view class="card-copy">
                    <text class="card-title" @click="openGame(row)">{{ row.game.title }}</text>
                    <text class="muted">{{ PLATFORM_LABELS[row.game.platform] }}</text>
                    <text v-if="!row.plan.played" class="muted">还没玩</text>
                    <view class="actions"><button class="play" @click.stop="toggle(row)">{{ row.plan.played ? '撤销已游玩' : '玩过了' }}</button><button class="more" aria-label="更多排期操作" @click.stop="more(row)">···</button></view>
                  </view>
                </view>
              </view>
              <button v-if="past.length > pastLimit" class="load" @click="pastLimit += 14">加载更多历史安排</button>
              <view id="history-end" />
            </template>
          </template>
          <button v-if="view === 'week' && pastOpenCount" class="history" @click="showPastOpen">过去未玩的安排 {{ pastOpenCount }}　›</button>
        </view>
      </scroll-view>
    </view>
    <button class="fab" @click="openCreate">＋ 排一期</button>
    <view v-if="deleted" class="undo"><text>已删除</text><button @click="undoDelete">撤销</button></view>
    <PlanSheet v-if="sheet" :initial-date="sheet.at" :game-id="sheet.gameId" :moving-plan="sheet.plan" @close="sheet = null" @saved="saved" />
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue';
import { onBackPress, onHide, onLoad, onShow } from '@dcloudio/uni-app';
import NavMenu from '../../components/NavMenu.vue';
import SlidePick from '../../components/SlidePick.vue';
import PlanSheet from '../../components/PlanSheet.vue';
import { isStoredGame } from '../../composables/usePlanRangeForm';
import { useRootPageMotion } from '../../composables/useRootPageMotion';
import { dateInputText, listMyGames, localMidnight, newerPlanFirst, parseDateInput, reloadFromStorage, removePlayPlan, reschedulePlayPlan, restorePlayPlan, togglePlayPlan } from '../../services/catalog';
import { libraryPlatform } from '../../services/library-theme';
import { getStoreTheme } from '../../theme/store';
import { PLATFORM_LABELS } from '../../types/catalog';
import type { Game, PlayPlan } from '../../types/catalog';
type Row = {
  game: Game;
  plan: PlayPlan;
};
type View = 'week' | 'all';
const { motionClass } = useRootPageMotion();
const theme = computed(() => getStoreTheme(libraryPlatform.value));
const screenStyle = computed(() => ({ background: theme.value.pageBg, '--page': theme.value.pageBg, '--card': theme.value.cardBg, '--text': theme.value.text, '--muted': theme.value.muted, '--accent': theme.value.accent, '--on-accent': theme.value.tabActiveText, '--track': theme.value.tabBg }));
const pickColors = computed(() => ({ track: theme.value.tabBg, thumb: theme.value.tabActiveBg, active: theme.value.tabActiveText, muted: theme.value.muted, accent: theme.value.accent }));
const views = [{ value: 'week', label: '按周' }, { value: 'all', label: '全部' }];
const filters = [{ value: 'all', label: '全部' }, { value: 'open', label: '未游玩' }, { value: 'played', label: '已游玩' }];
const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
const view = ref<View>('week');
const filter = ref('all');
const today = ref(localMidnight());
const selectedDay = ref(today.value);
const library = ref<Game[]>([]);
const futureLimit = ref(14);
const pastLimit = ref(14);
const historyOpen = ref(false);
const scrollTop = ref(0);
const scrollTarget = ref('');
const positions: Record<View, number> = { week: 0, all: 0 };
const sheet = ref<{
  at: number;
  gameId?: string;
  plan?: PlayPlan;
} | null>(null);
const deleted = ref<{
  gameId: string;
  plan: PlayPlan;
} | null>(null);
let undoTimer: ReturnType<typeof setTimeout> | undefined;
let hidden = false;
let detailDay: number | null = null;
const allRows = computed<Row[]>(() => library.value.flatMap((game) => (game.plans ?? []).map((plan) => ({ game, plan }))));
const counts = computed(() => {
  const map = new Map<number, number>();
  for (const row of allRows.value)
    map.set(row.plan.at, (map.get(row.plan.at) ?? 0) + 1);
  return map;
});
const grouped = computed(() => {
  const map = new Map<number, Row[]>();
  for (const row of allRows.value) {
    if (filter.value === 'open' && row.plan.played)
      continue;
    if (filter.value === 'played' && !row.plan.played)
      continue;
    const list = map.get(row.plan.at) ?? [];
    list.push(row);
    map.set(row.plan.at, list);
  }
  for (const list of map.values())
    list.sort((a, b) => newerPlanFirst(a.plan.id, b.plan.id));
  return map;
});
const upcoming = computed(() => [...grouped.value.keys()].filter((day) => day >= today.value).sort((a, b) => a - b));
const past = computed(() => [...grouped.value.keys()].filter((day) => day < today.value).sort((a, b) => b - a));
const visibleDays = computed(() => view.value === 'week' ? [selectedDay.value] : upcoming.value.slice(0, futureLimit.value));
const pastCount = computed(() => past.value.reduce((count, day) => count + rowsOn(day).length, 0));
const pastOpenCount = computed(() => allRows.value.filter((row) => row.plan.at < today.value && !row.plan.played).length);
const weekDays = computed(() => {
  const date = new Date(selectedDay.value);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, index) => shiftDay(date.getTime(), index));
});
const monthLabel = computed(() => `${new Date(selectedDay.value).getFullYear()}年${new Date(selectedDay.value).getMonth() + 1}月`);
const weekEmpty = computed(() => counts.value.get(selectedDay.value) ? `这一天没有${filter.value === 'played' ? '已游玩' : '未游玩'}的安排` : '这一天还没有安排');
const emptyUpcoming = computed(() => filter.value === 'all' ? '今天和未来还没有安排' : `今天和未来没有${filter.value === 'played' ? '已游玩' : '未游玩'}的安排`);
function shiftDay(at: number, offset: number) {
  const date = new Date(at);
  date.setDate(date.getDate() + offset);
  return date.getTime();
}
function rowsOn(day: number) { return grouped.value.get(day) ?? []; }
function dayId(day: number) { return `day-${day}`; }
function dayLabel(day: number) {
  const date = new Date(day);
  const year = date.getFullYear() !== new Date(today.value).getFullYear() ? `${date.getFullYear()}年` : '';
  const prefix = day === today.value ? '今天 · ' : day === shiftDay(today.value, 1) ? '明天 · ' : '';
  return `${prefix}${year}${date.getMonth() + 1}月${date.getDate()}日${prefix ? '' : ' 周' + weekdays[(date.getDay() + 6) % 7]}`;
}
function refresh() {
  const now = localMidnight();
  if (selectedDay.value === today.value)
    selectedDay.value = now;
  today.value = now;
  reloadFromStorage();
  library.value = listMyGames();
}
function onScroll(event: {
  detail: {
    scrollTop: number;
  };
}) { positions[view.value] = event.detail.scrollTop; }
async function setScroll(top: number) {
  scrollTarget.value = '';
  scrollTop.value = positions[view.value];
  await nextTick();
  scrollTop.value = top;
}
async function scrollTo(id: string) {
  scrollTarget.value = '';
  await nextTick();
  scrollTarget.value = id;
}
async function switchView(value: string) {
  if (value !== 'week' && value !== 'all')
    return;
  if (value === view.value)
    return;
  view.value = value;
  await nextTick();
  setScroll(positions[value]);
}
function selectDay(day: number) { selectedDay.value = day; setScroll(0); }
function selectDate(text: string) {
  const at = parseDateInput(text);
  if (Number.isFinite(at))
    selectDay(at);
}
function shiftWeek(offset: number) { selectDay(shiftDay(selectedDay.value, offset)); }
function setFilter(value: string) {
  filter.value = value;
  futureLimit.value = 14;
  pastLimit.value = 14;
  setScroll(0);
}
async function jumpDate(text: string) {
  const at = parseDateInput(text);
  if (!Number.isFinite(at))
    return;
  const isPast = at < today.value;
  if (isPast)
    historyOpen.value = true;
  const days = isPast ? [...past.value].reverse() : upcoming.value;
  const target = days.find((day) => day >= at);
  if (!grouped.value.has(at))
    uni.showToast({ title: '这一天没有符合筛选的安排', icon: 'none' });
  if (target != null) {
    if (isPast)
      pastLimit.value = Math.max(pastLimit.value, past.value.indexOf(target) + 1);
    else
      futureLimit.value = Math.max(futureLimit.value, upcoming.value.indexOf(target) + 1);
    await scrollTo(dayId(target));
  }
  else {
    if (isPast)
      pastLimit.value = past.value.length;
    else
      futureLimit.value = upcoming.value.length;
    await scrollTo(isPast ? 'history-end' : 'future-end');
  }
}
function goToday() {
  refresh();
  if (view.value === 'week')
    selectDay(today.value);
  else
    jumpDate(dateInputText(today.value));
}
async function showPastOpen() {
  filter.value = 'open';
  view.value = 'all';
  historyOpen.value = true;
  await scrollTo('history-heading');
}
function openCreate() {
  refresh();
  sheet.value = { at: view.value === 'week' ? selectedDay.value : today.value };
}
function saved(message: string) {
  const creating = !sheet.value?.plan;
  sheet.value = null;
  refresh();
  uni.showToast({ title: creating && filter.value === 'played' ? '已加入排期，切换到全部或未游玩查看' : message, icon: 'none' });
}
function openGame(row: Row) {
  detailDay = row.plan.at;
  uni.navigateTo({ url: `/pages/game/detail?id=${row.game.id}` });
}
function toggle(row: Row) {
  const result = togglePlayPlan(row.game.id, row.plan.id);
  if (!isStoredGame(result)) {
    uni.showToast({ title: '保存失败', icon: 'none' });
    return;
  }
  refresh();
}
function more(row: Row) {
  const canMoveToday = row.plan.at < today.value && !row.plan.played;
  const actions = canMoveToday ? ['改期', '移到今天', '删除'] : ['改期', '删除'];
  uni.showActionSheet({ itemList: actions, success: ({ tapIndex }) => {
      const action = actions[tapIndex];
      if (action === '改期')
        sheet.value = { at: row.plan.at, gameId: row.game.id, plan: { ...row.plan } };
      if (action === '移到今天') {
        const result = reschedulePlayPlan(row.game.id, row.plan.id, today.value);
        if (!isStoredGame(result))
          uni.showToast({ title: result === 'duplicate' ? '这一天已经排过这款' : '保存失败', icon: 'none' });
        refresh();
      }
      if (action === '删除')
        remove(row);
    } });
}
function clearUndo() {
  if (undoTimer)
    clearTimeout(undoTimer);
  undoTimer = undefined;
  deleted.value = null;
}
function remove(row: Row) {
  if (!removePlayPlan(row.game.id, row.plan.id)) {
    uni.showToast({ title: '删除失败', icon: 'none' });
    return;
  }
  clearUndo();
  deleted.value = { gameId: row.game.id, plan: { ...row.plan } };
  undoTimer = setTimeout(clearUndo, 5000);
  refresh();
}
function undoDelete() {
  if (!deleted.value)
    return;
  reloadFromStorage();
  const result = restorePlayPlan(deleted.value.gameId, deleted.value.plan);
  if (isStoredGame(result)) {
    clearUndo();
    refresh();
    return;
  }
  uni.showToast({ title: result === 'duplicate' ? '这一天已有安排，无法撤销' : result === 'failed' ? '保存失败' : '游戏已不存在，无法撤销', icon: 'none' });
}
onLoad((query) => {
  refresh();
  if (query?.gameId)
    sheet.value = { at: today.value, gameId: String(query.gameId) };
});
onShow(async () => {
  refresh();
  if (hidden) {
    hidden = false;
    await nextTick();
    if (view.value === 'all' && detailDay != null && !grouped.value.has(detailDay)) {
      await jumpDate(dateInputText(detailDay));
    }
    else {
      await setScroll(positions[view.value]);
    }
    detailDay = null;
  }
});
onHide(() => { hidden = true; sheet.value = null; clearUndo(); });
onBackPress(() => { if (!sheet.value)
  return false; sheet.value = null; return true; });
onUnmounted(clearUndo);
</script>

<style scoped>
.screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  color: var(--text);
  overflow: hidden;
}

.page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--page);
}

.controls {
  padding: 24rpx 28rpx 12rpx;
}

button {
  margin: 0;
  padding: 12rpx 20rpx;
  background: transparent;
  color: var(--accent);
  line-height: 1.5;
  border-radius: 16rpx;
  font-size: 26rpx;
}

button::after {
  border: none;
}

.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  padding: 24rpx 0;
}

.month {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text);
}

.arrow {
  font-size: 44rpx;
  color: var(--text);
  padding: 0 12rpx;
}

.today {
  border: 1px solid var(--accent);
  padding: 6rpx 20rpx;
}

.jump {
  flex: 1;
  font-size: 28rpx;
  color: var(--muted);
  padding: 10rpx 18rpx;
  background: var(--card);
  border-radius: 14rpx;
}

.week {
  display: flex;
  gap: 6rpx;
  margin-bottom: 26rpx;
}

.week-day {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 0;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.weekday, .day-count {
  color: var(--muted);
  font-size: 22rpx;
}

.day-number {
  font-weight: 700;
  font-size: 30rpx;
}

.is-today {
  text-decoration: underline;
  text-underline-offset: 5rpx;
}

.week-day.selected {
  background: var(--accent);
  color: var(--on-accent);
}

.selected .weekday, .selected .day-count {
  color: var(--on-accent);
}

.list {
  flex: 1;
  height: 0;
  min-height: 0;
}

.list-content {
  padding: 0 28rpx calc(180rpx + env(safe-area-inset-bottom));
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  font-size: 30rpx;
  font-weight: 700;
  padding: 24rpx 0 16rpx;
}

.muted {
  display: block;
  color: var(--muted);
  font-size: 24rpx;
  font-weight: 400;
  margin-top: 6rpx;
}

.card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 18rpx;
  margin-bottom: 14rpx;
  background: var(--card);
  border-radius: 22rpx;
}

.cover {
  width: 100rpx;
  height: 124rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
}

.card-copy {
  flex: 1;
  min-width: 0;
}

.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.4;
}

.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12rpx;
  margin-top: 10rpx;
}

.play {
  border: 1px solid var(--accent);
  padding: 4rpx 16rpx;
  font-size: 24rpx;
}

.more {
  font-size: 30rpx;
  padding: 0 12rpx;
  color: var(--text);
}

.empty {
  display: block;
  text-align: center;
  padding: 48rpx 12rpx;
  font-size: 26rpx;
  color: var(--muted);
}

.history {
  width: 100%;
  text-align: left;
  background: var(--card);
  color: var(--text);
  margin: 24rpx 0;
  padding: 22rpx;
}

.load {
  width: 100%;
  color: var(--muted);
  padding: 24rpx;
}

.link {
  margin-top: 20rpx;
}

.fab {
  position: fixed;
  z-index: 20;
  right: 28rpx;
  bottom: calc(28rpx + env(safe-area-inset-bottom));
  border-radius: 999rpx;
  padding: 20rpx 28rpx;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 700;
  box-shadow: 0 12rpx 28rpx rgba(0,0,0,.28);
  animation: fabPulse 2.4s ease-in-out infinite;
}

.fab:active {
  transform: scale(.92);
  animation: none;
}

.undo {
  position: fixed;
  z-index: 100;
  bottom: calc(132rpx + env(safe-area-inset-bottom));
  left: 28rpx;
  right: 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx;
  background: var(--card);
  color: var(--text);
  border-radius: 20rpx;
  box-shadow: 0 8rpx 28rpx rgba(0,0,0,.2);
  font-size: 26rpx;
}

@keyframes fabPulse {
  0%,100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.03);
  }

}
</style>
