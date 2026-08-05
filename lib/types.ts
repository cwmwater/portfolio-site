export interface Visit {
  id: string
  path: string
  ref: string | null
  referrer: string | null
  created_at: string
}

export interface ProjectMediaItem {
  type: 'image' | 'video' | 'youtube'
  url: string
}

export interface ProjectLink {
  label: string
  url: string
}

export interface ProjectTroubleshootingItem {
  title: string
  problem: string
  solution: string
}

export interface Project {
  id: string
  title: string
  period: string | null
  description: string
  tech_stack: string[]
  team_size: string | null
  main_duty: string | null
  role: string | null
  features: string[]
  troubleshooting: ProjectTroubleshootingItem[]
  media: ProjectMediaItem[]
  links: ProjectLink[]
  is_featured: boolean
  sort_order: number
  created_at: string
}

export interface SkillCategory {
  category: string
  primary: string[]
  learning: string[]
}

export interface ResumeItem {
  category: string
  period: string
  title: string
}

export interface Profile {
  id: number
  photo_url: string | null
  hero_image_url: string | null
  phone: string | null
  birthdate: string | null
  location: string | null
  intro: string
  skill_categories: SkillCategory[]
  resume_items: ResumeItem[]
  updated_at: string
}
