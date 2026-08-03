import { Suspense } from 'react'
import type { Metadata } from 'next'
import VisitTracker from '@/components/VisitTracker'
import ScrollProgress from '@/components/ScrollProgress'
import CursorTrail from '@/components/CursorTrail'
import './globals.css'

export const metadata: Metadata = {
  title: '최원민 포트폴리오',
  description: 'React · Spring · FastAPI 기반 AI 연동 웹 서비스를 만드는 풀스택 개발자',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <VisitTracker />
        </Suspense>
        <ScrollProgress />
        <CursorTrail />
        {children}
      </body>
    </html>
  )
}
