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
  null,
  '[{"primary":["Java","Python","JavaScript","C#"],"category":"Language","learning":[]},{"primary":["Spring / Spring Boot","JPA","FastAPI","NestJS","Prisma","OAuth2"],"category":"Backend","learning":[]},{"primary":["React"],"category":"Frontend","learning":[]},{"primary":["PyTorch","Pandas","RAG"],"category":"Data / AI","learning":[]},{"primary":["MySQL","PostgreSQL","Redis","Git","Docker","CI/CD","Oracle Cloud","Linux","AWS"],"category":"Infra","learning":[]},{"primary":["Unity"],"category":"Game","learning":[]}]'::jsonb,
  '[{"title":"중부대학교 게임소프트웨어학과 학사","period":"2020.03~2026.02","category":"학력"},{"title":"정보처리기사","period":"2026.06","category":"자격증"},{"title":"H 아카데미 · 인공지능 트랜스포메이션을 위한 플랫폼 개발자 양성과정 수료","period":"2025.04~2025.10","category":"수료"}]'::jsonb,
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
  array['Spring Boot', 'JPA', 'MySQL', 'Redis', 'React', 'FastAPI', 'JWT', 'OAuth2', 'Docker', 'CI/CD', 'OCI', 'RAG'],
  2,
  '[]'::jsonb,
  '[{"url":"https://github.com/cwmwater/Marketten","label":"Marketten"},{"url":"https://github.com/cwmwater/Marketten-React","label":"Marketten-React"},{"url":"https://github.com/cwmwater/mkt-module","label":"mkt-module"},{"url":"https://marketten.site","label":"marketten.site (배포)"}]'::jsonb,
  '6명',
  'GitHub 저장소 관리자 · 글 생성 플로우 · 소셜로그인 · FastAPI 연동 · 인프라(Docker/CI-CD/RAG/nginx) 담당',
  '- 단계별 글 작성 및 이어쓰기 기능 구현
- Spring Boot와 FastAPI 간 AI 요청·응답 연동
- Google·Naver·Kakao 소셜 로그인 구현
- 관련 예문 검색 및 AI 생성 결과 반영
- Docker 실행 환경과 GitHub Actions 배포 자동화 구성
- nginx 리버스 프록시와 HTTPS 배포 환경 구성',
  array['RAG(검색증강생성) 구조 설계 및 구현 — 기존에는 톤(tone)별 예문 하나만 고정해서 AI에게 전달했지만, 상품 정보와 키워드에 의미가 가까운 예문을 자동으로 찾아 AI 글 생성에 반영하도록 개선. 예문 등록 시 실시간으로 임베딩을 계산해 저장, 본문 생성 요청 시점에 저장된 임베딩들과 유사도를 비교해 가장 관련 있는 예문을 검색하도록 처리. 별도 벡터DB 없이 OpenAI 임베딩(텍스트를 숫자 벡터로 변환) API + 코사인 유사도 계산만으로 경량 구현(1GB RAM VPS 제약 고려). 서로 다른 주제의 예문 3개를 대상으로 관련 예문은 유사도 0.33, 무관한 예문은 0.19~0.24로 구분되는 것을 확인해 검색 결과가 의도대로 동작하는지 검증.', 'React–Spring Boot–FastAPI 3계층 구조 설계 — React의 사용자 요청을 Spring Boot가 받아 필요한 데이터를 정리하고, FastAPI에 AI 생성을 요청한 뒤 결과를 다시 React 화면에 전달하는 3계층 구조 구성', '단계별 AI 생성 파이프라인 구축 — 주제 설정, 초안 생성, 글 복사의 3단계 흐름 중, 초안 생성 단계에서 본문 생성, 제목 키워드 분석, 제목 생성이 순서대로 진행되며 이전 결과를 다음 요청에 전달하도록 구현. 제목 키워드는 상품 정보가 아닌 에디터에서 편집 중인 본문 내용을 분석해 추출하고, 제목 생성은 이 키워드와 본문 내용을 함께 반영하도록 구성. 본문 생성은 소주제를 먼저 생성한 뒤 해당 내용을 본문 작성 요청에 포함해 구현. 각 단계의 AI 호출이 완료될 때마다 결과를 임시 저장글에 반영해, 생성 과정에서 중단되더라도 이전 단계의 결과를 유지할 수 있도록 구성.', 'Google·Naver·Kakao 소셜 로그인 구현 — Google·Naver·Kakao의 중첩된 사용자 정보 응답을 공통 인터페이스로 변환해 로그인 제공자별 차이 분리. 이메일을 기준으로 기존 계정을 확인해 중복 가입을 방지하고, 다른 소셜 로그인 방식을 기존 계정에 연결. 소셜 로그인 성공 후 일반 로그인과 동일한 토큰 발급 흐름으로 연결하고, 재발급용 토큰은 JavaScript에서 접근할 수 없는 쿠키로 전달.', 'Docker 컨테이너화 — 프로덕션 의존성만 분리해 pywin32·jupyter 등 개발용 패키지가 운영 이미지에 포함되지 않도록 구성. React는 멀티스테이지 빌드로 빌드 도구가 포함되지 않은 실행 이미지를 구성해 경량화(빌드 스테이지 1.87GB → 최종 이미지 108MB, 약 17배 감소). healthcheck로 MySQL·Redis가 단순히 실행 중인지가 아니라 실제 연결 가능한 상태인지 확인한 뒤 백엔드가 실행되도록 기동 순서 구성. 1GB RAM VPS의 제한된 자원을 고려해 Spring Boot의 JVM 최대 힙을 384MB로 설정.', 'GitHub Actions CI/CD — backend, fastapi-module, frontend 3개 저장소에 서비스별 배포 워크플로우 작성. 코드 push를 기준으로 Docker 이미지 빌드와 GitHub Container Registry 업로드 자동화. 운영 서버에서는 변경된 서비스의 이미지만 내려받고 해당 컨테이너만 재실행하도록 구성. 프론트엔드 API 주소는 빌드 단계에 주입. 이미지 업로드 오류는 저장소 Actions 권한과 이미지 저장소의 GitHub 저장소 연결 설정을 각각 확인해 해결.', '도메인 + nginx 리버스 프록시 + HTTPS — nginx를 외부 요청을 받아 프론트엔드와 백엔드로 나누어 전달하는 중간 서버로 구성. API 요청은 Spring Boot로, 나머지 요청은 React 서비스로 전달하고 각 서버 포트를 외부에 직접 노출하지 않도록 설정. HTTP 요청은 HTTPS로 자동 전환. 서버 예약 작업으로 인증서 갱신 여부를 매일 확인하고, 갱신 후 nginx 설정만 다시 읽도록 해 기존 연결을 끊지 않고 새 인증서를 반영.'],
  '[{"title":"이미지 저장소 업로드 권한 오류","problem":"GitHub Actions에서 빌드한 이미지를 이미지 저장소에 올릴 때 계속 거부됨","cause":"저장소 Actions 기본 권한이 읽기 전용이라 자동 발급되는 인증 토큰에 애초에 쓰기 권한이 없었음. 권한을 읽기/쓰기로 바꿔도 계속 거부됐는데, 이미지가 로컬에서 개인용 인증 토큰으로 먼저 올라가며 저장소가 아닌 개인 계정 소속으로 등록돼 있던 게 2차 원인","solution":"저장소 Actions 권한을 읽기/쓰기로 변경하고, 이미지 저장소 설정에서 해당 저장소를 쓰기 권한으로 별도 연결"},{"title":"HTTPS 전환 후 API 호출이 차단되는 오류","problem":"HTTPS로 전환한 직후 페이지에서 API 호출이 전부 실패, 브라우저가 HTTPS 페이지에서 HTTP API를 호출한다며 차단","cause":"빌드 도구가 환경변수를 빌드 시점에 결과물에 정적으로 박아넣는데, 프론트엔드가 예전 HTTP 주소로 빌드되어 있었음","solution":"배포 워크플로우의 빌드 단계 환경변수를 새 HTTPS 주소로 수정 후 재빌드·재배포, 새 탭에서 콘솔·네트워크 로그를 재확인해 정상 동작 확인"},{"title":"소셜 로그인 콜백이 프론트엔드로 잘못 라우팅됨","problem":"카카오/구글/네이버 로그인 콜백 처리가 정상 동작하지 않음","cause":"nginx가 /api/*만 백엔드로 보내고 나머지는 전부 프론트엔드로 보내는 구조였는데, 소셜 로그인 콜백이 사용하는 /oauth2/*·/login/oauth2/* 경로는 /api 밑이 아니라서 프론트엔드로 잘못 가고 있었음","solution":"nginx에 /oauth2/, /login/oauth2/ 경로를 추가해 백엔드로 라우팅하도록 수정"}]'::jsonb,
  true,
  '- 기존 서비스의 한계: 기존 자동 생성 서비스는 블로그·뉴스 내용을 조합해 상품의 특징과 실제 사용 경험을 충분히 반영하기 어려웠음
- 개선 방향: 상품명·특징·사용 경험·키워드를 입력받아 상품에 맞는 마케팅 글을 생성하는 방향으로 개선
- 작성 흐름: 정보를 단계적으로 입력하고 생성 결과를 확인·수정할 수 있는 작성 흐름 구성',
  '- 서버 간 데이터 흐름 이해: React에서 보낸 요청을 Spring Boot가 처리하고 FastAPI의 AI 결과를 다시 화면에 전달하는 전체 흐름 구현
- 외부 AI API 활용: 상품 정보·사용 경험·키워드·문체를 구분해 GPT API에 전달하고 생성 결과를 서비스 형식에 맞게 가공
- 컨테이너 기반 실행 환경 구성: React·Spring Boot·FastAPI·MySQL을 Docker로 실행하고 서비스 간 의존 관계 구성
- 배포와 운영 문제 해결: nginx를 통해 외부 요청을 프론트엔드와 백엔드로 분리하고 HTTPS·인증서 자동 갱신 적용
- 오류 원인 분석: API 주소·소셜 로그인 경로·이미지 저장소 권한 문제를 로그와 네트워크 요청으로 확인하고 해결',
  array['RAG 기반 톤 맞춤 문구 생성', '3계층 아키텍처(React ↔ Spring ↔ FastAPI) 설계', '단계별 AI 생성 파이프라인 구축', 'Google·Naver·Kakao 소셜 로그인 구현'],
  '[
    {"feature_index":0,"image_url":"/diagrams/marketten-rag.svg","caption":"예문 등록 시 임베딩을 계산해 저장하고, 글 생성 요청 시 저장된 임베딩들과 코사인 유사도를 비교해 가장 관련 있는 예문을 찾는 전체 흐름과, 별도 벡터DB 없이 구현한 이유를 정리한 다이어그램입니다."},
    {"feature_index":1,"image_url":"/diagrams/marketten-3tier.svg","caption":"React가 사용자 요청을 보내면 Spring Boot가 인증·데이터 정리 후 FastAPI로 라우팅하고, FastAPI가 OpenAI를 호출해 결과를 다시 위 계층으로 돌려주는 3계층 구조를 정리한 다이어그램입니다."},
    {"feature_index":2,"image_url":"/diagrams/marketten-step-pipeline.svg","caption":"주제 설정, 초안 생성, 글 복사로 이어지는 3단계 UI 흐름과, 초안 생성 화면 안에서 본문 생성 → 제목 키워드 분석 → 제목 생성이 순서대로 진행되는 내부 처리 구조를 정리한 다이어그램입니다."},
    {"feature_index":5,"image_url":"/diagrams/marketten-cicd.svg","caption":"backend·fastapi-module·frontend 3개 저장소가 각자의 워크플로우로 이미지를 빌드해 GHCR에 올리고, 운영 서버에서는 변경된 저장소의 이미지만 pull해 해당 컨테이너만 재실행하는 배포 구조를 정리한 다이어그램입니다."},
    {"feature_index":6,"image_url":"/diagrams/marketten-nginx.svg","caption":"nginx가 API 요청은 Spring Boot로, 나머지는 React로 나누어 전달하는 라우팅 구조와, 서버 예약 작업이 인증서 갱신을 확인해 nginx reload로 기존 연결을 끊지 않고 새 인증서를 반영하는 무중단 흐름을 정리한 다이어그램입니다."}
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
  '게임 상태를 바탕으로 몬스터 행동을 결정하고, 퍼지 AI의 행동 데이터를 LSTM으로 학습해 Unity에서 실시간 추론하는 몬스터 AI 시스템',
  array['Python', 'PyTorch', 'C#', 'Unity', 'ONNX'],
  4,
  '[]'::jsonb,
  '[{"url":"https://github.com/cwmwater/monster-ai-behavior","label":"monster-ai-behavior"},{"url":"https://github.com/cwmwater/monster-ai-unity","label":"monster-ai-unity"}]'::jsonb,
  '3명',
  '몬스터/보스 AI 전담',
  '- 몬스터·보스 AI 전담
- 체력·거리·속성 정보를 이용한 계층형 퍼지 상태머신 설계
- 퍼지 AI 행동 데이터 수집 및 LSTM 학습 구조 구성
- PyTorch 모델 학습과 ONNX 변환, Unity 실시간 추론 연동
- 체력 단계별 보스 페이즈와 공격 패턴 구현',
  array['퍼지 AI 행동 데이터를 활용한 LSTM 모방학습 파이프라인 — 퍼지 시스템이 플레이 중 선택한 행동과 당시의 거리·각도·체력·속성 관계·오염도를 게임 데이터로 수집. 좌표 기반 방향 값을 회전각 기준으로 변환하고 입력값을 정규화해 각도 값의 불연속 문제 완화. 전처리한 시계열 데이터를 PyTorch 2층 LSTM 모델(은닉 상태 크기 32에서 16으로 축소, Dropout 0.5)로 학습. 학습한 모델을 ONNX 형식으로 변환해 Unity에서 사용할 수 있도록 구성. Unity에서 0.1초 간격으로 모델을 호출하고, 행동별 출력 확률 중 가장 높은 값을 기준으로 행동 선택.', '계층형 퍼지 상태머신(HFSM) — 체력과 거리를 각각 낮음·중간·높음, 가까움·중간·먼 3단계로 구분. 각 상태 조합에 점수를 부여하고 가중평균을 계산해 대기·접근·전투·광폭 등 상위 행동 결정. 상위 행동이 정해진 뒤 거리와 몬스터 유형을 기준으로 세부 행동 선택. 근접형·원거리형·슬로우형·일벌형·중형 보스 등 9개 이상의 몬스터 유형에 공통 적용할 수 있는 구조로 구성.', '보스 몬스터 페이즈 시스템 — 보스 체력에 따라 3단계 페이즈로 전환. 각 페이즈에 수비·균형·공격·광폭 4가지 공격 성향 적용. 페이즈 전환 시 이벤트를 발생시켜 공격 패턴과 행동 상태 변경. 여왕벌 보스와 일벌 몬스터의 행동이 연계되도록 구성.', '데이터 전처리 튜닝 — 게임 데이터에 맞춰 불필요한 열 제거. 3D 거리 값을 학습에 사용할 수 있는 범위로 정규화. 시계열 데이터를 일정한 간격으로 나누어 LSTM 입력 형태로 변환. 입력값과 행동 라벨의 순서를 맞춰 학습 데이터 구성.'],
  '[{"title":"LSTM 학습 데이터 정의 불명확","problem":"학습에 사용할 입력 속성이 정리되지 않아 초기 모델의 행동 예측이 일정하지 않음","cause":"체력·거리만으로는 행동 차이를 설명하기 어려웠고, 각도·속성 관계·오염도와 같은 상태 정보가 빠져 있었음","solution":"행동에 영향을 주는 입력 속성을 다시 정의하고 각 값의 범위를 맞추도록 정규화 적용, 게임 상태와 행동 라벨의 관계를 정리해 LSTM 학습에 사용할 수 있는 데이터셋 구성"},{"title":"PyTorch와 Unity 간 입출력 구조 불일치","problem":"PyTorch에서 학습한 모델을 Unity에서 실행할 때 입력·출력 데이터 구조가 맞지 않아 추론 오류 발생","cause":"ONNX 변환 후 모델의 입력 차원과 출력 텐서 구조가 Unity에서 처리하도록 작성한 형식과 달랐음","solution":"변환된 모델의 입력·출력 구조를 확인하고 Unity에서 전달하는 데이터 순서와 행동 결과 처리 방식을 수정, Unity에서 게임 상태를 모델에 전달하고 행동별 출력값을 받아 몬스터 행동을 결정하는 흐름 연결"}]'::jsonb,
  true,
  '- 기존 규칙 기반 AI의 한계: 미리 정한 조건에 따라 현재 게임 상태에 맞는 행동을 선택할 수는 있었지만, 시간에 따른 행동 흐름을 학습해 다음 행동을 예측하기는 어려웠음
- 학습 기반 AI로 확장: 퍼지 AI가 실제 플레이 중 선택한 행동과 당시의 게임 상태를 학습 데이터로 수집하고, LSTM 모델이 시간에 따른 행동 패턴을 학습하도록 구성
- Unity 적용 및 비교: 학습한 LSTM 모델을 Unity에 적용해 퍼지 규칙 기반 행동과 학습 기반 행동을 비교할 수 있는 구조 구현',
  '- 퍼지 추론과 LSTM의 역할 구분: 퍼지 추론은 현재 체력·거리와 같은 상태를 규칙에 대입해 즉시 행동을 결정하고, LSTM은 시간 순서가 있는 상태 데이터를 바탕으로 다음 행동을 예측하는 방식으로 역할을 분리
- 학습 데이터 구성: 거리·각도·체력·속성 관계·오염도와 행동 결과를 수집하고, 입력값의 범위를 맞추기 위해 정규화와 불필요한 열 제거 적용
- 입력값 설계: 체력과 거리만 사용하던 초기 입력에 각도·속성 관계·오염도를 추가해 몬스터 행동에 영향을 주는 상태 정보 확장
- 모델 실행 환경 연결: PyTorch에서 학습한 LSTM 모델을 ONNX로 변환하고 Unity의 입력·출력 형식에 맞춰 실시간 추론 구조 구성',
  array['모방학습 파이프라인 구축 (LSTM → ONNX → Unity)', '계층형 퍼지 상태머신(HFSM) 설계', '보스 몬스터 페이즈 시스템 설계'],
  '[
    {"feature_index":0,"image_url":"https://pansfwryctxokvmssywb.supabase.co/storage/v1/object/public/portfolio-images/projects/1785771463765.png","caption":"퍼지 추론 결과를 라벨로 삼아 CSV 데이터를 만들고, 이 데이터로 LSTM을 학습시켜 ONNX로 변환한 뒤 Unity에 실시간 추론기로 탑재하기까지의 전체 파이프라인입니다."},
    {"feature_index":1,"image_url":"https://pansfwryctxokvmssywb.supabase.co/storage/v1/object/public/portfolio-images/projects/1785771445061.png","caption":"특정 입력값(체력 30, 거리 8)에서 퍼지 규칙들이 어떻게 평가되어 최종 행동으로 역퍼지화되는지 보여주는 실행 예시. Combat과 Berserk 규칙이 동시에 활성화되어 가중평균으로 최종 출력값(1.491)이 결정됩니다."},
    {"feature_index":2,"image_url":"https://pansfwryctxokvmssywb.supabase.co/storage/v1/object/public/portfolio-images/projects/1785771466814.png","caption":"QueenBeeAI를 중심으로 페이즈 전환(BossPhaseSystem), 공격 패턴(BossAttackPattern), 일벌 유닛(BossWorkBeeAI), 벌집 스폰(BossHoneyComb)이 상호작용하는 보스 AI 클래스 구조입니다."}
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
  team_size, main_duty, role, features, troubleshooting, is_featured, background, meaning, highlights, feature_media
)
values (
  '클라우드 서버 기반 데이터 자동화 시스템',
  '2026.03 – 2026.04',
  '외부 거래 API에서 시세와 잔고를 조회하고, 여러 조건을 충족한 경우 주문과 알림을 자동으로 처리하도록 구성한 Python 기반 개인 프로젝트',
  array['Python', 'Oracle Cloud', 'Linux', 'Discord Webhook', 'REST API'],
  3,
  '[]'::jsonb,
  '[]'::jsonb,
  '1명',
  '전략 설계 · 자동화 스크립트 운영 · Discord 모니터링, 1인 진행',
  '- Python 자동매매 로직 설계 및 구현
- 외부 거래 API를 이용한 시세 조회·주문·잔고 확인 로직 구성
- 다중 조건 기반 진입·청산 전략과 포지션 상태 관리 구현
- Oracle Cloud VPS에 SSH로 접속해 자동매매 스크립트 상시 실행 환경 구성
- Discord Webhook을 이용한 매매 신호·실행 결과 알림 구현',
  array['11개 시장 조건 감지 및 매매 신호 점수화 — 이동평균선 교차, 추세 강도, RSI, 볼린저밴드 이탈, 거래량 급증 등 11개 조건을 감지. 각 조건의 충족 여부를 0~100점의 내부 점수로 환산해 매매 신호의 강도 표시(실제 수익 가능성이 아닌 조건 충족 정도를 나타내는 규칙 기반 점수). 감지된 조건과 점수를 바탕으로 현재 시장 상태를 요약해 Discord로 전송.', '다중 조건 매매 전략 — 이동평균선 교차(MA10/30), 추세 강도(ADX), RSI, 거래량, 상위 시간대(4시간봉) 흐름까지 여러 조건을 동시에 확인한 뒤 진입. 단기 지표뿐 아니라 상위 시간대 흐름을 함께 확인해 단일 지표에 의존하지 않도록 구성. 파라미터 조합별 백테스트 비교 결과를 바탕으로 사용할 조건과 값 선정.', '리스크 관리 — ATR(평균 실제 변동폭)을 기준으로 종목별 손절·익절 범위 계산. 수익이 발생한 뒤 고점 대비 일정 비율 이상 하락하면 포지션을 자동 청산하는 트레일링스탑 적용. 여러 종목에 자산을 나누어 배분하고, 종목별 최대 보유 수를 제한하는 멀티 포지션 구조 구성.'],
  '[{"title":"포지션 상태 동기화 문제","problem":"주문 체결 후 로컬 상태 파일이 갱신되지 않아 실제 보유 포지션과 프로그램 기록이 달라짐","cause":"로컬 파일을 기준으로만 포지션을 관리하고, 외부 거래 시스템의 실제 잔고·체결 상태를 다시 확인하지 않는 구조","solution":"프로그램 시작 시 외부 잔고와 보유 포지션을 조회해 로컬 상태를 복구하고, 매 실행 주기마다 실제 잔고와 로컬 기록의 차이를 확인하도록 수정. 프로그램 재시작이나 상태 파일 누락 이후에도 실제 보유 상태를 기준으로 매매를 이어갈 수 있는 복구 흐름 구성"},{"title":"API 요청 빈도 문제","problem":"여러 종목의 현재가를 개별적으로 조회하면서 API 요청이 빠르게 증가하고 연결 오류 발생","cause":"종목마다 동일한 종류의 요청을 반복해 호출하는 구조","solution":"종목별 개별 조회를 현재가 일괄 조회 방식으로 변경해 한 번의 요청으로 여러 종목 데이터를 수집. 반복 요청을 줄이고 여러 종목의 현재가를 한 주기 안에 처리하는 구조로 개선"}]'::jsonb,
  true,
  '- 반복 작업 자동화: 여러 종목의 시세를 반복해서 확인하고 매매 조건을 판단하는 작업을 자동화하기 위해 프로젝트 시작
- 자동매매 흐름 구성: 단순히 매매 신호만 출력하는 것이 아니라, 외부 거래 API를 통한 시세·잔고 조회부터 조건 판단·주문·포지션 관리까지 하나의 흐름으로 구성
- 서버 운영과 상태 확인: Oracle Cloud 서버에서 자동매매 스크립트를 상시 실행하고, 매매 결과를 Discord 알림으로 확인할 수 있는 운영 환경 구성',
  '- 외부 API 기반 자동화: 시세·잔고 조회, 주문 요청, 실행 결과 확인을 하나의 주기적인 실행 흐름으로 구성
- 상태 동기화: 로컬 파일의 기록만 신뢰하지 않고 거래소 잔고와 실제 포지션을 기준으로 프로그램 상태를 복구하는 구조 구현
- API 요청 관리: 종목별 개별 조회로 요청이 증가하는 문제를 일괄 조회 방식으로 변경해 외부 API 호출 구조 개선
- 서버 운영: Oracle Cloud VPS에 SSH로 접속해 Python 프로세스를 실행하고 Discord 알림으로 원격 상태 확인',
  array['11가지 시장 조건 감지 및 매매 신호 점수화', '다중 조건 매매 전략 설계 및 반복 백테스트', 'ATR 기반 리스크 관리 (손절·익절·트레일링스탑)'],
  '[
    {"feature_index":0,"image_url":"/diagrams/trading-bot-flow.svg","caption":"거래소 API로 시세를 일괄 조회한 뒤 지표 계산, 11개 패턴 감지·스코어링, 다중 조건 판단, ATR 기반 리스크 관리를 거쳐 주문을 실행하고 Discord로 알리는 전체 흐름과, 재시작 시 거래소 잔고를 스캔해 로컬 상태를 자동 복구하는 구조를 정리한 다이어그램입니다."}
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
  team_size, role, features, troubleshooting, is_featured, background, meaning, highlights, feature_media
)
values (
  '말씀결 (Bible Name Lab)',
  '2026.08 – 진행 중',
  '원하는 신앙적 의미를 문장으로 입력하면 성경 근거와 함께 이름을 추천하고, 반대로 이름의 성경적 연관성도 검증해주는 웹 서비스',
  array['React', 'NestJS', 'FastAPI', 'Prisma', 'PostgreSQL', 'Redis', 'Docker', 'CI/CD', 'OAuth2', 'RAG'],
  1,
  '[]'::jsonb,
  '[{"url":"https://biblenamelab.com","label":"biblenamelab.com (배포)"}]'::jsonb,
  '1명',
  '- React·NestJS·FastAPI 세 개 프로그램을 직접 설계하고 개발
- 성경 데이터를 체계적으로 정리하고, 이름을 만들어주는 AI 처리 과정 설계
- 이름의 성경적 근거를 확인하는 기능과 발음이 자연스러운지 평가하는 기능 구현
- Docker·GitHub Actions로 자동 배포 환경 구성 및 서버 운영 설정
- Google·Naver·Kakao 소셜 로그인 구현',
  array['근거 등급을 매기는 이름 생성 파이프라인 — 사용자가 입력한 의미 문장에서 핵심 개념을 뽑아 성경 구절을 먼저 검색하고, 이 구절들을 후보로 AI에게 제공해 이름을 생성. 생성된 이름이 참조한 구절이 검색된 목록에 없으면 실제로 존재하는 구절이라도 근거로 인정하지 않고 걸러냄. 생성된 이름마다 성경 데이터에서 다시 검색해, 성경에 직접 나오는 이름인지, 성경적 개념으로 만든 이름인지, 해석을 더한 이름인지, 새로 지은 이름인지 4단계로 구분해 등급을 판정.', '성씨와 합쳤을 때 어감이 자연스러운지 채점하는 엔진 — 한글 음절을 초성·중성·종성으로 분해해 흐름이 매끄러운지, 받침이 부딪히는지를 규칙으로 판정하는 엔진을 직접 구현. 이 엔진은 새 이름을 만들지 않고 생성된 이름을 점수로 정렬만 하며, 실제 있는 흔한 단어처럼 들리는지처럼 규칙만으로 판단하기 어려운 부분은 이름을 생성하는 AI 쪽 프롬프트 지침에 반영해, 규칙과 AI가 채점과 생성 제약이라는 서로 다른 역할을 맡도록 구성.', '테스트 통과 시에만, 정해진 순서로 진행되는 자동 배포 — 코드를 준비(빌드·테스트)하는 작업과 서버에 올리는 작업을 분리해, 준비가 성공했을 때만 배포가 자동으로 이어지도록 구성. 배포할 때는 데이터베이스 구조 변경과 기본 데이터 입력을 완전히 끝낸 뒤에만 실제 서비스 컨테이너를 새 버전으로 교체하도록 순서를 고정해, 옛날 데이터 구조와 새 코드가 잠깐이라도 얽히는 상황을 방지.'],
  '[{"title":"배포 도중 서버 전체가 응답하지 않는 상태가 됨","problem":"배포하는 도중 서버에 원격 접속하는 것조차 안 될 정도로 서버 전체가 약 24분간 멈춤","cause":"메모리 부족, 처리 지연 등 확인할 수 있는 원인은 다 아니었고, 서버 한 대에서 프로그램 3~4개를 한꺼번에 준비(빌드)하던 방식이 컴퓨터 자원을 너무 많이 사용한 것이 가장 유력한 원인으로 보이지만 완전히 확정하지는 못함","solution":"원인을 정확히 특정하지 못했기 때문에, 원인일 수 있는 상황 자체를 구조적으로 없애는 방향을 선택 — 프로그램을 준비(빌드)하는 작업을 서버가 아닌 GitHub에서 하도록 옮기고, 실제 서버는 완성된 프로그램만 받아오도록 바꿔서 서버가 무거운 작업을 아예 안 하게 만듦. 원인을 완전히 밝히지 못해 만약을 대비해 여유 메모리 공간도 늘려둠"},{"title":"이름에 안 어울리는 한자가 후보로 노출됨","problem":"죽을 사(死)처럼 이름으로 쓰기에 좋지 않은 한자가 추천 후보 상위에 노출됨","cause":"순서를 매겨서 뒤로 보내는 방식으로만 걸러내고 있었는데, 확인해보니 이 한자가 실제로 이름에 쓸 수 있다고 정부가 정한 한자 목록에 정식으로 포함돼 있어서 순서 조정만으로는 걸러지지 않음. 법적으로 써도 되는 한자와 추천할 만한 한자는 서로 다른 기준이라는 것을 이 일로 확인. 순서만 뒤로 미루는 방식은 후보가 충분할 때는 문제가 겉으로 드러나지 않지만, 조건에 맞는 후보 이름이 적게 나올 때는 순위가 밀린 한자도 결국 최종 후보 안에 들어갈 수 있어 근본적인 해결이 아니라는 것도 함께 확인","solution":"순서 조정(정렬)이 아니라 검색 결과 자체에서 강제로 빠지도록 걸러내는 조건(배제)으로 바꾸고, 죽음·살해 같은 좋지 않은 뜻을 가진 한자들을 별도 제외 목록에 좁게 추가"}]'::jsonb,
  true,
  '- 기존 작명 방식의 한계: 사주·음양오행에 기반한 작명 서비스는 흔하지만, 성경 말씀에서 의미를 찾아 이름을 짓는 서비스는 접해보지 못해 직접 만들어보기로 함
- 서비스 방향: 성경적으로 좋은 이름과 실제로 자연스럽게 들리는 이름은 별개의 문제라고 보고, 의미와 어감을 각각 분석한 뒤 결합하는 방향으로 설계',
  '- 근거 재확인: AI가 만든 결과를 그대로 믿지 않고, 원본 성경 데이터에서 다시 찾아봐서 근거가 얼마나 확실한지 등급을 매기도록 설계
- 자동 배포 구조 개선: 서버에서 직접 프로그램을 준비하다 서버가 멈췄던 사고를 겪은 뒤, 준비 작업을 다른 곳(GitHub)에서 하도록 분리해 같은 문제가 다시 안 생기게 함
- 배포 순서 설계: 데이터베이스 구조 변경과 기본 데이터 입력을 먼저 끝낸 뒤에만 서비스를 교체하도록 순서를 고정해, 새 코드가 옛날 데이터 구조와 안 맞아 생기는 오류를 없앰',
  array['근거 등급을 매기는 이름 생성 파이프라인', '성씨와 합쳤을 때 어감이 자연스러운지 채점하는 엔진', '테스트 통과 시에만, 정해진 순서로 진행되는 자동 배포'],
  '[
    {"feature_index":0,"image_url":"/diagrams/bible-rag-pipeline.svg","caption":"사용자가 입력한 문장에서 핵심 개념을 뽑아 성경 구절을 먼저 검색하고, 이 구절만 후보로 AI에게 제공해 이름을 생성한 뒤, 생성된 이름을 성경 데이터에서 다시 검색해 4단계 근거 등급으로 판정하는 전체 흐름을 정리한 다이어그램입니다."},
    {"feature_index":1,"image_url":"/diagrams/bible-phonetic-engine.svg","caption":"이름 생성 AI의 프롬프트 지침과, 생성된 이름을 초성·중성·종성으로 분해해 규칙으로 채점·정렬하는 엔진이 서로 다른 역할을 맡아 동작하는 구조를 정리한 다이어그램입니다."},
    {"feature_index":2,"image_url":"/diagrams/bible-deploy-pipeline.svg","caption":"테스트(CI)를 통과했을 때만 배포(CD)가 이어지고, 서버에서는 마이그레이션·시딩을 임시 컨테이너로 먼저 끝낸 뒤에만 실제 컨테이너를 교체하는 순서와, 배포가 겹치면 순서대로 대기하는 큐잉 구조를 정리한 다이어그램입니다."}
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
  role = excluded.role,
  features = excluded.features,
  troubleshooting = excluded.troubleshooting,
  is_featured = excluded.is_featured,
  background = excluded.background,
  meaning = excluded.meaning,
  highlights = excluded.highlights,
  feature_media = excluded.feature_media;
