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
    pageBg: '#f0f0f0',
    cardBg: '#ffffff',
    text: '#1a1a1a',
    muted: '#6b6b6b',
    accent: '#e60012',
    tabBg: '#ffffff',
    tabActiveBg: '#e60012',
    tabActiveText: '#ffffff',
    navBg: '#e60012',
    navText: 'white',
  },
  ps5: {
    id: 'ps5',
    name: 'PlayStation Store',
    tagline: '书本式光盘盒货架 · 左右滑动选择',
    pageBg: '#000000',
    cardBg: '#1a1a1a',
    text: '#ffffff',
    muted: '#a0a0a0',
    accent: '#0070d1',
    tabBg: '#141414',
    tabActiveBg: '#0070d1',
    tabActiveText: '#ffffff',
    navBg: '#000000',
    navText: 'white',
  },
  steam: {
    id: 'steam',
    name: 'Steam',
    tagline: '书本式游戏盒货架 · 左右滑动选择',
    pageBg: '#1b2838',
    cardBg: '#16202d',
    text: '#c7d5e0',
    muted: '#8f98a0',
    accent: '#66c0f4',
    tabBg: '#2a475e',
    tabActiveBg: '#66c0f4',
    tabActiveText: '#1b2838',
    navBg: '#171a21',
    navText: 'white',
  },
}

export function getStoreTheme(platform: Platform): StoreTheme {
  return STORE_THEMES[platform]
}
