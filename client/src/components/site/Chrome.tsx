import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUp, ArrowUpRight, Command, Menu, Moon, Sun, X } from "lucide-react";
import type { Portfolio } from "../../lib/types";
import { useTheme } from "../../lib/context";
import { initials, prefersReducedMotion, useScroll } from "../../lib/hooks";
import CommandPalette from "./CommandPalette";

export type NavItem = { id: string; label: string };

export function sectionsFor(portfolio: Portfolio): NavItem[] {
  return [
    { id: "work", label: "Work" },
    { id: "about", label: "About" },
    ...(portfolio.experience.length ? [{ id: "experience", label: "Experience" }] : []),
    ...(portfolio.education.length || portfolio.certifications.length || portfolio.achievements.length ? [{ id: "credentials", label: "Credentials" }] : []),
    { id: "contact", label: "Contact" },
  ];
}

/** Scrolls to a home-page section, navigating home first when on another page. */
export function useSectionNav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (id: string) => {
    if (location.pathname !== "/") { navigate(`/#${id}`); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    history.replaceState(null, "", id === "top" ? "/" : `#${id}`);
  };
}

export function SiteChrome({ portfolio, active, children }: { portfolio: Portfolio; active?: string; children: ReactNode }) {
  const { progress, past, top } = useScroll(700);
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const goTo = useSectionNav();
  const sections = sectionsFor(portfolio);

  // Soft spotlight that follows the pointer — written to CSS vars, no re-renders.
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement;
    const move = (event: PointerEvent) => { root.style.setProperty("--mx", `${event.clientX}px`); root.style.setProperty("--my", `${event.clientY}px`); };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) { event.preventDefault(); setPaletteOpen(open => !open); }
      else if (event.key === "/" && !typing) { event.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { document.body.style.overflow = menuOpen ? "hidden" : ""; }, [menuOpen]);

  const navClick = (id: string) => (event: MouseEvent) => { event.preventDefault(); setMenuOpen(false); goTo(id); };
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return <div className="site">
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="spotlight" aria-hidden="true"/>
    <div className="scroll-progress" style={{ transform: `scaleX(${progress / 100})` }} aria-hidden="true"/>
    <header className={top ? "site-header" : "site-header scrolled"}>
      <a className="wordmark" href="/" onClick={navClick("top")}>
        <span className="wordmark-mark">{initials(portfolio.name)}</span>
        <span className="wordmark-text">{portfolio.name}<small>{portfolio.designation}</small></span>
      </a>
      <nav className={menuOpen ? "site-nav open" : "site-nav"} aria-label="Main navigation">
        {sections.map(item => <a key={item.id} href={`/#${item.id}`} className={active === item.id ? "active" : undefined} aria-current={active === item.id ? "true" : undefined} onClick={navClick(item.id)}>{item.label}</a>)}
      </nav>
      <div className="header-tools">
        <button className="kbd-button" onClick={() => setPaletteOpen(true)} aria-label="Open command palette"><Command size={14}/><span>{mac ? "⌘K" : "Ctrl K"}</span></button>
        <button className="icon-button" onClick={toggle} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title="Toggle theme">{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button>
        <a className="header-cta" data-magnetic="0.3" href="/#contact" onClick={navClick("contact")}>Let&apos;s talk <ArrowUpRight size={16}/></a>
        <button className="icon-button mobile-menu" aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={18}/> : <Menu size={18}/>}</button>
      </div>
    </header>

    <div id="main">{children}</div>

    <button className={past ? "scroll-top visible" : "scroll-top"} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}>
      <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" pathLength="100" style={{ strokeDashoffset: 100 - progress }}/></svg>
      <ArrowUp size={16}/>
    </button>

    <footer className="site-footer">
      <span>© {new Date().getFullYear()} {portfolio.name}</span>
      <span className="footer-hint">Press <kbd>/</kbd> to search anything</span>
      <Link to="/owner-login">Owner studio <ArrowRight size={14}/></Link>
    </footer>

    <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} portfolio={portfolio} sections={sections} goTo={goTo}/>
  </div>;
}
