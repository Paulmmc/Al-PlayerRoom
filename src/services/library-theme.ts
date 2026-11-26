import { ref } from 'vue'
import type { Platform } from '../types/catalog'
import { getStoreTheme } from '../theme/store'

export const libraryPlatform = ref<Platform>('switch')

export function applyLibraryNav(title?: string) {
  const theme = getStoreTheme(libraryPlatform.value)
  uni.setNavigationBarColor({
    frontColor: theme.navText === 'white' ? '#ffffff' : '#000000',
    backgroundColor: theme.navBg,
  })
  if (title) uni.setNavigationBarTitle({ title })
}
