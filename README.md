# 포트폴리오 사이트

Next.js + Supabase 기반 개인 포트폴리오. 방문 경로(ref)별 통계를 관리자 페이지에서 확인 가능.

## 1. Supabase 설정
1. https://supabase.com 에서 새 프로젝트 생성 (무료 티어)
2. 프로젝트 대시보드 → SQL Editor → `supabase/schema.sql` 내용 실행
3. 프로젝트 대시보드 → Authentication → Users → 본인 계정 1개 직접 추가 (이메일/비밀번호) — 이 계정으로 관리자 페이지 로그인
4. 프로젝트 대시보드 → Settings → API 에서 `Project URL`, `anon public key` 확인

## 2. 로컬 실행
```bash
npm install
cp .env.local.example .env.local
# .env.local에 위에서 확인한 Supabase URL/키 입력
npm run dev
```
http://localhost:3000 에서 확인, http://localhost:3000/admin 에서 관리자 로그인

## 3. 배포 (Vercel, 무료)
1. GitHub 저장소 생성 후 push (`.env.local`은 gitignore 되어 있어 안 올라감)
2. https://vercel.com 에서 GitHub 저장소 Import
3. 배포 시 Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록
4. 배포 완료 후 나오는 도메인이 실제 포트폴리오 주소

## 4. 회사별 방문 추적 사용법
지원서 제출 시 링크에 `?ref=회사이름`을 붙여서 제출
```
https://내도메인.vercel.app/?ref=sanggong
```
`/admin` 페이지에서 로그인하면 어떤 ref로 몇 번 방문했는지 확인 가능
