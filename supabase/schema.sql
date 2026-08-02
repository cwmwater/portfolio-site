-- 방문 기록 테이블
create table if not exists visits (
  id uuid default gen_random_uuid() primary key,
  path text not null,
  ref text,               -- 지원 회사 구분용 (예: sanggong, hyundai). 직접 방문이면 null
  referrer text,           -- 브라우저가 보내는 이전 페이지 정보 (있으면)
  created_at timestamptz not null default now()
);

-- RLS 활성화
alter table visits enable row level security;

-- 누구나(비로그인 방문자) 방문 기록은 남길 수 있게 허용
create policy "anyone can insert visits"
  on visits for insert
  to anon
  with check (true);

-- 로그인한 본인(관리자)만 조회 가능
create policy "only authenticated can read visits"
  on visits for select
  to authenticated
  using (true);
