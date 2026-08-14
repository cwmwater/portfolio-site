import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProjectList from '@/components/ProjectList'
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
    highlights: p.highlights ?? [],
    feature_media: p.feature_media ?? [],
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

      <section className="bg-white px-0 pb-10 pt-10 max-md:pb-8 max-md:pt-8" id="about">
        <div className="mx-auto max-w-[880px] px-6">
          <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              {profile?.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo_url}
                  alt="최원민 프로필 사진"
                  className="h-28 w-28 flex-shrink-0 rounded-full border-2 border-accent object-cover"
                />
              )}
              <div className="text-center sm:text-left">
                <h1 className="mb-3 font-display text-[clamp(1.7rem,3.5vw,2.2rem)] font-extrabold leading-[1.15] tracking-tight text-dark">
                  문제를 구조로
                  <br />
                  풀어가는 개발자
                </h1>
                <p className="max-w-[46ch] text-[0.95rem] leading-[1.6] text-muted">
                  안녕하세요, AI 연동 웹 서비스와 시스템 구조 설계에 관심이 많고,
                  <br />
                  문제의 원인을 끝까지 파고드는 과정에 흥미를 느끼며,
                  <br />
                  배운 만큼 꾸준히 성장하는 개발자입니다.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-4 sm:flex-shrink-0 sm:flex-col sm:justify-center">
              <a
                href="mailto:jo08198@gmail.com"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#d98e4c]/50 px-6 py-3 font-mono text-[0.85rem] font-semibold text-[#d98e4c] transition-colors hover:bg-[#d98e4c] hover:text-white"
              >
                이메일 보내기
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#6f93c4]/50 px-6 py-3 font-mono text-[0.85rem] font-semibold text-[#6f93c4] transition-colors hover:bg-[#6f93c4] hover:text-white"
              >
                <GithubIcon className="h-[15px] w-[15px]" />
                GitHub 보기
              </a>
            </div>
          </div>

          <div className="mb-4 border-t border-border pt-8">
            <dl className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
              {infoRows.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="h-[18px] w-[18px] flex-shrink-0 text-accent" />
                  <dt className="w-16 flex-shrink-0 font-mono text-[0.78rem] text-muted">{label}</dt>
                  <dd className="text-dark">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {resumeItems.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-2xl bg-neutral-50 p-4">
              {resumeItems.map((r, idx) => {
                const c = resumeCategoryColor(r.category, idx)
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-baseline gap-4 rounded-lg bg-white px-4 py-2.5 shadow-sm"
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

      <section className="border-t border-black/10 bg-[#d7ede5] px-0 py-[72px] max-md:py-[52px]" id="projects">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead title="프로젝트" />
          <ProjectList projects={projects} />
        </div>
      </section>

      <Footer phone={profile?.phone} skillCategories={skillCategories} />
    </>
  )
}
