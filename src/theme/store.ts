import type { Platform } from '../types/catalog'

export interface StoreTheme {
  id: Platform
  name: string
  tagline: string
  pageBg: string
  cardBg: string
  text: string
  muted: string
  accent: string
  tabBg: string
  tabActiveBg: string
  tabActiveText: string
  navBg: string
  navText: 'black' | 'white'
}

export const STORE_THEMES: Record<Platform, StoreTheme> = {
  switch: {
    id: 'switch',
    name: 'eShop',
    tagline: '书本式卡带盒货架 · 左右滑动选择',
    pageBg: '#F2F2F2',
    cardBg: '#FFFFFF',
    text: '#202020',
    muted: '#707070',
    accent: '#E60012',
    tabBg: '#E3E3E3',
    tabActiveBg: '#E60012',
    tabActiveText: '#FFFFFF',
    navBg: '#E60012',
    navText: 'white',
  },
  ps5: {
    id: 'ps5',
    name: 'PlayStation Store',
    tagline: '书本式光盘盒货架 · 左右滑动选择',
    pageBg: '#0B101B',
    cardBg: '#151E2E',
    text: '#F5F7FA',
    muted: '#9AA8BD',
    accent: '#0070E0',
    tabBg: '#253047',
    tabActiveBg: '#0070E0',
    tabActiveText: '#FFFFFF',
    navBg: '#0B101B',
    navText: 'white',
  },
  steam: {
    id: 'steam',
    name: 'Steam',
    tagline: '书本式游戏盒货架 · 左右滑动选择',
    pageBg: '#1B2838',
    cardBg: '#16202D',
    text: '#C7D5E0',
    muted: '#8F98A0',
    accent: '#66C0F4',
    tabBg: '#2A475E',
    tabActiveBg: '#66C0F4',
    tabActiveText: '#1B2838',
    navBg: '#171a21',
    navText: 'white',
  },
}

export function getStoreTheme(platform: Platform): StoreTheme {
  return STORE_THEMES[platform]
}
