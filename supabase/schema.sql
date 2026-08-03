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
where not exists (select 1 from projects where title = '게임 AI 몬스터 행동 시스템');

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
  {"category":"경력","period":"2025.04~2025.10","title":"인공지능 트랜스포메이션을 위한 플랫폼 개발자 양성과정 수료"}
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
