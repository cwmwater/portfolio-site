import SkillsList from '@/components/SkillsList'
import type { SkillCategory } from '@/lib/types'

export default function Footer({ phone, skillCategories }: { phone?: string | null; skillCategories?: SkillCategory[] }) {
  return (
    <footer className="border-t border-white/25 bg-dark pb-10 pt-8 font-mono text-[0.8rem] text-muted-light" id="contact">
      <div className="mx-auto max-w-[880px] px-6">
        {skillCategories && skillCategories.length > 0 && (
          <div className="mb-8 border-b border-white/10 pb-8">
            <h3 className="mb-4 text-[0.85rem] font-semibold tracking-wide text-muted-light">기술 스택</h3>
            <SkillsList categories={skillCategories} />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Wonmin Choi</span>
          <div className="flex flex-wrap gap-4">
            {phone && <span>{phone}</span>}
            <a href="mailto:jo08198@gmail.com" className="hover:text-accent">
              jo08198@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
