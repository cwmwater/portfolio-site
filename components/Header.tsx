export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-light/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[880px] items-center justify-between px-6">
        <span className="font-mono text-[0.95rem] font-bold tracking-tight">
          cwm<span className="text-accent-dim">.</span>dev
        </span>
        <nav className="flex gap-6 text-sm text-muted max-md:hidden">
          <a href="#about" className="hover:text-dark">
            소개
          </a>
          <a href="#resume" className="hover:text-dark">
            이력
          </a>
          <a href="#projects" className="hover:text-dark">
            프로젝트
          </a>
          <a href="#contact" className="hover:text-dark">
            연락처
          </a>
        </nav>
      </div>
    </header>
  )
}
