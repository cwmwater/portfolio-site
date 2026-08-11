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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-300 ${
        project ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={onClose}
      aria-hidden={!project}
    >
      <div
        className={`max-h-[85vh] w-full max-w-[800px] overflow-y-auto rounded-2xl bg-light shadow-card-lg transition-transform duration-300 ${
          project ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
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
      </div>
    </div>
  )
}
