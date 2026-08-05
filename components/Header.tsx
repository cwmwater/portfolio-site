export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-light/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[880px] items-center justify-between px-6">
        <span className="font-mono text-[0.95rem] font-bold tracking-tight text-dark">
          cwm<span className="text-accent">.</span>dev
        </span>
        <nav className="flex gap-6 text-sm text-muted max-md:hidden">
          <a href="#about" className="transition-colors hover:text-accent">
            소개
          </a>
          <a href="#skills" className="transition-colors hover:text-accent">
            기술
          </a>
          <a href="#archiving" className="transition-colors hover:text-accent">
            Archiving
          </a>
          <a href="#projects" className="transition-colors hover:text-accent">
            프로젝트
          </a>
        </nav>
      </div>
    </header>
  )
}
