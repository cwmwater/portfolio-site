'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

const ACCENT = '45, 212, 191'
const WHITE = '245, 245, 244'

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches
    if (reduceMotion || !finePointer) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    function onResize() {
      width = canvas!.width = window.innerWidth
      height = canvas!.height = window.innerHeight
    }

    let particles: Particle[] = []
    let lastSpawn = 0

    function onPointerMove(e: PointerEvent) {
      const now = performance.now()
      if (now - lastSpawn < 24) return
      lastSpawn = now

      for (let i = 0; i < 2; i++) {
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -Math.random() * 0.5 - 0.15,
          life: 0,
          maxLife: 500 + Math.random() * 450,
          size: 1.4 + Math.random() * 2,
          color: Math.random() > 0.35 ? ACCENT : WHITE,
        })
      }
      if (particles.length > 160) particles.splice(0, particles.length - 160)
    }

    let raf = 0
    let lastFrame = performance.now()

    function tick(now: number) {
      const dt = now - lastFrame
      lastFrame = now
      ctx!.clearRect(0, 0, width, height)

      particles = particles.filter((p) => p.life < p.maxLife)
      for (const p of particles) {
        p.life += dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        const t = p.life / p.maxLife
        const alpha = (1 - t) * 0.8
        ctx!.beginPath()
        ctx!.fillStyle = `rgba(${p.color}, ${alpha})`
        ctx!.arc(p.x, p.y, p.size * (1 - t * 0.4), 0, Math.PI * 2)
        ctx!.fill()
      }

      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointerMove)
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden="true" />
}
