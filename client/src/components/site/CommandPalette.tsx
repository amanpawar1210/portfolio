import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AtSign, Briefcase, Copy, CornerDownLeft, Download, Hash, Lock, Moon, Search, Sun } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "./BrandIcons";
import type { Portfolio } from "../../lib/types";
import { useTheme, useToast } from "../../lib/context";
import { fileUrl } from "../../lib/api";
import { track } from "../../lib/track";
import type { NavItem } from "./Chrome";

type Item = { id: string; group: string; label: string; hint?: string; icon: ReactNode; keywords?: string; run: () => void };

export default function CommandPalette({ open, onClose, portfolio, sections, goTo }: { open: boolean; onClose: () => void; portfolio: Portfolio; sections: NavItem[]; goTo: (id: string) => void }) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [
      ...sections.map(section => ({ id: `s-${section.id}`, group: "Jump to", label: section.label, icon: <Hash size={16}/>, run: () => goTo(section.id) })),
      ...portfolio.projects.map(project => ({ id: `p-${project.id}`, group: "Projects", label: project.title, hint: project.category, keywords: project.stack.join(" "), icon: <Briefcase size={16}/>, run: () => navigate(`/work/${project.id}`) })),
      { id: "a-copy", group: "Actions", label: "Copy email address", hint: portfolio.email, icon: <Copy size={16}/>, run: () => { navigator.clipboard?.writeText(portfolio.email).then(() => toast("Email copied to clipboard")); track("email_copy"); } },
      { id: "a-mail", group: "Actions", label: "Send an email", hint: portfolio.email, icon: <AtSign size={16}/>, run: () => { window.location.href = `mailto:${portfolio.email}`; } },
      { id: "a-message", group: "Actions", label: "Write a message", hint: "Contact form", keywords: "contact hire", icon: <ArrowRight size={16}/>, run: () => { goTo("contact"); setTimeout(() => document.getElementById("contact-name")?.focus(), 700); } },
      { id: "a-theme", group: "Actions", label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme", keywords: "dark light mode", icon: theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>, run: toggle },
    ];
    if (portfolio.cvUrl) list.push({ id: "a-cv", group: "Actions", label: "Download CV", hint: "PDF", keywords: "resume", icon: <Download size={16}/>, run: () => { track("cv"); window.open(fileUrl(`${portfolio.cvUrl}?download=1`), "_blank"); } });
    if (portfolio.github) list.push({ id: "l-gh", group: "Links", label: "GitHub", hint: new URL(portfolio.github).pathname, icon: <GithubIcon size={16}/>, run: () => { track("outbound", "github"); window.open(portfolio.github, "_blank", "noopener"); } });
    if (portfolio.linkedin) list.push({ id: "l-in", group: "Links", label: "LinkedIn", icon: <LinkedinIcon size={16}/>, run: () => { track("outbound", "linkedin"); window.open(portfolio.linkedin, "_blank", "noopener"); } });
    list.push({ id: "l-studio", group: "Links", label: "Owner studio", hint: "Private", icon: <Lock size={16}/>, run: () => navigate("/owner-login") });
    return list;
  }, [portfolio, sections, theme, toggle, goTo, navigate, toast]);

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return items;
    return items.filter(item => {
      const haystack = `${item.label} ${item.hint ?? ""} ${item.group} ${item.keywords ?? ""}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    });
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery(""); setIndex(0);
    const previous = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => previous?.focus?.();
  }, [open]);

  useEffect(() => { setIndex(0); }, [query]);
  useEffect(() => { listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" }); }, [index]);

  if (!open) return null;

  const run = (item: Item | undefined) => { if (!item) return; onClose(); setTimeout(item.run, 30); };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setIndex(i => (i + 1) % Math.max(1, filtered.length)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setIndex(i => (i - 1 + filtered.length) % Math.max(1, filtered.length)); }
    else if (event.key === "Enter") { event.preventDefault(); run(filtered[index]); }
    else if (event.key === "Escape") { event.preventDefault(); onClose(); }
    else if (event.key === "Tab") event.preventDefault();
  };

  let lastGroup = "";
  return <div className="palette-backdrop" onMouseDown={onClose}>
    <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={event => event.stopPropagation()} onKeyDown={onKeyDown}>
      <div className="palette-search">
        <Search size={18}/>
        <input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects, sections, actions…" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant={filtered[index] ? `pi-${filtered[index].id}` : undefined}/>
        <kbd>Esc</kbd>
      </div>
      <ul className="palette-list" id="palette-list" role="listbox" ref={listRef}>
        {filtered.length === 0 && <li className="palette-empty">No results for “{query}”</li>}
        {filtered.map((item, i) => {
          const header = item.group !== lastGroup ? <li key={`g-${item.group}`} className="palette-group" role="presentation">{item.group}</li> : null;
          lastGroup = item.group;
          return [header, <li key={item.id} id={`pi-${item.id}`} data-index={i} role="option" aria-selected={i === index} className={i === index ? "palette-item active" : "palette-item"} onMouseMove={() => setIndex(i)} onClick={() => run(item)}>
            <span className="palette-icon">{item.icon}</span>
            <span className="palette-label">{item.label}</span>
            {item.hint && <span className="palette-hint">{item.hint}</span>}
            {i === index && <CornerDownLeft size={14} className="palette-enter"/>}
          </li>];
        })}
      </ul>
      <div className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>Esc</kbd> close</span></div>
    </div>
  </div>;
}
