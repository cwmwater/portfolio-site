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
drop policy if exists "anyone can insert visits" on visits;
create policy "anyone can insert visits"
  on visits for insert
  to anon
  with check (true);

-- 로그인한 본인(관리자)만 조회 가능
drop policy if exists "only authenticated can read visits" on visits;
create policy "only authenticated can read visits"
  on visits for select
  to authenticated
  using (true);

-- ===== 프로젝트 테이블 (관리자 페이지에서 값 추가/삭제) =====
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  period text,
  description text not null,
  tech_stack text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

drop policy if exists "public can read projects" on projects;
create policy "public can read projects"
  on projects for select
  to public
  using (true);

drop policy if exists "authenticated can manage projects" on projects;
create policy "authenticated can manage projects"
  on projects for all
  to authenticated
  using (true)
  with check (true);

grant select on projects to anon, authenticated;
grant insert, update, delete on projects to authenticated;

-- 프로젝트 미디어 (어드민에서 업로드, 이미지/영상 섞어서 여러 개 가능 — 순서대로 전환됨)
-- 형태: [{"type": "image" | "video", "url": "..."}, ...]
alter table projects add column if not exists media jsonb not null default '[]';

-- 프로젝트 관련 링크 (예: GitHub, 라이브 데모)
-- 형태: [{"label": "GitHub", "url": "..."}, ...]
alter table projects add column if not exists links jsonb not null default '[]';

-- 예전 단일 image_url / 배열 image_urls 컬럼을 쓰던 경우 media로 이관 후 제거
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'projects' and column_name = 'image_url'
  ) then
    update projects
    set media = jsonb_build_array(jsonb_build_object('type', 'image', 'url', image_url))
    where image_url is not null and jsonb_array_length(media) = 0;

    alter table projects drop column image_url;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'projects' and column_name = 'image_urls'
  ) then
    update projects
    set media = (
      select coalesce(jsonb_agg(jsonb_build_object('type', 'image', 'url', u)), '[]'::jsonb)
      from unnest(image_urls) as u
    )
    where jsonb_array_length(media) = 0 and coalesce(array_length(image_urls, 1), 0) > 0;

    alter table projects drop column image_urls;
  end if;
end $$;

-- 프로젝트 상세 페이지용 필드 (개요 / 구현 기능 / 트러블슈팅)
alter table projects add column if not exists team_size text;
alter table projects add column if not exists main_duty text;
alter table projects add column if not exists role text;
alter table projects add column if not exists features text[] not null default '{}';
-- 형태: [{"title": "...", "problem": "...", "solution": "..."}, ...]
alter table projects add column if not exists troubleshooting jsonb not null default '[]';

-- ===== 프로필 테이블 (자기소개 / 기술 스택 / 프로필 사진, 단일 행) =====
create table if not exists profile (
  id int primary key default 1,
  photo_url text,
  intro text not null default '',
  tech_stack text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint profile_singleton check (id = 1)
);

-- 연락처, 카테고리별 기술 스택, 이력(학력/자격증/경력/수상)
alter table profile add column if not exists phone text;
-- 형태: [{"category": "Frontend", "primary": ["React"], "learning": ["TypeScript"]}, ...]
alter table profile add column if not exists skill_categories jsonb not null default '[]';
-- 형태: [{"category": "학력", "period": "...", "title": "..."}, ...]
alter table profile add column if not exists resume_items jsonb not null default '[]';

-- 카테고리별 기술 스택으로 대체되어 더 이상 쓰지 않는 컬럼 제거
alter table profile drop column if exists tech_stack;

alter table profile enable row level security;

drop policy if exists "public can read profile" on profile;
create policy "public can read profile"
  on profile for select
  to public
  using (true);

drop policy if exists "authenticated can update profile" on profile;
create policy "authenticated can update profile"
  on profile for update
  to authenticated
  using (id = 1)
  with check (id = 1);

grant select on profile to anon, authenticated;
grant update on profile to authenticated;

insert into profile (id, intro)
values (1, '')
on conflict (id) do nothing;

-- ===== Storage: 프로필 사진 / 프로젝트 이미지 업로드용 버킷 =====
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;

drop policy if exists "public can read portfolio images" on storage.objects;
create policy "public can read portfolio images"
  on storage.objects for select
  to public
  using (bucket_id = 'portfolio-images');

drop policy if exists "authenticated can upload portfolio images" on storage.objects;
create policy "authenticated can upload portfolio images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio-images');

drop policy if exists "authenticated can update portfolio images" on storage.objects;
create policy "authenticated can update portfolio images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio-images');

drop policy if exists "authenticated can delete portfolio images" on storage.objects;
create policy "authenticated can delete portfolio images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio-images');

-- 기존에 하드코딩되어 있던 프로젝트 2개를 초기 데이터로 삽입 (이미 있으면 중복 방지)
insert into projects (title, period, description, tech_stack, sort_order)
select 'AI 연동 블로그 웹 서비스', '2025.09 – 2025.10',
  'GPT API를 활용해 블로그 마케팅 문구를 자동 생성하는 서비스. React → Spring → FastAPI 3계층 아키텍처를 설계하고, 단계별 글 생성 플로우와 OAuth2 소셜 로그인, 관리자 페이지를 구현했습니다.',
  array['React','Spring Boot','FastAPI','GPT API','OAuth2','MySQL'], 1
where not exists (select 1 from projects where title = 'AI 연동 블로그 웹 서비스');

insert into projects (title, period, description, tech_stack, sort_order)
select '게임 AI 몬스터 행동 시스템', '2025.08 – 2025.12',
  '스게노 퍼지 추론으로 몬스터 행동 로직을 설계하고, PyTorch LSTM으로 학습시킨 모델을 ONNX 변환 후 Unity 엔진에 통합한 게임 AI 시스템.',
  array['Python','PyTorch','LSTM','ONNX','Unity','C#'], 2
-- 이후 아래에서 '게임 AI 몬스터 행동 시스템 (전공 프로젝트)'로 rename되므로 두 제목 모두 확인 (재실행 시 중복 삽입 방지)
where not exists (
  select 1 from projects
  where title in ('게임 AI 몬스터 행동 시스템', '게임 AI 몬스터 행동 시스템 (전공 프로젝트)')
);

-- ===== 실제 콘텐츠 채우기 (자기소개 / 기술스택 / 이력 / 프로젝트 상세) =====
-- 주의: 이 블록은 이력서 내용을 한 번에 채워 넣기 위한 것입니다.
-- intro는 항상 덮어쓰지만, phone/skill_categories/resume_items와 프로젝트의 media/links는
-- 이미 값이 채워져 있으면(예: 어드민에서 직접 수정) 덮어쓰지 않도록 가드되어 있습니다.

update profile
set intro = 'React, Spring, FastAPI를 연동한 3계층 아키텍처를 직접 설계하고 구현한 풀스택 개발자입니다. 단순히 기능을 구현하는 데 그치지 않고, 서비스 전체 데이터 흐름을 이해하고 설계하는 것을 중요하게 생각합니다. GPT API 연동 블로그 서비스에서 백엔드 개발을 주도하며 AI 서비스 통합, OAuth2 기반 소셜 로그인 구축, 3계층 통신 구조 설계까지 직접 경험했습니다. 또한 게임 AI 프로젝트에서는 데이터 설계부터 RNN 모델 학습, Unity 엔진 통합까지 전체 파이프라인을 직접 구현하며 복잡한 시스템 간 연동 능력을 키웠습니다. Spring 백엔드를 중심으로 전문성을 발전시키면서, 프론트엔드와 AI 서비스까지 아우르는 풀스택 개발자로 성장하고 있습니다.'
where id = 1;

update profile
set phone = '010-3747-5289'
where id = 1 and phone is null;

update profile
set skill_categories = '[
  {"category":"Frontend","primary":["React","JavaScript"],"learning":["TypeScript","Next.js","WebSocket"]},
  {"category":"Backend","primary":["Spring Boot","Spring Framework","Spring Security","Spring Data JPA","REST API","FastAPI","Python"],"learning":[]},
  {"category":"Database","primary":["MySQL"],"learning":[]},
  {"category":"AI·ML","primary":["PyTorch","RNN (게임 AI 프로젝트)","GPT API 연동 (웹 프로젝트)"],"learning":[]},
  {"category":"Auth","primary":["OAuth2 (Google·Kakao·Naver)"],"learning":[]},
  {"category":"Language","primary":["Java","Python","JavaScript"],"learning":["TypeScript","C#"]},
  {"category":"Game Engine","primary":[],"learning":["Unity"]},
  {"category":"Tools","primary":["Git","Postman"],"learning":[]}
]'::jsonb
where id = 1 and jsonb_array_length(skill_categories) = 0;

update profile
set resume_items = '[
  {"category":"학력","period":"2020.03~2026.02","title":"중부대학교 게임소프트웨어학과 졸업"},
  {"category":"자격증","period":"2026.06","title":"정보처리기사 (최종합격)"},
  {"category":"수료","period":"2025.04~2025.10","title":"인공지능 트랜스포메이션을 위한 플랫폼 개발자 양성과정 수료"}
]'::jsonb
where id = 1 and jsonb_array_length(resume_items) = 0;

update projects
set
  team_size = '6명',
  role = 'Spring 백엔드 주도 / FastAPI·GPT API 연동 / React 프론트 일부 / Git 형상관리',
  tech_stack = array['React','Spring Boot','Spring Security','FastAPI','GPT API','MySQL','OAuth2','Postman'],
  description = 'GPT API를 활용해 블로그 마케팅 전문 글을 자동 생성하는 웹 서비스. React → Spring → FastAPI로 이어지는 3계층 아키텍처를 직접 설계하고, Google·Kakao·Naver 소셜 로그인 및 단계별 글 생성 플로우를 구현했습니다.',
  features = array[
    '게시글 CRUD 및 전체 데이터 흐름 설계',
    'FastAPI + GPT API 연동 블로그 글 자동 생성',
    '단계별 글 생성 페이지 (1단계 → 2단계 → 3단계, 단계별 데이터 유지)',
    'Google·Kakao·Naver OAuth2 소셜 로그인 및 동일 이메일 계정 통합',
    'React ↔ Spring ↔ FastAPI 3계층 통신 구조 설계',
    'Git 브랜치 전략 및 형상관리'
  ],
  troubleshooting = '[
    {"title":"FastAPI ↔ Spring 데이터 규격 통일","problem":"두 프레임워크 간 JSON 필드명·데이터 타입이 달라 통신 오류 발생","solution":"API 명세를 문서화하고 양쪽 요청·응답 구조를 통일된 규격으로 재설계, Postman으로 사전 검증"},
    {"title":"React ↔ Spring 데이터 연동 검증","problem":"Spring API 연동 시 React 화면에 데이터가 정상 출력되지 않는 케이스 발생","solution":"API 응답 구조와 React 상태 관리 흐름을 단계별로 확인하며 출력까지 전 구간 검증"},
    {"title":"글 생성 데이터 테이블 설계 간략화","problem":"초기 설계가 지나치게 세분화되어 구현 복잡도가 높아짐","solution":"임시 저장 / 최종 저장 2개 테이블로 간략화하여 개발 속도와 유지보수성을 동시에 확보"},
    {"title":"AI 블로그 글 생성 — 단계별 페이지 설계","problem":"글 생성 과정을 1→2→3단계 페이지로 분리한 구조에서, 페이지 이동 시 이전 단계 입력 데이터가 초기화되는 문제 발생","solution":"각 단계의 데이터를 절차적으로 관리하는 상태 흐름을 설계하여, 단계 이동 후에도 데이터가 유지되도록 구현"},
    {"title":"소셜 로그인 계정 통합 처리","problem":"SSO 미사용 환경에서 동일 사용자가 플랫폼별로 중복 계정 생성되는 문제","solution":"동일 이메일이면 플랫폼에 관계없이 DB에 단일 레코드로 저장되도록 로직 설계, 하나의 계정으로 여러 소셜 로그인 이용 가능하게 구현"},
    {"title":"Git 브랜치 전략 개선","problem":"초기에 Test → Main으로 직접 머지하는 단순한 구조로 운영했으나, 배포 전 검증 단계 없이 Main에 바로 반영되어 안정성이 떨어지는 문제 발생","solution":"Release 브랜치를 도입하여 Test → Release → Main 흐름으로 개선. 배포 전 QA 단계를 분리함으로써 Main 브랜치의 안정성을 확보"}
  ]'::jsonb
where title = 'AI 연동 블로그 웹 서비스';

update projects
set media = '[{"type":"youtube","url":"https://youtu.be/c47sxZk141s"}]'::jsonb
where title = 'AI 연동 블로그 웹 서비스' and jsonb_array_length(media) = 0;

update projects
set links = '[
  {"label":"GitHub (FastAPI)","url":"https://github.com/cwmwater/mkt-module/tree/master/app"},
  {"label":"GitHub (백엔드)","url":"https://github.com/cwmwater/Marketten"},
  {"label":"GitHub (프론트엔드)","url":"https://github.com/cwmwater/Marketten-React"},
  {"label":"ERD 보기","url":"https://www.erdcloud.com/d/Pjc643rr7YTNFxQLu"}
]'::jsonb
where title = 'AI 연동 블로그 웹 서비스' and jsonb_array_length(links) = 0;

update projects
set
  role = '보스 몬스터 AI 시스템 설계 / 스게노 퍼지 추론 설계 / 데이터 정규화 / LSTM 모델 학습 / Unity 통합',
  tech_stack = array['Python','PyTorch','LSTM','ONNX','Unity','C#'],
  description = '스게노 퍼지 추론으로 몬스터 행동 로직을 설계하고, 정규화된 CSV 데이터를 PyTorch LSTM으로 학습시켜 ONNX 변환 후 Unity 엔진에 통합한 게임 AI 시스템. 보스 몬스터 AI는 QueenBeeAI를 중심으로 한 다중 클래스 구조로 별도 설계했습니다.',
  features = array[
    '스게노 퍼지 추론 설계 (Input: Health·Distance → 퍼지 규칙 → Output: Idle·Approach·Combat·Berserk)',
    'CSV 학습 데이터 구성 (Label: 행동 상태 5종 / Feature: Distance·Angle·MonsterHealth·PlayerHealth·ElementRelationCode·Pollution)',
    '데이터 정규화를 통한 학습 오류 최소화',
    'PyTorch LSTM 모델 학습 및 ONNX 변환 후 Unity Inference Engine 탑재',
    'QueenBeeAI 중심의 보스 몬스터 다중 클래스 구조 설계 (BossPhaseSystem·BossAttackPattern·BossHoneyComb·BossWorkBeeAI 연동)'
  ],
  troubleshooting = '[
    {"title":"몬스터 AI 학습 데이터 설계 및 정규화","problem":"몬스터 행동에 필요한 속성 정의가 불명확해 LSTM 학습 오류 발생","solution":"필요 속성을 체계적으로 나열하고 데이터 정규화를 적용하여 학습 안정성 확보"},
    {"title":"PyTorch ↔ Unity 입출력 구조 통합","problem":"PyTorch LSTM 모델의 입출력 형식과 Unity Inference Engine의 데이터 처리 구조가 맞지 않아 연동 오류 발생","solution":"ONNX 변환 후 입출력 구조를 Unity 연동 규격에 맞게 재설계하여 정상 동작 확인"}
  ]'::jsonb
where title = '게임 AI 몬스터 행동 시스템';

-- ===== 프로젝트 상세 내용 보강 (주요 업무 / 담당 역할 재정리 + 신규 프로젝트 추가) =====

-- 게임 AI 프로젝트는 전공 프로젝트임을 제목에 명시 (이후 statement는 새 제목으로 매칭)
update projects
set title = '게임 AI 몬스터 행동 시스템 (전공 프로젝트)'
where title = '게임 AI 몬스터 행동 시스템';

update projects
set
  main_duty = '백엔드 담당',
  role = 'Spring 백엔드 아키텍처 설계, FastAPI·GPT API 연동, OAuth2 소셜 로그인 구현, 화면 설계 및 프론트엔드 일부 구현, Git 형상관리',
  tech_stack = array['React','Spring Boot','Spring Security','FastAPI','Python','MySQL','OAuth2(Google·Kakao·Naver)','Git','Postman'],
  description = 'React·Spring Boot·FastAPI로 이어지는 3계층 아키텍처를 설계하고, GPT API를 연동해 블로그 마케팅 문구를 자동 생성하는 서비스를 개발했습니다.',
  features = array[
    '게시글 CRUD 및 전체 데이터 흐름 설계',
    'FastAPI + GPT API 연동 블로그 글 자동 생성',
    '단계별 글 생성 페이지 (1단계 → 2단계 → 3단계, 단계별 데이터 유지)',
    'Google·Kakao·Naver OAuth2 소셜 로그인 및 동일 이메일 계정 통합',
    'React ↔ Spring ↔ FastAPI 3계층 통신 구조 설계',
    'Git 브랜치 전략 및 형상관리',
    '글 보관함 기능',
    '관리자 권한 부여 기능',
    '사용자별 글 생성 수 통계 페이지'
  ],
  troubleshooting = '[
    {"title":"FastAPI ↔ Spring 데이터 규격 통일","problem":"두 프레임워크 간 JSON 필드명·데이터 타입이 달라 통신 오류 발생","solution":"API 명세를 문서화하고 DTO 계층을 재설계해 양쪽 요청·응답 구조를 통일된 규격으로 맞추고, Postman으로 사전 검증"},
    {"title":"React ↔ Spring 데이터 연동 검증","problem":"Spring API 연동 시 React 화면에 데이터가 정상 출력되지 않는 케이스 발생","solution":"API 응답 구조와 React 상태 관리 흐름을 단계별로 확인하며 출력까지 전 구간 검증"},
    {"title":"글 생성 데이터 테이블 설계 간략화","problem":"초기 설계가 지나치게 세분화되어 구현 복잡도가 높아짐","solution":"임시 저장 / 최종 저장 2개 테이블로 간략화하여 개발 속도와 유지보수성을 동시에 확보"},
    {"title":"AI 블로그 글 생성 — 단계별 페이지 설계","problem":"글 생성 과정을 1→2→3단계 페이지로 분리한 구조에서, 페이지 이동 시 이전 단계 입력 데이터가 초기화되는 문제 발생","solution":"각 단계의 데이터를 절차적으로 관리하는 상태 흐름을 설계하여, 단계 이동 후에도 데이터가 유지되도록 구현"},
    {"title":"소셜 로그인 계정 통합 처리","problem":"SSO 미사용 환경에서 동일 사용자가 플랫폼별로 중복 계정 생성되는 문제","solution":"동일 이메일이면 플랫폼에 관계없이 DB에 단일 레코드로 저장되도록 로직 설계, 하나의 계정으로 여러 소셜 로그인 이용 가능하게 구현"},
    {"title":"Git 브랜치 전략 개선","problem":"초기에 Test → Main으로 직접 머지하는 단순한 구조로 운영했으나, 배포 전 검증 단계 없이 Main에 바로 반영되어 안정성이 떨어지는 문제 발생","solution":"Release 브랜치를 도입하여 Test → Release → Main 흐름으로 개선. 배포 전 QA 단계를 분리함으로써 Main 브랜치의 안정성을 확보"}
  ]'::jsonb
where title = 'AI 연동 블로그 웹 서비스';

update projects
set
  team_size = '2명',
  main_duty = 'AI 로직 설계 및 모델 개발',
  role = '스게노 퍼지 추론 설계, 데이터 정규화, LSTM 모델 학습, ONNX 변환, Unity 통합, 보스 몬스터 AI 클래스 구조 설계',
  tech_stack = array['Python','PyTorch','LSTM','ONNX','Unity','C#'],
  description = '스게노 퍼지 추론을 기반으로 몬스터 행동(Health·Distance 입력 → 행동 라벨 출력) 로직을 설계하고, 정규화된 데이터를 PyTorch LSTM 모델로 학습시켰습니다. 학습된 모델을 ONNX로 변환해 Unity 엔진에 통합했으며, QueenBeeAI를 중심으로 한 보스 몬스터 다중 클래스 구조를 설계했습니다.'
where title = '게임 AI 몬스터 행동 시스템 (전공 프로젝트)';

-- ===== About 섹션 신상정보 (생년월일 / 거주지역) =====
alter table profile add column if not exists birthdate text;
alter table profile add column if not exists location text;

-- 히어로 섹션 배경 이미지
alter table profile add column if not exists hero_image_url text;

update profile set birthdate = '01.03.22' where id = 1 and birthdate is null;
update profile set location = '경기도 고양시 덕양구' where id = 1 and location is null;

-- ===== 프로젝트 목록의 "주요 프로젝트만 보기" 필터용 플래그 =====
alter table projects add column if not exists is_featured boolean not null default true;

-- 신규 프로젝트: 클라우드 서버 기반 데이터 자동화 시스템
insert into projects (
  title, period, team_size, main_duty, role, description, tech_stack, features, sort_order
)
select
  '클라우드 서버 기반 데이터 자동화 시스템',
  '2026.03 – 2026.04',
  '1명',
  '서버 구축 및 자동화 프로그램 개발',
  'Oracle Cloud 서버 구축 및 운영, Python 자동화 로직 설계, 외부 API 연동, Discord Webhook 알림 시스템 구축',
  'Oracle Cloud 기반 Linux 서버 환경을 구축하고, 외부 API와 연동해 데이터를 주기적으로 수집·처리하는 Python 자동화 프로그램을 개발했습니다. Discord Webhook을 연동해 실행 결과와 주요 이벤트를 실시간으로 전달하는 알림 시스템을 구축했습니다.',
  array['Python','Linux','Oracle Cloud','MobaXterm','Discord Webhook','REST API'],
  array[
    'Oracle Cloud 기반 Linux 서버 환경 구축',
    '외부 API 연동 데이터 주기적 수집 및 조건별 자동 처리 프로그램 개발',
    'MobaXterm을 활용한 원격 서버 관리',
    'Discord Webhook 연동 실시간 알림 시스템 구축'
  ],
  3
where not exists (select 1 from projects where title = '클라우드 서버 기반 데이터 자동화 시스템');

-- ===== 콘텐츠 전면 개편: 포트폴리오 아티팩트("포트폴리오 최종 정리") 기준으로 교체 =====
-- 주의: 아래 블록은 가드 없이 무조건 덮어씁니다. 실행 시점 이후 admin에서 손댄 내용이 있으면
-- 다시 실행할 때 되돌아가니 주의하세요. 값 자체는 매번 동일해서 재실행 자체는 안전합니다.

update profile
set intro = 'React, Spring, FastAPI를 연동한 3계층 아키텍처를 직접 설계하고 구현한 풀스택 개발자입니다. 단순히 기능을 구현하는 데 그치지 않고, 서비스 전체 데이터 흐름을 이해하고 설계하는 것을 중요하게 생각합니다. 마케튼(Marketten) 프로젝트에서 GitHub 저장소 관리자로 6인 팀의 브랜치 통합을 총괄하며 AI 서비스 통합, OAuth2 기반 소셜 로그인 구축, 3계층 통신 구조 설계를 직접 경험했습니다. 또한 게임 AI 프로젝트에서는 데이터 설계부터 LSTM 모델 학습, Unity 엔진 통합까지 전체 파이프라인을 직접 구현하며 복잡한 시스템 간 연동 능력을 키웠습니다. Spring 백엔드를 중심으로 전문성을 발전시키면서, 프론트엔드와 AI 서비스까지 아우르는 풀스택 개발자로 성장하고 있습니다.'
where id = 1;

update profile
set skill_categories = '[
  {"category":"Language","primary":["Java","Python","JavaScript","C#"],"learning":[]},
  {"category":"Backend","primary":["Spring / Spring Boot","JPA","FastAPI"],"learning":[]},
  {"category":"Frontend","primary":["React"],"learning":[]},
  {"category":"Data / AI","primary":["PyTorch","LSTM","ONNX","Pandas","Sugeno Fuzzy / ANFIS"],"learning":[]},
  {"category":"Infra","primary":["MySQL","Redis","Git","Oracle Cloud","Linux"],"learning":["Docker"]},
  {"category":"Game","primary":["Unity"],"learning":[]}
]'::jsonb
where id = 1;

-- 마케튼 (Marketten) — 기존 'AI 연동 블로그 웹 서비스' 리브랜딩 + 내용 전면 교체
update projects
set
  title = '마케튼 (Marketten)',
  period = '2025.10',
  team_size = '6명',
  main_duty = 'GitHub 저장소 관리자 · 글 생성 플로우 · 소셜로그인 · FastAPI 연동 담당',
  role = 'GitHub 저장소 관리자로 6인 팀 브랜치 통합 총괄, 글 생성 플로우·OAuth2 소셜로그인 3사 통합·FastAPI 연동 설계, 관리자 페이지 프론트엔드 구현',
  description = '상품 정보만 입력하면 단계별로 마케팅 블로그 글을 생성해주는 웹 서비스. GitHub 저장소 관리자로서 6인 팀의 브랜치 통합을 총괄하고, 글 생성 플로우·소셜로그인·FastAPI 연동을 직접 설계',
  tech_stack = array['Spring Boot','JPA','MySQL','Redis','React','FastAPI','JWT','OAuth2'],
  features = array[
    'Git 형상관리 — 팀원 각자의 feature/* 브랜치를 직접 받아 통합, 충돌 없으면 release로 병합하고 충돌 발생 시 보류 후 담당자와 재조율, release 완성 시 test(integration/test)로 재검증 후 main 병합하는 단계적 프로세스 운영',
    '3계층 아키텍처 통합 — React ↔ Spring Boot ↔ FastAPI 구조에서, Spring의 FastApiClient가 RestTemplate으로 FastAPI를 동기 호출하고 {success, data, error} 공통 응답 포맷으로 성공/실패를 분기하도록 두 서버 간 계약을 맞춰 실제로 동작하게 연결',
    '단계별 글 생성 플로우 — 키워드 분석 → 본문 생성 → 제목 키워드 분석 → 제목 생성, 4단계 흐름을 하나의 액션 디스패처(TempPostUpdateServiceImpl.handleAction)로 처리. TempPost 엔티티(1:N KeywordList/TitleList)에 매 단계 입력값·생성 결과·현재 step을 저장해 중간 이탈 후에도 이어작업 가능하도록 설계, 완성 시 FinalPost로 전환. 프론트엔드 단계별 화면(1~3단계+완성)과 진행 상태 라벨링도 직접 설계',
    'OAuth2 소셜로그인 3사 통합 — Google/Naver/Kakao 응답 구조가 제각각(Kakao는 kakao_account.profile 안에 중첩, Naver는 response 키로 한 번 더 래핑)인 걸 OAuth2UserInfo 공통 인터페이스로 추상화하고 provider별 구현체로 분리, CustomOAuth2UserService에서 registrationId로 분기해 다형성으로 처리. JWT 발급/Redis 리프레시 토큰 저장은 팀원과 공동 작업 영역',
    '보관함(작성 글 목록) 기능 — 프론트엔드 전체(StoragePage.jsx — 정렬, 상세 페이지, 삭제, 진행 단계 라벨링)와 백엔드 최초 구현(GET /api/posts/user) 담당. 이후 팀원이 인증된 사용자 정보(@AuthenticationPrincipal) 기반으로 정리',
    '관리자 페이지 프론트엔드 — 회원 관리 매니저, 권한 변경 드롭다운 UI, 관리자 API 연동 레이어(adminApi.js) 구현. 대시보드 통계·유저 목록 등 백엔드 로직은 팀원 담당'
  ],
  troubleshooting = '[
    {"title":"FastAPI 연동 트러블슈팅","problem":"Postman으로 FastAPI 엔드포인트를 테스트하던 중 Spring이 보낸 JSON 값이 전달되지 않는 문제 발견","solution":"엔드포인트 파라미터가 Form(...)(form-urlencoded)으로 선언돼 있어 application/json 바디를 파싱 못 하던 것이 원인임을 진단, gpt_router.py 5개 엔드포인트를 모두 Body(...)로 명시해 해결"}
  ]'::jsonb,
  links = '[
    {"label":"Marketten","url":"https://github.com/cwmwater/Marketten"},
    {"label":"Marketten-React","url":"https://github.com/cwmwater/Marketten-React"},
    {"label":"mkt-module","url":"https://github.com/cwmwater/mkt-module"}
  ]'::jsonb
where title = 'AI 연동 블로그 웹 서비스';

-- 게임 AI 몬스터 행동 시스템 — 아티팩트에는 "(전공 프로젝트)" 접미사 없이 기재되어 있어 제목도 원복
update projects
set
  title = '게임 AI 몬스터 행동 시스템',
  team_size = '3명',
  main_duty = '몬스터/보스 AI 전담',
  role = '몬스터/보스 AI 전담 — 계층형 퍼지 상태머신(HFSM) 설계, ANFIS 계수 최적화, 모방학습 파이프라인 구축, LSTM 학습·ONNX 변환, 보스 몬스터 페이즈 시스템 설계',
  description = 'Sugeno 퍼지 추론으로 몬스터 행동을 설계하고, 그 판단 데이터를 LSTM에 모방학습시켜 ONNX로 Unity에 재탑재한 게임 AI 파이프라인',
  tech_stack = array['Python','PyTorch','C#','Unity','ONNX'],
  features = array[
    '계층형 퍼지 상태머신(HFSM) — Health를 low/medium/high, Distance를 near/medium/far로 퍼지화하고 규칙별 선형 후건부(z = p·health_norm + q·distance_norm + r)로 Sugeno 가중평균 계산, 상위 상태(Idle/Approach/Combat/Berserk) 결정 후 거리 기준 하위 상태를 고르는 2단계 구조(TopLevelFFSM). ANFIS로 계수(p, q, r)를 최적화해 정확도 89.83% 달성 — MeleeAI/RangeAI/SlowAI/WorkBeeAI/MiddleBossAI 등 9개 이상 몬스터 클래스가 공유하는 실제 프로덕션 로직',
    '모방학습(imitation learning) 파이프라인 — 퍼지 시스템이 실제 플레이 중 만들어낸 (거리·각도·체력·속성관계·오염도 → 행동) 데이터를 매 프레임 정규화해 CSV로 기록 → (x,y) 벡터를 극좌표(sin/cos/거리)로 변환해 각도 불연속 문제 해결 → PyTorch 2-layer LSTM(32→16 hidden, Dropout 0.5) 학습 → torch.onnx.export(opset 11)로 변환 → Unity Inference Engine이 0.1초 간격으로 실시간 추론, softmax로 행동 확률 계산',
    '데이터 전처리 튜닝 — DataProcessor 클래스 골격은 수업 제공 베이스 코드, 게임 데이터에 맞춘 튜닝(불필요 컬럼 제거, 3D 유클리드 거리 정규화, 시퀀스 윈도잉 stride=100으로 과적합 방지)은 직접 작업',
    '보스 몬스터 페이즈 시스템 — 체력 기준 3페이즈 × 4가지 공격 패턴(수비/균형/공격/광폭) 조합, C# 이벤트로 페이즈 전환 통지, 여왕벌(QueenBeeAI)이 일벌 부대를 커맨드하는 구조로 설계'
  ],
  troubleshooting = '[
    {"title":"LSTM 학습 데이터 정의 불명확","problem":"몬스터 행동에 필요한 속성 정의가 불명확해 LSTM 학습 오류 발생","solution":"속성을 체계적으로 나열하고 정규화를 적용해 학습 안정성 확보"},
    {"title":"PyTorch ↔ Unity 입출력 구조 불일치","problem":"PyTorch와 Unity Inference Engine 간 입출력 데이터 구조가 맞지 않아 연동 오류 발생","solution":"ONNX 변환 후 입출력 구조를 Unity 규격(TensorShape)에 맞게 재설계"}
  ]'::jsonb,
  links = '[
    {"label":"monster-ai-behavior","url":"https://github.com/cwmwater/monster-ai-behavior"},
    {"label":"monster-ai-unity","url":"https://github.com/cwmwater/monster-ai-unity"}
  ]'::jsonb
where title = '게임 AI 몬스터 행동 시스템 (전공 프로젝트)';

-- 클라우드 서버 기반 데이터 자동화 시스템 (트레이딩 봇)
update projects
set
  main_duty = '전략 설계부터 서버 운영, 장애 복구까지 1인 진행',
  description = 'Oracle Cloud 무료 인스턴스에서 상시 실행되는 멀티코인 자동매매 봇. 전략 설계부터 서버 운영, 장애 복구까지 1인 진행',
  tech_stack = array['Python','Oracle Cloud','Linux','Discord Webhook','REST API'],
  features = array[
    '다중 조건 매매 전략 — MA10/30 골든크로스 또는 추세유지 + ADX>25(상승중) + RSI<60 + 거래량 필터(20봉 평균×1.3) + 4시간봉 상위 타임프레임 필터. 여러 버전(v2~v4)을 백테스트하며 파라미터를 실험적으로 조정해 가장 안정적인 조합을 채택',
    '리스크 관리 — ATR×1.5 손절(최대 −3% 캡) / ATR×3.5 익절(손익비 목표 1:2.3) / 트레일링스탑(+2% 활성화, 최고가 대비 −2% 청산), 종목별 보유 자산을 슬롯 수로 나눠 배분하는 멀티 포지션 구조',
    '패턴 감지·신호 스코어링 — 골든/데드크로스, ADX 강도, RSI 과매수/과매도, 볼린저밴드 이탈/지지, 거래량 급증 등 11가지 패턴을 감지해 0~100점 신호 스코어로 환산, 규칙 기반 시황 코멘트를 자동 생성해 Discord embed로 전송',
    '장애 복구 로직 — 재시작 시 positions.json이 없거나 깨져도 실제 거래소 잔고를 스캔(평균매수가 조회 포함)해 포지션을 자동 복구, 매 실행마다 잔고 드리프트를 동기화(sync_positions). 상태 파일은 임시파일 작성 후 os.replace로 원자적 저장',
    'API 안정성·인증 — 현재가 일괄 조회 방식으로 요청 횟수 절감 / 업비트 REST API는 JWT(SHA512 쿼리 해시 서명) 기반 인증 / fcntl 프로세스 락으로 동일 봇 중복 실행 방지'
  ],
  troubleshooting = '[
    {"title":"포지션 상태 동기화 문제","problem":"초기엔 매매가 체결돼도 로컬 상태 파일에 반영이 안 돼 직접 수정해야 하는 불편함이 있었음","solution":"재시작 시 거래소 잔고를 스캔해 포지션을 자동 복구하고 매 실행마다 잔고 드리프트를 동기화하도록 개선"},
    {"title":"API 요청 빈도 이슈","problem":"종목별 개별 조회 시 요청이 잦아 연결이 끊기는 문제 발생","solution":"현재가 일괄 조회 방식으로 변경해 요청 횟수 절감"}
  ]'::jsonb,
  links = '[
    {"label":"btc-cloud-trader (private)","url":"https://github.com/cwmwater/btc-cloud-trader"}
  ]'::jsonb
where title = '클라우드 서버 기반 데이터 자동화 시스템';
