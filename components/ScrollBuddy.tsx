'use client'

import { useEffect, useRef, useState } from 'react'

type BuddyState = 'top' | 'climbing' | 'idle' | 'cheer'

// 직선(어깨→손) 모양 — climbing/cheer처럼 회전 애니메이션으로 움직이는 포즈용
const ARM_L_STRAIGHT = '20,22 14,30 8,38'
const ARM_R_STRAIGHT = '20,22 26,30 32,38'
// 맨 위: 양팔을 허리에 짚은 "<  >" 자 포즈
const ARM_L_AKIMBO = '20,22 9,26 16,36'
const ARM_R_AKIMBO = '20,22 31,26 24,36'
// 섹션에 머물러 있을 때: 한쪽은 힘 빼고, 한쪽은 턱을 괴는 제스처
const ARM_L_RELAXED = '20,22 15,32 12,42'
const ARM_R_CHIN = '20,22 27,26 16,13'

const SCROLL_IDLE_DELAY = 180

export default function ScrollBuddy() {
  const [progress, setProgress] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const rafRef = useRef(0)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    function onScroll() {
      setIsScrolling(true)
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => setIsScrolling(false), SCROLL_IDLE_DELAY)

      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const scrollable = document.documentElement.scrollHeight - window.innerHeight
        const pct = scrollable > 0 ? scrollTop / scrollable : 0
        setProgress(Math.min(Math.max(pct, 0), 1))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafRef.current)
      clearTimeout(idleTimerRef.current)
    }
  }, [])

  const state: BuddyState =
    progress >= 0.94 ? 'cheer' : progress <= 0.02 && !isScrolling ? 'top' : isScrolling ? 'climbing' : 'idle'

  const armLPoints = state === 'top' ? ARM_L_AKIMBO : state === 'idle' ? ARM_L_RELAXED : ARM_L_STRAIGHT
  const armRPoints = state === 'top' ? ARM_R_AKIMBO : state === 'idle' ? ARM_R_CHIN : ARM_R_STRAIGHT

  // 헤더 아래(8vh)부터 푸터 위(92vh)까지만 움직이게
  const top = 8 + progress * 84

  return (
    <div
      className="pointer-events-none fixed left-3 z-30 hidden text-accent md:block"
      style={{ top: `${top}vh`, transition: 'top 0.1s linear' }}
      aria-hidden="true"
    >
      <svg
        width="34"
        height="60"
        viewBox="0 0 40 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`scroll-buddy scroll-buddy-${state}`}
      >
        <circle cx="20" cy="10" r="7" />
        <line x1="20" y1="17" x2="20" y2="45" />
        <polyline className="scroll-buddy-arm-l" points={armLPoints} />
        <polyline className="scroll-buddy-arm-r" points={armRPoints} />
        <line className="scroll-buddy-leg-l" x1="20" y1="45" x2="10" y2="65" />
        <line className="scroll-buddy-leg-r" x1="20" y1="45" x2="30" y2="65" />
      </svg>
    </div>
  )
}
