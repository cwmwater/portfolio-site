// simple-icons CDN (https://cdn.simpleicons.org) 슬러그 매핑. 매핑 없는 기술은 아이콘 없이 텍스트만 표시.
const TECH_ICON_SLUGS: Record<string, string> = {
  Java: 'openjdk',
  Python: 'python',
  JavaScript: 'javascript',
  'Spring / Spring Boot': 'springboot',
  FastAPI: 'fastapi',
  React: 'react',
  PyTorch: 'pytorch',
  Pandas: 'pandas',
  MySQL: 'mysql',
  Redis: 'redis',
  Git: 'git',
  Docker: 'docker',
  Linux: 'linux',
  Unity: 'unity',
}

export function techIconUrl(tech: string): string | null {
  const slug = TECH_ICON_SLUGS[tech]
  return slug ? `https://cdn.simpleicons.org/${slug}/1fbf9b` : null
}
