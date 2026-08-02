# 프로젝트: 개인 포트폴리오 사이트

## 아키텍처
Next.js(App Router, TypeScript) + Supabase(Auth/DB, PostgreSQL). 서버 별도 없음, Vercel 배포.
DB 타입은 lib/types.ts에서 관리, `any` 사용 지양.

## 원칙
1. 애매하면 추측하지 말고 물어볼 것 (예: 디자인, 문구 톤)
2. 필요한 최소한의 코드만. 불필요한 추상화/라이브러리 추가 금지
3. 요청받은 파일/라인만 수정. 관련 없는 코드·주석·포맷 건드리지 않기
4. "완료"는 실제로 로컬에서 동작 확인 후에만 선언

## 구조
- app/ : 페이지 (App Router)
- components/ : 클라이언트 컴포넌트
- lib/supabaseClient.js : Supabase 클라이언트 (환경변수 참조)
- supabase/schema.sql : DB 스키마 (레이지 로딩 — 필요할 때만 참조)

## 보안
- 키는 반드시 .env.local, 절대 커밋 금지 (.gitignore 확인)
- anon key는 public이어도 되지만, RLS 정책으로 insert/select 권한 반드시 분리
