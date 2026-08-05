import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProjectList from '@/components/ProjectList'
import SkillsList from '@/components/SkillsList'
import GithubIcon from '@/components/icons/GithubIcon'
import { UserIcon, CalendarIcon, MapPinIcon, PhoneIcon, MailIcon, CapIcon } from '@/components/icons/InfoIcons'
import { supabase } from '@/lib/supabaseClient'
import { resumeCategoryColor } from '@/lib/palette'
import type { Project, Profile } from '@/lib/types'

export const revalidate = 0 // 관리자 페이지에서 수정한 내용이 바로 반영되도록

const GITHUB_URL = 'https://github.com/cwmwater'

function SectionHead({ num, title }: { num: string; title: string }) {
  return (
    <div className="mb-8 flex items-baseline gap-3">
      <span className="font-mono text-[0.9rem] text-accent">{num}</span>
      <h2 className="font-display text-2xl font-bold tracking-tight text-dark">{title}</h2>
    </div>
  )
}

export default async function Home() {
  const [{ data: projectsData }, { data: profileData }] = await Promise.all([
    supabase.from('projects').select('*').order('sort_order', { ascending: true }),
    supabase.from('profile').select('*').eq('id', 1).maybeSingle(),
  ])

  const projects = ((projectsData as Project[]) ?? []).map((p) => ({
    ...p,
    media: p.media ?? [],
    links: p.links ?? [],
  }))
  const profile = profileData as Profile | null
  const skillCategories = profile?.skill_categories ?? []
  const resumeItems = profile?.resume_items ?? []
  const education = resumeItems.find((r) => r.category === '학력')?.title ?? null

  const infoRows = [
    { Icon: UserIcon, label: '이름', value: '최원민' },
    { Icon: CalendarIcon, label: '생년월일', value: profile?.birthdate },
    { Icon: MapPinIcon, label: '위치', value: profile?.location },
    { Icon: PhoneIcon, label: '연락처', value: profile?.phone },
    { Icon: MailIcon, label: '이메일', value: 'jo08198@gmail.com' },
    { Icon: CapIcon, label: '학력', value: education },
  ].filter((r): r is { Icon: typeof UserIcon; label: string; value: string } => Boolean(r.value))

  return (
    <>
      <Header />

      <section
        className="relative overflow-hidden bg-dark bg-cover bg-center pb-20 pt-24 text-light max-md:pb-14 max-md:pt-16"
        style={profile?.hero_image_url ? { backgroundImage: `url(${profile.hero_image_url})` } : undefined}
      >
        {profile?.hero_image_url && (
          <div className="absolute inset-0 bg-gradient-to-b from-dark/85 via-dark/85 to-dark" aria-hidden="true" />
        )}
        <div className="relative mx-auto max-w-[880px] px-6">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-[560px]">
              {profile?.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo_url}
                  alt="최원민 프로필 사진"
                  className="mb-6 h-[72px] w-[72px] rounded-full border-2 border-accent object-cover"
                />
              )}
              <p className="mb-4 font-mono text-[0.85rem] tracking-[0.08em] text-accent">
                PORTFOLIO / FULLSTACK DEVELOPER
              </p>
              <h1 className="mb-6 font-display text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold leading-[1.05] tracking-tight text-light">
                구조를 설계하고
                <br />
                연결하는 개발자
                <br />
                <span className="text-accent">최원민</span>
              </h1>
              <p className="max-w-[46ch] text-[1.05rem] leading-[1.8] text-muted-light">
                React · Spring · FastAPI 기반 AI 연동 웹 서비스를 설계하고
                구현합니다. 화면 설계부터 데이터가 흐르는 구조까지, 전체를
                이해하고 만드는 것을 중요하게 생각합니다.
              </p>
            </div>

            <div className="flex flex-shrink-0 gap-4">
              <a
                href="#projects"
                className="flex h-[150px] w-[150px] flex-shrink-0 flex-col items-center justify-center rounded-full bg-accent text-center font-mono text-[0.85rem] font-semibold text-accent-ink transition-colors hover:bg-accent-dim max-md:h-[120px] max-md:w-[120px]"
              >
                프로젝트
                <br />
                보기
                <span aria-hidden="true" className="mt-1 text-lg">
                  ↓
                </span>
              </a>
              <a
                href="mailto:jo08198@gmail.com"
                className="flex h-[150px] w-[150px] flex-shrink-0 flex-col items-center justify-center rounded-full border border-white/25 text-center font-mono text-[0.85rem] text-light transition-colors hover:border-accent hover:text-accent max-md:h-[120px] max-md:w-[120px]"
              >
                이메일
                <br />
                보내기
                <span aria-hidden="true" className="mt-1 text-lg">
                  ↗
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-0 py-[72px] max-md:py-[52px]" id="about">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead num="01" title="자기소개" />

          <dl className="mb-8 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
            {infoRows.map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="h-[18px] w-[18px] flex-shrink-0 text-accent" />
                <dt className="w-16 flex-shrink-0 font-mono text-[0.78rem] text-muted">{label}</dt>
                <dd className="text-dark">{value}</dd>
              </div>
            ))}
          </dl>

          {resumeItems.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-neutral-50 p-5">
              {resumeItems.map((r, idx) => {
                const c = resumeCategoryColor(r.category, idx)
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-baseline gap-4 rounded-lg bg-white px-4 py-3 shadow-sm"
                  >
                    <span
                      className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs font-medium ${c.tag}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                      {r.category}
                    </span>
                    <span className="flex-shrink-0 font-mono text-[0.8rem] text-muted">{r.period}</span>
                    <span className="text-dark">{r.title}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="font-mono text-sm text-muted">아직 등록된 이력이 없습니다.</p>
          )}
        </div>
      </section>

      <section className="bg-accent-soft px-0 py-[72px] max-md:py-[52px]" id="skills">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead num="02" title="기술 스택" />
          <SkillsList categories={skillCategories} />
        </div>
      </section>

      <section className="bg-white px-0 py-[72px] max-md:py-[52px]" id="archiving">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead num="03" title="Archiving" />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-light px-5 py-4 shadow-card transition-colors hover:border-accent"
          >
            <GithubIcon className="h-5 w-5 flex-shrink-0 text-dark" />
            <span className="font-mono text-[0.9rem] text-accent">github.com/cwmwater</span>
            <span className="text-[0.85rem] text-muted">소스 코드 저장소</span>
          </a>
        </div>
      </section>

      <section className="bg-light px-0 py-[72px] max-md:py-[52px]" id="projects">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead num="04" title="프로젝트" />
          <ProjectList projects={projects} />
        </div>
      </section>

      <Footer phone={profile?.phone} />
    </>
  )
}
