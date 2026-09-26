import { useCallback, useEffect, useRef, useState } from "react";

export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Adds `.visible` to every [data-reveal] element as it scrolls into view. Re-scans when `deps` change. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.visible)"));
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      elements.forEach(element => element.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Counts the numeric part of a value like "3.5+" or "17+" up from zero once visible. */
export function useCountUp(value: string) {
  const ref = useRef<HTMLElement | null>(null);
  const match = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  const [display, setDisplay] = useState(match ? `${match[1]}0${match[3]}` : value);

  useEffect(() => {
    if (!match) { setDisplay(value); return; }
    const [, prefix, number, suffix] = match;
    const target = Number(number);
    const decimals = number.includes(".") ? number.split(".")[1].length : 0;
    const element = ref.current;
    if (!element || prefersReducedMotion()) { setDisplay(value); return; }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(`${prefix}${(target * eased).toFixed(decimals)}${suffix}`);
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { ref, display };
}

/** Live clock for a time zone, e.g. "7:42 PM". */
export function useLocalTime(timeZone: string) {
  const format = useCallback(() => {
    try { return new Intl.DateTimeFormat("en-IN", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date()); }
    catch { return ""; }
  }, [timeZone]);
  const [time, setTime] = useState(format);
  useEffect(() => {
    setTime(format());
    const timer = setInterval(() => setTime(format()), 15_000);
    return () => clearInterval(timer);
  }, [format]);
  return time;
}

/** Cycles through words with a typing / deleting effect. */
export function useTypewriter(words: string[], { typeMs = 70, holdMs = 1600 } = {}) {
  const [text, setText] = useState(words[0] ?? "");
  const key = words.join("|");
  useEffect(() => {
    if (words.length === 0) { setText(""); return; }
    if (words.length === 1 || prefersReducedMotion()) { setText(words[0]); return; }
    let index = 0, length = words[0].length, deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = words[index];
      if (!deleting && length === word.length) { deleting = true; timer = setTimeout(tick, holdMs); return; }
      if (deleting && length === 0) { deleting = false; index = (index + 1) % words.length; }
      length += deleting ? -1 : 1;
      setText(words[index].slice(0, length));
      timer = setTimeout(tick, deleting ? typeMs / 2 : typeMs);
    };
    timer = setTimeout(tick, holdMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return text;
}

/** Tracks which of the given section ids is currently in the middle of the viewport. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join(",");
  useEffect(() => {
    const sections = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    }), { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active;
}

/** Scroll progress 0–100 and whether the page has scrolled past `threshold`. */
export function useScroll(threshold = 600) {
  const [state, setState] = useState({ progress: 0, past: false, top: true });
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const distance = document.documentElement.scrollHeight - window.innerHeight;
        setState({ progress: distance > 0 ? window.scrollY / distance * 100 : 0, past: window.scrollY > threshold, top: window.scrollY < 20 });
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); cancelAnimationFrame(frame); };
  }, [threshold]);
  return state;
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "✦";
}

export function timeAgo(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units: [number, string][] = [[60, "min"], [3600, "h"], [86400, "d"], [604800, "w"]];
  let label = "";
  for (let i = units.length - 1; i >= 0; i--) {
    if (seconds >= units[i][0]) { label = `${Math.floor(seconds / units[i][0])}${units[i][1] === "min" ? " min" : units[i][1]} ago`; break; }
  }
  return seconds > 60 * 60 * 24 * 30 ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : label;
}
