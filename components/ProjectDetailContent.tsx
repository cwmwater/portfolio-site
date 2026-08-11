'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getYoutubeId } from '@/lib/youtube'
import GithubIcon from '@/components/icons/GithubIcon'
import { SummaryIcon, BackgroundIcon, MeaningIcon, ImageIcon } from '@/components/icons/ProjectDetailIcons'
import FeatureText from '@/components/FeatureText'
import { TECH_TAG_CLASS, LINK_BTN_LIGHT_CLASS } from '@/lib/uiClasses'
import { categoryColor } from '@/lib/palette'
import type { Project } from '@/lib/types'

function isGithubLink(link: { label: string; url: string }) {
  return /github/i.test(link.label) || /github\.com/i.test(link.url)
}

export default function ProjectDetailContent({ project: p }: { project: Project }) {
  // 이미지는 관련 기능 항목 옆 아이콘으로 붙여서 보여주므로, 상단 갤러리는 영상만 노출
  const media = (p.media ?? []).filter((m) => m.type !== 'image')
  const links = p.links ?? []
  const features = p.features ?? []
  const featureMedia = p.feature_media ?? []
  const troubleshooting = p.troubleshooting ?? []
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [expandedImageIdx, setExpandedImageIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!lightboxUrl) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxUrl(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxUrl])

  return (
    <>
      <h1 className="mb-1 text-[1.6rem] font-extrabold tracking-tight text-dark">{p.title}</h1>
      {p.period && <span className="mb-6 block font-mono text-[0.85rem] text-muted">{p.period}</span>}

      <div className="mb-8 overflow-hidden rounded-xl border border-border">
        <table className="w-full border-collapse text-[0.92rem]">
          <tbody>
            {p.period && (
              <tr>
                <th className="w-[110px] border-b border-border bg-neutral-50 px-3.5 py-2.5 text-left font-semibold text-muted">
                  기간
                </th>
                <td className="border-b border-border px-3.5 py-2.5 text-dark">{p.period}</td>
              </tr>
            )}
            {p.team_size && (
              <tr>
                <th className="w-[110px] border-b border-border bg-neutral-50 px-3.5 py-2.5 text-left font-semibold text-muted">
                  인원
                </th>
                <td className="border-b border-border px-3.5 py-2.5 text-dark">{p.team_size}</td>
              </tr>
            )}
            {p.main_duty && (
              <tr>
                <th className="w-[110px] border-b border-border bg-neutral-50 px-3.5 py-2.5 text-left font-semibold text-muted">
                  주요 업무
                </th>
                <td className="border-b border-border px-3.5 py-2.5 text-dark">{p.main_duty}</td>
              </tr>
            )}
            {p.role && (
              <tr>
                <th className="w-[110px] border-b border-border bg-neutral-50 px-3.5 py-2.5 text-left font-semibold text-muted">
                  역할
                </th>
                <td className="border-b border-border px-3.5 py-2.5 text-dark">{p.role}</td>
              </tr>
            )}
            {p.tech_stack.length > 0 && (
              <tr>
                <th className="w-[110px] bg-neutral-50 px-3.5 py-2.5 text-left align-top font-semibold text-muted">
                  기술 스택
                </th>
                <td className="px-3.5 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {p.tech_stack.map((t) => (
                      <span key={t} className={TECH_TAG_CLASS}>
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {media.length > 0 && (
        <div className="mb-8 flex flex-col gap-4">
          {media.map((item, idx) => {
            if (item.type === 'youtube') {
              const ytId = getYoutubeId(item.url)
              if (!ytId) return null
              return (
                <iframe
                  key={idx}
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={`${p.title} 시연 영상 ${idx + 1}`}
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full rounded-xl border-0"
                />
              )
            }
            if (item.type === 'video') {
              return (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video key={idx} src={item.url} controls className="w-full rounded-xl" />
              )
            }
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={item.url}
                alt={`${p.title} 이미지 ${idx + 1}`}
                onClick={() => setLightboxUrl(item.url)}
                className="w-full cursor-zoom-in rounded-xl object-cover transition-opacity hover:opacity-90"
              />
            )
          })}
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold text-dark">
          <SummaryIcon className="text-accent" />
          서비스 소개
        </h2>
        <p className="max-w-[84ch] text-neutral-700">{p.description}</p>
      </section>

      {p.background && (
        <section className="mb-8">
          <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold text-dark">
            <BackgroundIcon className="text-accent" />
            왜 만들었는지
          </h2>
          <p className="max-w-[84ch] text-neutral-700">{p.background}</p>
        </section>
      )}

      {p.meaning && (
        <section className="mb-8">
          <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold text-dark">
            <MeaningIcon className="text-accent" />
            무엇을 배웠는지
          </h2>
          <p className="max-w-[84ch] text-neutral-700">{p.meaning}</p>
        </section>
      )}

      {features.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3.5 text-lg font-bold text-dark">주요 구현 기능</h2>
          <ul className="flex flex-col gap-2">
            {features.map((f, idx) => {
              const color = categoryColor(idx)
              const fMedia = featureMedia.find((m) => m.feature_index === idx)
              const isExpanded = expandedImageIdx === idx
              return (
                <li
                  key={idx}
                  className={`list-none rounded-lg border ${color.border} border-l-4 bg-white px-4 py-2.5 text-neutral-700 shadow-sm`}
                >
                  <FeatureText
                    text={f}
                    actions={
                      fMedia && (
                        <button
                          type="button"
                          onClick={() => setExpandedImageIdx(isExpanded ? null : idx)}
                          className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[0.68rem] font-semibold transition-colors ${
                            isExpanded
                              ? 'border-accent bg-accent text-accent-ink'
                              : 'border-accent bg-accent-soft text-accent-dim hover:bg-accent hover:text-accent-ink'
                          }`}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          이미지 보기
                        </button>
                      )
                    }
                  />
                  {fMedia && isExpanded && (
                    <div className="mt-3 border-t border-border pt-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fMedia.image_url}
                        alt={fMedia.caption}
                        onClick={() => setLightboxUrl(fMedia.image_url)}
                        className="mb-2 w-full cursor-zoom-in rounded-lg border border-border object-contain"
                      />
                      <p className="text-[0.85rem] text-muted">{fMedia.caption}</p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {troubleshooting.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3.5 text-lg font-bold text-dark">트러블슈팅</h2>
          {troubleshooting.map((t, idx) => {
            const color = categoryColor(idx)
            return (
              <div key={idx} className={`mb-3 rounded-xl border ${color.border} border-l-4 p-5`}>
                <h3 className="mb-2.5 text-[0.98rem] font-semibold text-dark">{t.title}</h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="font-mono text-muted">문제</dt>
                  <dd className="text-neutral-700">{t.problem}</dd>
                  <dt className="font-mono text-muted">해결</dt>
                  <dd className="text-neutral-700">{t.solution}</dd>
                </dl>
              </div>
            )
          })}
        </section>
      )}

      {links.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3.5 text-lg font-bold text-dark">관련 링크</h2>
          <div className="flex flex-wrap gap-2.5">
            {links.map((l, idx) => (
              <a key={idx} href={l.url} target="_blank" rel="noopener noreferrer" className={LINK_BTN_LIGHT_CLASS}>
                {isGithubLink(l) && <GithubIcon />}
                {l.label} ↗
              </a>
            ))}
          </div>
        </section>
      )}

      {lightboxUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/90 p-6"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              className="absolute right-5 top-5 text-3xl leading-none text-white/80 hover:text-white"
              onClick={() => setLightboxUrl(null)}
              aria-label="닫기"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="확대된 이미지"
              className="max-h-[90vh] max-w-[90vw] cursor-default rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </>
  )
}
