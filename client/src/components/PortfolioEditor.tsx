import "../styles/studio.css";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useBlocker } from "react-router-dom";
import { Award, BarChart3, BriefcaseBusiness, ExternalLink, History as HistoryIcon, Inbox as InboxIcon, Link2, Loader2, LogOut, Menu, Monitor, MessageSquareQuote, Moon, PanelRightClose, PanelRightOpen, Save, Smartphone, Sun, Undo2, User, UserRound, X } from "lucide-react";
import type { Portfolio } from "../lib/types";
import { fetchMessages, ownerLogout, savePortfolio } from "../lib/api";
import { useTheme, useToast } from "../lib/context";
import { initials, timeAgo } from "../lib/hooks";
import { markOwner } from "../lib/track";
import { AboutEditor, CompletionCard, CredentialsEditor, ExperienceEditor, LinksEditor, ProfileEditor, ProjectsEditor, TestimonialsEditor, completeness } from "./studio/ContentEditors";
import Dashboard from "./studio/Dashboard";
import Inbox from "./studio/Inbox";
import History from "./studio/History";

type Tab = "dashboard" | "inbox" | "profile" | "about" | "experience" | "projects" | "credentials" | "testimonials" | "links" | "history";
type TabInfo = { id: Tab; label: string; icon: ReactNode; group: string; section?: string; title: string; intro: string };

const TABS: TabInfo[] = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={17}/>, group: "Overview", title: "Dashboard", intro: "How your portfolio is doing." },
  { id: "inbox", label: "Inbox", icon: <InboxIcon size={17}/>, group: "Overview", title: "Inbox", intro: "Messages sent from your contact form." },
  { id: "profile", label: "Profile", icon: <User size={17}/>, group: "Content", section: "top", title: "Profile", intro: "Your name, headline, availability and highlight numbers." },
  { id: "about", label: "About & skills", icon: <UserRound size={17}/>, group: "Content", section: "about", title: "About & skills", intro: "Your story, skills and what you do best." },
  { id: "experience", label: "Experience", icon: <BriefcaseBusiness size={17}/>, group: "Content", section: "experience", title: "Experience", intro: "The roles and impact you want recruiters to see." },
  { id: "projects", label: "Projects", icon: <BriefcaseBusiness size={17}/>, group: "Content", section: "work", title: "Projects", intro: "Your selected work and case studies." },
  { id: "credentials", label: "Credentials", icon: <Award size={17}/>, group: "Content", section: "credentials", title: "Credentials", intro: "Education, certifications and achievements." },
  { id: "testimonials", label: "Testimonials", icon: <MessageSquareQuote size={17}/>, group: "Content", section: "testimonials", title: "Testimonials", intro: "What people say about working with you." },
  { id: "links", label: "Links & CV", icon: <Link2 size={17}/>, group: "Content", section: "contact", title: "Links & CV", intro: "Contact details, social links and your CV." },
  { id: "history", label: "History", icon: <HistoryIcon size={17}/>, group: "Manage", title: "Version history", intro: "Review or restore earlier saves." },
];

const JUMPS: Record<string, Tab> = {
  "Headline and intro": "profile", "At least 8 skills": "about", "A work role": "experience", "3+ projects": "projects", "Project screenshots": "projects",
  "Case-study stories": "projects", "GitHub or LinkedIn": "links", "CV uploaded": "links", "Education or certs": "credentials", "A testimonial": "testimonials",
};

export default function PortfolioEditor({ initial, initialUpdatedAt }: { initial: Portfolio; initialUpdatedAt: string | null }) {
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const [data, setData] = useState<Portfolio>(initial);
  const [saved, setSaved] = useState<Portfolio>(initial);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [tab, setTab] = useState<Tab>(() => (TABS.find(t => t.id === new URLSearchParams(location.search).get("tab"))?.id ?? "dashboard"));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [unread, setUnread] = useState(0);
  const [preview, setPreview] = useState(() => window.innerWidth > 1280);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [navOpen, setNavOpen] = useState(false);
  const [, setTick] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(saved), [data, saved]);
  const info = TABS.find(t => t.id === tab)!;
  const editing = !["dashboard", "inbox", "history"].includes(tab);

  const set = useCallback(<K extends keyof Portfolio>(key: K, value: Portfolio[K]) => { setData(current => ({ ...current, [key]: value })); setSaveError(""); }, []);

  useEffect(() => { document.title = `${info.title} — Portfolio Studio`; history.replaceState(null, "", `/studio?tab=${tab}`); }, [tab, info.title]);
  useEffect(() => { fetchMessages().then(result => setUnread(result.messages.filter(m => !m.read).length)).catch(() => {}); }, []);
  useEffect(() => { const timer = setInterval(() => setTick(t => t + 1), 30_000); return () => clearInterval(timer); }, []);

  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true); setSaveError("");
    try {
      const result = await savePortfolio(data);
      setData(result.portfolio); setSaved(result.portfolio); setUpdatedAt(result.updatedAt);
      toast("Saved. Your portfolio is live with the changes.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      setSaveError(message); toast(message, "error");
    } finally { setSaving(false); }
  }, [data, saving, toast]);

  // Ctrl/Cmd+S saves from anywhere in the studio.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); if (dirty) void save(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, save]);

  // Warn before closing the tab or leaving the studio with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);

  // Live preview: push the unsaved draft into the iframe.
  const pushPreview = useCallback((scroll = false) => {
    frame.current?.contentWindow?.postMessage({ type: "ps-preview", portfolio: data, scrollTo: scroll ? info.section : undefined }, window.location.origin);
  }, [data, info.section]);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => { if (event.origin === window.location.origin && event.data?.type === "ps-preview-ready") pushPreview(true); };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pushPreview]);
  useEffect(() => { if (!preview) return; const timer = setTimeout(() => pushPreview(false), 200); return () => clearTimeout(timer); }, [data, preview]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (preview) pushPreview(true); }, [tab, preview]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (next: Tab) => { setTab(next); setNavOpen(false); document.querySelector(".studio-scroll")?.scrollTo({ top: 0 }); };
  const signOut = async () => {
    if (dirty && !confirm("You have unsaved changes. Sign out anyway?")) return;
    await ownerLogout().catch(() => {});
    markOwner(false);
    window.location.replace("/");
  };

  const props = { data, set };
  const { score } = completeness(data);
  const groups = [...new Set(TABS.map(t => t.group))];

  return <main className={`studio${preview && editing ? " with-preview" : ""}`}>
    <aside className={navOpen ? "studio-sidebar open" : "studio-sidebar"}>
      <div className="studio-brand"><span>{initials(data.name)}</span><div>{data.name}<small>Portfolio Studio</small></div><button className="icon-button studio-nav-close" onClick={() => setNavOpen(false)} aria-label="Close menu"><X size={17}/></button></div>
      <nav aria-label="Studio sections">{groups.map(group => <div key={group} className="nav-group">
        <span>{group}</span>
        {TABS.filter(t => t.group === group).map(item => <button key={item.id} className={tab === item.id ? "active" : ""} aria-current={tab === item.id ? "page" : undefined} onClick={() => go(item.id)}>
          {item.icon}{item.label}{item.id === "inbox" && unread > 0 && <em className="badge-count">{unread}</em>}
        </button>)}
      </div>)}</nav>
      <button className="sidebar-strength" onClick={() => go("dashboard")}><span>Profile strength</span><div className="meter"><i style={{ width: `${score}%` }}/></div><strong>{score}%</strong></button>
      <div className="studio-side-bottom">
        <a href="/" target="_blank" rel="noreferrer"><ExternalLink size={15}/> View live site</a>
        <button onClick={toggle}>{theme === "dark" ? <Sun size={15}/> : <Moon size={15}/>} {theme === "dark" ? "Light" : "Dark"} theme</button>
        <button onClick={signOut}><LogOut size={15}/> Sign out</button>
      </div>
    </aside>
    {navOpen && <div className="studio-scrim" onClick={() => setNavOpen(false)}/>}

    <div className="studio-main">
      <header className="studio-topbar">
        <button className="icon-button studio-menu" onClick={() => setNavOpen(true)} aria-label="Open menu"><Menu size={18}/></button>
        <div className="studio-title"><h1>{info.title}</h1><p>{info.intro}</p></div>
        <div className="studio-actions">
          <span className={dirty ? "save-state dirty" : "save-state"} role="status">{saving ? "Saving…" : dirty ? "Unsaved changes" : updatedAt ? `Saved ${timeAgo(updatedAt)}` : "Not published yet"}</span>
          {editing && <button className="icon-button" onClick={() => setPreview(!preview)} aria-pressed={preview} aria-label={preview ? "Hide live preview" : "Show live preview"} title="Live preview">{preview ? <PanelRightClose size={17}/> : <PanelRightOpen size={17}/>}</button>}
          {dirty && <button className="studio-button ghost" onClick={() => { if (confirm("Discard all unsaved changes?")) { setData(saved); toast("Changes discarded", "info"); } }}><Undo2 size={15}/><span>Discard</span></button>}
          <button className="studio-button primary" onClick={save} disabled={!dirty || saving} title="Save (Ctrl+S)">{saving ? <Loader2 size={15} className="spin"/> : <Save size={15}/>}<span>Save</span><kbd>Ctrl S</kbd></button>
        </div>
      </header>
      {saveError && <p className="studio-error banner" role="alert">{saveError}</p>}

      <div className="studio-body">
        <div className="studio-scroll">
          <div className="studio-content">
            {tab === "dashboard" && <Dashboard data={data} onOpenInbox={() => go("inbox")} onJump={label => go(JUMPS[label] ?? "profile")}/>}
            {tab === "inbox" && <Inbox onUnreadChange={setUnread}/>}
            {tab === "profile" && <ProfileEditor {...props}/>}
            {tab === "about" && <AboutEditor {...props}/>}
            {tab === "experience" && <ExperienceEditor {...props}/>}
            {tab === "projects" && <ProjectsEditor {...props}/>}
            {tab === "credentials" && <CredentialsEditor {...props}/>}
            {tab === "testimonials" && <TestimonialsEditor {...props}/>}
            {tab === "links" && <LinksEditor {...props}/>}
            {tab === "history" && <History refreshKey={updatedAt} dirty={dirty} onLoadDraft={portfolio => { setData(portfolio); go("profile"); }} onRestored={(portfolio, at) => { setData(portfolio); setSaved(portfolio); setUpdatedAt(at); }}/>}
            {editing && !preview && <div className="studio-aside-tip"><CompletionCard data={data} onJump={label => go(JUMPS[label] ?? "profile")}/></div>}
          </div>
        </div>

        {editing && preview && <aside className="preview-pane" aria-label="Live preview">
          <div className="preview-bar">
            <span><i className="live-dot"/>Live preview{dirty ? " · unsaved" : ""}</span>
            <div className="segmented small" role="group" aria-label="Preview size">
              <button className={device === "desktop" ? "active" : ""} aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")} aria-label="Desktop"><Monitor size={14}/></button>
              <button className={device === "mobile" ? "active" : ""} aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")} aria-label="Mobile"><Smartphone size={14}/></button>
            </div>
          </div>
          <div className={`preview-frame ${device}`}><iframe ref={frame} name="ps-preview" src="/" title="Live preview of your portfolio"/></div>
        </aside>}
      </div>
    </div>

    {blocker.state === "blocked" && <div className="palette-backdrop" onClick={() => blocker.reset?.()}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="leave-title" onClick={event => event.stopPropagation()}>
        <h2 id="leave-title">Leave without saving?</h2>
        <p>You have unsaved changes. They'll be lost if you leave now.</p>
        <div><button className="studio-button ghost" onClick={() => blocker.reset?.()}>Stay</button><button className="studio-button ghost danger" onClick={() => blocker.proceed?.()}>Leave anyway</button><button className="studio-button primary" onClick={async () => { await save(); blocker.proceed?.(); }}>Save & leave</button></div>
      </div>
    </div>}
  </main>;
}

