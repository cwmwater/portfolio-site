'use client'

import { useEffect } from 'react'
import ProjectDetailContent from '@/components/ProjectDetailContent'
import type { Project } from '@/lib/types'

export default function ProjectDetailPanel({
  project,
  onClose,
}: {
  project: Project | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!project) return
    document.body.style.overflow = 'hidden'
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [project, onClose])

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          project ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed bottom-0 right-0 top-0 z-[55] w-full max-w-[560px] overflow-y-auto bg-light shadow-card-lg transition-transform duration-300 ${
          project ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!project}
      >
        <button
          className="sticky top-0 z-10 ml-auto block bg-light px-5 py-3.5 text-2xl leading-none text-muted hover:text-dark"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>
        {project && (
          <div className="px-7 pb-12">
            <ProjectDetailContent project={project} />
          </div>
        )}
      </aside>
    </>
  )
}
