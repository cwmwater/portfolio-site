import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CodeWindow from '@/components/CodeWindow'
import ProjectShowcase from '@/components/ProjectShowcase'
import { supabase } from '@/lib/supabaseClient'
import { categoryColor, resumeCategoryColor } from '@/lib/palette'
import type { Project, Profile } from '@/lib/types'

export const revalidate = 0 // 관리자 페이지에서 수정한 내용이 바로 반영되도록

function SectionHead({ num, title }: { num: string; title: string }) {
  return (
    <div className="mb-8 flex items-baseline gap-3">
      <span className="font-mono text-[0.9rem] text-accent-dim">{num}</span>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
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

  return (
    <>
      <Header />

      <section className="relative overflow-hidden bg-dark pb-[88px] pt-24 text-light after:pointer-events-none after:absolute after:-bottom-40 after:-right-[120px] after:h-[380px] after:w-[380px] after:rounded-full after:bg-[radial-gradient(circle,var(--accent-dim)_0%,transparent_72%)] after:opacity-35 after:content-[''] max-md:pb-14 max-md:pt-16">
        <div className="relative mx-auto grid max-w-[880px] grid-cols-[1.1fr_0.9fr] items-center gap-12 px-6 max-md:grid-cols-1 max-md:gap-8">
          <div>
            {profile?.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo_url}
                alt="최원민 프로필 사진"
                className="mb-5 h-[88px] w-[88px] rounded-full border-2 border-accent object-cover"
              />
            )}
            <p className="mb-4 font-mono text-[0.85rem] tracking-[0.08em] text-accent">
              PORTFOLIO / FULLSTACK DEVELOPER
            </p>
            <h1 className="mb-5 text-[clamp(2.1rem,4vw,2.9rem)] font-extrabold leading-[1.25] tracking-tight">
              구조를 설계하고
              <br />
              연결하는 개발자, 최원민
            </h1>
            <p className="mb-7 max-w-[42ch] text-[1.05rem] text-muted-light">
              React · Spring · FastAPI 기반 AI 연동 웹 서비스를 설계하고
              구현합니다. 화면 설계부터 데이터가 흐르는 구조까지, 전체를
              이해하고 만드는 것을 중요하게 생각합니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="rounded-lg border border-accent bg-accent px-[18px] py-2.5 font-mono text-[0.85rem] font-semibold text-dark transition-colors hover:bg-accent-dim"
                href="#projects"
              >
                프로젝트 보기
              </a>
              <a
                className="rounded-lg border border-border-dark px-[18px] py-2.5 font-mono text-[0.85rem] text-light transition-colors hover:border-accent hover:text-accent"
                href="mailto:jo08198@gmail.com"
              >
                이메일 보내기
              </a>
            </div>
          </div>

          <CodeWindow filename="profile.ts">
            <div>
              <span className="ln">1</span>
              <span className="tag">const</span> developer = {'{'}
            </div>
            <div>
              <span className="ln">2</span>&nbsp;&nbsp;name:{' '}
              <span className="str">&apos;최원민&apos;</span>,
            </div>
            <div>
              <span className="ln">3</span>&nbsp;&nbsp;stack: [
              <span className="str">&apos;React&apos;</span>,{' '}
              <span className="str">&apos;Spring&apos;</span>,{' '}
              <span className="str">&apos;FastAPI&apos;</span>],
            </div>
            <div>
              <span className="ln">4</span>&nbsp;&nbsp;status:{' '}
              <span className="str">&apos;신입 지원 중&apos;</span>,
            </div>
            <div>
              <span className="ln">5</span>
              {'}'}
            </div>
          </CodeWindow>
        </div>
      </section>

      <section className="px-0 py-[72px] max-md:py-[52px]" id="about">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead num="01" title="자기소개" />
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-white to-neutral-50 p-8 shadow-card max-md:p-6">
            <span className="pointer-events-none absolute -right-6 -top-10 select-none font-serif text-[8rem] leading-none text-accent/10">
              &ldquo;
            </span>
            <div className="relative flex items-start gap-7 max-md:flex-col max-md:items-center max-md:text-center">
              {profile?.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo_url}
                  alt="최원민 프로필 사진"
                  className="h-28 w-28 flex-shrink-0 rounded-2xl object-cover shadow-md ring-4 ring-accent/10"
                />
              )}
              <p className="max-w-[62ch] text-[1.08rem] leading-[1.85] text-neutral-700">
                {profile?.intro || '아직 등록된 자기소개가 없습니다.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-0 py-[72px] max-md:py-[52px]" id="resume">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead num="02" title="이력" />

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

      <section className="px-0 py-[72px] max-md:py-[52px]" id="skills">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead num="03" title="기술 스택" />

          {skillCategories.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6">
              {skillCategories.map((c, idx) => {
                const color = categoryColor(idx)
                const total = c.primary.length + c.learning.length
                return (
                  <div key={c.category} className={`rounded-xl border ${color.border} bg-white p-5 shadow-card`}>
                    <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                      <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                      <h3 className="font-mono text-[0.85rem] tracking-wide text-dark">{c.category}</h3>
                      {total > 0 && (
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.text}`}>
                          {total}
                        </span>
                      )}
                    </div>

                    {c.primary.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.primary.map((t) => (
                          <span key={t} className={`rounded-md border px-3 py-1.5 font-mono text-[0.85rem] ${color.tag}`}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {c.learning.length > 0 && (
                      <>
                        <p className="mb-1.5 mt-3 text-xs text-muted">학습·경험</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.learning.map((t) => (
                            <span
                              key={t}
                              className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-muted"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="font-mono text-sm text-muted">아직 등록된 기술 스택이 없습니다.</p>
          )}
        </div>
      </section>

      <section className="pt-[72px] max-md:pt-[52px]" id="projects">
        <div className="mx-auto max-w-[880px] px-6">
          <SectionHead num="04" title="프로젝트" />
        </div>

        <ProjectShowcase projects={projects} />
      </section>

      <Footer phone={profile?.phone} />
    </>
  )
}
