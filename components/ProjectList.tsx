'use client'

import { useEffect, useRef, useState } from 'react'
import type { Project } from '@/lib/types'
import GithubIcon from '@/components/icons/GithubIcon'
import ProjectDetailPanel from '@/components/ProjectDetailPanel'

function isGithubLink(link: { label: string; url: string }) {
  return /github/i.test(link.label) || /github\.com/i.test(link.url)
}

// 모든 카드 동일한 베이지 톤으로 통일
const CARD_COLORS = ['bg-light', 'bg-light', 'bg-light']

// 카드 톤과 맞춘 제목 색 (teal / copper / steel blue, 밝은 배경에서도 읽히는 진한 톤)
const TITLE_COLORS = ['text-accent-dim', 'text-[#b5691f]', 'text-[#3d6da3]']

// 카드마다 프로젝트 구분만 살짝 주는 상단 액센트 바
const ACCENT_BORDERS = ['border-t-accent-dim', 'border-t-[#b5691f]', 'border-t-[#3d6da3]']

// 섹션(설명/기술/링크 등)을 고정 높이로 자르고, 넘칠 때만 "더보기"를 보여주는 공용 블록.
// 모든 카드에서 같은 섹션이 같은 높이로 정렬되도록 하기 위함
function ClampBlock({ maxHeightPx, children }: { maxHeightPx: number; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function measure() {
      const el = ref.current
      if (!el) return
      setOverflowing(el.scrollHeight > maxHeightPx + 2)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [maxHeightPx, children])

  return (
    <div>
      <div ref={ref} className="overflow-hidden" style={{ maxHeight: expanded ? undefined : maxHeightPx }}>
        {children}
      </div>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 font-mono text-[0.72rem] text-muted transition-colors hover:text-accent"
        >
          {expanded ? '접기' : '더보기'}
        </button>
      )}
    </div>
  )
}

export default function ProjectList({ projects }: { projects: Project[] }) {
  const [showAll, setShowAll] = useState(false)
  const [detailProject, setDetailProject] = useState<Project | null>(null)

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
            className={`flex flex-col rounded-2xl border border-border border-t-4 p-6 shadow-card-lg ${CARD_COLORS[i % CARD_COLORS.length]} ${ACCENT_BORDERS[i % ACCENT_BORDERS.length]}`}
          >
            <h3
              className={`mb-3 break-keep font-mono text-[1.55rem] font-extrabold tracking-tight ${TITLE_COLORS[i % TITLE_COLORS.length]}`}
            >
              {p.title === '클라우드 서버 기반 데이터 자동화 시스템' ? (
                <>
                  클라우드 서버 기반
                  <br />
                  데이터 자동화 시스템
                </>
              ) : (
                p.title
              )}
            </h3>

            {(p.period || p.team_size) && (
              <div className="mb-3 border-b border-border pb-3 font-mono text-[0.78rem] text-muted">
                {p.period}
                {p.period && p.team_size && ' · '}
                {p.team_size && `${p.team_size} 프로젝트`}
              </div>
            )}

            <div className="mb-3">
              <ClampBlock maxHeightPx={104}>
                <p className="font-semibold text-dark">{p.description}</p>
              </ClampBlock>
            </div>

            {p.highlights.length > 0 && (
              <div className="mb-3">
                <ClampBlock maxHeightPx={100}>
                  <ul className="flex flex-col gap-1">
                    {p.highlights.map((h, idx) => (
                      <li key={idx} className="flex gap-2 text-[0.85rem] text-muted">
                        <span className="text-accent">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </ClampBlock>
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
