// 관리자 인증으로 profile/projects 테이블을 직접 갱신하는 재사용 스크립트.
// anon key는 RLS상 읽기 전용이라, 이 스크립트는 ADMIN_EMAIL/ADMIN_PASSWORD로 로그인한 뒤
// 인증된 세션으로 update를 보낸다. Supabase SQL 에디터에 매번 복붙하는 과정을 없애기 위함.
//
// 사용법: node scripts/db-update.mjs <payload.json>
// payload.json 형태:
// {
//   "profile": { "intro": "...", ... } | null,   // profile 테이블 id=1 row를 갱신
//   "projects": [ { "title": "마케튼 (Marketten)", "description": "...", ... }, ... ] | null
//                                                  // title로 매칭되는 row를 갱신 (title 자체를 바꾸는 것도 가능,
//                                                  // 이 경우 매칭은 원래 title로 하고 새 title은 필드 안에 포함)
// }

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf-8')
  const get = (key) => {
    const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'))
    return match ? match[1].trim() : undefined
  }
  return {
    url: get('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: get('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    adminEmail: get('ADMIN_EMAIL'),
    adminPassword: get('ADMIN_PASSWORD'),
  }
}

async function main() {
  const payloadPath = process.argv[2]
  if (!payloadPath) {
    console.error('사용법: node scripts/db-update.mjs <payload.json>')
    process.exit(1)
  }

  const { url, anonKey, adminEmail, adminPassword } = loadEnv()
  if (!url || !anonKey || !adminEmail || !adminPassword) {
    console.error('환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / ADMIN_EMAIL / ADMIN_PASSWORD 를 .env.local에 채워주세요.')
    process.exit(1)
  }

  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf-8'))
  const supabase = createClient(url, anonKey)

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  })
  if (signInError) {
    console.error('로그인 실패:', signInError.message)
    process.exit(1)
  }
  console.log('✔ 관리자 로그인 성공')

  if (payload.profile) {
    const { error } = await supabase.from('profile').update(payload.profile).eq('id', 1)
    if (error) {
      console.error('profile 업데이트 실패:', error.message)
      process.exit(1)
    }
    console.log('✔ profile 업데이트 완료')
  }

  if (payload.projects) {
    for (const entry of payload.projects) {
      const { matchTitle, ...fields } = entry
      const title = matchTitle ?? fields.title
      const { error } = await supabase.from('projects').update(fields).eq('title', title)
      if (error) {
        console.error(`✗ projects 업데이트 실패 (${title}):`, error.message)
        process.exit(1)
      }
      console.log(`✔ projects 업데이트 완료: ${title}`)
    }
  }

  await supabase.auth.signOut()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
