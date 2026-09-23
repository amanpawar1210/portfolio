import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Check, CirclePlus, FileUp, ImagePlus, LogOut, Save, Trash2 } from "lucide-react";
import type { Portfolio, Project, Experience } from "../lib/types";
import { savePortfolio, uploadCv as uploadCvRequest, uploadProjectImage, ownerLogout } from "../lib/api";

type Tab = "identity" | "skills" | "experience" | "projects" | "links";
const tabs: { id: Tab; label: string; number: string }[] = [
  { id: "identity", label: "Identity", number: "01" },
  { id: "skills", label: "About & skills", number: "02" },
  { id: "experience", label: "Experience", number: "03" },
  { id: "projects", label: "Projects", number: "04" },
  { id: "links", label: "Links & CV", number: "05" },
];

export default function PortfolioEditor({ initial }: { initial: Portfolio }) {
  const navigate = useNavigate();
  const [data, setData] = useState<Portfolio>(initial);
  const [tab, setTab] = useState<Tab>("identity");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const field = (key: keyof Portfolio, value: string) => { setData(current => ({ ...current, [key]: value })); setStatus("Unsaved changes"); };
  const updateProject = (id: string, patch: Partial<Project>) => { setData(current => ({ ...current, projects: current.projects.map(item => item.id === id ? { ...item, ...patch } : item) })); setStatus("Unsaved changes"); };
  const updateExperience = (id: string, patch: Partial<Experience>) => { setData(current => ({ ...current, experience: current.experience.map(item => item.id === id ? { ...item, ...patch } : item) })); setStatus("Unsaved changes"); };

  async function save() {
    setBusy(true); setStatus("Saving…");
    try {
      const result = await savePortfolio(data);
      setData(result.portfolio); setStatus("Saved. Your public portfolio is updated.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Save failed"); }
    finally { setBusy(false); }
  }

  async function uploadCv(file: File | undefined) {
    if (!file) return;
    setBusy(true); setStatus("Uploading CV…");
    try {
      const result = await uploadCvRequest(file);
      setData(current => ({ ...current, cvUrl: result.url }));
      setStatus("CV uploaded. Press Save changes to show it on your portfolio.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Upload failed"); }
    finally { setBusy(false); }
  }

  async function uploadProjectShot(projectId: string, file: File | undefined) {
    if (!file) return;
    setBusy(true); setStatus("Uploading project image…");
    try {
      const result = await uploadProjectImage(projectId, file);
      updateProject(projectId, { image: `${result.url}?t=${Date.now()}` });
      setStatus("Image uploaded. Press Save changes to show it on your portfolio.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Image upload failed"); }
    finally { setBusy(false); }
  }

  async function signOut() {
    await ownerLogout().catch(() => {});
    navigate("/");
  }

  const input = (label: string, key: keyof Portfolio, hint?: string) => <label className="studio-field"><span>{label}</span><input value={String(data[key])} onChange={event => field(key, event.target.value)} placeholder={hint || label} /></label>;

  return <main className="studio-page">
    <aside className="studio-sidebar"><Link className="studio-brand" to="/"><span>AP</span><div>AMAN PAWAR<small>PORTFOLIO STUDIO</small></div></Link><div className="studio-side-label">YOUR WORKSPACE</div><nav aria-label="Studio sections">{tabs.map(item => <button className={tab === item.id ? "active" : ""} key={item.id} onClick={() => setTab(item.id)}><span>{item.number}</span>{item.label}</button>)}</nav><div className="studio-side-bottom"><Link to="/" target="_blank">View live site <ArrowUpRight size={16}/></Link><button onClick={signOut}>Sign out <LogOut size={16}/></button></div></aside>
    <div className="studio-main"><header className="studio-topbar"><Link to="/"><ArrowLeft size={17}/> Portfolio</Link><div><span className="studio-status" role="status">{status}</span><button onClick={save} disabled={busy}><Save size={16}/>{busy ? "Working…" : "Save changes"}</button></div></header>
      <div className="studio-content"><div className="studio-intro"><span>PRIVATE EDITOR / {tabs.find(item => item.id === tab)?.number}</span><h1>{tabs.find(item => item.id === tab)?.label}<em>.</em></h1><p>Edit your details here. Save to update the public portfolio instantly—no code changes needed.</p></div>
      {tab === "identity" && <div className="studio-panel"><h2>The first impression</h2><div className="studio-fields">{input("Full name", "name")}{input("Designation", "designation", "e.g. Senior Frontend Developer")}{input("Location", "location")}{input("Years of experience", "years")}{input("Availability", "availability", "Open to opportunities")}</div><label className="studio-field"><span>Hero headline</span><textarea rows={3} value={data.headline} onChange={event => field("headline", event.target.value)} /></label></div>}
      {tab === "skills" && <div className="studio-panel"><h2>Your story & expertise</h2><label className="studio-field"><span>Introduction</span><textarea rows={7} value={data.introduction} onChange={event => field("introduction", event.target.value)} /></label><label className="studio-field"><span>Skills <small>One skill per line</small></span><textarea rows={9} value={data.skills.join("\n")} onChange={event => { setData(current => ({ ...current, skills: event.target.value.split("\n") })); setStatus("Unsaved changes"); }} /></label></div>}
      {tab === "experience" && <div className="studio-panel"><div className="studio-panel-head"><div><h2>Career history</h2><p>Add the roles and impact you want recruiters to see.</p></div><button onClick={() => { setData(current => ({ ...current, experience: [...current.experience, { id: crypto.randomUUID(), role: "", company: "", period: "", description: "" }] })); setStatus("Unsaved changes"); }}><CirclePlus size={17}/> Add role</button></div>{data.experience.length === 0 && <p className="studio-empty">No roles added yet. This section stays hidden on the public site until you add one.</p>}{data.experience.map((item, index) => <div className="studio-item" key={item.id}><div className="studio-item-head"><strong>ROLE {String(index + 1).padStart(2, "0")}</strong><button aria-label="Remove role" onClick={() => { setData(current => ({ ...current, experience: current.experience.filter(entry => entry.id !== item.id) })); setStatus("Unsaved changes"); }}><Trash2 size={16}/></button></div><div className="studio-fields"><label className="studio-field"><span>Role</span><input value={item.role} onChange={event => updateExperience(item.id, { role: event.target.value })}/></label><label className="studio-field"><span>Company</span><input value={item.company} onChange={event => updateExperience(item.id, { company: event.target.value })}/></label><label className="studio-field"><span>Period</span><input placeholder="2022 — Present" value={item.period} onChange={event => updateExperience(item.id, { period: event.target.value })}/></label></div><label className="studio-field"><span>What you achieved</span><textarea rows={4} value={item.description} onChange={event => updateExperience(item.id, { description: event.target.value })}/></label></div>)}</div>}
      {tab === "projects" && <div className="studio-panel"><div className="studio-panel-head"><div><h2>Selected work</h2><p>Show the problems you solved, not only the tools you used.</p></div><button onClick={() => { setData(current => ({ ...current, projects: [...current.projects, { id: crypto.randomUUID(), title: "", category: "", summary: "", stack: [], url: "", theme: "mint" }] })); setStatus("Unsaved changes"); }}><CirclePlus size={17}/> Add project</button></div>{data.projects.map((item, index) => <div className="studio-item" key={item.id}><div className="studio-item-head"><strong>PROJECT {String(index + 1).padStart(2, "0")}</strong><button aria-label="Remove project" onClick={() => { setData(current => ({ ...current, projects: current.projects.filter(entry => entry.id !== item.id) })); setStatus("Unsaved changes"); }}><Trash2 size={16}/></button></div><div className="studio-fields"><label className="studio-field"><span>Project name</span><input value={item.title} onChange={event => updateProject(item.id, { title: event.target.value })}/></label><label className="studio-field"><span>Category</span><input value={item.category} onChange={event => updateProject(item.id, { category: event.target.value })}/></label><label className="studio-field"><span>Project URL</span><input type="url" placeholder="https://" value={item.url} onChange={event => updateProject(item.id, { url: event.target.value })}/></label><label className="studio-field"><span>Accent</span><select value={item.theme} onChange={event => updateProject(item.id, { theme: event.target.value as Project["theme"] })}><option value="ember">Coral</option><option value="violet">Violet</option><option value="mint">Mint</option></select></label></div><label className="studio-field"><span>Summary</span><textarea rows={4} value={item.summary} onChange={event => updateProject(item.id, { summary: event.target.value })}/></label><label className="studio-field"><span>Tech stack <small>Comma separated</small></span><input value={item.stack.join(", ")} onChange={event => updateProject(item.id, { stack: event.target.value.split(",").map(value => value.trim()) })}/></label><div className="project-image-upload">{item.image ? <img src={item.image} alt="" /> : <div className="project-image-placeholder"><ImagePlus size={22}/></div>}<div><strong>Project screenshot</strong><p>JPG, PNG or WEBP under 4 MB. Replaces the generated preview art.</p><label>Choose image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void uploadProjectShot(item.id, event.target.files?.[0])}/></label></div></div></div>)}</div>}
      {tab === "links" && <div className="studio-panel"><h2>Connect & share</h2><div className="studio-fields">{input("Public email", "email")}{input("GitHub URL", "github", "https://github.com/...")}{input("LinkedIn URL", "linkedin", "https://linkedin.com/in/...")}</div><div className="cv-upload"><FileUp size={30}/><div><strong>Your CV</strong><p>Upload a PDF under 5 MB. The new file replaces the previous version.</p></div><label>Choose PDF<input type="file" accept="application/pdf,.pdf" onChange={event => void uploadCv(event.target.files?.[0])}/></label>{data.cvUrl && <span><Check size={15}/> CV ready</span>}</div></div>}
      <div className="studio-bottom"><button onClick={save} disabled={busy}><Save size={16}/> Save changes</button><Link to="/" target="_blank">Preview public portfolio <ArrowUpRight size={16}/></Link></div>
      </div></div>
  </main>;
}
