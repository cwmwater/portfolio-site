import { categoryColor } from '@/lib/palette'
import { TECH_TAG_CLASS } from '@/lib/uiClasses'
import type { SkillCategory } from '@/lib/types'

export default function SkillsList({ categories }: { categories: SkillCategory[] }) {
  if (categories.length === 0) {
    return <p className="font-mono text-sm text-muted">아직 등록된 기술 스택이 없습니다.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-8 md:grid-cols-4">
      {categories.map((cat, i) => {
        const color = categoryColor(i)
        return (
          <div key={cat.category}>
            <div className="mb-2.5 flex items-center gap-2 border-b border-border pb-2">
              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${color.dot}`} />
              <h3 className="truncate font-mono text-[0.8rem] tracking-wide text-dark">{cat.category}</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cat.primary.map((t) => (
                <span key={t} className={TECH_TAG_CLASS}>
                  {t}
                </span>
              ))}
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
  )
}
