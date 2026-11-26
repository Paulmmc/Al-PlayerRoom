<template>
  <view v-if="ready" class="page" :style="pageTheme">
    <view class="cover-wrap" @click="pickCover">
      <image
        v-if="coverImage"
        class="cover-image"
        :src="coverImage"
        mode="aspectFill"
      />
      <view
        v-else
        class="cover-color"
        :style="{ backgroundColor: coverColor }"
      >
        <text class="cover-title-fallback">{{ title || '新游戏' }}</text>
      </view>
      <view class="cover-mask">
        <text class="cover-hint">点击更换封面</text>
      </view>
    </view>

    <view v-if="isCreate" class="field">
      <text class="label">从 {{ labels[platform] }} 资料库选择</text>
      <scroll-view class="catalog-scroll" scroll-x enable-flex>
        <view
          v-for="item in catalog"
          :key="item.id"
          class="catalog-item"
          :class="{ on: selectedCatalogId === item.id }"
          @click="applyCatalog(item)"
        >
          <image
            v-if="item.coverImage"
            class="catalog-cover"
            :src="item.coverImage"
            mode="aspectFill"
          />
          <view
            v-else
            class="catalog-cover catalog-fallback"
            :style="{ background: item.coverColor }"
          >
            <text class="catalog-fallback-text">{{ labels[item.platform] }}</text>
          </view>
          <text class="catalog-name">{{ item.title }}</text>
        </view>
      </scroll-view>
      <text class="catalog-hint">只显示当前平台。选中后填入名称与介绍，仍可改标题和封面</text>
    </view>

    <view class="field">
      <text class="label">标题</text>
      <view class="input-box">
        <input
          class="input"
          type="text"
          v-model="title"
          maxlength="40"
          placeholder="游戏名称"
          placeholder-class="placeholder"
          confirm-type="done"
        />
      </view>
    </view>

    <view class="field">
      <text class="label">介绍</text>
      <textarea
        class="textarea"
        v-model="summary"
        maxlength="200"
        auto-height
        placeholder="写一段游戏介绍"
        placeholder-class="placeholder"
      />
    </view>

    <view class="field">
      <text class="label">状态</text>
      <ChoiceMenu
        :open="openMenu === 'status'"
        :value="status"
        :options="statusOptions"
        :accent="theme.accent"
        :text="theme.text"
        :menu-bg="theme.cardBg"
        @toggle="toggleMenu('status')"
        @close="openMenu = null"
        @pick="pickStatus"
      />
    </view>

    <view class="field">
      <text class="label">展示</text>
      <ChoiceMenu
        :open="openMenu === 'shelf'"
        :value="onShelf ? 'showing' : 'shelf'"
        :options="shelfOptions"
        :accent="theme.accent"
        :text="theme.text"
        :menu-bg="theme.cardBg"
        @toggle="toggleMenu('shelf')"
        @close="openMenu = null"
        @pick="pickShelf"
      />
    </view>

    <view class="field">
      <text class="label">备注</text>
      <view class="input-box">
        <input
          class="input"
          type="text"
          v-model="note"
          maxlength="40"
          placeholder="写一句备注，例如二周目"
          placeholder-class="placeholder"
          confirm-type="done"
        />
      </view>
    </view>

    <view class="field">
      <text class="label">平台</text>
      <view class="platform-tabs">
        <view
          v-for="item in platforms"
          :key="item"
          class="tab"
          :class="{ active: platform === item }"
          @click="platform = item"
        >
          <text class="tab-text">{{ labels[item] }}</text>
        </view>
      </view>
    </view>

    <button class="save-btn" :loading="saving" @click="save">
      {{ isCreate ? '添加到游戏库' : '保存' }}
    </button>
  </view>
  <view v-else class="page empty">
    <text class="empty-text">游戏不存在</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  addGame,
  getGame,
  listCatalogByPlatform,
  PLATFORM_LABELS,
  PLATFORMS,
  reloadFromStorage,
  setOnShelf,
  updateGame,
} from '../../services/catalog'
import { getStoreTheme } from '../../theme/store'
import { libraryPlatform, applyLibraryNav } from '../../services/library-theme'
import ChoiceMenu from '../../components/ChoiceMenu.vue'
import { SHELF_MENU, STATUS_MENU } from '../../components/choice-menus'
import type { Game, Platform, PlayStatus } from '../../types/catalog'

const platforms = PLATFORMS
const labels = PLATFORM_LABELS
const statusOptions = STATUS_MENU
const shelfOptions = SHELF_MENU
const openMenu = ref<'status' | 'shelf' | null>(null)

const ready = ref(false)
const isCreate = ref(false)
const saving = ref(false)
const gameId = ref('')
const title = ref('')
const summary = ref('')
const platform = ref<Platform>('switch')
const coverColor = ref('#2a3350')
const coverImage = ref<string | undefined>()
const tags = ref<string[]>([])
const status = ref<PlayStatus>('backlog')
const onShelf = ref(false)
const theme = computed(() => getStoreTheme(libraryPlatform.value))
const pageTheme = computed(() => ({
  background: theme.value.pageBg,
  color: theme.value.text,
  '--field': theme.value.cardBg,
  '--quiet': theme.value.muted,
  '--accent': theme.value.accent,
  '--on-accent': theme.value.tabActiveText,
  '--track': theme.value.tabBg,
}))
const note = ref('')
const selectedCatalogId = ref('')

const catalog = computed(() =>
  isCreate.value ? listCatalogByPlatform(platform.value) : [],
)

watch(platform, () => {
  if (!isCreate.value) return
  if (
    selectedCatalogId.value &&
    catalog.value.some((item) => item.id === selectedCatalogId.value)
  ) {
    return
  }
  selectedCatalogId.value = ''
  title.value = ''
  summary.value = ''
  coverColor.value = '#2a3350'
  coverImage.value = undefined
  tags.value = []
})

onLoad((query) => {
  const id = String(query?.id ?? '').trim()
  const mode = String(query?.mode ?? '').trim()
  const qPlatform = query?.platform as Platform | undefined
  const creating = mode === 'create' || !id

  if (creating) {
    isCreate.value = true
    gameId.value = ''
    title.value = ''
    summary.value = ''
    platform.value =
      qPlatform && PLATFORMS.includes(qPlatform) ? qPlatform : 'switch'
    coverColor.value = '#2a3350'
    coverImage.value = undefined
    ready.value = true
    applyLibraryNav('添加游戏')
    return
  }

  isCreate.value = false
  gameId.value = id
  reloadFromStorage()
  const game = getGame(id)
  if (!game) {
    ready.value = false
    return
  }
  title.value = game.title
  summary.value = game.summary
  platform.value = game.platform
  coverColor.value = game.coverColor
  coverImage.value = game.coverImage || undefined
  status.value = game.status
  onShelf.value = game.onShelf
  note.value = game.note
  ready.value = true
  applyLibraryNav('编辑游戏')
})

function fileToDataUrl(path: string): Promise<string> {
  // #ifdef H5
  return fetch(path)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(blob)
        }),
    )
  // #endif
  // #ifndef H5
  return Promise.resolve(path)
  // #endif
}

function applyCatalog(item: Game) {
  selectedCatalogId.value = item.id
  title.value = item.title
  summary.value = item.summary
  platform.value = item.platform
  coverColor.value = item.coverColor
  coverImage.value = item.coverImage
  tags.value = [...item.tags]
}

function pickCover() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const path = res.tempFilePaths[0]
      if (!path) return
      try {
        coverImage.value = await fileToDataUrl(path)
      } catch {
        coverImage.value = path
      }
    },
  })
}

function toggleMenu(which: 'status' | 'shelf') {
  openMenu.value = openMenu.value === which ? null : which
}

function pickStatus(value: string) {
  status.value = value as PlayStatus
  openMenu.value = null
}

function pickShelf(value: string) {
  onShelf.value = value === 'shelf'
  openMenu.value = null
}

function applyShelf(id: string) {
  const updated = setOnShelf(id, onShelf.value)
  if (onShelf.value && !updated) {
    uni.showToast({ title: '这个平台的书架最多 8 本', icon: 'none' })
  }
}

function save() {
  if (!ready.value || saving.value) return
  const nextTitle = String(title.value ?? '').trim()
  if (!nextTitle) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  saving.value = true

  if (isCreate.value) {
    const created = addGame({
      title: nextTitle,
      summary: String(summary.value ?? ''),
      platform: platform.value,
      coverImage: coverImage.value,
      coverColor: coverColor.value,
      tags: tags.value,
      status: status.value,
      note: note.value,
    })
    applyShelf(created.id)
    saving.value = false
    uni.showToast({ title: '已添加', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/game/detail?id=${created.id}` })
    }, 400)
    return
  }

  const updated = updateGame(gameId.value, {
    title: nextTitle,
    summary: String(summary.value ?? ''),
    platform: platform.value,
    coverImage: coverImage.value ?? '',
    status: status.value,
    note: note.value,
  })
  if (!updated) {
    uni.showToast({ title: '保存失败', icon: 'none' })
    saving.value = false
    return
  }
  applyShelf(updated.id)
  saving.value = false
  uni.showToast({ title: '已保存', icon: 'success' })
  setTimeout(() => {
    uni.navigateBack()
  }, 400)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 28rpx 28rpx 60rpx;
  box-sizing: border-box;
}

.cover-wrap {
  position: relative;
  height: 320rpx;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 32rpx;
}

.cover-image,
.cover-color {
  width: 100%;
  height: 100%;
}

.cover-color {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  box-sizing: border-box;
}

.cover-title-fallback {
  color: rgba(255, 255, 255, 0.9);
  font-size: 36rpx;
  font-weight: 700;
  text-align: center;
}

.cover-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 24rpx;
  background: linear-gradient(transparent 40%, rgba(0, 0, 0, 0.45));
  pointer-events: none;
}

.cover-hint {
  color: #fff;
  font-size: 26rpx;
}

.field {
  position: relative;
  z-index: 2;
  margin-bottom: 28rpx;
}

.catalog-scroll {
  width: 100%;
  white-space: nowrap;
  height: 220rpx;
}

.catalog-item {
  display: inline-flex;
  flex-direction: column;
  width: 140rpx;
  margin-right: 16rpx;
  vertical-align: top;
}

.catalog-item.on .catalog-cover {
  border-color: #7c5cff;
}

.catalog-cover {
  width: 140rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: var(--field);
  border: 4rpx solid transparent;
  box-sizing: border-box;
}

.catalog-fallback {
  display: flex;
  align-items: flex-end;
  padding: 10rpx;
}

.catalog-fallback-text {
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
}

.catalog-name {
  margin-top: 8rpx;
  color: inherit;
  font-size: 20rpx;
  line-height: 1.3;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.catalog-hint {
  display: block;
  margin-top: 8rpx;
  color: #6b7388;
  font-size: 22rpx;
}

.label {
  display: block;
  color: inherit;
  font-size: 26rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.input-box {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: var(--field);
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  color: inherit;
  font-size: 28rpx;
  background: transparent;
}

/* uni-app H5: host + inner native input both need height or hit area is 0 */
.input-box :deep(uni-input),
.input-box :deep(.uni-input-wrapper),
.input-box :deep(.uni-input-input) {
  width: 100%;
  height: 88rpx !important;
  line-height: 88rpx;
  min-height: 88rpx;
}

.input-box :deep(.uni-input-placeholder) {
  line-height: 88rpx;
}

.textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: var(--field);
  color: inherit;
  font-size: 28rpx;
  line-height: 1.5;
  box-sizing: border-box;
}

.placeholder {
  color: var(--quiet);
}

.platform-tabs {
  display: flex;
  background: var(--track);
  border-radius: 16rpx;
  padding: 6rpx;
}

.tab {
  flex: 1;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
}

.tab.active {
  background: var(--accent);
}

.tab-text {
  color: var(--quiet);
  font-size: 26rpx;
  font-weight: 600;
}

.tab.active .tab-text {
  color: var(--on-accent);
}

.save-btn {
  margin-top: 20rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 30rpx;
  font-weight: 600;
}

.save-btn::after {
  border: none;
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
