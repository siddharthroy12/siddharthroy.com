import { useEffect, useRef, useState } from 'react'

const PROJECTS = [
  {
    title: 'Noa',
    tags: 'Lightweight scripting language in Rust',
    year: '',
    link: 'https://github.com/siddharthroy12/noa',
  },
  {
    title: 'GlobeChat',
    tags: 'Chats on world map',
    year: '',
    link: 'https://globechat.live/',
  },
  {
    title: 'Timebrew',
    tags: 'A personal time tracker',
    year: '',
    link: 'https://github.com/siddharthroy12/timebrew',
  },
  {
    title: 'Gravity sandbox',
    tags: '2D Newtonian gravity simulator',
    year: '',
    link: 'https://gravity-sandbox.netlify.app/',
  },
  {
    title: 'Rockets',
    tags: 'Dodge rockets in retro style',
    year: '',
    link: 'https://www.lexaloffle.com/bbs/?pid=111184',
  },
]

const EXPERIENCE = [
  {
    title: 'Algo One',
    tags: 'Frontend & full-stack engineer',
    description:
      'Built frontends for various clients, plus a full-stack proctored-test application and a mobile app for GQFinXray.',
    year: 'APR 15, 2024 — NOW',
  },
  {
    title: 'Everlytics',
    tags: 'Frontend developer intern',
    description:
      'Built dashboards for internal and client projects with end-to-end automated testing.',
    year: 'OCT 25, 2022 — 2024',
  },
]

const AVAILABLE_FOR_WORK = false
const CONTACT_LINK = 'https://www.linkedin.com/in/reactoverflow/'

const SOCIALS = [
  { label: 'GITHUB', href: 'https://github.com/siddharthroy12' },
  { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/reactoverflow/' },
]

/* Adds .visible to .reveal elements once mounted (staggered via inline delays) */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const id = requestAnimationFrame(() =>
      els.forEach((el) => el.classList.add('visible')),
    )
    return () => cancelAnimationFrame(id)
  }, [])
}

function Clock() {
  // Start with a stable server/client value, then begin the live clock after
  // hydration so the prerendered HTML always matches the initial client render.
  const [now, setNow] = useState(null)
  useEffect(() => {
    const update = () => setNow(new Date())
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="mono muted">
      {now ? now.toLocaleTimeString('en-US', { hour12: false }) : '--:--:--'} LOCAL
    </span>
  )
}

function Glow() {
  const ref = useRef(null)
  useEffect(() => {
    const onMove = (e) => {
      if (!ref.current) return
      ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
  return <div className="glow" ref={ref} aria-hidden="true" />
}

function Marquee() {
  const items = [
    'FRONTEND',
    'BACKEND',
    'AUTOMATION',
    'GAMES',
    'LLMS',
    'AGENTIC CODING',
  ]
  /* Enough copies to keep the track wider than the viewport,
     so the -50% scroll loop never runs into empty space */
  const copies = [0, 1, 2, 3, 4, 5, 6, 7]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {copies.map((copy) =>
          items.map((t, i) => (
            <span key={`${copy}-${i}`}>
              {t}
              <em>✦</em>
            </span>
          )),
        )}
      </div>
    </div>
  )
}

export default function App() {
  useReveal()
  const [tab, setTab] = useState('experience')
  const items = tab === 'projects' ? PROJECTS : EXPERIENCE

  return (
    <div className="frame">
      <Glow />
      <div className="grain" aria-hidden="true" />

      <header className="nav">
        <a href="/" className="logo mono">
          SR<span className="accent">.</span>
        </a>
        <p className="kicker mono">
          <span className={`dot ${AVAILABLE_FOR_WORK ? '' : 'dot-off'}`} />
          {AVAILABLE_FOR_WORK ? 'AVAILABLE FOR WORK' : 'NOT AVAILABLE FOR WORK'}
        </p>
        <Clock />
      </header>

      <main className="board">
        <section className="left">
          <h1>
            <span className="line">
              <span style={{ animationDelay: '0.05s' }}>SIDDHARTH</span>
            </span>
            <span className="line">
              <span style={{ animationDelay: '0.18s' }}>
                ROY
              </span>
            </span>
          </h1>

          <div className="about reveal" style={{ transitionDelay: '0.35s' }}>
            <p className="mono muted label">ABOUT</p>
            <p className="about-text">
              I write software — web apps, mobile apps, automation, and
              everything in between. Currently building frontends (and the
              occasional full-stack app) at{' '}
              <span className="accent">Algo One</span>. Outside of code, I'm
              probably watching anime or playing games.
            </p>
            <ul className="skills">
              {[
                'Frontend',
                'Backend',
                'Automation',
                'Games',
                'LLMs',
                'Agentic Coding',
              ].map((s) => (
                <li key={s} className="mono">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <a
            className="big-link reveal"
            style={{ transitionDelay: '0.45s' }}
            href={CONTACT_LINK}
            target="_blank"
            rel="noreferrer"
          >
            LET&apos;S TALK
            <span className="arrow" aria-hidden="true">↗</span>
          </a>
        </section>

        <section className="right">
          <div className="section-head reveal" style={{ transitionDelay: '0.25s' }}>
            <div className="tabs mono">
              <button
                type="button"
                className={`tab ${tab === 'projects' ? 'active' : ''}`}
                onClick={() => setTab('projects')}
              >
                PROJECTS
              </button>
              <span className="muted">/</span>
              <button
                type="button"
                className={`tab ${tab === 'experience' ? 'active' : ''}`}
                onClick={() => setTab('experience')}
              >
                EXPERIENCE
              </button>
            </div>
            <span className="mono muted">
              / 01–{String(items.length).padStart(2, '0')}
            </span>
          </div>
          <div className="list-wrap reveal" style={{ transitionDelay: '0.3s' }}>
            <ul className="work-list" key={tab}>
              {items.map((p, i) => {
                const Row = p.link ? 'a' : 'div'
                const linkProps = p.link
                  ? {
                      href: p.link,
                      target: p.link.startsWith('http') ? '_blank' : undefined,
                      rel: p.link.startsWith('http') ? 'noreferrer' : undefined,
                    }
                  : {}

                return (
                  <li key={p.title}>
                    <Row
                      className={`work-row ${p.link ? '' : 'experience-row'}`}
                      {...linkProps}
                    >
                    <span className="mono num">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="work-main">
                      <span className="work-title">{p.title}</span>
                      <span className="mono tags">{p.tags}</span>
                      {p.description && (
                        <span className="mono work-description">
                          {p.description}
                        </span>
                      )}
                    </span>
                    <span className="mono year">{p.year}</span>
                    {p.link && <span className="arrow" aria-hidden="true">↗</span>}
                    </Row>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      </main>

      <Marquee />

      <footer className="footer mono">
        <span className="muted">© 2026 SIDDHARTH ROY</span>
        <div className="socials">
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
