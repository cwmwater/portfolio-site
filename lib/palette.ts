export interface CategoryColor {
  dot: string
  bg: string
  text: string
  border: string
  tag: string
  borderTop: string
  frame: string
  hex: string
  hexLight: string
}

// 무지개색 카테고리 구분을 걷어내고 포인트색(accent) 하나로 통일.
// 인덱스별 분기가 필요했던 호출부는 그대로 두되 항상 같은 톤을 반환한다.
const ACCENT: CategoryColor = {
  dot: 'bg-accent',
  bg: 'bg-surface',
  text: 'text-accent',
  border: 'border-border',
  tag: 'bg-surface text-accent border-border',
  borderTop: 'border-t-accent',
  frame: 'border-accent',
  hex: '#2f6156',
  hexLight: '#6fa08f',
}

export function categoryColor(_index: number): CategoryColor {
  return ACCENT
}

export function resumeCategoryColor(_category: string, _fallbackIndex: number): CategoryColor {
  return ACCENT
}
