'use client'

import { useState } from 'react'
import { TECH_TAG_CLASS } from '@/lib/uiClasses'
import { techIconUrl } from '@/lib/techIcons'
import { CATEGORY_ICONS } from '@/components/icons/CategoryIcons'
import type { SkillCategory } from '@/lib/types'

export default function SkillsList({ categories }: { categories: SkillCategory[] }) {
  const [open, setOpen] = useState(false)

  if (categories.length === 0) {
    return <p className="font-mono text-sm text-muted">아직 등록된 기술 스택이 없습니다.</p>
  }

  return (
    <div className="rounded-2xl border border-border bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left md:px-8"
      >
        <span className="font-mono text-sm font-semibold text-dark">기술 스택 보기</span>
        <span className={`text-accent transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border p-6 md:p-8">
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
                      <span key={t} className={`inline-flex items-center gap-1.5 ${TECH_TAG_CLASS}`}>
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
                      className="rounded-[6px] border border-border px-[9px] py-[3px] font-mono text-[0.75rem] text-muted"
                    >
                      {t} (학습 중)
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
