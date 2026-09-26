import type { Project } from "../../lib/types";
import { fileUrl } from "../../lib/api";

/** Browser-window mock for a project: the uploaded screenshot, or hand-drawn art. */
export default function ProjectArt({ project, large = false, parallax = false }: { project: Project; large?: boolean; parallax?: boolean }) {
  let host = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project"}.app`;
  try { if (project.url) host = new URL(project.url).hostname; } catch { /* keep generated host */ }

  return <div className={large ? "project-art large" : "project-art"} aria-hidden="true" style={{ viewTransitionName: `art-${project.id.replace(/[^a-zA-Z0-9_-]/g, "")}` }}>
    <div className="mock-browser" data-parallax={parallax ? "-0.06" : undefined}>
      <div className="mock-toolbar"><i/><i/><i/><span>{host}</span></div>
      {project.image
        ? <div className="mock-content mock-image"><img src={fileUrl(project.image)} alt="" loading="lazy" decoding="async"/></div>
        : project.id === "online-food" ? <FoodMock/>
        : project.id === "scenepass" ? <SceneMock/>
        : project.id === "portfolio-studio" ? <StudioMock/>
        : <GenericMock project={project}/>}
    </div>
  </div>;
}

function FoodMock() {
  return <div className="mock-content food-mock">
    <div className="mock-app-nav"><b>quickbite<span>.</span></b><span>Discover　 Restaurants　 Offers</span><i/></div>
    <div className="food-mock-body">
      <div className="food-mock-copy"><small>GOOD FOOD, GOOD MOOD</small><strong>Cravings meet<br/>their match.</strong><div className="mock-search">What are you craving today?　⌕</div></div>
      <div className="food-bowl"><span>✺</span></div>
    </div>
    <div className="food-mini"><i/><i/><i/><i/></div>
  </div>;
}

function SceneMock() {
  return <div className="mock-content scene-mock">
    <div className="mock-app-nav"><b>SCENE<span>PASS</span></b><span>Discover　 Tickets　 Studio</span><i/></div>
    <div className="scene-mock-body">
      <div className="scene-poster"><span>LIVE / 2026</span><strong>THE<br/>NEXT<br/>SCENE</strong><small>Pick your seats →</small></div>
      <div className="scene-side"><span>01 / FEATURED</span><div/><div/><div/></div>
    </div>
  </div>;
}

function StudioMock() {
  const bars = [30, 44, 38, 56, 50, 68, 62, 80, 74, 92];
  return <div className="mock-content studio-mock">
    <aside><b>PS</b><i className="on"/><i/><i/><i/><i/></aside>
    <div className="studio-mock-main">
      <div className="studio-mock-top"><span>Dashboard</span><em>Save</em></div>
      <div className="studio-mock-kpis">{["1.2k", "438", "57"].map(v => <div key={v}><small/><strong>{v}</strong></div>)}</div>
      <div className="studio-mock-chart">{bars.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}/>)}</div>
    </div>
  </div>;
}

function GenericMock({ project }: { project: Project }) {
  return <div className="mock-content generic-mock">
    <div className="mock-app-nav"><b>{(project.title || "app").toLowerCase()}<span>.</span></b><span>Home　 Features　 About</span><i/></div>
    <div className="generic-hero"><small>{project.category || "Product"}</small><div className="generic-lines"><i/><i/><i/></div><em/></div>
    <div className="generic-cards"><i/><i/><i/></div>
  </div>;
}
