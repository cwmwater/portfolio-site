'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { Visit } from '@/lib/types'

// 사용법: 이력서/공고 제출 시 링크 뒤에 ?ref=회사이름 붙여서 배포
// 예) https://내포트폴리오.com/?ref=sanggong
export default function VisitTracker(): null {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    // 같은 브라우저 세션에서 새로고침해도 중복 카운트 안 되게 방지
    const sessionKey = `visit_logged_${ref || 'direct'}`
    if (sessionStorage.getItem(sessionKey)) return
    sessionStorage.setItem(sessionKey, '1')

    const payload: Omit<Visit, 'id' | 'created_at'> = {
      path: window.location.pathname,
      ref: ref || null,
      referrer: document.referrer || null,
    }

    supabase
      .from('visits')
      .insert(payload)
      .then(({ error }) => {
        if (error) console.error('방문 기록 실패:', error.message)
      })
  }, [searchParams])

  return null
}
