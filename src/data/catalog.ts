import { CURRENT_PLAYER_ID } from '../types/catalog'
import type { Game, Player } from '../types/catalog'

export const mePlayer: Player = {
  id: CURRENT_PLAYER_ID,
  name: '我',
  bio: '我的 Switch / PS5 / Steam 游戏库',
  initial: '我',
  accent: '#7C5CFF',
}

export const players: Player[] = [mePlayer]

function assets(id: string, coverFile = 'cover.jpg'): Pick<Game, 'coverImage'> {
  return {
    coverImage: `/static/games/${id}/${coverFile}`,
  }
}

/** 玩家初始库：各平台有封面的正例（不含测试条目） */
export const seedGames: Game[] = [
  {
    id: 'g-zelda-totk',
    title: '塞尔达传说：王国之泪',
    summary: '海拉鲁上空展开新的冒险，建造、探索与解谜交织。',
    tags: ['冒险', '开放世界', '解谜'],
    platform: 'switch',
    playerId: CURRENT_PLAYER_ID,
    coverColor: '#2F6B4A',
    status: 'playing',
    note: '二周目，神庙还没清完',
    journal: [],
    ...assets('g-zelda-totk'),
  },
  {
    id: 'g-mario-odyssey',
    title: '超级马力欧：奥德赛',
    summary: '戴着帽子环游各国，经典平台动作与收集。',
    tags: ['平台', '家庭', '冒险'],
    platform: 'switch',
    playerId: CURRENT_PLAYER_ID,
    coverColor: '#C43B3B',
    status: 'done',
    note: '',
    journal: [],
    ...assets('g-mario-odyssey'),
  },
  {
    id: 'g-elden-ring',
    title: '艾尔登法环',
    summary: '交界地开放世界魂系冒险，自由探索与高压战斗。',
    tags: ['动作', 'RPG', '开放世界'],
    platform: 'ps5',
    playerId: CURRENT_PLAYER_ID,
    coverColor: '#6B4A1B',
    status: 'playing',
    note: '',
    journal: [],
    ...assets('g-elden-ring'),
  },
  {
    id: 'g-gow-ragnarok',
    title: '战神：诸神黄昏',
    summary: '奎托斯与阿特柔斯踏上北欧终焉之路。',
    tags: ['动作', '叙事', '冒险'],
    platform: 'ps5',
    playerId: CURRENT_PLAYER_ID,
    coverColor: '#2B4A6F',
    status: 'backlog',
    note: '',
    journal: [],
    ...assets('g-gow-ragnarok'),
  },
  {
    id: 'g-black-myth',
    title: '黑神话：悟空',
    summary: '以西游为背景的动作冒险，战斗与神话场景并重。',
    tags: ['动作', '神话', '单机'],
    platform: 'steam',
    playerId: CURRENT_PLAYER_ID,
    coverColor: '#8B3A1A',
    status: 'shelved',
    note: '',
    journal: [],
    ...assets('g-black-myth', 'capsule.jpg'),
  },
  {
    id: 'g-hollow-knight',
    title: '空洞骑士',
    summary: '地下王国里的探索与硬核战斗，经典银河恶魔城。',
    tags: ['银河恶魔城', '独立', '挑战'],
    platform: 'steam',
    playerId: CURRENT_PLAYER_ID,
    coverColor: '#1A1F3A',
    status: 'done',
    note: '',
    journal: [],
    ...assets('g-hollow-knight', 'capsule.jpg'),
  },
]
