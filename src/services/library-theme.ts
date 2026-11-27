import { ref } from 'vue'
import type { Platform } from '../types/catalog'
import { PLATFORMS } from '../types/catalog'
import { getStoreTheme } from '../theme/store'

const STORAGE_KEY = 'playerroom.libraryPlatform'

function readPlatform(): Platform {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (PLATFORMS.includes(raw as Platform)) return raw as Platform
  } catch {
    /* keep default */
  }
  return 'switch'
}

export const libraryPlatform = ref<Platform>(readPlatform())

export function setLibraryPlatform(platform: Platform) {
  if (!PLATFORMS.includes(platform)) return
  if (libraryPlatform.value === platform) return
  libraryPlatform.value = platform
  try {
    uni.setStorageSync(STORAGE_KEY, platform)
  } catch {
    /* ignore */
  }
}

export function applyLibraryNav(title?: string) {
  const theme = getStoreTheme(libraryPlatform.value)
  uni.setNavigationBarColor({
    frontColor: theme.navText === 'white' ? '#ffffff' : '#000000',
    backgroundColor: theme.navBg,
  })
  if (title) uni.setNavigationBarTitle({ title })
}
