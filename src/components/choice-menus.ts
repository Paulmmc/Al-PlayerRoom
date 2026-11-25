export type ChoiceOption = {
  value: string
  label: string
  icon?: 'backlog' | 'playing' | 'done' | 'shelved' | 'shelf' | 'shelfOn' | 'shelfUp' | 'shelfDown' | 'chevron'
}

export const STATUS_MENU: ChoiceOption[] = [
  { value: 'backlog', label: '想玩', icon: 'backlog' },
  { value: 'playing', label: '在玩', icon: 'playing' },
  { value: 'done', label: '已通关', icon: 'done' },
  { value: 'shelved', label: '搁置', icon: 'shelved' },
]

export const SHELF_MENU: ChoiceOption[] = [
  { value: 'shelf', label: '书架展示', icon: 'shelf' },
  { value: 'showing', label: '展示中', icon: 'shelfOn' },
]
