'use client'

import { useEffect, useState } from 'react'

interface Ripple {
  id: number
  x: number
  y: number
}

let nextId = 0

// 클릭할 때 커서 위치에 teal 링이 잠깐 번지는 효과. 클릭 즉시 사라지므로 상태만 짧게 유지
export default function ClickRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([])

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    function onDown(e: MouseEvent) {
      const id = nextId++
      setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 450)
    }

    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <>
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="click-ripple pointer-events-none fixed z-[200]"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </>
  )
}
