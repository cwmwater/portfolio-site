'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { TECH_TAG_CLASS } from '@/lib/uiClasses'
import type {
  Visit,
  Project,
  Profile,
  ProjectMediaItem,
  ProjectLink,
  SkillCategory,
  ResumeItem,
} from '@/lib/types'

async function uploadPortfolioImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('portfolio-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('portfolio-images').getPublicUrl(path)
  return data.publicUrl
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [visits, setVisits] = useState<Visit[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  // 프로필 상태
  const [profile, setProfile] = useState<Profile | null>(null)
  const [introInput, setIntroInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([])
  const [skillTagInput, setSkillTagInput] = useState<Record<string, string>>({})
  const [resumeItems, setResumeItems] = useState<ResumeItem[]>([])
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // 프로젝트 상세(개요/구현기능/트러블슈팅) 편집 상태
  const [overviewDraft, setOverviewDraft] = useState<
    Record<string, { team_size: string; main_duty: string; role: string }>
  >({})
  const [featureInput, setFeatureInput] = useState<Record<string, string>>({})
  const [tsDraft, setTsDraft] = useState<Record<string, { title: string; problem: string; solution: string }>>(
    {}
  )
  const [ytInput, setYtInput] = useState<Record<string, string>>({})

  // 새 프로젝트 입력 폼 상태
  const [title, setTitle] = useState('')
  const [period, setPeriod] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [mainDuty, setMainDuty] = useState('')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')
  const [techStackInput, setTechStackInput] = useState('')
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('')
  const [newProjectFiles, setNewProjectFiles] = useState<File[]>([])
  const [newProjectLinks, setNewProjectLinks] = useState<ProjectLink[]>([])
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingProjectImageId, setUploadingProjectImageId] = useState<string | null>(null)
  const [linkDraft, setLinkDraft] = useState<Record<string, { label: string; url: string }>>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  function loadVisits() {
    supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setVisits((data as Visit[]) ?? [])
      })
  }

  function loadProjects() {
    supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else
          setProjects(
            ((data as Project[]) ?? []).map((p) => ({
              ...p,
              media: p.media ?? [],
              links: p.links ?? [],
              features: p.features ?? [],
              troubleshooting: p.troubleshooting ?? [],
            }))
          )
      })
  }

  function loadProfile() {
    supabase
      .from('profile')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
          return
        }
        const p = data as Profile | null
        setProfile(p)
        setIntroInput(p?.intro ?? '')
        setPhoneInput(p?.phone ?? '')
        setSkillCategories(p?.skill_categories ?? [])
        setResumeItems(p?.resume_items ?? [])
      })
  }

  useEffect(() => {
    if (!session) return
    loadVisits()
    loadProjects()
    loadProfile()
  }, [session])

  async function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const url = await uploadPortfolioImage(file, 'profile')
      const { error } = await supabase.from('profile').update({ photo_url: url }).eq('id', 1)
      if (error) throw error
      loadProfile()
    } catch (err) {
      alert('사진 업로드 실패: ' + (err as Error).message)
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  function addSkillCategory() {
    setSkillCategories((cats) => [...cats, { category: '새 카테고리', primary: [], learning: [] }])
  }

  function removeSkillCategory(idx: number) {
    setSkillCategories((cats) => cats.filter((_, i) => i !== idx))
  }

  function updateSkillCategoryName(idx: number, name: string) {
    setSkillCategories((cats) => cats.map((c, i) => (i === idx ? { ...c, category: name } : c)))
  }

  function addSkillTag(idx: number, group: 'primary' | 'learning') {
    const key = `${idx}:${group}`
    const value = skillTagInput[key]?.trim()
    if (!value) return
    setSkillCategories((cats) =>
      cats.map((c, i) => (i === idx ? { ...c, [group]: [...c[group], value] } : c))
    )
    setSkillTagInput((d) => ({ ...d, [key]: '' }))
  }

  function removeSkillTag(idx: number, group: 'primary' | 'learning', tag: string) {
    setSkillCategories((cats) =>
      cats.map((c, i) => (i === idx ? { ...c, [group]: c[group].filter((t) => t !== tag) } : c))
    )
  }

  function addResumeItem() {
    setResumeItems((items) => [...items, { category: '학력', period: '', title: '' }])
  }

  function updateResumeItem(idx: number, field: keyof ResumeItem, value: string) {
    setResumeItems((items) => items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }

  function removeResumeItem(idx: number) {
    setResumeItems((items) => items.filter((_, i) => i !== idx))
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingProfile(true)
    const { error } = await supabase
      .from('profile')
      .update({
        intro: introInput.trim(),
        phone: phoneInput.trim() || null,
        skill_categories: skillCategories,
        resume_items: resumeItems,
      })
      .eq('id', 1)
    setSavingProfile(false)
    if (error) {
      alert('저장 실패: ' + error.message)
      return
    }
    loadProfile()
  }

  async function fileToMediaItem(file: File): Promise<ProjectMediaItem> {
    const url = await uploadPortfolioImage(file, 'projects')
    return { type: file.type.startsWith('video/') ? 'video' : 'image', url }
  }

  async function handleAddProjectMedia(id: string, files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingProjectImageId(id)
    try {
      const items = await Promise.all(Array.from(files).map(fileToMediaItem))
      const target = projects.find((p) => p.id === id)
      const nextMedia = [...(target?.media ?? []), ...items]
      const { error } = await supabase.from('projects').update({ media: nextMedia }).eq('id', id)
      if (error) throw error
      loadProjects()
    } catch (err) {
      alert('업로드 실패: ' + (err as Error).message)
    } finally {
      setUploadingProjectImageId(null)
    }
  }

  async function handleRemoveProjectMedia(id: string, index: number) {
    const target = projects.find((p) => p.id === id)
    if (!target) return
    const nextMedia = target.media.filter((_, i) => i !== index)
    const { error } = await supabase.from('projects').update({ media: nextMedia }).eq('id', id)
    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }
    loadProjects()
  }

  async function handleMoveProjectMedia(id: string, index: number, direction: -1 | 1) {
    const target = projects.find((p) => p.id === id)
    if (!target) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= target.media.length) return
    const nextMedia = [...target.media]
    ;[nextMedia[index], nextMedia[targetIndex]] = [nextMedia[targetIndex], nextMedia[index]]
    const { error } = await supabase.from('projects').update({ media: nextMedia }).eq('id', id)
    if (error) {
      alert('순서 변경 실패: ' + error.message)
      return
    }
    loadProjects()
  }

  async function handleAddYoutubeMedia(id: string) {
    const url = ytInput[id]?.trim()
    if (!url) return
    const target = projects.find((p) => p.id === id)
    if (!target) return
    const nextMedia: ProjectMediaItem[] = [...target.media, { type: 'youtube', url }]
    const { error } = await supabase.from('projects').update({ media: nextMedia }).eq('id', id)
    if (error) {
      alert('추가 실패: ' + error.message)
      return
    }
    setYtInput((d) => ({ ...d, [id]: '' }))
    loadProjects()
  }

  async function handleSaveOverview(id: string) {
    const draft = overviewDraft[id]
    const { error } = await supabase
      .from('projects')
      .update({
        team_size: draft?.team_size.trim() || null,
        main_duty: draft?.main_duty.trim() || null,
        role: draft?.role.trim() || null,
      })
      .eq('id', id)
    if (error) {
      alert('저장 실패: ' + error.message)
      return
    }
    loadProjects()
  }

  async function handleAddFeature(id: string) {
    const text = featureInput[id]?.trim()
    if (!text) return
    const target = projects.find((p) => p.id === id)
    if (!target) return
    const nextFeatures = [...target.features, text]
    const { error } = await supabase.from('projects').update({ features: nextFeatures }).eq('id', id)
    if (error) {
      alert('추가 실패: ' + error.message)
      return
    }
    setFeatureInput((d) => ({ ...d, [id]: '' }))
    loadProjects()
  }

  async function handleRemoveFeature(id: string, index: number) {
    const target = projects.find((p) => p.id === id)
    if (!target) return
    const nextFeatures = target.features.filter((_, i) => i !== index)
    const { error } = await supabase.from('projects').update({ features: nextFeatures }).eq('id', id)
    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }
    loadProjects()
  }

  async function handleAddTroubleshooting(id: string) {
    const draft = tsDraft[id]
    if (!draft?.title.trim() || !draft?.problem.trim() || !draft?.solution.trim()) return
    const target = projects.find((p) => p.id === id)
    if (!target) return
    const nextTs = [
      ...target.troubleshooting,
      { title: draft.title.trim(), problem: draft.problem.trim(), solution: draft.solution.trim() },
    ]
    const { error } = await supabase.from('projects').update({ troubleshooting: nextTs }).eq('id', id)
    if (error) {
      alert('추가 실패: ' + error.message)
      return
    }
    setTsDraft((d) => ({ ...d, [id]: { title: '', problem: '', solution: '' } }))
    loadProjects()
  }

  async function handleRemoveTroubleshooting(id: string, index: number) {
    const target = projects.find((p) => p.id === id)
    if (!target) return
    const nextTs = target.troubleshooting.filter((_, i) => i !== index)
    const { error } = await supabase.from('projects').update({ troubleshooting: nextTs }).eq('id', id)
    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }
    loadProjects()
  }

  async function handleAddProjectLink(id: string) {
    const draft = linkDraft[id]
    if (!draft?.label.trim() || !draft?.url.trim()) return
    const target = projects.find((p) => p.id === id)
    if (!target) return
    const nextLinks = [...target.links, { label: draft.label.trim(), url: draft.url.trim() }]
    const { error } = await supabase.from('projects').update({ links: nextLinks }).eq('id', id)
    if (error) {
      alert('링크 추가 실패: ' + error.message)
      return
    }
    setLinkDraft((d) => ({ ...d, [id]: { label: '', url: '' } }))
    loadProjects()
  }

  async function handleRemoveProjectLink(id: string, index: number) {
    const target = projects.find((p) => p.id === id)
    if (!target) return
    const nextLinks = target.links.filter((_, i) => i !== index)
    const { error } = await supabase.from('projects').update({ links: nextLinks }).eq('id', id)
    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }
    loadProjects()
  }

  function addNewProjectLink() {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return
    setNewProjectLinks((links) => [...links, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }])
    setNewLinkLabel('')
    setNewLinkUrl('')
  }

  function removeNewProjectLink(index: number) {
    setNewProjectLinks((links) => links.filter((_, i) => i !== index))
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError(error.message)
  }

  async function handleAddProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setSaving(true)
    const techStack = techStackInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    let media: ProjectMediaItem[] = []
    try {
      if (newProjectFiles.length > 0) {
        media = await Promise.all(newProjectFiles.map(fileToMediaItem))
      }
    } catch (err) {
      setSaving(false)
      alert('업로드 실패: ' + (err as Error).message)
      return
    }
    if (newYoutubeUrl.trim()) {
      media = [...media, { type: 'youtube', url: newYoutubeUrl.trim() }]
    }

    const { error } = await supabase.from('projects').insert({
      title: title.trim(),
      period: period.trim() || null,
      team_size: teamSize.trim() || null,
      main_duty: mainDuty.trim() || null,
      role: role.trim() || null,
      description: description.trim(),
      tech_stack: techStack,
      media,
      links: newProjectLinks,
      sort_order: projects.length + 1,
    })

    setSaving(false)
    if (error) {
      alert('저장 실패: ' + error.message)
      return
    }

    setTitle('')
    setPeriod('')
    setTeamSize('')
    setMainDuty('')
    setRole('')
    setDescription('')
    setTechStackInput('')
    setNewProjectFiles([])
    setNewYoutubeUrl('')
    setNewProjectLinks([])
    loadProjects()
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('이 프로젝트를 삭제할까요?')) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }
    loadProjects()
  }

  if (loading) return <main className="admin-shell">불러오는 중...</main>

  if (!session) {
    return (
      <main className="admin-shell max-w-[360px]">
        <h2>관리자 로그인</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">로그인</button>
          {loginError && <p className="text-red-600">{loginError}</p>}
        </form>
      </main>
    )
  }

  // ref(어느 회사 경로로 들어왔는지)별 집계
  const refCounts = visits.reduce<Record<string, number>>((acc, v) => {
    const key = v.ref || '(직접 방문)'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <main className="admin-shell">
      <h2>프로필</h2>

      <section className="mb-10">
        <div className="admin-photo-row">
          {profile?.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo_url} alt="프로필 사진 미리보기" className="admin-photo-preview" />
          )}
          <div>
            <input type="file" accept="image/*" onChange={handlePhotoFileChange} disabled={uploadingPhoto} />
            {uploadingPhoto && <p className="mt-1 text-[0.85rem]">업로드 중...</p>}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-2.5">
          <textarea
            placeholder="자기소개"
            value={introInput}
            onChange={(e) => setIntroInput(e.target.value)}
            rows={5}
          />

          <input
            placeholder="전화번호 (예: 010-1234-5678)"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
          />

          <h3 className="mt-2">기술 스택 (카테고리별)</h3>
          {skillCategories.map((cat, idx) => (
            <div className="admin-skill-category" key={idx}>
              <div className="admin-skill-category-head">
                <input
                  value={cat.category}
                  onChange={(e) => updateSkillCategoryName(idx, e.target.value)}
                />
                <button type="button" onClick={() => removeSkillCategory(idx)}>
                  카테고리 삭제
                </button>
              </div>

              <p className="admin-skill-group-label">주력</p>
              <div className="admin-tag-input-row">
                <input
                  placeholder="예: React"
                  value={skillTagInput[`${idx}:primary`] ?? ''}
                  onChange={(e) =>
                    setSkillTagInput((d) => ({ ...d, [`${idx}:primary`]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkillTag(idx, 'primary')
                    }
                  }}
                />
                <button type="button" onClick={() => addSkillTag(idx, 'primary')}>
                  추가
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.primary.map((t) => (
                  <span className={`${TECH_TAG_CLASS} inline-flex items-center gap-1.5`} key={t}>
                    {t}
                    <button
                      type="button"
                      className="!bg-transparent !p-0 !text-sm !font-normal !text-accent-dim"
                      onClick={() => removeSkillTag(idx, 'primary', t)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <p className="admin-skill-group-label">학습·경험</p>
              <div className="admin-tag-input-row">
                <input
                  placeholder="예: TypeScript"
                  value={skillTagInput[`${idx}:learning`] ?? ''}
                  onChange={(e) =>
                    setSkillTagInput((d) => ({ ...d, [`${idx}:learning`]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkillTag(idx, 'learning')
                    }
                  }}
                />
                <button type="button" onClick={() => addSkillTag(idx, 'learning')}>
                  추가
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.learning.map((t) => (
                  <span className={`${TECH_TAG_CLASS} inline-flex items-center gap-1.5`} key={t}>
                    {t}
                    <button
                      type="button"
                      className="!bg-transparent !p-0 !text-sm !font-normal !text-accent-dim"
                      onClick={() => removeSkillTag(idx, 'learning', t)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <button type="button" onClick={addSkillCategory} className="self-start">
            카테고리 추가
          </button>

          <h3 className="mt-2">이력 (학력·자격증·경력·수상)</h3>
          {resumeItems.map((item, idx) => (
            <div className="admin-resume-item" key={idx}>
              <select
                value={item.category}
                onChange={(e) => updateResumeItem(idx, 'category', e.target.value)}
              >
                <option value="학력">학력</option>
                <option value="자격증">자격증</option>
                <option value="경력">경력</option>
                <option value="수상">수상</option>
              </select>
              <input
                placeholder="기간 (예: 2020.03~2026.02)"
                value={item.period}
                onChange={(e) => updateResumeItem(idx, 'period', e.target.value)}
              />
              <input
                placeholder="내용"
                value={item.title}
                onChange={(e) => updateResumeItem(idx, 'title', e.target.value)}
              />
              <button type="button" onClick={() => removeResumeItem(idx)}>
                삭제
              </button>
            </div>
          ))}
          <button type="button" onClick={addResumeItem} className="self-start">
            이력 추가
          </button>

          <button type="submit" disabled={savingProfile} className="mt-2 self-start">
            {savingProfile ? '저장 중...' : '프로필 저장'}
          </button>
        </form>
      </section>

      <h2>프로젝트 관리</h2>

      <section className="mb-8">
        <h3>새 프로젝트 추가</h3>
        <form onSubmit={handleAddProject} className="mt-3 flex flex-col gap-2.5">
          <input
            placeholder="프로젝트명"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            placeholder="기간 (예: 2025.09 – 2025.10)"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
          <input
            placeholder="인원 (예: 6명)"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
          />
          <input
            placeholder="주요 업무 (예: 백엔드 담당)"
            value={mainDuty}
            onChange={(e) => setMainDuty(e.target.value)}
          />
          <input
            placeholder="담당 역할"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <textarea
            placeholder="설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <input
            placeholder="기술 스택 (쉼표로 구분, 예: React, Spring Boot, MySQL)"
            value={techStackInput}
            onChange={(e) => setTechStackInput(e.target.value)}
          />
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => setNewProjectFiles(Array.from(e.target.files ?? []))}
          />
          {newProjectFiles.length > 0 && (
            <p className="text-[0.85rem] text-muted">{newProjectFiles.length}개 선택됨</p>
          )}
          <input
            placeholder="유튜브 시연 영상 링크 (선택)"
            value={newYoutubeUrl}
            onChange={(e) => setNewYoutubeUrl(e.target.value)}
          />

          <div className="admin-link-row">
            <input
              placeholder="링크 라벨 (예: GitHub)"
              value={newLinkLabel}
              onChange={(e) => setNewLinkLabel(e.target.value)}
            />
            <input
              placeholder="URL"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
            />
            <button type="button" onClick={addNewProjectLink}>
              링크 추가
            </button>
          </div>
          {newProjectLinks.length > 0 && (
            <div className="admin-link-list">
              {newProjectLinks.map((l, idx) => (
                <div className="admin-link-item" key={idx}>
                  <span>
                    {l.label} — {l.url}
                  </span>
                  <button type="button" onClick={() => removeNewProjectLink(idx)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </button>
        </form>
      </section>

      <section className="mb-10">
        <h3>등록된 프로젝트 ({projects.length})</h3>
        {projects.map((p) => (
          <div
            key={p.id}
            className="mt-2.5 flex items-start justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div>
              <strong>{p.title}</strong>
              {p.period && <span className="ml-2 text-muted">{p.period}</span>}
              <p className="mt-1 text-[0.9rem]">{p.description}</p>

              <div className="admin-resume-item grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  placeholder="인원 (예: 6명)"
                  value={overviewDraft[p.id]?.team_size ?? p.team_size ?? ''}
                  onChange={(e) =>
                    setOverviewDraft((d) => ({
                      ...d,
                      [p.id]: {
                        team_size: e.target.value,
                        main_duty: d[p.id]?.main_duty ?? p.main_duty ?? '',
                        role: d[p.id]?.role ?? p.role ?? '',
                      },
                    }))
                  }
                />
                <input
                  placeholder="주요 업무"
                  value={overviewDraft[p.id]?.main_duty ?? p.main_duty ?? ''}
                  onChange={(e) =>
                    setOverviewDraft((d) => ({
                      ...d,
                      [p.id]: {
                        team_size: d[p.id]?.team_size ?? p.team_size ?? '',
                        main_duty: e.target.value,
                        role: d[p.id]?.role ?? p.role ?? '',
                      },
                    }))
                  }
                />
                <input
                  placeholder="담당 역할"
                  value={overviewDraft[p.id]?.role ?? p.role ?? ''}
                  onChange={(e) =>
                    setOverviewDraft((d) => ({
                      ...d,
                      [p.id]: {
                        team_size: d[p.id]?.team_size ?? p.team_size ?? '',
                        main_duty: d[p.id]?.main_duty ?? p.main_duty ?? '',
                        role: e.target.value,
                      },
                    }))
                  }
                />
                <button type="button" onClick={() => handleSaveOverview(p.id)}>
                  저장
                </button>
              </div>

              <p className="admin-skill-group-label">구현 기능</p>
              {p.features.length > 0 && (
                <div className="admin-link-list">
                  {p.features.map((f, idx) => (
                    <div className="admin-link-item" key={idx}>
                      <span>{f}</span>
                      <button type="button" onClick={() => handleRemoveFeature(p.id, idx)}>
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="admin-link-row">
                <input
                  placeholder="구현 기능 추가"
                  value={featureInput[p.id] ?? ''}
                  onChange={(e) => setFeatureInput((d) => ({ ...d, [p.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddFeature(p.id)
                    }
                  }}
                />
                <button type="button" onClick={() => handleAddFeature(p.id)}>
                  추가
                </button>
              </div>

              <p className="admin-skill-group-label">트러블슈팅</p>
              {p.troubleshooting.length > 0 && (
                <div className="admin-link-list">
                  {p.troubleshooting.map((t, idx) => (
                    <div className="admin-link-item" key={idx}>
                      <span>{t.title}</span>
                      <button type="button" onClick={() => handleRemoveTroubleshooting(p.id, idx)}>
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 flex flex-col gap-1.5">
                <input
                  placeholder="제목"
                  value={tsDraft[p.id]?.title ?? ''}
                  onChange={(e) =>
                    setTsDraft((d) => ({
                      ...d,
                      [p.id]: {
                        title: e.target.value,
                        problem: d[p.id]?.problem ?? '',
                        solution: d[p.id]?.solution ?? '',
                      },
                    }))
                  }
                />
                <input
                  placeholder="문제"
                  value={tsDraft[p.id]?.problem ?? ''}
                  onChange={(e) =>
                    setTsDraft((d) => ({
                      ...d,
                      [p.id]: {
                        title: d[p.id]?.title ?? '',
                        problem: e.target.value,
                        solution: d[p.id]?.solution ?? '',
                      },
                    }))
                  }
                />
                <input
                  placeholder="해결"
                  value={tsDraft[p.id]?.solution ?? ''}
                  onChange={(e) =>
                    setTsDraft((d) => ({
                      ...d,
                      [p.id]: {
                        title: d[p.id]?.title ?? '',
                        problem: d[p.id]?.problem ?? '',
                        solution: e.target.value,
                      },
                    }))
                  }
                />
                <button type="button" onClick={() => handleAddTroubleshooting(p.id)} className="self-start">
                  트러블슈팅 추가
                </button>
              </div>

              {p.media.length > 0 && (
                <div className="admin-project-images">
                  {p.media.map((item, idx) => (
                    <div key={idx} className="admin-project-image-item">
                      {item.type === 'video' ? (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video
                          src={item.url}
                          muted
                          preload="metadata"
                          className="admin-project-thumb"
                        />
                      ) : item.type === 'youtube' ? (
                        <div className="admin-project-thumb flex items-center justify-center bg-[#111] text-[0.7rem] text-white">
                          YouTube
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt={`${p.title} 이미지 ${idx + 1}`}
                          className="admin-project-thumb"
                        />
                      )}
                      <div className="admin-project-image-actions">
                        <button
                          type="button"
                          onClick={() => handleMoveProjectMedia(p.id, idx, -1)}
                          disabled={idx === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveProjectMedia(p.id, idx, 1)}
                          disabled={idx === p.media.length - 1}
                        >
                          ↓
                        </button>
                        <button type="button" onClick={() => handleRemoveProjectMedia(p.id, idx)}>
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => {
                  handleAddProjectMedia(p.id, e.target.files)
                  e.target.value = ''
                }}
                disabled={uploadingProjectImageId === p.id}
                className="mt-2"
              />
              {uploadingProjectImageId === p.id && <p className="mt-1 text-[0.8rem]">업로드 중...</p>}
              <div className="admin-link-row">
                <input
                  placeholder="유튜브 시연 영상 링크"
                  value={ytInput[p.id] ?? ''}
                  onChange={(e) => setYtInput((d) => ({ ...d, [p.id]: e.target.value }))}
                />
                <button type="button" onClick={() => handleAddYoutubeMedia(p.id)}>
                  추가
                </button>
              </div>

              {p.links.length > 0 && (
                <div className="admin-link-list">
                  {p.links.map((l, idx) => (
                    <div className="admin-link-item" key={idx}>
                      <span>
                        {l.label} — {l.url}
                      </span>
                      <button type="button" onClick={() => handleRemoveProjectLink(p.id, idx)}>
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="admin-link-row">
                <input
                  placeholder="링크 라벨 (예: GitHub)"
                  value={linkDraft[p.id]?.label ?? ''}
                  onChange={(e) =>
                    setLinkDraft((d) => ({ ...d, [p.id]: { label: e.target.value, url: d[p.id]?.url ?? '' } }))
                  }
                />
                <input
                  placeholder="URL"
                  value={linkDraft[p.id]?.url ?? ''}
                  onChange={(e) =>
                    setLinkDraft((d) => ({ ...d, [p.id]: { label: d[p.id]?.label ?? '', url: e.target.value } }))
                  }
                />
                <button type="button" onClick={() => handleAddProjectLink(p.id)}>
                  링크 추가
                </button>
              </div>
            </div>
            <button onClick={() => handleDeleteProject(p.id)} className="flex-shrink-0 bg-red-500">
              삭제
            </button>
          </div>
        ))}
      </section>

      <h2>방문 통계</h2>

      <section>
        <h3>경로(ref)별 방문 수</h3>
        <ul>
          {Object.entries(refCounts).map(([ref, count]) => (
            <li key={ref}>
              {ref} — {count}회
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>최근 방문 기록</h3>
        <table>
          <thead>
            <tr>
              <th>시각</th>
              <th>경로(ref)</th>
              <th>페이지</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v) => (
              <tr key={v.id}>
                <td>{new Date(v.created_at).toLocaleString('ko-KR')}</td>
                <td>{v.ref || '-'}</td>
                <td>{v.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
