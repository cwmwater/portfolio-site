import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProjectDetailContent from '@/components/ProjectDetailContent'
import { supabase } from '@/lib/supabaseClient'
import type { Project, Profile } from '@/lib/types'

export const revalidate = 0

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [{ data: projectData }, { data: profileData }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('profile').select('phone').eq('id', 1).maybeSingle(),
  ])

  if (!projectData) notFound()

  const phone = (profileData as Pick<Profile, 'phone'> | null)?.phone

  return (
    <>
      <Header />
      <main className="py-12 pb-24">
        <div className="mx-auto max-w-[880px] px-6">
          <Link href="/#projects" className="mb-6 inline-block font-mono text-[0.85rem] text-muted hover:text-accent-dim">
            ← 프로젝트 목록으로
          </Link>
          <ProjectDetailContent project={projectData as Project} />
        </div>
      </main>
      <Footer phone={phone} />
    </>
  )
}
