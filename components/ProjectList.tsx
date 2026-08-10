'use client'

import { useEffect, useRef, useState } from 'react'
import type { Project } from '@/lib/types'
import GithubIcon from '@/components/icons/GithubIcon'
import ProjectDetailPanel from '@/components/ProjectDetailPanel'

function isGithubLink(link: { label: string; url: string }) {
  return /github/i.test(link.label) || /github\.com/i.test(link.url)
}

// 프로젝트마다 다른 그라디언트 포인트를 주되, 전부 다크 네이비(--dark)로 수렴시켜 톤을 통일
const CARD_GRADIENTS = [
  'bg-gradient-to-br from-[#123a30] to-[#0b1220]',
  'bg-gradient-to-br from-[#4a3218] to-[#0b1220]',
  'bg-gradient-to-br from-[#12233d] to-[#0b1220]',
]

export default function ProjectList({ projects }: { projects: Project[] }) {
  const [showAll, setShowAll] = useState(false)
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [expandedTech, setExpandedTech] = useState<Record<string, boolean>>({})
  const [overflowingTech, setOverflowingTech] = useState<Record<string, boolean>>({})
  const techRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    function measure() {
      const next: Record<string, boolean> = {}
      for (const [id, el] of Object.entries(techRefs.current)) {
        if (!el || el.children.length === 0) continue
        const rowHeight = (el.children[0] as HTMLElement).offsetHeight
        next[id] = el.scrollHeight > rowHeight + 4
      }
      setOverflowingTech(next)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [projects])

  if (projects.length === 0) {
    return <p className="font-mono text-sm text-muted">아직 등록된 프로젝트가 없습니다.</p>
  }

  // is_featured가 아직 없는(마이그레이션 전) 프로젝트는 주요 프로젝트로 간주
  const hasHidden = projects.some((p) => p.is_featured === false)
  const visible = showAll ? projects : projects.filter((p) => p.is_featured !== false)

  return (
    <>
      {hasHidden && (
        <label className="mb-6 flex items-center gap-2 font-mono text-[0.85rem] text-dark">
          <input type="checkbox" checked={!showAll} onChange={(e) => setShowAll(!e.target.checked)} />
          주요 프로젝트만 보기
        </label>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {visible.map((p, i) => (
          <div
            key={p.id}
            className={`flex flex-col rounded-2xl border border-white/10 p-6 shadow-card-lg ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]}`}
          >
            <span className="mb-3 inline-block w-fit rounded-md bg-light px-3 py-1 font-mono text-[0.85rem] font-semibold text-dark">
              {p.title}
            </span>

            {(p.period || p.team_size) && (
              <div className="mb-3 border-b border-white/15 pb-3 font-mono text-[0.78rem] text-muted-light">
                {p.period}
                {p.period && p.team_size && ' · '}
                {p.team_size && `${p.team_size} 프로젝트`}
              </div>
            )}

            <p className="mb-3 font-semibold text-light">{p.description}</p>

            {p.highlights.length > 0 && (
              <ul className="mb-3 flex flex-col gap-1">
                {p.highlights.map((h, idx) => (
                  <li key={idx} className="flex gap-2 text-[0.85rem] text-muted-light">
                    <span className="text-accent">•</span>
                    {h}
                  </li>
                ))}
              </ul>
            )}

            {p.tech_stack.length > 0 && (
              <div className="mb-3">
                <div
                  ref={(el) => {
                    techRefs.current[p.id] = el
                  }}
                  className={`flex flex-wrap gap-1.5 overflow-hidden ${
                    expandedTech[p.id] ? '' : 'max-h-[28px]'
                  }`}
                >
                  {p.tech_stack.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[0.75rem] text-accent"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {overflowingTech[p.id] && (
                  <button
                    type="button"
                    onClick={() => setExpandedTech((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                    className="mt-1.5 font-mono text-[0.72rem] text-muted-light transition-colors hover:text-accent"
                  >
                    {expandedTech[p.id] ? '접기' : '더보기'}
                  </button>
                )}
              </div>
            )}

            <div className="mt-auto pt-2">
              {p.links.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {p.links.map((l, idx) => {
                    const isGithub = isGithubLink(l)
                    return (
                      <a
                        key={idx}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[0.78rem] font-semibold transition-colors ${
                          isGithub
                            ? 'border-[#6f93c4]/40 text-[#6f93c4] hover:border-[#6f93c4]'
                            : 'border-[#d98e4c]/40 text-[#d98e4c] hover:border-[#d98e4c]'
                        }`}
                      >
                        {isGithub && <GithubIcon />}
                        {l.label}
                      </a>
                    )
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() => setDetailProject(p)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent px-3 py-1.5 font-mono text-[0.78rem] font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-ink"
              >
                자세히 보기
              </button>
            </div>
          </div>
        ))}
      </div>

      <ProjectDetailPanel project={detailProject} onClose={() => setDetailProject(null)} />
    </>
  )
}
