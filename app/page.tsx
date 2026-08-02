import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CodeWindow from '@/components/CodeWindow'

export default function Home() {
  return (
    <>
      <Header />

      <section className="hero">
        <div className="container">
          <div>
            <p className="eyebrow">PORTFOLIO / FULLSTACK DEVELOPER</p>
            <h1>
              구조를 설계하고
              <br />
              연결하는 개발자, 최원민
            </h1>
            <p className="lede">
              React · Spring · FastAPI 기반 AI 연동 웹 서비스를 설계하고
              구현합니다. 화면 설계부터 데이터가 흐르는 구조까지, 전체를
              이해하고 만드는 것을 중요하게 생각합니다.
            </p>
            <div className="hero-links">
              <a className="btn btn-primary" href="#projects">
                프로젝트 보기
              </a>
              <a className="btn btn-ghost" href="mailto:jo08198@gmail.com">
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

      <section className="block about" id="about">
        <div className="container">
          <div className="section-head">
            <span className="num">01</span>
            <h2>자기소개</h2>
          </div>
          <p>
            React, Spring, FastAPI를 연동한 3계층 아키텍처를 직접 설계하고
            구현한 풀스택 개발자입니다. 단순히 기능을 구현하는 데 그치지
            않고, 서비스 전체 데이터 흐름을 이해하고 설계하는 것을 중요하게
            생각합니다. GPT API 연동 블로그 서비스에서 백엔드 개발을
            주도하며 AI 서비스 통합, OAuth2 기반 소셜 로그인 구축, 3계층
            통신 구조 설계까지 직접 경험했습니다.
          </p>
        </div>
      </section>

      <section className="block" id="projects">
        <div className="container">
          <div className="section-head">
            <span className="num">02</span>
            <h2>프로젝트</h2>
          </div>

          <div className="projects-grid">
            <CodeWindow filename="ai-blog-service.md" variant="light">
              <div className="project-title-row">
                <h3>AI 연동 블로그 웹 서비스</h3>
                <span className="project-period">2025.09 – 2025.10</span>
              </div>
              <p>
                GPT API를 활용해 블로그 마케팅 문구를 자동 생성하는 서비스.
                React → Spring → FastAPI 3계층 아키텍처를 설계하고, 단계별
                글 생성 플로우와 OAuth2 소셜 로그인, 관리자 페이지를
                구현했습니다.
              </p>
              <div className="tech-tags">
                {['React', 'Spring Boot', 'FastAPI', 'GPT API', 'OAuth2', 'MySQL'].map(
                  (t) => (
                    <span className="tech-tag" key={t}>
                      {t}
                    </span>
                  )
                )}
              </div>
            </CodeWindow>

            <CodeWindow filename="monster-ai-system.md" variant="light">
              <div className="project-title-row">
                <h3>게임 AI 몬스터 행동 시스템</h3>
                <span className="project-period">2025.08 – 2025.12</span>
              </div>
              <p>
                스게노 퍼지 추론으로 몬스터 행동 로직을 설계하고, PyTorch
                LSTM으로 학습시킨 모델을 ONNX 변환 후 Unity 엔진에 통합한
                게임 AI 시스템.
              </p>
              <div className="tech-tags">
                {['Python', 'PyTorch', 'LSTM', 'ONNX', 'Unity', 'C#'].map((t) => (
                  <span className="tech-tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </CodeWindow>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
