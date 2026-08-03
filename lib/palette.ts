export interface CategoryColor {
  dot: string
  bg: string
  text: string
  border: string
  tag: string
}

export const CATEGORY_COLORS: CategoryColor[] = [
  { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', tag: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', tag: 'bg-amber-50 text-amber-700 border-amber-200' },
  { dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', tag: 'bg-sky-50 text-sky-700 border-sky-200' },
  { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', tag: 'bg-violet-50 text-violet-700 border-violet-200' },
  { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', tag: 'bg-rose-50 text-rose-700 border-rose-200' },
  { dot: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', tag: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', tag: 'bg-orange-50 text-orange-700 border-orange-200' },
  { dot: 'bg-fuchsia-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', tag: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
]

export function categoryColor(index: number): CategoryColor {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

const RESUME_CATEGORY_COLORS: Record<string, CategoryColor> = {
  학력: CATEGORY_COLORS[2], // sky
  자격증: CATEGORY_COLORS[0], // emerald
  경력: CATEGORY_COLORS[3], // violet
  수상: CATEGORY_COLORS[1], // amber
}

export function resumeCategoryColor(category: string, fallbackIndex: number): CategoryColor {
  return RESUME_CATEGORY_COLORS[category] ?? categoryColor(fallbackIndex)
}
