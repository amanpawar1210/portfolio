import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, Award, Check, ChevronLeft, ChevronRight, Clock, Cloud, Copy, Download, Gauge, GraduationCap, Layers, MapPin, Monitor, Palette, Quote, ServerCog, ShieldCheck, Sparkles, Trophy, Workflow } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "./site/BrandIcons";
import type { Portfolio, Project, Stat } from "../lib/types";
import { fileUrl } from "../lib/api";
import { useToast } from "../lib/context";
import { initials, prefersReducedMotion, useActiveSection, useCountUp, useLocalTime, useReveal, useTypewriter } from "../lib/hooks";
import { track } from "../lib/track";
import { SiteChrome, sectionsFor, useSectionNav } from "./site/Chrome";
import ProjectArt from "./site/ProjectArt";
import ContactForm from "./site/ContactForm";
import { Intro, Ticker, useMotionEffects, usePointerTilt } from "../lib/motion";

export default function PortfolioView({ portfolio }: { portfolio: Portfolio }) {
  const sections = sectionsFor(portfolio);
  const active = useActiveSection(["top", ...sections.map(section => section.id)]);
  const number = (id: string) => String(sections.findIndex(section => section.id === id) + 1).padStart(2, "0");
  useReveal([portfolio]);
  useMotionEffects([portfolio]);

  return <SiteChrome portfolio={portfolio} active={active}>
    <Intro name={portfolio.name}/>
    <Hero portfolio={portfolio}/>
    <Ticker items={portfolio.skills}/>
    {portfolio.stats.length > 0 && <section className="stats-bar" aria-label="Highlights">{portfolio.stats.map((stat, index) => <StatTile key={index} stat={stat}/>)}</section>}
    <Work portfolio={portfolio} index={number("work")}/>
    <About portfolio={portfolio} index={number("about")}/>
    {portfolio.experience.length > 0 && <ExperienceSection portfolio={portfolio} index={number("experience")}/>}
    {sections.some(section => section.id === "credentials") && <Credentials portfolio={portfolio} index={number("credentials")}/>}
    {portfolio.testimonials.length > 0 && <Testimonials portfolio={portfolio}/>}
    <Contact portfolio={portfolio} index={number("contact")}/>
  </SiteChrome>;
}

function Hero({ portfolio }: { portfolio: Portfolio }) {
  const goTo = useSectionNav();
  const role = useTypewriter(portfolio.roles.length ? portfolio.roles : [portfolio.designation]);
  const time = useLocalTime(portfolio.timezone);
  const tilt = usePointerTilt<HTMLElement>(10);
  // Text wrapped in *asterisks* is highlighted, e.g. "I turn complex workflows into *fast, reliable* products."
  const plainHeadline = portfolio.headline.replace(/\*/g, "");
  const words = portfolio.headline.split("*").flatMap((part, segment) => part.split(" ").filter(Boolean).map(text => ({ text, accent: segment % 2 === 1 })));
  const featured = portfolio.projects.slice(0, 3);

  return <section className="hero" id="top">
    <div className="hero-glow" aria-hidden="true"/>
    <div className="hero-main">
      <div className="hero-badges">
        <span className={portfolio.openToWork ? "badge badge-live" : "badge"}><span className="pulse-dot"/>{portfolio.openToWork ? "Open to new opportunities" : portfolio.availability}</span>
        {time && <span className="badge badge-quiet"><Clock size={13}/>{time} in {portfolio.location.split(",")[0] || "my city"}</span>}
      </div>
      <p className="hero-role">{portfolio.designation} <span aria-hidden="true">·</span> <span className="typewriter" aria-label={portfolio.roles.join(", ")}>{role}<i aria-hidden="true"/></span></p>
      <h1 aria-label={plainHeadline}>{words.map((word, index) => <span key={index} className={word.accent ? "word accent" : "word"} aria-hidden="true" style={{ animationDelay: `${120 + index * 55}ms` }}>{word.text}{" "}</span>)}</h1>
      <p className="hero-intro">{portfolio.introduction}</p>
      <div className="hero-actions">
        <button className="primary-button" data-magnetic="0.25" onClick={() => goTo("work")}>Explore my work <ArrowDown size={17}/></button>
        {portfolio.cvUrl
          ? <a className="ghost-button" data-magnetic="0.25" href={fileUrl(`${portfolio.cvUrl}?download=1`)} onClick={() => track("cv")}>Download CV <Download size={16}/></a>
          : <a className="ghost-button" data-magnetic="0.25" href="/#contact" onClick={event => { event.preventDefault(); goTo("contact"); }}>Get in touch <ArrowUpRight size={16}/></a>}
        <div className="hero-socials">
          {portfolio.github && <a href={portfolio.github} target="_blank" rel="noreferrer" aria-label="GitHub" onClick={() => track("outbound", "github")}><GithubIcon size={18}/></a>}
          {portfolio.linkedin && <a href={portfolio.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" onClick={() => track("outbound", "linkedin")}><LinkedinIcon size={18}/></a>}
        </div>
      </div>
    </div>

    <aside className="hero-card" aria-label="Profile summary" ref={tilt}>
      <div className="profile-card">
        <div className="profile-top">
          <div className="avatar-ring">{portfolio.photo ? <img src={fileUrl(portfolio.photo)} alt={portfolio.name}/> : <span>{initials(portfolio.name)}</span>}</div>
          <div className="profile-id">
            <strong>{portfolio.name}</strong>
            <span>{portfolio.designation}</span>
            {portfolio.location && <small><MapPin size={13}/>{portfolio.location}</small>}
          </div>
        </div>
        <dl className="profile-facts">
          <div><dt>Experience</dt><dd>{portfolio.years}+ yrs</dd></div>
          <div><dt>Projects</dt><dd>{portfolio.projects.length}</dd></div>
          <div><dt>Skills</dt><dd>{portfolio.skills.length}+</dd></div>
        </dl>
        <pre className="profile-code"><code>
          <span className="tk-key">const</span> <span className="tk-var">{(portfolio.name.split(" ")[0] || "me").toLowerCase()}</span> = {"{"}{"\n"}
          {"  "}stack: [{portfolio.skills.slice(0, 3).map((skill, index) => <span key={skill}><span className="tk-str">"{skill.replace(/\s*[\d–-]+$/, "")}"</span>{index < Math.min(3, portfolio.skills.length) - 1 ? ", " : ""}</span>)}],{"\n"}
          {"  "}openToWork: <span className="tk-key">{String(portfolio.openToWork)}</span>,{"\n"}
          {"}"};<span className="caret" aria-hidden="true"/>
        </code></pre>
      </div>
      {featured.length > 0 && <div className="hero-featured">
        <span>Recent work</span>
        {featured.map(project => <Link key={project.id} to={`/work/${project.id}`} viewTransition className={`hero-project theme-${project.theme}`}><i/>{project.title}<ArrowUpRight size={14}/></Link>)}
      </div>}
    </aside>

    <button className="scroll-cue" onClick={() => goTo("work")}><span>Scroll</span><ArrowDown size={15}/></button>
  </section>;
}

function StatTile({ stat }: { stat: Stat }) {
  const { ref, display } = useCountUp(stat.value);
  return <div className="stat" data-reveal><strong ref={ref as React.RefObject<HTMLElement>}>{display}</strong><span>{stat.label}</span></div>;
}

function SectionHeading({ index, kicker, title, accent, text }: { index: string; kicker: string; title: string; accent: string; text?: string }) {
  return <div className="section-heading" data-reveal>
    <div><span className="section-index" data-scramble>{index} / {kicker}</span><h2>{title}<br/><em>{accent}</em></h2></div>
    {text && <p>{text}</p>}
  </div>;
}

function Work({ portfolio, index }: { portfolio: Portfolio; index: string }) {
  const [filter, setFilter] = useState("All");
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    portfolio.projects.forEach(project => project.stack.forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return ["All", ...[...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag]) => tag)];
  }, [portfolio.projects]);
  const projects = filter === "All" ? portfolio.projects : portfolio.projects.filter(project => project.stack.includes(filter));
  useReveal([filter]);

  return <section className="section-wrap" id="work">
    <SectionHeading index={index} kicker="SELECTED WORK" title="Work with" accent="purpose." text="Products built to solve real problems. Open any project for the full case study."/>
    {portfolio.projects.length > 1 && <div className="filter-chips" role="toolbar" aria-label="Filter projects by technology">
      {tags.map(tag => <button key={tag} className={filter === tag ? "chip active" : "chip"} aria-pressed={filter === tag} onClick={() => setFilter(tag)}>{tag}{tag !== "All" && <em>{portfolio.projects.filter(project => project.stack.includes(tag)).length}</em>}</button>)}
    </div>}
    <div className="project-grid">{projects.map((project, i) => <ProjectCard key={project.id} project={project} index={portfolio.projects.indexOf(project)} wide={project.featured && i === 0 && projects.length > 2}/>)}</div>
    {portfolio.projects.length === 0 && <p className="empty-copy">Selected work is coming soon.</p>}
  </section>;
}

function ProjectCard({ project, index, wide }: { project: Project; index: number; wide: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const tilt = (event: PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion() || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--rx", `${((event.clientY - rect.top) / rect.height - 0.5) * -5}deg`);
    ref.current.style.setProperty("--ry", `${((event.clientX - rect.left) / rect.width - 0.5) * 6}deg`);
    ref.current.style.setProperty("--gx", `${event.clientX - rect.left}px`);
    ref.current.style.setProperty("--gy", `${event.clientY - rect.top}px`);
  };
  const reset = () => { ref.current?.style.setProperty("--rx", "0deg"); ref.current?.style.setProperty("--ry", "0deg"); };

  return <article ref={ref} className={`project-card theme-${project.theme}${wide ? " wide" : ""}`} data-reveal onPointerMove={tilt} onPointerLeave={reset}>
    <Link to={`/work/${project.id}`} viewTransition className="project-card-link" aria-label={`${project.title} case study`}/>
    <ProjectArt project={project} parallax/>
    <div className="project-info">
      <div className="project-top"><span>{String(index + 1).padStart(2, "0")} / {project.year || "CASE STUDY"}</span><span className="project-category">{project.category}</span></div>
      <h3>{project.title}{project.featured && <Sparkles size={16} aria-label="Featured"/>}</h3>
      <p>{project.summary}</p>
      <div className="tag-row">{project.stack.slice(0, 5).map(tag => <span key={tag}>{tag}</span>)}{project.stack.length > 5 && <span>+{project.stack.length - 5}</span>}</div>
      <div className="project-actions">
        <span className="text-link">Read case study <ArrowRight size={16}/></span>
        {project.url && <a className="text-link muted" href={project.url} target="_blank" rel="noreferrer" onClick={() => track("project_click", project.id)}>Live <ArrowUpRight size={15}/></a>}
      </div>
    </div>
  </article>;
}

const CAPABILITY_ICONS = [<Layers size={20}/>, <Workflow size={20}/>, <Palette size={20}/>, <ServerCog size={20}/>, <Gauge size={20}/>, <ShieldCheck size={20}/>];

// Pick an icon from the group's name; anything unrecognised gets a sparkle.
const GROUP_ICONS: [RegExp, React.ReactNode][] = [
  [/front|ui|web|client/i, <Monitor size={15}/>],
  [/state|data|api/i, <Workflow size={15}/>],
  [/back|server|database|db/i, <ServerCog size={15}/>],
  [/cloud|devops|delivery|deploy|tool/i, <Cloud size={15}/>],
  [/design|ux/i, <Palette size={15}/>],
  [/test|quality|qa/i, <ShieldCheck size={15}/>],
];
const groupIcon = (label: string) => GROUP_ICONS.find(([match]) => match.test(label))?.[1] ?? <Sparkles size={15}/>;

function About({ portfolio, index }: { portfolio: Portfolio; index: string }) {
  return <section className="about-section" id="about"><div className="section-wrap">
    <div className="about-grid">
      <div data-reveal><span className="section-index" data-scramble>{index} / ENGINEERING PROFILE</span><h2>Architecture first.<br/><em>Experience always.</em></h2></div>
      <div className="about-copy" data-reveal>
        <p>{portfolio.introduction}</p>
        <div className="skill-groups">{portfolio.skillGroups.filter(group => group.skills.length).map(group => <div key={group.id} className="skill-group" data-reveal>
          <span className="skill-group-label">{groupIcon(group.label)}{group.label}</span>
          <div className="skills-cloud">{group.skills.map((skill, i) => <span key={skill} style={{ transitionDelay: `${i * 45}ms` }}>{skill}</span>)}</div>
        </div>)}</div>
      </div>
    </div>
    {portfolio.capabilities.length > 0 && <div className="capability-grid">{portfolio.capabilities.map((item, i) => <article key={item.title} data-reveal style={{ transitionDelay: `${i * 70}ms` }}><div className="capability-head"><span className="capability-icon">{CAPABILITY_ICONS[i % CAPABILITY_ICONS.length]}</span><span>{String(i + 1).padStart(2, "0")}</span></div><strong>{item.title}</strong><p>{item.text}</p></article>)}</div>}
  </div></section>;
}

function ExperienceSection({ portfolio, index }: { portfolio: Portfolio; index: string }) {
  const [open, setOpen] = useState<string>(portfolio.experience[0]?.id ?? "");
  return <section className="section-wrap" id="experience">
    <SectionHeading index={index} kicker="EXPERIENCE" title="Enterprise systems." accent="Built for production." text="From architecture and implementation through release and support."/>
    <ol className="timeline">{portfolio.experience.map(item => {
      const expanded = open === item.id;
      return <li key={item.id} className={expanded ? "timeline-item open" : "timeline-item"} data-reveal>
        <div className="timeline-dot" aria-hidden="true">{item.current && <span className="pulse-dot"/>}</div>
        <div className="timeline-card">
          <button className="timeline-head" aria-expanded={expanded} onClick={() => setOpen(expanded ? "" : item.id)}>
            <div><p className="timeline-meta">{item.current && <b>CURRENT</b>}{item.period}{item.location && <> · {item.location}</>}</p><h3>{item.role}</h3><p className="timeline-company">{item.company}</p></div>
            <ChevronRight size={20} className="timeline-chevron"/>
          </button>
          <div className="timeline-body"><div>
            <p>{item.description}</p>
            {item.highlights.length > 0 && <ul>{item.highlights.map((highlight, i) => <li key={i}><span>{String(i + 1).padStart(2, "0")}</span><p>{emphasize(highlight)}</p></li>)}</ul>}
            {item.stack.length > 0 && <div className="tag-row">{item.stack.map(tag => <span key={tag}>{tag}</span>)}</div>}
          </div></div>
        </div>
      </li>;
    })}</ol>
  </section>;
}

/** Renders text wrapped in *asterisks* as highlighted <strong>. */
function emphasize(text: string) {
  return text.split("*").map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
}

function Credentials({ portfolio, index }: { portfolio: Portfolio; index: string }) {
  return <section className="section-wrap" id="credentials">
    <SectionHeading index={index} kicker="CREDENTIALS" title="Always" accent="learning." text="Education, certifications and milestones along the way."/>
    <div className="credential-grid">
      {portfolio.education.map(item => <article key={item.id} className="credential" data-reveal><GraduationCap size={22}/><span>{item.period}</span><h3>{item.degree}</h3><p className="credential-org">{item.school}</p>{item.detail && <p>{item.detail}</p>}</article>)}
      {portfolio.certifications.map(item => <article key={item.id} className="credential" data-reveal><Award size={22}/><span>{item.year}</span><h3>{item.name}</h3><p className="credential-org">{item.issuer}</p>{item.url && <a className="text-link" href={item.url} target="_blank" rel="noreferrer">View credential <ArrowUpRight size={14}/></a>}</article>)}
      {portfolio.achievements.map(item => <article key={item.id} className="credential" data-reveal><Trophy size={22}/><span>{item.year}</span><h3>{item.title}</h3>{item.detail && <p>{item.detail}</p>}</article>)}
    </div>
  </section>;
}

function Testimonials({ portfolio }: { portfolio: Portfolio }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = portfolio.testimonials.length;
  useEffect(() => {
    if (count < 2 || paused || prefersReducedMotion()) return;
    const timer = setInterval(() => setCurrent(i => (i + 1) % count), 7000);
    return () => clearInterval(timer);
  }, [count, paused]);
  const item = portfolio.testimonials[Math.min(current, count - 1)];
  return <section className="testimonials" id="testimonials" aria-label="Testimonials" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <div className="section-wrap" data-reveal>
      <Quote size={40} className="quote-mark"/>
      <blockquote key={current} className="testimonial"><p>{item.quote}</p><footer><strong>{item.name}</strong><span>{item.role}</span></footer></blockquote>
      {count > 1 && <div className="testimonial-nav">
        <button className="icon-button" aria-label="Previous testimonial" onClick={() => setCurrent(i => (i - 1 + count) % count)}><ChevronLeft size={18}/></button>
        <div className="dots">{portfolio.testimonials.map((t, i) => <button key={t.id} aria-label={`Testimonial ${i + 1}`} aria-current={i === current} className={i === current ? "active" : ""} onClick={() => setCurrent(i)}/>)}</div>
        <button className="icon-button" aria-label="Next testimonial" onClick={() => setCurrent(i => (i + 1) % count)}><ChevronRight size={18}/></button>
      </div>}
    </div>
  </section>;
}

function Contact({ portfolio, index }: { portfolio: Portfolio; index: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const time = useLocalTime(portfolio.timezone);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(portfolio.email);
      setCopied(true); toast("Email copied to clipboard"); track("email_copy");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast("Couldn't copy — select the address instead", "error"); }
  };
  return <section className="contact-section" id="contact"><div className="section-wrap contact-grid">
    <div className="contact-intro" data-reveal>
      <span className="section-index" data-scramble>{index} / LET&apos;S CONNECT</span>
      <h2>Have something<br/><em>worth building?</em></h2>
      <p>Tell me about the role, product or idea. Messages land straight in my inbox.</p>
      {portfolio.email && <div className="email-row"><a className="email-link" href={`mailto:${portfolio.email}`}>{portfolio.email}</a><button className="icon-button" type="button" onClick={copy} aria-label="Copy email address">{copied ? <Check size={16}/> : <Copy size={16}/>}</button></div>}
      <ul className="contact-facts">
        {portfolio.location && <li><MapPin size={16}/>{portfolio.location}</li>}
        {time && <li><Clock size={16}/>{time} local time</li>}
      </ul>
      <div className="contact-links">
        {portfolio.github && <a href={portfolio.github} target="_blank" rel="noreferrer" onClick={() => track("outbound", "github")}><GithubIcon size={16}/> GitHub</a>}
        {portfolio.linkedin && <a href={portfolio.linkedin} target="_blank" rel="noreferrer" onClick={() => track("outbound", "linkedin")}><LinkedinIcon size={16}/> LinkedIn</a>}
        {portfolio.cvUrl && <a href={fileUrl(`${portfolio.cvUrl}?download=1`)} onClick={() => track("cv")}><Download size={16}/> CV</a>}
      </div>
    </div>
    <div data-reveal><ContactForm ownerName={portfolio.name}/></div>
  </div></section>;
}
