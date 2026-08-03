'use client'

import { useEffect, useRef, useState } from 'react'
import type { Project } from '@/lib/types'
import { getYoutubeId } from '@/lib/youtube'
import GithubIcon from '@/components/icons/GithubIcon'
import ProjectDetailPanel from '@/components/ProjectDetailPanel'
import { TECH_TAG_CLASS } from '@/lib/uiClasses'

function isGithubLink(link: { label: string; url: string }) {
  return /github/i.test(link.label) || /github\.com/i.test(link.url)
}

const MOBILE_BREAKPOINT = 768

const LINK_BTN_CLASS =
  'inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-4 py-2 font-mono text-[0.8rem] text-light transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent max-md:border-border max-md:text-dark max-md:hover:bg-[#eefdfb]'

const LINK_BTN_PRIMARY_CLASS =
  'inline-flex items-center gap-1.5 rounded-lg border border-accent bg-accent px-4 py-2 font-mono text-[0.8rem] font-semibold text-dark transition-colors hover:bg-accent-dim'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isMobile
}

export default function ProjectShowcase({ projects }: { projects: Project[] }) {
  const isMobile = useIsMobile()
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([])
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const [activeImageIndex, setActiveImageIndex] = useState<number[]>(() => projects.map(() => 0))
  const [activeProject, setActiveProject] = useState(0)
  const [navVisible, setNavVisible] = useState(false)
  const [detailProject, setDetailProject] = useState<Project | null>(null)

  // 스크롤 위치에 따라 어떤 프로젝트/미디어가 현재 화면에 고정되어 있는지 계산
  useEffect(() => {
    let raf = 0

    function onScroll() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const vh = window.innerHeight
        const center = vh / 2
        let current = 0

        const nextIndexes = projects.map((p, i) => {
          const el = sceneRefs.current[i]
          if (!el) return 0
          const rect = el.getBoundingClientRect()
          if (rect.top <= center) current = i

          if (isMobile) return 0
          const count = Math.max(p.media.length, 1)
          const progress = -rect.top / vh
          return Math.min(Math.max(Math.floor(progress), 0), count - 1)
        })

        setActiveProject(current)
        if (!isMobile) {
          setActiveImageIndex(nextIndexes)

          // 화면에 고정된 미디어의 영상만 재생하고 나머지는 정지
          videoRefs.current.forEach((video, key) => {
            const [pi, mi] = key.split(':').map(Number)
            const isActive = nextIndexes[pi] === mi
            if (isActive) {
              if (video.paused) video.play().catch(() => {})
            } else if (!video.paused) {
              video.pause()
            }
          })
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [isMobile, projects])

  // 프로젝트 영역이 화면에 보일 때만 하단 이동 UI를 노출
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setNavVisible(entry.isIntersecting), {
      threshold: 0,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function goToProject(i: number) {
    sceneRefs.current[i]?.scrollIntoView({ behavior: 'smooth' })
  }

  if (projects.length === 0) {
    return <p className="font-mono text-sm text-muted">아직 등록된 프로젝트가 없습니다.</p>
  }

  function renderMediaItem(
    item: Project['media'][number],
    idx: number,
    projectIndex: number,
    title: string,
    className: string
  ) {
    if (item.type === 'youtube') {
      const ytId = getYoutubeId(item.url)
      if (!ytId) return null
      return (
        <iframe
          key={idx}
          src={`https://www.youtube.com/embed/${ytId}`}
          title={`${title} 시연 영상`}
          className={className}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )
    }
    if (item.type === 'video') {
      return (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          key={idx}
          src={item.url}
          muted
          loop
          playsInline
          className={className}
          ref={(el) => {
            const key = `${projectIndex}:${idx}`
            if (el) videoRefs.current.set(key, el)
            else videoRefs.current.delete(key)
          }}
        />
      )
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={idx} src={item.url} alt={`${title} 이미지 ${idx + 1}`} className={className} />
    )
  }

  return (
    <>
      <div className="project-scroller" ref={scrollerRef}>
        {projects.map((p, i) => {
          const count = Math.max(p.media.length, 1)
          return (
            <div
              key={p.id}
              className="project-scene-wrapper"
              style={!isMobile ? { height: `${count * 100}vh` } : undefined}
              ref={(el) => {
                sceneRefs.current[i] = el
              }}
            >
              <div className="project-scene">
                <div className="project-scene-media">
                  {isMobile ? (
                    <div className="project-scene-media-mobile">
                      {p.media.map((item, idx) => renderMediaItem(item, idx, i, p.title, ''))}
                    </div>
                  ) : (
                    p.media.map((item, idx) =>
                      renderMediaItem(
                        item,
                        idx,
                        i,
                        p.title,
                        `project-scene-image ${idx === activeImageIndex[i] ? 'is-active' : ''}`
                      )
                    )
                  )}
                </div>

                <div className="relative z-[2] mx-auto w-full max-w-[880px] px-6 pb-[120px] text-light max-md:max-w-none max-md:px-6 max-md:pb-12 max-md:text-dark">
                  <div className="mb-2 flex items-center gap-3 max-md:flex-col max-md:items-start max-md:gap-1">
                    <h3 className="text-[1.7rem] font-extrabold tracking-tight">{p.title}</h3>
                    {p.period && (
                      <span className="font-mono text-[0.8rem] text-muted-light max-md:text-muted">{p.period}</span>
                    )}
                  </div>
                  <p className="max-w-[62ch] text-[1.02rem] text-muted-light max-md:text-neutral-700">
                    {p.description}
                  </p>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {p.tech_stack.map((t) => (
                      <span className={TECH_TAG_CLASS} key={t}>
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {p.links.map((l, idx) => (
                      <a key={idx} href={l.url} target="_blank" rel="noopener noreferrer" className={LINK_BTN_CLASS}>
                        {isGithubLink(l) && <GithubIcon />}
                        {l.label} ↗
                      </a>
                    ))}
                    <button type="button" className={LINK_BTN_PRIMARY_CLASS} onClick={() => setDetailProject(p)}>
                      자세히 보기 →
                    </button>
                  </div>

                  {!isMobile && p.media.length > 1 && (
                    <div className="mt-5 flex gap-1.5">
                      {p.media.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full transition-transform ${
                            idx === activeImageIndex[i] ? 'scale-[1.4] bg-accent' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <nav
        className={`fixed bottom-5 left-1/2 z-40 flex max-w-[calc(100vw-32px)] -translate-x-1/2 gap-1 overflow-x-auto rounded-full border border-white/10 bg-dark/60 p-2 backdrop-blur-md transition-all duration-300 ${
          navVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
        aria-label="프로젝트 바로가기"
      >
        {projects.map((p, i) => (
          <button
            key={p.id}
            className={`whitespace-nowrap rounded-full px-3.5 py-2 font-mono text-[0.8rem] transition-colors ${
              i === activeProject ? 'bg-accent font-semibold text-dark' : 'text-muted-light'
            }`}
            onClick={() => goToProject(i)}
          >
            {p.title}
          </button>
        ))}
      </nav>

      <ProjectDetailPanel project={detailProject} onClose={() => setDetailProject(null)} />
    </>
  )
}
