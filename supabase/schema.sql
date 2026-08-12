-- ============================================================
-- 포트폴리오 사이트 DB 스키마
-- 이 파일은 스키마 정의 + 현재 콘텐츠 시드로 구성되어 있습니다.
-- 전체를 다시 실행해도 안전합니다 (테이블/컬럼/정책은 idempotent,
-- 콘텐츠는 upsert라 항상 아래 값으로 맞춰집니다).
-- 콘텐츠를 바꿀 땐 이 파일의 값 자체를 수정한 뒤 재실행하세요.
-- ============================================================

-- ===== 방문 기록 테이블 =====
create table if not exists visits (
  id uuid default gen_random_uuid() primary key,
  path text not null,
  ref text,               -- 지원 회사 구분용 (예: sanggong, hyundai). 직접 방문이면 null
  referrer text,          -- 브라우저가 보내는 이전 페이지 정보 (있으면)
  created_at timestamptz not null default now()
);

alter table visits enable row level security;

drop policy if exists "anyone can insert visits" on visits;
create policy "anyone can insert visits"
  on visits for insert
  to anon
  with check (true);

drop policy if exists "only authenticated can read visits" on visits;
create policy "only authenticated can read visits"
  on visits for select
  to authenticated
  using (true);

-- ===== 프로젝트 테이블 =====
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  period text,
  description text not null,
  tech_stack text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  -- 미디어: [{"type": "image"|"video"|"youtube", "url": "..."}, ...]
  media jsonb not null default '[]',
  -- 링크: [{"label": "GitHub", "url": "..."}, ...]
  links jsonb not null default '[]',
  team_size text,
  main_duty text,
  role text,
  features text[] not null default '{}',
  -- 트러블슈팅: [{"title": "...", "problem": "...", "solution": "..."}, ...]
  troubleshooting jsonb not null default '[]',
  is_featured boolean not null default true,
  background text, -- 왜 만들었는지
  meaning text,     -- 무엇을 배웠는지
  -- 카드 미리보기용 짧은 bullet (상세 features와 별개, 3~4개)
  highlights text[] not null default '{}',
  -- 특정 구현 기능(features[N])에 딸린 이미지. 상세 페이지에서 해당 기능 옆 아이콘 클릭 시 노출
  -- 형태: [{"feature_index": 0, "image_url": "...", "caption": "..."}, ...]
  feature_media jsonb not null default '[]'
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

-- 이미 테이블이 있던 기존 DB에도 새 컬럼이 반영되도록 (create table if not exists는
-- 테이블이 이미 있으면 컬럼 정의를 무시하므로, 신규 컬럼은 항상 여기 alter로도 추가)
alter table projects add column if not exists feature_media jsonb not null default '[]';

-- title 유일성 보장 (콘텐츠 upsert 시 중복 로우 생성 방지)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'projects_title_key') then
    alter table projects add constraint projects_title_key unique (title);
  end if;
end $$;

-- ===== 프로필 테이블 (자기소개 / 기술 스택 / 프로필 사진, 단일 행) =====
create table if not exists profile (
  id int primary key default 1,
  photo_url text,
  hero_image_url text,
  intro text not null default '',
  phone text,
  -- 형태: [{"category": "Backend", "primary": ["Spring"], "learning": ["Docker"]}, ...]
  skill_categories jsonb not null default '[]',
  -- 형태: [{"category": "학력", "period": "...", "title": "..."}, ...]
  resume_items jsonb not null default '[]',
  birthdate text,
  location text,
  updated_at timestamptz not null default now(),
  constraint profile_singleton check (id = 1)
);

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

-- ============================================================
-- 콘텐츠 (현재 값 기준 — upsert라 재실행해도 항상 이 값으로 맞춰짐)
-- ============================================================

insert into profile (id, photo_url, hero_image_url, intro, phone, skill_categories, resume_items, birthdate, location)
values (
  1,
  'https://pansfwryctxokvmssywb.supabase.co/storage/v1/object/public/portfolio-images/profile/1786066801692.jpeg',
  'https://pansfwryctxokvmssywb.supabase.co/storage/v1/object/public/portfolio-images/hero/1785917777642.jpg',
  'React, Spring, FastAPI를 연동한 3계층 아키텍처를 직접 설계하고 구현한 풀스택 개발자입니다. 단순히 기능을 구현하는 데 그치지 않고, 서비스 전체 데이터 흐름을 이해하고 설계하는 것을 중요하게 생각합니다. 마케튼(Marketten) 프로젝트에서 GitHub 저장소 관리자로 6인 팀의 브랜치 통합을 총괄하며 AI 서비스 통합, OAuth2 기반 소셜 로그인 구축, 3계층 통신 구조 설계를 직접 경험했습니다. 또한 게임 AI 프로젝트에서는 데이터 설계부터 LSTM 모델 학습, Unity 엔진 통합까지 전체 파이프라인을 직접 구현하며 복잡한 시스템 간 연동 능력을 키웠습니다. Spring 백엔드를 중심으로 전문성을 발전시키면서, 프론트엔드와 AI 서비스까지 아우르는 풀스택 개발자로 성장하고 있습니다.',
  '010-3747-5289',
  '[{"primary":["Java","Python","JavaScript","C#"],"category":"Language","learning":[]},{"primary":["Spring / Spring Boot","JPA","FastAPI"],"category":"Backend","learning":[]},{"primary":["React"],"category":"Frontend","learning":[]},{"primary":["PyTorch","Pandas","RAG"],"category":"Data / AI","learning":[]},{"primary":["MySQL","Redis","Git","Docker","Oracle Cloud","Linux","AWS"],"category":"Infra","learning":[]},{"primary":["Unity"],"category":"Game","learning":[]}]'::jsonb,
  '[{"title":"중부대학교 게임소프트웨어학과 졸업 (4년제 학사 학위)","period":"2020.03~2026.02","category":"학력"},{"title":"정보처리기사 (최종합격)","period":"2026.06","category":"자격증"},{"title":"에이치 아카데미 · 인공지능 트랜스포메이션을 위한 플랫폼 개발자 양성과정 수료","period":"2025.04~2025.10","category":"수료"}]'::jsonb,
  '2001.03.22',
  '경기도 고양시 덕양구'
)
on conflict (id) do update set
  photo_url = excluded.photo_url,
  hero_image_url = excluded.hero_image_url,
  intro = excluded.intro,
  phone = excluded.phone,
  skill_categories = excluded.skill_categories,
  resume_items = excluded.resume_items,
  birthdate = excluded.birthdate,
  location = excluded.location;

insert into projects (
  title, period, description, tech_stack, sort_order, media, links,
  team_size, main_duty, role, features, troubleshooting, is_featured, background, meaning, highlights, feature_media
)
values (
  '마케튼 (Marketten)',
  '2025.10 – 진행 중',
  '상품 정보만 입력하면 단계별로 마케팅 블로그 글을 생성해주는 웹 서비스',
  array['Spring Boot', 'JPA', 'MySQL', 'Redis', 'React', 'FastAPI', 'JWT', 'OAuth2', 'Docker', 'Docker Compose', 'GitHub Actions', 'Oracle Cloud VPS', 'RAG', 'nginx', 'Let''s Encrypt'],
  1,
  '[{"url":"https://youtu.be/c47sxZk141s","type":"youtube"}]'::jsonb,
  '[{"url":"https://github.com/cwmwater/Marketten","label":"Marketten"},{"url":"https://github.com/cwmwater/Marketten-React","label":"Marketten-React"},{"url":"https://github.com/cwmwater/mkt-module","label":"mkt-module"},{"url":"https://marketten.site","label":"marketten.site (배포)"}]'::jsonb,
  '6명',
  'GitHub 저장소 관리자 · 글 생성 플로우 · 소셜로그인 · FastAPI 연동 · 인프라(Docker/CI-CD/RAG/nginx) 담당',
  'GitHub 저장소 관리자로 6인 팀 브랜치 통합 총괄, 글 생성 플로우·OAuth2 소셜로그인 3사 통합·FastAPI 연동 설계. 이후 Docker 컨테이너화·GitHub Actions CI/CD·RAG 구조 설계·nginx/HTTPS 배포는 개인적으로 이어서 진행',
  array['3계층 아키텍처 통합 — React ↔ Spring Boot ↔ FastAPI 구조에서, Spring이 FastAPI를 동기 호출하는 전용 클라이언트 구현. {success, data, error} 공통 응답 형식으로 성공/실패를 구분하도록 두 서버 간 통신 규칙을 맞춰 실제로 연동.', '단계별 글 생성 플로우 — 키워드 분석 → 본문 생성 → 제목 키워드 분석 → 제목 생성, 4단계 흐름을 하나의 로직에서 단계별로 나눠 처리. 임시 저장 테이블에 매 단계 입력값·생성 결과·현재 단계를 저장해 중간에 나갔다 와도 이어서 작업할 수 있도록 설계. 완성되면 최종 게시물로 전환. 프론트엔드 단계별 화면(1~3단계+완성)과 진행 상태 표시도 직접 설계.', 'OAuth2 소셜로그인 3사 통합 — Google/Naver/Kakao 응답 구조가 제각각(Kakao는 프로필 정보가 한 번 더 중첩되고, Naver는 응답 값이 한 번 더 감싸진 구조)인 것을 공통 형태로 통일. 플랫폼별로 세부 처리만 따로 나눠서 처리하도록 설계. JWT 발급/Redis 리프레시 토큰 저장은 팀원과 공동 작업 영역.', 'Docker 컨테이너화 — Spring Boot/FastAPI/React 3개 서비스 전부 Dockerfile 직접 작성(FastAPI는 프로덕션 의존성만 분리, React는 멀티스테이지 빌드로 빌드 후 nginx로 서비스). MySQL/Redis 포함 docker-compose로 로컬 전체 스택을 한 번에 기동하도록 구성.', 'Oracle Cloud VPS 배포 — RAM 1GB의 완전 초기 상태 VPS(Ubuntu 24.04)에 Docker 설치. 2GB 스왑 설정, GitHub 컨테이너 레지스트리에 이미지 3개 푸시. 운영용 설정(JVM 힙 제한, 불필요 포트 비공개)으로 배포. 클라우드 방화벽과 서버 내부 방화벽 양쪽을 다 열어야 접속된다는 것까지 직접 확인.', 'GitHub Actions CI/CD — 3개 저장소 각각에 이미지 빌드→레지스트리 푸시→서버 배포까지 자동화하는 워크플로우 작성. 3개 저장소 모두 push 한 번으로 자동 배포되는 것까지 확인.', 'RAG(검색증강생성) 구조 설계 및 구현 — 톤(tone)마다 예문 하나만 고정으로 넣던 프롬프트 구조를, 요청 내용(상품 정보·키워드)과 의미적으로 가장 비슷한 예문을 자동으로 찾아 넣는 구조로 백엔드/AI 서버/프론트 전 구간 재설계. 별도 벡터DB 없이 OpenAI 임베딩 API + 코사인 유사도 계산만으로 경량 구현(1GB RAM VPS 제약 고려). 예문을 저장하는 테이블과 관리 API를 새로 만들고, 예문 등록 시 실시간으로 임베딩을 계산해 저장, 본문 생성 요청 시점에 저장된 임베딩들과 유사도를 비교해 가장 관련 있는 예문을 검색하도록 처리. 서로 다른 주제의 예문 3개로 검색 정확도를 검증 — 관련 있는 예문은 유사도 0.33, 무관한 예문은 0.19~0.24로 명확히 구분됨을 확인.', '도메인 + nginx 리버스 프록시 + HTTPS(Let''s Encrypt) — 도메인 구매 후 nginx를 프록시 계층으로 세워 API 요청은 백엔드로, 나머지는 프론트엔드로 라우팅하도록 재구성. 백엔드/프론트 포트 직접 노출 제거. Certbot으로 무료 SSL 인증서 발급, HTTP→HTTPS 자동 리다이렉트와 인증서 자동 갱신까지 무중단 구성.'],
  '[{"title":"FastAPI 연동 트러블슈팅","problem":"Postman으로 FastAPI 엔드포인트를 테스트하던 중 Spring이 보낸 JSON 값이 전달되지 않는 문제 발견","solution":"엔드포인트 파라미터가 Form 방식(form-urlencoded)으로 선언돼 있어 JSON 형식 데이터를 못 받아들이던 것이 원인임을 진단, 관련 엔드포인트 5개를 모두 JSON 바디를 받도록 수정해 해결"},{"title":"GHCR 이미지 푸시 권한 오류","problem":"GitHub Actions에서 빌드한 이미지를 이미지 레지스트리에 푸시할 때 계속 거부됨","solution":"저장소의 Actions 권한을 읽기 전용에서 읽기/쓰기로 바꾸고, 패키지 소유 계정 쪽 접근 권한도 함께 열어줘야 한다는 것을 단계적으로 원인을 좁혀가며 해결"},{"title":"배포 인프라 오류 3건","problem":"사용하던 베이스 이미지가 배포 저장소에서 삭제됨 / 환경변수 값 형식 오류로 디코딩 실패 / 프론트엔드 API 주소 설정 누락으로 인증 오류 발생","solution":"각각 대체 이미지 교체, 올바른 값으로 재설정, 누락된 설정값 추가로 해결"},{"title":"HTTPS 전환 후 Mixed Content 오류","problem":"HTTPS 전환 직후 브라우저가 보안 정책 위반으로 API 호출을 차단","solution":"프론트엔드가 빌드 시점에 저장해둔 API 주소가 예전 값이었던 것이 원인 — 새 주소 기준으로 다시 빌드해 해결"},{"title":"GitHub Actions 배포 실패 (Service Unavailable)","problem":"재배포 중 GitHub Actions가 일시적으로 실패","solution":"GitHub 쪽 일시 장애로 판단, 재실행으로 해결"}]'::jsonb,
  true,
  '국비 부트캠프(K-Digital Training) 6인 팀 프로젝트로 시작했습니다. 기존 블로그 자동 생성 서비스들을 살펴보니, 블로그·뉴스 글을 요약해서 짜깁기하는 수준에 그치는 경우가 많았습니다. 상품 정보와 실제 사용 경험을 반영해 브랜드 톤에 맞는 완성도 높은 마케팅 글을 만들 수 있는 서비스가 있으면 좋겠다고 생각해 이 프로젝트를 기획했습니다.',
  'Spring 백엔드, React 프론트, FastAPI 기반 AI 모듈을 동시에 연동하며 서비스 전체 구조를 처음부터 끝까지 파악하고 실제로 동작하게 만드는 경험을 했습니다. 서로 다른 서버끼리 데이터를 주고받는 방식을 하나씩 맞춰가는 과정에서, 각자 다른 프레임워크로 짠 코드가 실제로 하나의 서비스로 이어지는 것을 직접 확인하며 자신감을 얻었습니다.',
  array['상품 정보 기반 단계별 마케팅 글 자동 생성', '3계층 아키텍처(React ↔ Spring ↔ FastAPI) 설계', 'OAuth2 소셜로그인 3사 통합', 'RAG 기반 톤 맞춤 문구 생성 구조 설계'],
  '[
    {"feature_index":0,"image_url":"/diagrams/marketten-3tier.svg","caption":"React ↔ Spring Boot ↔ FastAPI 3계층 구조의 요청/응답 흐름과 Spring↔FastAPI 공통 응답 계약, 그리고 FastAPI를 별도로 둔 이유를 정리한 다이어그램입니다."},
    {"feature_index":1,"image_url":"/diagrams/marketten-flow.svg","caption":"키워드 분석 → 본문 생성 → 제목 키워드 분석 → 제목 생성 4단계 흐름과, 각 단계의 입력값·결과·현재 단계를 임시 저장 테이블에 남겨 중간 이탈 후에도 이어서 작업할 수 있도록 설계한 구조입니다."},
    {"feature_index":6,"image_url":"/diagrams/marketten-rag.svg","caption":"예문 등록 시 임베딩을 계산해 저장하고, 글 생성 요청 시 저장된 임베딩들과 코사인 유사도를 비교해 가장 관련 있는 예문을 찾는 전체 흐름과, 별도 벡터DB 없이 구현한 이유를 정리한 다이어그램입니다."}
  ]'::jsonb
)
on conflict (title) do update set
  period = excluded.period,
  description = excluded.description,
  tech_stack = excluded.tech_stack,
  sort_order = excluded.sort_order,
  media = excluded.media,
  links = excluded.links,
  team_size = excluded.team_size,
  main_duty = excluded.main_duty,
  role = excluded.role,
  features = excluded.features,
  troubleshooting = excluded.troubleshooting,
  is_featured = excluded.is_featured,
  background = excluded.background,
  meaning = excluded.meaning,
  feature_media = excluded.feature_media,
  highlights = excluded.highlights;

insert into projects (
  title, period, description, tech_stack, sort_order, media, links,
  team_size, main_duty, role, features, troubleshooting, is_featured, background, meaning, highlights, feature_media
)
values (
  '게임 AI 몬스터 행동 시스템',
  '2025.08 – 2025.12',
  'Sugeno 퍼지 추론으로 몬스터 행동을 설계 및 LSTM 모방학습을 통해 Unity에 탑재',
  array['Python', 'PyTorch', 'C#', 'Unity', 'ONNX'],
  2,
  '[]'::jsonb,
  '[{"url":"https://github.com/cwmwater/monster-ai-behavior","label":"monster-ai-behavior"},{"url":"https://github.com/cwmwater/monster-ai-unity","label":"monster-ai-unity"}]'::jsonb,
  '3명',
  '몬스터/보스 AI 전담',
  '몬스터/보스 AI 전담 — 계층형 퍼지 상태머신(HFSM) 설계, 모방학습 파이프라인 구축, LSTM 학습·ONNX 변환, 보스 몬스터 페이즈 시스템 설계',
  array['계층형 퍼지 상태머신(HFSM) — 체력과 거리를 각각 낮음/중간/높음, 가까움/중간/먼 3단계로 구분. 규칙별 계산식으로 점수를 매겨 가중평균을 내는 방식(Sugeno 퍼지 추론)으로 상위 상태(대기/접근/전투/광폭) 결정. 거리 기준으로 하위 상태를 고르는 2단계 구조로 설계. 근접형/원거리형/슬로우형/일벌형/중형 보스 등 9개 이상 몬스터 종류가 공유하는 실제 프로덕션 로직.', '모방학습(imitation learning) 파이프라인 — 퍼지 시스템이 실제 플레이 중 만들어낸 (거리·각도·체력·속성관계·오염도 → 행동) 데이터를 매 프레임 정규화해 기록 → 좌표를 회전각 기반 값으로 변환해 각도 계산의 불연속 문제를 해결 → PyTorch 2-layer LSTM(32→16 hidden, Dropout 0.5)으로 학습 → ONNX 형식으로 변환 → Unity에서 0.1초 간격으로 실시간 추론하며 확률 계산으로 행동을 결정', '데이터 전처리 튜닝 — 전처리 코드의 기본 틀은 수업 제공. 게임 데이터에 맞춘 튜닝(불필요한 열 제거, 3D 거리 값 정규화, 데이터를 일정 간격으로 나눠 과적합을 방지하는 처리)은 직접 작업.', '보스 몬스터 페이즈 시스템 — 체력 기준 3단계 페이즈 × 4가지 공격 패턴(수비/균형/공격/광폭) 조합. 페이즈가 바뀔 때마다 이벤트로 상태 변화를 알리는 방식으로 구현. 여왕벌이 일벌 부대를 지휘하는 구조로 설계.'],
  '[{"title":"LSTM 학습 데이터 정의 불명확","problem":"몬스터 행동에 필요한 속성 정의가 불명확해 LSTM 학습 오류 발생","solution":"속성을 체계적으로 나열하고 정규화를 적용해 학습 안정성 확보"},{"title":"PyTorch ↔ Unity 입출력 구조 불일치","problem":"PyTorch와 Unity 추론 엔진 간 입출력 데이터 구조가 맞지 않아 연동 오류 발생","solution":"ONNX 변환 후 입출력 구조를 Unity가 요구하는 형식에 맞게 재설계"}]'::jsonb,
  true,
  '전공 수업의 팀 프로젝트로, 교수님의 제안을 통해 퍼지 추론을 활용한 몬스터 행동 AI를 설계했습니다. 정해진 규칙에 따라 행동하는 1단계 프로젝트를 진행한 이후, 교수님께서 데이터를 학습해 상황에 따라 보다 능동적으로 판단하는 AI로 발전시켜보자는 방향을 제안하셨습니다. 이에 2단계에서는 LSTM을 추가 적용하여 시간에 따른 행동 패턴을 학습하고, 기존 규칙 기반 AI를 학습 기반 AI로 확장했습니다.',
  '퍼지 추론은 체력·거리와 같은 현재 상태를 그때그때 규칙에 대입해 행동을 결정하는 방식인 반면, LSTM은 시간에 따른 입력 데이터를 시퀀스로 구성하고 이전 상태와 현재 입력의 관계를 학습해 행동을 예측한다는 점에서 서로 다른 접근임을 체감했습니다. 또한 LSTM 학습 데이터를 구성하면서 라벨과 입력값을 CSV로 추출하고 정규화하는 과정을 직접 경험하며, 데이터의 형태와 스케일을 적절하게 맞추는 것이 학습 과정에 중요하다는 것을 배웠습니다. 특히 퍼지 추론에서는 사용하지 않았던 각도, 속성 간 관계, 오염도 등의 정보를 입력값에 추가하면서, AI의 판단에 필요한 데이터를 어떻게 정의하고 구성할 것인지도 고민하게 되었습니다.',
  array['계층형 퍼지 상태머신(HFSM) 설계', '모방학습 파이프라인 구축 (LSTM → ONNX → Unity)', '보스 몬스터 페이즈 시스템 설계'],
  '[
    {"feature_index":0,"image_url":"https://pansfwryctxokvmssywb.supabase.co/storage/v1/object/public/portfolio-images/projects/1785771445061.png","caption":"특정 입력값(체력 30, 거리 8)에서 퍼지 규칙들이 어떻게 평가되어 최종 행동으로 역퍼지화되는지 보여주는 실행 예시. Combat과 Berserk 규칙이 동시에 활성화되어 가중평균으로 최종 출력값(1.491)이 결정됩니다."},
    {"feature_index":1,"image_url":"https://pansfwryctxokvmssywb.supabase.co/storage/v1/object/public/portfolio-images/projects/1785771463765.png","caption":"퍼지 추론 결과를 라벨로 삼아 CSV 데이터를 만들고, 이 데이터로 LSTM을 학습시켜 ONNX로 변환한 뒤 Unity에 실시간 추론기로 탑재하기까지의 전체 파이프라인입니다."},
    {"feature_index":3,"image_url":"https://pansfwryctxokvmssywb.supabase.co/storage/v1/object/public/portfolio-images/projects/1785771466814.png","caption":"QueenBeeAI를 중심으로 페이즈 전환(BossPhaseSystem), 공격 패턴(BossAttackPattern), 일벌 유닛(BossWorkBeeAI), 벌집 스폰(BossHoneyComb)이 상호작용하는 보스 AI 클래스 구조입니다."}
  ]'::jsonb
)
on conflict (title) do update set
  period = excluded.period,
  description = excluded.description,
  tech_stack = excluded.tech_stack,
  sort_order = excluded.sort_order,
  media = excluded.media,
  links = excluded.links,
  team_size = excluded.team_size,
  main_duty = excluded.main_duty,
  role = excluded.role,
  features = excluded.features,
  troubleshooting = excluded.troubleshooting,
  is_featured = excluded.is_featured,
  background = excluded.background,
  meaning = excluded.meaning,
  highlights = excluded.highlights,
  feature_media = excluded.feature_media;

insert into projects (
  title, period, description, tech_stack, sort_order, media, links,
  team_size, main_duty, role, features, troubleshooting, is_featured, background, meaning, highlights
)
values (
  '클라우드 서버 기반 데이터 자동화 시스템',
  '2026.03 – 2026.04',
  'Oracle Cloud 무료 인스턴스에서 상시 실행 중인 개인용 멀티코인 자동매매 스크립트',
  array['Python', 'Oracle Cloud', 'Linux', 'Discord Webhook', 'REST API'],
  3,
  '[]'::jsonb,
  '[{"url":"https://github.com/cwmwater/btc-cloud-trader","label":"btc-cloud-trader (private)"}]'::jsonb,
  '1명',
  '전략 설계 · 자동화 스크립트 운영 · Discord 모니터링, 1인 진행',
  'Python 자동매매 로직 설계, Oracle Cloud 무료 인스턴스에 MobaXterm SSH로 접속해 스크립트를 상시 실행, Discord Webhook으로 매매 현황 모니터링',
  array['다중 조건 매매 전략 — 이동평균선 교차(MA10/30), 추세 강도(ADX>25), 과매수·과매도(RSI<60), 거래량, 상위 시간대(4시간봉) 흐름까지 여러 지표가 동시에 조건을 만족할 때만 진입. 여러 버전을 반복 실험하며 파라미터를 조정해 가장 안정적인 조합 채택.', '리스크 관리 — 변동성 지표(ATR) 기반으로 손절·익절 폭을 정하고, 수익이 난 뒤 고점 대비 일정 비율 이상 하락하면 자동 청산하는 트레일링스탑 적용. 종목별 보유 자산을 슬롯 수로 나눠 배분하는 멀티 포지션 구조로 운용.', '패턴 감지·신호 스코어링 — 이동평균선 교차, 추세 강도, 과매수·과매도, 변동성 밴드(볼린저밴드) 이탈, 거래량 급증 등 11가지 패턴을 감지해 0~100점 신호 스코어로 환산. 규칙 기반 시황 코멘트를 자동 생성해 Discord로 전송.'],
  '[{"title":"포지션 상태 동기화 문제","problem":"초기엔 매매가 체결돼도 로컬 상태 파일에 반영이 안 돼 직접 수정해야 하는 불편함이 있었음","solution":"재시작 시 거래소 잔고를 스캔해 포지션을 자동 복구하고, 매 실행마다 로컬 기록과 실제 잔고 차이를 맞추도록 개선"},{"title":"API 요청 빈도 이슈","problem":"종목별 개별 조회 시 요청이 잦아 연결이 끊기는 문제 발생","solution":"현재가 일괄 조회 방식으로 변경해 요청 횟수 절감"}]'::jsonb,
  true,
  '최근 자본을 어떻게 효과적으로 굴릴지, 재테크에 관심이 생겼습니다. 주식이나 비트코인 같은 시장을 자동화해서 고정적인 수익을 낼 수 있다면 좋겠다는 생각에서 이 프로젝트를 시작했습니다.',
  '투자 전략을 개인적으로 공부해보고 싶은 마음도 있었고, Oracle Cloud와 서버 운영 경험까지 쌓을 수 있어서 공부와 실전을 동시에 챙길 수 있는 프로젝트였습니다.',
  array['다중 조건 매매 전략 설계 및 반복 백테스트', 'ATR 기반 리스크 관리 (손절·익절·트레일링스탑)', '11가지 패턴 감지·신호 스코어링, Discord 알림']
)
on conflict (title) do update set
  period = excluded.period,
  description = excluded.description,
  tech_stack = excluded.tech_stack,
  sort_order = excluded.sort_order,
  media = excluded.media,
  links = excluded.links,
  team_size = excluded.team_size,
  main_duty = excluded.main_duty,
  role = excluded.role,
  features = excluded.features,
  troubleshooting = excluded.troubleshooting,
  is_featured = excluded.is_featured,
  background = excluded.background,
  meaning = excluded.meaning,
  highlights = excluded.highlights;
