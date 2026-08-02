export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <span className="brand">
          cwm<span className="dot">.</span>dev
        </span>
        <nav className="nav-links">
          <a href="#about">소개</a>
          <a href="#projects">프로젝트</a>
          <a href="#contact">연락처</a>
        </nav>
      </div>
    </header>
  )
}
