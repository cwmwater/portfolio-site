'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { Visit } from '@/lib/types'

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [visits, setVisits] = useState<Visit[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setVisits((data as Visit[]) ?? [])
      })
  }, [session])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError(error.message)
  }

  if (loading) return <main className="admin-shell">불러오는 중...</main>

  if (!session) {
    return (
      <main className="admin-shell" style={{ maxWidth: 360 }}>
        <h2>관리자 로그인</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">로그인</button>
          {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
        </form>
      </main>
    )
  }

  // ref(어느 회사 경로로 들어왔는지)별 집계
  const refCounts = visits.reduce<Record<string, number>>((acc, v) => {
    const key = v.ref || '(직접 방문)'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <main className="admin-shell">
      <h2>방문 통계</h2>

      <section>
        <h3>경로(ref)별 방문 수</h3>
        <ul>
          {Object.entries(refCounts).map(([ref, count]) => (
            <li key={ref}>
              {ref} — {count}회
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>최근 방문 기록</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>시각</th>
              <th style={{ textAlign: 'left' }}>경로(ref)</th>
              <th style={{ textAlign: 'left' }}>페이지</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v) => (
              <tr key={v.id}>
                <td>{new Date(v.created_at).toLocaleString('ko-KR')}</td>
                <td>{v.ref || '-'}</td>
                <td>{v.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
