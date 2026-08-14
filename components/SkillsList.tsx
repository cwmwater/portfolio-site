'use client'

import { techIconUrl } from '@/lib/techIcons'
import { CATEGORY_ICONS } from '@/components/icons/CategoryIcons'
import type { SkillCategory } from '@/lib/types'

export default function SkillsList({ categories }: { categories: SkillCategory[] }) {
  if (categories.length === 0) {
    return <p className="font-mono text-sm text-muted-light">아직 등록된 기술 스택이 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => {
        const CategoryIcon = CATEGORY_ICONS[cat.category]
        return (
          <div key={cat.category} className="flex flex-wrap items-center gap-3">
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 font-mono text-sm font-semibold text-accent-ink">
              {CategoryIcon && <CategoryIcon className="h-3.5 w-3.5" />}
              {cat.category}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cat.primary.map((t) => {
                const iconUrl = techIconUrl(t)
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border border-white/15 bg-white/5 px-[9px] py-[3px] font-mono text-[0.75rem] text-muted-light"
                  >
                    {iconUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={iconUrl}
                        alt=""
                        className="h-3 w-3 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    {t}
                  </span>
                )
              })}
              {cat.learning.map((t) => (
                <span
                  key={t}
                  className="rounded-[6px] border border-white/10 px-[9px] py-[3px] font-mono text-[0.75rem] text-muted-light/70"
                >
                  {t} (학습 중)
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
