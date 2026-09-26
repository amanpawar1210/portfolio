import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, FileText, Loader2, Sparkles, UploadCloud } from "lucide-react";
import type { Achievement, Capability, Certification, Education, Portfolio, Project, SkillGroup, Stat, Testimonial } from "../../lib/types";
import { newExperience, newProject } from "../../lib/types";
import { fetchCvMeta, fileUrl, uploadCv } from "../../lib/api";
import { useToast } from "../../lib/context";
import { timeAgo } from "../../lib/hooks";
import { Area, Gallery, ImageDrop, Lines, RecordList, Tags, Text, Toggle } from "./fields";

export type EditorProps = { data: Portfolio; set: <K extends keyof Portfolio>(key: K, value: Portfolio[K]) => void };

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function Panel({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return <section className="studio-panel"><header><h2>{title}</h2>{text && <p>{text}</p>}</header>{children}</section>;
}

function StatsEditor({ value, onChange, max, label }: { value: Stat[]; onChange: (value: Stat[]) => void; max: number; label: string }) {
  return <RecordList items={value} onChange={onChange} max={max} addLabel={`Add ${label}`} empty={`No ${label}s yet.`} defaultOpen
    create={() => ({ value: "", label: "" })}
    title={item => <span>{item.value || "—"} <small>{item.label}</small></span>}
    render={(item, update) => <div className="studio-fields"><Text label="Value" value={item.value} max={24} placeholder="e.g. 40%" onChange={v => update({ value: v })}/><Text label="Label" value={item.label} max={120} placeholder="e.g. Faster checkout" onChange={v => update({ label: v })}/></div>}/>;
}

export function ProfileEditor({ data, set }: EditorProps) {
  return <>
    <Panel title="The first impression" text="What visitors see at the very top of your site.">
      <div className="studio-fields">
        <div className="studio-field wide"><ImageDrop label="Profile photo" value={data.photo} onChange={v => set("photo", v)}/></div>
        <Text label="Full name" value={data.name} max={120} onChange={v => set("name", v)}/>
        <Text label="Designation" value={data.designation} max={120} placeholder="e.g. Senior Frontend Engineer" onChange={v => set("designation", v)}/>
        <Area label="Hero headline" hint="Wrap words in *asterisks* to highlight them" value={data.headline} max={180} rows={2} onChange={v => set("headline", v)}/>
        <Tags label="Rotating roles" hint="Typed out one after another in the hero" value={data.roles} max={8} onChange={v => set("roles", v)}/>
      </div>
    </Panel>
    <Panel title="Availability & location">
      <div className="studio-fields">
        <Toggle label="Open to new opportunities" hint="Shows a green “Open to work” badge in the hero" checked={data.openToWork} onChange={v => set("openToWork", v)}/>
        <Text label="Status line" value={data.availability} max={160} placeholder="Shown when not open to work" onChange={v => set("availability", v)}/>
        <Text label="Location" value={data.location} max={120} onChange={v => set("location", v)}/>
        <label className="studio-field"><span>Time zone<small>For the live local-time clock</small></span>
          <select value={data.timezone} onChange={event => set("timezone", event.target.value)}>
            {["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Australia/Sydney"].map(zone => <option key={zone}>{zone}</option>)}
          </select>
        </label>
        <Text label="Years of experience" value={data.years} max={30} onChange={v => set("years", v)}/>
      </div>
    </Panel>
    <Panel title="Highlight numbers" text="The count-up stats under the hero. Numbers animate; text like “E2E” stays as is.">
      <StatsEditor value={data.stats} onChange={v => set("stats", v)} max={6} label="stat"/>
    </Panel>
  </>;
}

export function AboutEditor({ data, set }: EditorProps) {
  return <>
    <Panel title="Your story">
      <Area label="Introduction" value={data.introduction} max={2400} rows={7} onChange={v => set("introduction", v)}/>
    </Panel>
    <Panel title="Skill groups" text="Grouped on the About section; every skill also appears in the moving ticker. Drag groups to reorder them.">
      <RecordList<SkillGroup> items={data.skillGroups} max={8} defaultOpen addLabel="Add group" empty="No skill groups yet."
        onChange={groups => { set("skillGroups", groups); set("skills", [...new Set(groups.flatMap(group => group.skills))]); }}
        create={() => ({ id: uid("group"), label: "", skills: [] })}
        title={item => <span>{item.label || "New group"} <small>{item.skills.length} skill{item.skills.length === 1 ? "" : "s"}</small></span>}
        render={(item, update) => <div className="studio-fields">
          <Text label="Group name" value={item.label} max={40} placeholder="e.g. Frontend" onChange={v => update({ label: v })} wide/>
          <Tags label="Skills" value={item.skills} max={24} onChange={v => update({ skills: v })}/>
        </div>}/>
    </Panel>
    <Panel title="What you do best" text="Up to 8 capability cards.">
      <RecordList<Capability> items={data.capabilities} onChange={v => set("capabilities", v)} max={8} addLabel="Add capability" empty="No capability cards yet."
        create={() => ({ title: "", text: "" })}
        title={item => <span>{item.title || "Untitled capability"}</span>}
        render={(item, update) => <div className="studio-fields"><Text label="Title" value={item.title} max={80} onChange={v => update({ title: v })} wide/><Area label="Description" value={item.text} max={400} rows={3} onChange={v => update({ text: v })}/></div>}/>
    </Panel>
  </>;
}

export function ExperienceEditor({ data, set }: EditorProps) {
  return <Panel title="Career history" text="Drag roles to reorder. The first role is expanded on the public site.">
    <RecordList items={data.experience} onChange={v => set("experience", v)} max={25} addLabel="Add role" empty="No roles yet. The Experience section stays hidden until you add one."
      create={newExperience}
      title={item => <span>{item.role || "New role"} <small>{item.company}{item.current ? " · current" : ""}</small></span>}
      render={(item, update) => <div className="studio-fields">
        <Text label="Role" value={item.role} max={120} onChange={v => update({ role: v })}/>
        <Text label="Company" value={item.company} max={120} onChange={v => update({ company: v })}/>
        <Text label="Period" value={item.period} max={80} placeholder="June 2023 — Present" onChange={v => update({ period: v })}/>
        <Text label="Location" value={item.location} max={120} onChange={v => update({ location: v })}/>
        <Toggle label="Current position" checked={item.current} onChange={v => update({ current: v })}/>
        <Area label="Summary" value={item.description} max={1200} rows={3} onChange={v => update({ description: v })}/>
        <Lines label="Key contributions" value={item.highlights} placeholder="Built *X*, which cut *Y* by *30%* — wrap key words in *asterisks*" onChange={v => update({ highlights: v })} max={20}/>
        <Tags label="Tech used" value={item.stack} max={20} onChange={v => update({ stack: v })}/>
      </div>}/>
  </Panel>;
}

export function ProjectsEditor({ data, set }: EditorProps) {
  return <Panel title="Selected work" text="Each project gets its own case-study page at /work/your-slug.">
    <RecordList<Project> items={data.projects} onChange={v => set("projects", v)} max={24} addLabel="Add project" empty="No projects yet."
      create={newProject}
      title={item => <span>{item.title || "New project"} <small>{item.category}{item.featured ? " · ★ featured" : ""}</small></span>}
      render={(item, update) => <ProjectForm project={item} update={update} taken={data.projects.filter(p => p !== item).map(p => p.id)}/>}/>
  </Panel>;
}

function ProjectForm({ project, update, taken }: { project: Project; update: (patch: Partial<Project>) => void; taken: string[] }) {
  const [tab, setTab] = useState<"basics" | "story" | "media">("basics");
  const slugTaken = taken.includes(project.id);
  return <div className="project-form">
    <div className="segmented" role="tablist">{(["basics", "story", "media"] as const).map(key => <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{key === "basics" ? "Basics" : key === "story" ? "Case study" : "Images"}</button>)}</div>
    {tab === "basics" && <div className="studio-fields">
      <Text label="Project name" value={project.title} max={120} onChange={v => update(project.title && project.id !== slugify(project.title) ? { title: v } : { title: v, id: slugify(v) || project.id })}/>
      <Text label="URL slug" hint={slugTaken ? "Already used by another project" : `/work/${project.id}`} value={project.id} max={60} onChange={v => update({ id: v.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 60) })}/>
      <Text label="Category" value={project.category} max={100} placeholder="e.g. Fintech dashboard" onChange={v => update({ category: v })}/>
      <Text label="Year" value={project.year} max={20} onChange={v => update({ year: v })}/>
      <Text label="Your role" value={project.role} max={120} placeholder="e.g. Lead frontend engineer" onChange={v => update({ role: v })}/>
      <label className="studio-field"><span>Accent colour</span>
        <div className="swatches">{(["ember", "violet", "mint"] as const).map(theme => <button key={theme} type="button" className={`swatch swatch-${theme}${project.theme === theme ? " active" : ""}`} aria-label={theme} aria-pressed={project.theme === theme} onClick={() => update({ theme })}/>)}</div>
      </label>
      <Text label="Live URL" type="url" value={project.url} placeholder="https://" onChange={v => update({ url: v })}/>
      <Text label="Source code URL" type="url" value={project.repo} placeholder="https://github.com/…" onChange={v => update({ repo: v })}/>
      <Toggle label="Featured" hint="Adds a ★ and can show as a wide card" checked={project.featured} onChange={v => update({ featured: v })}/>
      <Area label="Summary" value={project.summary} max={1200} rows={3} onChange={v => update({ summary: v })}/>
      <Tags label="Tech stack" value={project.stack} max={20} onChange={v => update({ stack: v })}/>
    </div>}
    {tab === "story" && <div className="studio-fields">
      <Area label="The problem" value={project.problem} max={2000} rows={3} placeholder="What wasn't working, and for whom?" onChange={v => update({ problem: v })}/>
      <Area label="The approach" value={project.approach} max={2000} rows={4} placeholder="How you designed and built the solution" onChange={v => update({ approach: v })}/>
      <Area label="The outcome" value={project.outcome} max={2000} rows={3} placeholder="Results, impact, what shipped" onChange={v => update({ outcome: v })}/>
      <Lines label="Key features" value={project.features} placeholder="A feature worth calling out" onChange={v => update({ features: v })}/>
      <div className="studio-field wide"><span>Impact metrics<small>Up to 4 big numbers on the case study</small></span><StatsEditor value={project.metrics} onChange={v => update({ metrics: v })} max={4} label="metric"/></div>
    </div>}
    {tab === "media" && <div className="studio-fields">
      <div className="studio-field wide"><ImageDrop label="Cover screenshot" value={project.image} onChange={image => update({ image })}/></div>
      <Gallery value={project.gallery} onChange={gallery => update({ gallery })}/>
    </div>}
  </div>;
}

export function CredentialsEditor({ data, set }: EditorProps) {
  return <>
    <Panel title="Education" text="Sections stay hidden on the site while empty.">
      <RecordList<Education> items={data.education} onChange={v => set("education", v)} max={10} addLabel="Add education" empty="No education added."
        create={() => ({ id: uid("edu"), degree: "", school: "", period: "", detail: "" })}
        title={item => <span>{item.degree || "New entry"} <small>{item.school}</small></span>}
        render={(item, update) => <div className="studio-fields"><Text label="Degree / course" value={item.degree} max={160} onChange={v => update({ degree: v })}/><Text label="School" value={item.school} max={160} onChange={v => update({ school: v })}/><Text label="Period" value={item.period} max={60} placeholder="2016 — 2020" onChange={v => update({ period: v })}/><Area label="Details" value={item.detail} max={600} rows={2} onChange={v => update({ detail: v })}/></div>}/>
    </Panel>
    <Panel title="Certifications">
      <RecordList<Certification> items={data.certifications} onChange={v => set("certifications", v)} max={20} addLabel="Add certification" empty="No certifications added."
        create={() => ({ id: uid("cert"), name: "", issuer: "", year: "", url: "" })}
        title={item => <span>{item.name || "New certification"} <small>{item.issuer}</small></span>}
        render={(item, update) => <div className="studio-fields"><Text label="Name" value={item.name} max={160} onChange={v => update({ name: v })}/><Text label="Issuer" value={item.issuer} max={120} onChange={v => update({ issuer: v })}/><Text label="Year" value={item.year} max={20} onChange={v => update({ year: v })}/><Text label="Credential URL" type="url" value={item.url} placeholder="https://" onChange={v => update({ url: v })}/></div>}/>
    </Panel>
    <Panel title="Achievements">
      <RecordList<Achievement> items={data.achievements} onChange={v => set("achievements", v)} max={20} addLabel="Add achievement" empty="No achievements added."
        create={() => ({ id: uid("award"), title: "", detail: "", year: "" })}
        title={item => <span>{item.title || "New achievement"} <small>{item.year}</small></span>}
        render={(item, update) => <div className="studio-fields"><Text label="Title" value={item.title} max={160} onChange={v => update({ title: v })}/><Text label="Year" value={item.year} max={20} onChange={v => update({ year: v })}/><Area label="Details" value={item.detail} max={600} rows={2} onChange={v => update({ detail: v })}/></div>}/>
    </Panel>
  </>;
}

export function TestimonialsEditor({ data, set }: EditorProps) {
  return <Panel title="Testimonials" text="Quotes from managers, colleagues or clients. Shown as an auto-playing carousel.">
    <RecordList<Testimonial> items={data.testimonials} onChange={v => set("testimonials", v)} max={12} addLabel="Add testimonial" empty="No testimonials yet. The section stays hidden until you add one."
      create={() => ({ id: uid("quote"), quote: "", name: "", role: "" })}
      title={item => <span>{item.name || "New testimonial"} <small>{item.role}</small></span>}
      render={(item, update) => <div className="studio-fields"><Area label="Quote" value={item.quote} max={800} rows={4} onChange={v => update({ quote: v })}/><Text label="Name" value={item.name} max={120} onChange={v => update({ name: v })}/><Text label="Role & company" value={item.role} max={160} placeholder="Engineering Manager, Acme" onChange={v => update({ role: v })}/></div>}/>
  </Panel>;
}

export function LinksEditor({ data, set }: EditorProps) {
  const toast = useToast();
  const [cv, setCv] = useState<{ name: string; size: number; updatedAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { fetchCvMeta().then(result => setCv(result.cv)).catch(() => {}); }, []);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") { toast("Choose a PDF file", "error"); return; }
    if (file.size > 4_000_000) { toast("The PDF must be under 4 MB", "error"); return; }
    setBusy(true);
    try {
      const result = await uploadCv(file);
      setCv({ name: result.name, size: result.size, updatedAt: new Date().toISOString() });
      set("cvUrl", result.url);
      toast("CV uploaded. It's live now; save to show the download buttons.");
    } catch (error) { toast(error instanceof Error ? error.message : "Upload failed", "error"); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };

  return <>
    <Panel title="Contact & social" text="Where people can reach you.">
      <div className="studio-fields">
        <Text label="Public email" type="email" value={data.email} max={160} onChange={v => set("email", v)}/>
        <Text label="Phone" hint="Optional, not shown yet" value={data.phone} max={40} onChange={v => set("phone", v)}/>
        <Text label="GitHub URL" type="url" value={data.github} placeholder="https://github.com/…" onChange={v => set("github", v)}/>
        <Text label="LinkedIn URL" type="url" value={data.linkedin} placeholder="https://linkedin.com/in/…" onChange={v => set("linkedin", v)}/>
        <Text label="X / Twitter URL" type="url" value={data.twitter} placeholder="https://x.com/…" onChange={v => set("twitter", v)}/>
      </div>
    </Panel>
    <Panel title="Your CV" text="Upload a PDF under 4 MB. A new upload replaces the previous file.">
      <div className={`cv-drop${over ? " over" : ""}`} onDragOver={event => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={event => { event.preventDefault(); setOver(false); void upload(event.dataTransfer.files[0]); }}>
        {busy ? <Loader2 className="spin" size={30}/> : cv ? <FileText size={30}/> : <UploadCloud size={30}/>}
        <div>
          {cv ? <><strong>{cv.name}</strong><p>{(cv.size / 1024).toFixed(0)} KB · uploaded {timeAgo(cv.updatedAt)}</p></> : <><strong>No CV uploaded yet</strong><p>Drag a PDF here, or choose one.</p></>}
        </div>
        <div className="image-actions">
          <button type="button" className="studio-button small" disabled={busy} onClick={() => input.current?.click()}>{cv ? "Replace PDF" : "Choose PDF"}</button>
          {cv && <a className="studio-button small ghost" href={fileUrl("/api/cv")} target="_blank" rel="noreferrer">Open <ExternalLink size={13}/></a>}
        </div>
        <input ref={input} hidden type="file" accept="application/pdf,.pdf" onChange={event => void upload(event.target.files?.[0])}/>
      </div>
      {cv && <Toggle label="Show “Download CV” buttons" hint="In the hero, contact section and command palette" checked={data.cvUrl === "/api/cv"} onChange={v => set("cvUrl", v ? "/api/cv" : "")}/>}
      {cv && data.cvUrl && <p className="studio-ok"><CheckCircle2 size={15}/> Download buttons are enabled.</p>}
    </Panel>
  </>;
}

/** Share of recommended fields that are filled — shown in the sidebar and dashboard. */
export function completeness(data: Portfolio) {
  const checks: [string, boolean][] = [
    ["Headline and intro", Boolean(data.headline && data.introduction.length > 80)],
    ["At least 8 skills", data.skills.length >= 8],
    ["A work role", data.experience.length > 0],
    ["3+ projects", data.projects.length >= 3],
    ["Project screenshots", data.projects.length > 0 && data.projects.every(p => p.image)],
    ["Case-study stories", data.projects.length > 0 && data.projects.every(p => p.problem && p.outcome)],
    ["GitHub or LinkedIn", Boolean(data.github || data.linkedin)],
    ["CV uploaded", Boolean(data.cvUrl)],
    ["Education or certs", data.education.length + data.certifications.length > 0],
    ["A testimonial", data.testimonials.length > 0],
  ];
  return { score: Math.round(checks.filter(([, ok]) => ok).length / checks.length * 100), checks };
}

export function CompletionCard({ data, onJump }: { data: Portfolio; onJump?: (label: string) => void }) {
  const { score, checks } = completeness(data);
  return <div className="completion">
    <div className="completion-head"><Sparkles size={16}/><strong>Profile strength</strong><span>{score}%</span></div>
    <div className="meter" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Profile strength"><i style={{ width: `${score}%` }}/></div>
    <ul>{checks.map(([label, ok]) => <li key={label} className={ok ? "done" : ""}><button type="button" onClick={() => onJump?.(label)} disabled={ok}>{ok ? <CheckCircle2 size={14}/> : <span className="todo-dot"/>}{label}</button></li>)}</ul>
  </div>;
}
