import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, FolderGit2, Share2, X } from "lucide-react";
import { SiteChrome } from "../components/site/Chrome";
import ProjectArt from "../components/site/ProjectArt";
import { fileUrl } from "../lib/api";
import { usePortfolio, useToast } from "../lib/context";
import { useReveal } from "../lib/hooks";
import { useMotionEffects } from "../lib/motion";
import { track } from "../lib/track";
import { LoadingScreen, LoadError } from "./Home";
import NotFound from "./NotFound";

export default function ProjectPage() {
  const { id } = useParams();
  const { portfolio, error, reload } = usePortfolio();
  const toast = useToast();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const index = portfolio?.projects.findIndex(project => project.id === id) ?? -1;
  const project = portfolio && index >= 0 ? portfolio.projects[index] : null;

  useReveal([project]);
  useMotionEffects([project]);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  useEffect(() => {
    if (!project || !portfolio) return;
    document.title = `${project.title} — ${portfolio.name}`;
    track("project_view", project.id, true);
  }, [project, portfolio]);
  useEffect(() => {
    if (lightbox === null || !project) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox(i => i === null ? i : (i + 1) % project.gallery.length);
      if (event.key === "ArrowLeft") setLightbox(i => i === null ? i : (i - 1 + project.gallery.length) % project.gallery.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, project]);

  if (error) return <LoadError message={error} retry={reload}/>;
  if (!portfolio) return <LoadingScreen/>;
  if (!project) return <NotFound/>;

  const prev = portfolio.projects[(index - 1 + portfolio.projects.length) % portfolio.projects.length];
  const next = portfolio.projects[(index + 1) % portfolio.projects.length];
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: project.title, text: project.summary, url });
      else { await navigator.clipboard.writeText(url); toast("Link copied to clipboard"); }
    } catch { /* share dismissed */ }
  };
  const story = [
    { key: "problem", label: "The problem", text: project.problem },
    { key: "approach", label: "The approach", text: project.approach },
    { key: "outcome", label: "The outcome", text: project.outcome },
  ].filter(item => item.text);

  return <SiteChrome portfolio={portfolio} active="work">
    <article className={`case theme-${project.theme}`}>
      <header className="case-hero section-wrap">
        <Link className="back-link" to="/#work" viewTransition><ArrowLeft size={16}/> All work</Link>
        <div className="case-kicker"><span>{String(index + 1).padStart(2, "0")} / CASE STUDY</span><span>{project.category}</span></div>
        <h1>{project.title}</h1>
        <p className="case-summary">{project.summary}</p>
        <dl className="case-meta">
          {project.role && <div><dt>Role</dt><dd>{project.role}</dd></div>}
          {project.year && <div><dt>Year</dt><dd>{project.year}</dd></div>}
          <div><dt>Stack</dt><dd>{project.stack.join(" · ") || "—"}</dd></div>
        </dl>
        <div className="case-actions">
          {project.url && <a className="primary-button" data-magnetic="0.25" href={project.url} target="_blank" rel="noreferrer" onClick={() => track("project_click", project.id)}>Visit live project <ArrowUpRight size={17}/></a>}
          {project.repo && <a className="ghost-button" href={project.repo} target="_blank" rel="noreferrer" onClick={() => track("outbound", `repo:${project.id}`)}><FolderGit2 size={16}/> Source code</a>}
          <button className="ghost-button" onClick={share}><Share2 size={16}/> Share</button>
        </div>
      </header>

      <div className="case-art section-wrap" data-reveal><ProjectArt project={project} large/></div>

      {project.metrics.length > 0 && <div className="case-metrics section-wrap">{project.metrics.map((metric, i) => <div key={i} data-reveal><strong>{metric.value}</strong><span>{metric.label}</span></div>)}</div>}

      {story.length > 0 && <div className="case-story section-wrap">{story.map((item, i) => <section key={item.key} data-reveal><span className="section-index" data-scramble>{String(i + 1).padStart(2, "0")}</span><h2>{item.label}</h2><p>{item.text}</p></section>)}</div>}

      {project.features.length > 0 && <section className="case-features section-wrap" data-reveal>
        <h2>Key features</h2>
        <ul>{project.features.map((feature, i) => <li key={i}><CheckCircle2 size={18}/>{feature}</li>)}</ul>
      </section>}

      {project.gallery.length > 0 && <section className="case-gallery section-wrap">
        <h2 data-reveal>Gallery</h2>
        <div className="gallery-grid">{project.gallery.map((src, i) => <button key={src} data-reveal onClick={() => setLightbox(i)} aria-label={`Open screenshot ${i + 1}`}><img src={fileUrl(src)} alt={`${project.title} screenshot ${i + 1}`} loading="lazy"/></button>)}</div>
      </section>}

      {portfolio.projects.length > 1 && <nav className="case-pager section-wrap" aria-label="More projects">
        <Link to={`/work/${prev.id}`} viewTransition className="pager-card"><span><ArrowLeft size={15}/> Previous</span><strong>{prev.title}</strong></Link>
        <Link to={`/work/${next.id}`} viewTransition className="pager-card next"><span>Next <ArrowRight size={15}/></span><strong>{next.title}</strong></Link>
      </nav>}

      <section className="case-cta section-wrap" data-reveal>
        <h2>Like what you see?</h2>
        <p>I'm always happy to talk about how something like this could work for your team.</p>
        <Link className="primary-button" data-magnetic="0.25" to="/#contact">Start a conversation <ArrowRight size={17}/></Link>
      </section>
    </article>

    {lightbox !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Screenshot viewer" onClick={() => setLightbox(null)}>
      <button className="icon-button lightbox-close" aria-label="Close" onClick={() => setLightbox(null)}><X size={20}/></button>
      <img src={fileUrl(project.gallery[lightbox])} alt={`${project.title} screenshot ${lightbox + 1}`} onClick={event => event.stopPropagation()}/>
      <span>{lightbox + 1} / {project.gallery.length} · ← → to browse</span>
    </div>}
  </SiteChrome>;
}
