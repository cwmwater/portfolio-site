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

function SectionHead({ title }: { title: string }) {
  return (
    <div className="mb-8">
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

  const infoRows = [
    { Icon: UserIcon, label: '이름', value: '최원민' },
    { Icon: CalendarIcon, label: '생년월일', value: profile?.birthdate },
    { Icon: MapPinIcon, label: '위치', value: profile?.location },
    { Icon: PhoneIcon, label: '연락처', value: profile?.phone },
    { Icon: MailIcon, label: '이메일', value: 'jo08198@gmail.com' },
    { Icon: CapIcon, label: '학력', value: '중부대학교 (게임소프트웨어학과)' },
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
          <div className="flex flex-col items-center gap-6 text-center">
            {profile?.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo_url}
                alt="최원민 프로필 사진"
                className="h-24 w-24 flex-shrink-0 rounded-full border-2 border-accent object-cover"
              />
            )}
            <div className="max-w-[560px]">
              <p className="mb-4 font-mono text-[0.85rem] tracking-[0.08em] text-accent">
                PORTFOLIO / JUNIOR DEVELOPER
              </p>
              <h1 className="mb-6 font-display text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold leading-[1.05] tracking-tight text-light">
                시스템의 흐름을
                <br />
                설계하는 개발자
                <br />
                <span className="text-accent">최원민</span>
              </h1>
              <p className="mx-auto max-w-[46ch] text-[1.2rem] leading-[1.8] text-accent-soft/90">
                문제의 원인을 파고들어
                <br />
                더 나은 구조로 해결합니다.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="#projects"
              className="flex h-[150px] w-[150px] flex-shrink-0 flex-col items-center justify-center rounded-full border border-white/25 text-center font-mono text-[0.85rem] font-semibold text-accent transition-colors hover:border-accent max-md:h-[120px] max-md:w-[120px]"
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
              className="flex h-[150px] w-[150px] flex-shrink-0 flex-col items-center justify-center rounded-full border border-white/25 text-center font-mono text-[0.85rem] font-semibold text-[#d98e4c] transition-colors hover:border-[#d98e4c] max-md:h-[120px] max-md:w-[120px]"
            >
              이메일
              <br />
              보내기
              <span aria-hidden="true" className="mt-1 text-lg">
                ↗
              </span>
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[150px] w-[150px] flex-shrink-0 flex-col items-center justify-center rounded-full border border-white/25 text-center font-mono text-[0.85rem] font-semibold text-[#6f93c4] transition-colors hover:border-[#6f93c4] max-md:h-[120px] max-md:w-[120px]"
            >
              GitHub
              <br />
              보기
              <GithubIcon className="mt-1 h-[18px] w-[18px]" />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white px-0 py-[72px] max-md:py-[52px]" id="about">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead title="자기소개" />

          <dl className="mb-6 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
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

          <h3 className="mb-4 mt-10 font-mono text-[0.85rem] font-semibold tracking-wide text-muted">
            기술 스택
          </h3>
          <SkillsList categories={skillCategories} />
        </div>
      </section>

      <section className="bg-light px-0 py-[72px] max-md:py-[52px]" id="projects">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead title="프로젝트" />
          <ProjectList projects={projects} />
        </div>
      </section>

      <Footer phone={profile?.phone} />
    </>
  )
}
