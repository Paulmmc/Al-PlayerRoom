import { CURRENT_PLAYER_ID } from '../types/catalog'
import type { Game, Platform } from '../types/catalog'

type Entry = {
  id: string
  title: string
  summary: string
  tags: string[]
  platform: Platform
  coverColor: string
}

function toGame(entry: Entry): Game {
  const file = entry.platform === 'steam' ? 'capsule.jpg' : 'cover.jpg'
  const coverImage = `/static/games/${entry.id}/${file}`
  return {
    ...entry,
    playerId: CURRENT_PLAYER_ID,
    coverImage,
    status: 'backlog',
    note: '',
    journal: [],
    onShelf: false,
    shelfAt: 0,
  }
}

const SWITCH_DB: Entry[] = [
  { id: 'db-sw-01', title: '马里奥赛车8 豪华版', summary: '在反重力赛道上与好友竞速，含众多经典角色与赛道。', tags: ['竞速', '派对'], platform: 'switch', coverColor: '#E60012' },
  { id: 'db-sw-02', title: '喷射战士3', summary: '四对四占地对战，用墨汁涂满场地并压制对手。', tags: ['射击', '对战'], platform: 'switch', coverColor: '#F15BB5' },
  { id: 'db-sw-03', title: '集合啦！动物森友会', summary: '在无人岛上生活、装扮与交友的慢节奏模拟游戏。', tags: ['模拟', '生活'], platform: 'switch', coverColor: '#7DCE6A' },
  { id: 'db-sw-04', title: '火焰纹章 风花雪月', summary: '学院三人组与战略回合战，剧情随路线分岔。', tags: ['策略', 'RPG'], platform: 'switch', coverColor: '#C9A227' },
  { id: 'db-sw-05', title: '异度神剑3', summary: '两个国家的士兵在无尽战争中寻找终结之路。', tags: ['RPG', '开放世界'], platform: 'switch', coverColor: '#3D5A80' },
  { id: 'db-sw-06', title: '斯普拉遁3', summary: '新一轮占地对战，并加入鲑鱼跑与卡牌模式。', tags: ['射击', '对战'], platform: 'switch', coverColor: '#FF7A00' },
  { id: 'db-sw-07', title: '宝可梦 朱', summary: '在帕底亚地区冒险、收集宝可梦并挑战道馆。', tags: ['RPG', '收集'], platform: 'switch', coverColor: '#C0392B' },
  { id: 'db-sw-08', title: '星之卡比 探索发现', summary: '卡比在废弃文明中用复制能力解开机关。', tags: ['平台', '动作'], platform: 'switch', coverColor: '#F4A7C1' },
  { id: 'db-sw-09', title: '健身环大冒险', summary: '用环形控制器在冒险关卡里完成健身动作。', tags: ['体感', '运动'], platform: 'switch', coverColor: '#1ABC9C' },
  { id: 'db-sw-10', title: '塞尔达传说 旷野之息', summary: '海拉鲁开放世界，自由探索、解谜与战斗。', tags: ['冒险', '开放世界'], platform: 'switch', coverColor: '#2F6B4A' },
  { id: 'db-sw-11', title: '超级马力欧兄弟 惊奇', summary: '经典横版关卡中充满会说话的惊奇花。', tags: ['平台', '家庭'], platform: 'switch', coverColor: '#3498DB' },
  { id: 'db-sw-12', title: '宝可梦传说 阿尔宙斯', summary: '在洗翠地区调查宝可梦，动作捕捉与图鉴研究。', tags: ['动作', 'RPG'], platform: 'switch', coverColor: '#1A5276' },
  { id: 'db-sw-13', title: '银河战士 究极', summary: '萨姆丝回到银河战士系列的初代星球，探索与射击。', tags: ['动作', '探索'], platform: 'switch', coverColor: '#F39C12' },
  { id: 'db-sw-14', title: '路易吉洋馆3', summary: '路易吉在多层酒店里用吸尘器解救马力欧。', tags: ['动作', '解谜'], platform: 'switch', coverColor: '#196F3D' },
  { id: 'db-sw-15', title: '皮克敏4', summary: '指挥皮克敏在庭院与洞穴中收集宝物、解谜。', tags: ['策略', '解谜'], platform: 'switch', coverColor: '#D4AC0D' },
]

const PS5_DB: Entry[] = [
  { id: 'db-ps-01', title: '对马岛之魂 导演剪辑版', summary: '武士境井仁在对马岛抵抗入侵，剑戟与开放世界。', tags: ['动作', '开放世界'], platform: 'ps5', coverColor: '#7B241C' },
  { id: 'db-ps-02', title: '最后生还者 第一部', summary: '乔尔与艾莉穿越末世美国的叙事动作冒险。', tags: ['动作', '叙事'], platform: 'ps5', coverColor: '#4A3728' },
  { id: 'db-ps-03', title: '地平线 西之绝境', summary: '埃洛伊前往禁西之地，对抗新的机器与部落。', tags: ['动作', '开放世界'], platform: 'ps5', coverColor: '#1A5276' },
  { id: 'db-ps-04', title: '漫威蜘蛛侠2', summary: '彼得与迈尔斯在纽约并肩作战的开放世界动作游戏。', tags: ['动作', '开放世界'], platform: 'ps5', coverColor: '#1B4F72' },
  { id: 'db-ps-05', title: '最终幻想7 重生', summary: '克劳德一行离开米德加，在广阔世界中继续旅程。', tags: ['RPG', '动作'], platform: 'ps5', coverColor: '#1A5276' },
  { id: 'db-ps-06', title: '死亡搁浅 导演剪辑版', summary: '山姆在破碎的美国运送货物，重建连接。', tags: ['动作', '冒险'], platform: 'ps5', coverColor: '#2C3E50' },
  { id: 'db-ps-07', title: '恶魔之魂', summary: 'FromSoftware 对古典魂系的高清重制，高压战斗。', tags: ['动作', 'RPG'], platform: 'ps5', coverColor: '#4A235A' },
  { id: 'db-ps-08', title: '瑞奇与叮当 时空跳转', summary: '跨维度的平台射击冒险，画面与手感面向新主机。', tags: ['平台', '射击'], platform: 'ps5', coverColor: '#148F77' },
  { id: 'db-ps-09', title: '往日不再', summary: '迪肯骑摩托车穿越末日俄勒冈，清理感染者。', tags: ['动作', '开放世界'], platform: 'ps5', coverColor: '#6E2C00' },
  { id: 'db-ps-10', title: '星鸣特攻', summary: '第三人生射击，小队在边境星球执行任务。', tags: ['射击', '合作'], platform: 'ps5', coverColor: '#1ABC9C' },
  { id: 'db-ps-11', title: '宇宙机器人', summary: '平台动作，机器人用配件穿越关卡并救援同伴。', tags: ['平台', '家庭'], platform: 'ps5', coverColor: '#5DADE2' },
  { id: 'db-ps-12', title: '旺达与巨像', summary: '在寂静大陆上攀爬并击败巨像的动作冒险。', tags: ['动作', '冒险'], platform: 'ps5', coverColor: '#7F8C8D' },
  { id: 'db-ps-13', title: '仁王2', summary: '战国妖鬼与复杂战斗系统的硬核动作游戏。', tags: ['动作', 'RPG'], platform: 'ps5', coverColor: '#922B21' },
  { id: 'db-ps-14', title: '如龙8', summary: '桐生与春日在夏威夷展开的现代动作RPG。', tags: ['动作', 'RPG'], platform: 'ps5', coverColor: '#1C2833' },
  { id: 'db-ps-15', title: '跑车浪漫旅7', summary: '写实赛车与车辆收集，覆盖世界各地赛道。', tags: ['竞速', '模拟'], platform: 'ps5', coverColor: '#B9770E' },
]

const STEAM_DB: Entry[] = [
  { id: 'db-st-01', title: '博德之门3', summary: '基于 D&D 的深度回合制 RPG，同伴与选择决定结局。', tags: ['RPG', '回合制'], platform: 'steam', coverColor: '#6C3483' },
  { id: 'db-st-02', title: '哈迪斯', summary: '地狱王子一次次冲出冥界的动作 roguelike。', tags: ['动作', 'Roguelike'], platform: 'steam', coverColor: '#922B21' },
  { id: 'db-st-03', title: '星露谷物语', summary: '继承农场、种植养殖并与小镇居民建立关系。', tags: ['模拟', '生活'], platform: 'steam', coverColor: '#1E8449' },
  { id: 'db-st-04', title: '文明6', summary: '从石器时代发展到太空的回合制帝国建设。', tags: ['策略', '4X'], platform: 'steam', coverColor: '#1A5276' },
  { id: 'db-st-05', title: '传送门2', summary: '用传送门枪解开实验室谜题，含合作战役。', tags: ['解谜', '第一人称'], platform: 'steam', coverColor: '#D35400' },
  { id: 'db-st-06', title: '巫师3：狂猎', summary: '杰洛特在开放世界中追猎怪物与寻找养女。', tags: ['RPG', '开放世界'], platform: 'steam', coverColor: '#1C2833' },
  { id: 'db-st-07', title: '赛博朋克 2077', summary: '夜之城的第一人称开放世界 RPG 与义体改造。', tags: ['RPG', '开放世界'], platform: 'steam', coverColor: '#F1C40F' },
  { id: 'db-st-08', title: '双人成行', summary: '两名性格迥异的囚犯必须合作通关的平台冒险。', tags: ['合作', '平台'], platform: 'steam', coverColor: '#E67E22' },
  { id: 'db-st-09', title: '戴森球计划', summary: '在星际间建造巨型生产线与戴森球的工厂游戏。', tags: ['工厂', '策略'], platform: 'steam', coverColor: '#2874A6' },
  { id: 'db-st-10', title: '缺氧', summary: '在小行星殖民地管理氧气、食物与压力的模拟。', tags: ['模拟', '生存'], platform: 'steam', coverColor: '#117A65' },
  { id: 'db-st-11', title: '艾尔登法环', summary: '交界地开放世界魂系冒险（PC 版）。', tags: ['动作', 'RPG'], platform: 'steam', coverColor: '#6B4A1B' },
  { id: 'db-st-12', title: '只狼：影逝二度', summary: '以弹反为核心的忍者生存动作游戏。', tags: ['动作', '挑战'], platform: 'steam', coverColor: '#7B241C' },
  { id: 'db-st-13', title: '杀戮尖塔', summary: '构筑卡组攀登尖塔的回合制 roguelike。', tags: ['卡牌', 'Roguelike'], platform: 'steam', coverColor: '#5B2C6F' },
  { id: 'db-st-14', title: '泰拉瑞亚', summary: '挖掘、建造与战斗的 2D 沙盒冒险。', tags: ['沙盒', '冒险'], platform: 'steam', coverColor: '#1ABC9C' },
  { id: 'db-st-15', title: '饥荒联机版', summary: '与好友在残酷世界中活过每一个季节。', tags: ['生存', '合作'], platform: 'steam', coverColor: '#784212' },
]

export const catalogGames: Game[] = [
  ...SWITCH_DB.map((entry) => toGame(entry)),
  ...PS5_DB.map((entry) => toGame(entry)),
  ...STEAM_DB.map((entry) => toGame(entry)),
]
