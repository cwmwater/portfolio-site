'use client'

import { useEffect, useRef } from 'react'

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0

    function onScroll() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const scrollable = document.documentElement.scrollHeight - window.innerHeight
        const progress = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0
        if (barRef.current) barRef.current.style.width = `${progress}%`
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]" aria-hidden="true">
      <div
        className="h-full w-0 bg-gradient-to-r from-accent-dim to-accent"
        ref={barRef}
      />
    </div>
  )
}
