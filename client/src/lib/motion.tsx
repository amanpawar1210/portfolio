import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./hooks";
import { IS_PREVIEW } from "./track";

const finePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
const motionOn = () => !prefersReducedMotion();

// ---------- intro loader ----------

/** One-time-per-session loader: counts to 100, then lifts like a curtain. */
export function Intro({ name }: { name: string }) {
  const [state, setState] = useState<"hidden" | "counting" | "leaving">(() => {
    try {
      if (IS_PREVIEW || !motionOn() || sessionStorage.getItem("ps-intro")) return "hidden";
    } catch { return "hidden"; }
    return "counting";
  });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (state !== "counting") return;
    try { sessionStorage.setItem("ps-intro", "1"); } catch { /* ignore */ }
    document.body.style.overflow = "hidden";
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1100);
      setCount(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) frame = requestAnimationFrame(tick);
      else setTimeout(() => setState("leaving"), 150);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  useEffect(() => {
    if (state !== "leaving") return;
    const timer = setTimeout(() => { setState("hidden"); document.body.style.overflow = ""; }, 900);
    return () => clearTimeout(timer);
  }, [state]);

  if (state === "hidden") return null;
  return <div className={`intro ${state}`} aria-hidden="true">
    <div className="intro-name">{name.split("").map((char, i) => <span key={i} style={{ animationDelay: `${i * 35}ms` }}>{char === " " ? " " : char}</span>)}</div>
    <div className="intro-bar"><i style={{ transform: `scaleX(${count / 100})` }}/></div>
    <div className="intro-count">{String(count).padStart(3, "0")}</div>
  </div>;
}

// ---------- scroll-velocity ticker ----------

/** Marquee that drifts on its own and speeds up with scroll velocity. */
export function Ticker({ items }: { items: string[] }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = track.current;
    if (!element || !motionOn()) return;
    let offset = 0, velocity = 0, lastY = window.scrollY, frame = 0, paused = false;
    const onScroll = () => { velocity += Math.abs(window.scrollY - lastY) * 0.08; lastY = window.scrollY; };
    const enter = () => { paused = true; };
    const leave = () => { paused = false; };
    const loop = () => {
      velocity *= 0.92;
      if (!paused) offset -= 0.45 + Math.min(velocity, 14);
      const half = element.scrollWidth / 2;
      if (half > 0 && -offset >= half) offset += half;
      element.style.transform = `translate3d(${offset}px, 0, 0) skewX(${-Math.min(velocity, 10) * 0.6}deg)`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    window.addEventListener("scroll", onScroll, { passive: true });
    element.addEventListener("mouseenter", enter);
    element.addEventListener("mouseleave", leave);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); element.removeEventListener("mouseenter", enter); element.removeEventListener("mouseleave", leave); };
  }, []);
  return <div className="ticker" aria-label="Core skills">
    <div ref={track}>{[...items, ...items].map((item, index) => <span key={`${item}-${index}`} aria-hidden={index >= items.length}>{item}<i>✳</i></span>)}</div>
  </div>;
}

// ---------- page-wide scroll & hover effects ----------

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#";

function scramble(element: HTMLElement) {
  const final = element.dataset.text ?? element.textContent ?? "";
  element.dataset.text = final;
  let frame = 0;
  const total = 22;
  const step = () => {
    const progress = frame / total;
    element.textContent = final.split("").map((char, i) => {
      if (char === " " || i / final.length < progress) return char;
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }).join("");
    if (frame++ < total) requestAnimationFrame(step);
    else element.textContent = final;
  };
  step();
}

/**
 * Wires delegated, attribute-driven effects for everything currently in the page:
 *  [data-scramble]  decode text when it scrolls into view
 *  [data-parallax]  translate by scroll offset × value
 *  [data-magnetic]  pull toward the pointer
 *  .timeline        fill its progress line (--progress) as it scrolls through
 */
export function useMotionEffects(deps: unknown[]) {
  useEffect(() => {
    if (!motionOn()) return;
    const cleanups: (() => void)[] = [];

    const scrambleObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { scramble(entry.target as HTMLElement); scrambleObserver.unobserve(entry.target); }
    }), { threshold: 0.6 });
    document.querySelectorAll<HTMLElement>("[data-scramble]").forEach(el => scrambleObserver.observe(el));
    cleanups.push(() => scrambleObserver.disconnect());

    const parallax = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    const timelines = Array.from(document.querySelectorAll<HTMLElement>(".timeline"));
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const vh = window.innerHeight;
        parallax.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > vh) return;
          const center = rect.top + rect.height / 2 - vh / 2;
          el.style.setProperty("--parallax", `${(center * Number(el.dataset.parallax || 0.1)).toFixed(1)}px`);
        });
        timelines.forEach(el => {
          const rect = el.getBoundingClientRect();
          const progress = Math.min(1, Math.max(0, (vh * 0.6 - rect.top) / rect.height));
          el.style.setProperty("--progress", progress.toFixed(3));
        });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); });

    if (finePointer()) {
      let active: HTMLElement | null = null;
      const onMove = (event: PointerEvent) => {
        const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-magnetic]") ?? null;
        if (active && active !== target) { active.style.transform = ""; }
        active = target;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const strength = Number(target.dataset.magnetic || 0.25);
        target.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * strength}px, ${(event.clientY - rect.top - rect.height / 2) * strength}px)`;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => { window.removeEventListener("pointermove", onMove); if (active) active.style.transform = ""; });
    }

    return () => cleanups.forEach(fn => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Tilts an element toward the pointer (whole-window tracking, for hero pieces). */
export function usePointerTilt<T extends HTMLElement>(max = 8) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!finePointer() || !motionOn()) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
        const dy = (event.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
        el.style.setProperty("--tilt-x", `${(-dy * max).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(dx * max).toFixed(2)}deg`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(frame); };
  }, [max]);
  return ref;
}

// ---------- confetti ----------

export function burstConfetti(origin: HTMLElement | null) {
  if (!origin || !motionOn()) return;
  const rect = origin.getBoundingClientRect();
  const colors = ["var(--accent)", "var(--violet)", "var(--blue)", "var(--coral)", "var(--warn)"];
  const layer = document.createElement("div");
  layer.className = "confetti";
  layer.style.left = `${rect.left + rect.width / 2}px`;
  layer.style.top = `${rect.top + rect.height / 3}px`;
  for (let i = 0; i < 42; i++) {
    const piece = document.createElement("i");
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 170;
    piece.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--dy", `${Math.sin(angle) * distance - 80}px`);
    piece.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 80}ms`;
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1600);
}

