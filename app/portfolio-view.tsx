"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Download, Menu, X } from "lucide-react";
import type { Portfolio } from "../lib/portfolio";

export default function PortfolioView({ portfolio }: { portfolio: Portfolio }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 68, y: 24 });

  useEffect(() => {
    const update = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(distance > 0 ? window.scrollY / distance * 100 : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.13 });
    document.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
    return () => { window.removeEventListener("scroll", update); observer.disconnect(); };
  }, []);

  const initials = portfolio.name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  return <main className="portfolio-site" onPointerMove={event => setPointer({ x: event.clientX / window.innerWidth * 100, y: (event.clientY + window.scrollY) / document.documentElement.scrollHeight * 100 })}>
    <div className="pointer-aura" aria-hidden="true" style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }}/>
    <div className="scroll-progress" style={{ width: `${progress}%` }} />
    <header className="site-header">
      <a className="wordmark" href="#top" onClick={() => setMenuOpen(false)}><span className="wordmark-mark">{initials}</span><span>{portfolio.name}<small>PORTFOLIO / 2026</small></span></a>
      <nav className={menuOpen ? "site-nav open" : "site-nav"} aria-label="Main navigation">
        <button onClick={() => scrollTo("work")}>Work</button><button onClick={() => scrollTo("about")}>About</button>{portfolio.experience.length > 0 && <button onClick={() => scrollTo("experience")}>Experience</button>}<button onClick={() => scrollTo("contact")}>Contact</button>
      </nav>
      <a className="header-cta" href={`mailto:${portfolio.email}`}>Let&apos;s talk <ArrowUpRight size={16}/></a>
      <button className="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
    </header>

    <section className="portfolio-hero" id="top">
      <div className="hero-grid" aria-hidden="true"/>
      <div className="hero-orb hero-orb-one" aria-hidden="true"/><div className="hero-orb hero-orb-two" aria-hidden="true"/>
      <div className="hero-main">
        <div className="eyebrow"><span className="pulse-dot"/>{portfolio.availability}</div>
        <p className="hero-role">{portfolio.designation} <span>— {portfolio.location}</span></p>
        <div className="hero-kicker">ANGULAR × REACT × TYPESCRIPT</div>
        <h1>{portfolio.headline}</h1>
        <div className="hero-bottom"><p>{portfolio.introduction}</p><div className="hero-actions"><button onClick={() => scrollTo("work")}>Explore my work <ArrowUpRight size={18}/></button>{portfolio.cvUrl && <a href={portfolio.cvUrl} target="_blank" rel="noreferrer">Download CV <Download size={17}/></a>}</div></div>
      </div>
      <div className="hero-side" aria-hidden="true" style={{ transform: `translateY(${progress * .7}px)` }}><span>01 / INTRODUCTION</span><div className="monogram">{initials}</div><span>ENGINEERED FOR REAL-WORLD IMPACT</span></div>
      <div className="code-float code-float-one" aria-hidden="true">&lt;state /&gt;</div><div className="code-float code-float-two" aria-hidden="true">observable$</div><div className="code-float code-float-three" aria-hidden="true">{"{ scale: enterprise }"}</div>
      <button className="scroll-cue" onClick={() => scrollTo("work")}>Scroll to discover <ArrowDown size={17}/></button>
    </section>

    <section className="signal-bar" aria-label="Professional highlights"><div><strong>{portfolio.years}+</strong><span>Years delivering<br/>production software</span></div><div><strong>2</strong><span>Modern frontend<br/>ecosystems</span></div><div><strong>17+</strong><span>Enterprise Angular<br/>delivery</span></div><div><strong>E2E</strong><span>Architecture through<br/>production support</span></div></section>

    <div className="ticker" aria-label="Core skills"><div>{[...portfolio.skills, ...portfolio.skills].map((skill, index) => <span key={`${skill}-${index}`}>{skill}<i>✳</i></span>)}</div></div>
    <div className="motion-ribbon" aria-hidden="true"><div><span>SOFTWARE ENGINEERING</span><i>✦</i><span>ENTERPRISE ANGULAR</span><i>✦</i><span>REACTIVE SYSTEMS</span><i>✦</i><span>FULL-STACK DELIVERY</span><i>✦</i><span>SOFTWARE ENGINEERING</span><i>✦</i><span>ENTERPRISE ANGULAR</span><i>✦</i></div></div>

    <section className="section-wrap work-section" id="work"><div className="section-heading" data-reveal><div><span className="section-index">01 / SELECTED WORK</span><h2>Work with <em>purpose.</em></h2></div><p>Products built to solve real problems and make every interaction count.</p></div>
      <div className="project-grid">{portfolio.projects.map((project, index) => <article className={`project-card theme-${project.theme}`} key={project.id} data-reveal>
        <div className="project-info"><div className="project-top"><span>CASE STUDY / {String(index + 1).padStart(2, "0")}</span><span className="project-category">{project.category}</span></div><div><h3>{project.title}</h3><p>{project.summary}</p></div><div className="project-stack">{project.stack.map(tag => <span key={tag}>{tag}</span>)}</div>{project.url ? <a className="project-link" href={project.url} target="_blank" rel="noreferrer">Explore live project <ArrowUpRight size={19}/></a> : <span className="project-link project-link-muted">Case study in progress</span>}</div>
        <div className="project-art" aria-hidden="true"><div className="mock-browser"><div className="mock-toolbar"><i/><i/><i/><span>{project.url ? new URL(project.url).hostname : `${project.title.toLowerCase().replace(/\s+/g, "-")}.app`}</span></div>{project.id === "online-food" ? <div className="mock-content food-mock"><div className="mock-app-nav"><b>goodfood<span>.</span></b><span>Discover　 Restaurants　 Offers</span><i/></div><div className="food-mock-body"><div className="food-mock-copy"><small>GOOD FOOD, GOOD MOOD</small><strong>Cravings meet<br/>their match.</strong><div className="mock-search">What are you craving today?　⌕</div></div><div className="food-bowl"><span>✺</span></div></div><div className="food-mini"><i/><i/><i/><i/></div></div> : project.id === "scenepass" ? <div className="mock-content scene-mock"><div className="mock-app-nav"><b>SCENE<span>PASS</span></b><span>Explore　 Events　 Experiences</span><i/></div><div className="scene-mock-body"><div className="scene-poster"><span>LIVE / 2026</span><strong>THE<br/>NEXT<br/>SCENE</strong><small>Discover what moves you →</small></div><div className="scene-side"><span>01 / FEATURED</span><div/><div/><div/></div></div></div> : <div className="mock-content generic-mock"><span>FEATURED PROJECT</span><strong>{project.title}</strong><small>{project.category}</small><div className="generic-shapes"><i/><i/><i/></div></div>}</div></div>
      </article>)}</div>
      {portfolio.projects.length === 0 && <p className="empty-copy">Selected work is coming soon.</p>}
    </section>

    <section className="about-section" id="about"><div className="section-wrap"><div className="about-grid"><div data-reveal><span className="section-index">02 / ENGINEERING PROFILE</span><h2>Architecture first.<br/><em>Experience always.</em></h2></div><div className="about-copy" data-reveal><p>{portfolio.introduction}</p><div className="skills-list">{portfolio.skills.map(skill => <span key={skill}>{skill}</span>)}</div></div></div><div className="capability-grid"><article data-reveal><span>01</span><strong>State architecture</strong><p>Predictable NgRx stores, selectors and effects for multi-step, business-critical journeys.</p></article><article data-reveal><span>02</span><strong>Reactive systems</strong><p>RxJS orchestration that prevents redundant requests and keeps asynchronous interfaces resilient.</p></article><article data-reveal><span>03</span><strong>Design engineering</strong><p>Responsive, accessible component systems that stay consistent as products and teams grow.</p></article><article data-reveal><span>04</span><strong>Full-stack delivery</strong><p>REST integrations, Node services, MongoDB data flows, CI/CD and production ownership.</p></article></div></div></section>

    {portfolio.experience.length > 0 && <section className="experience-section" id="experience"><div className="section-wrap"><div className="section-heading" data-reveal><div><span className="section-index">03 / EXPERIENCE</span><h2>Enterprise systems.<br/><em>Built for production.</em></h2></div><p>Delivering business-critical insurance products from architecture and implementation through release and support.</p></div><div className="experience-list">{portfolio.experience.map(item => <article key={item.id} data-reveal><div className="experience-meta"><span className="live-dot"/>CURRENT POSITION<span>{item.period}</span><span>{item.location}</span></div><div className="experience-body"><div className="experience-intro"><p className="experience-company">{item.company}</p><h3>{item.role}</h3><p>{item.description}</p><div className="experience-stack"><span>Angular</span><span>TypeScript</span><span>RxJS</span><span>NgRx</span><span>React</span><span>AWS</span></div></div><div className="experience-outcomes"><p className="outcomes-label">SELECTED CONTRIBUTIONS</p><ul>{item.highlights?.map((highlight, index) => <li key={highlight}><span>{String(index + 1).padStart(2, "0")}</span>{highlight}</li>)}</ul></div></div></article>)}</div></div></section>}

    <section className="contact-section" id="contact"><div className="section-wrap contact-inner" data-reveal><span className="section-index">{portfolio.experience.length > 0 ? "04" : "03"} / LET&apos;S CONNECT</span><h2>Have something<br/><em>worth building?</em></h2><a className="email-link" href={`mailto:${portfolio.email}`}>{portfolio.email}<ArrowUpRight/></a><div className="contact-footer"><span>{portfolio.name} · {portfolio.designation}</span><div>{portfolio.github && <a href={portfolio.github} target="_blank" rel="noreferrer"><ArrowUpRight size={17}/> GitHub</a>}{portfolio.linkedin && <a href={portfolio.linkedin} target="_blank" rel="noreferrer"><ArrowUpRight size={17}/> LinkedIn</a>}{portfolio.cvUrl && <a href={portfolio.cvUrl} target="_blank" rel="noreferrer"><Download size={17}/> CV</a>}</div></div></div></section>
    <footer className="site-footer"><span>© {new Date().getFullYear()} {portfolio.name}</span><span>Software engineered with intention.</span><a href="/owner-login">Owner studio <ArrowRight size={14}/></a></footer>
  </main>;
}
