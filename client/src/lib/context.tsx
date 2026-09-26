import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { fetchPortfolio } from "./api";
import { IS_PREVIEW } from "./track";
import type { Portfolio } from "./types";

// ---------- portfolio data ----------

type PortfolioState = { portfolio: Portfolio | null; error: string; reload: () => void };
const PortfolioContext = createContext<PortfolioState>({ portfolio: null, error: "", reload: () => {} });

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState("");
  const receivedPreview = useRef(false);

  const load = useCallback(() => {
    setError("");
    fetchPortfolio()
      .then(result => { if (!receivedPreview.current) setPortfolio(result.portfolio); })
      .catch(err => setError(err instanceof Error ? err.message : "Could not load portfolio"));
  }, []);

  useEffect(() => {
    load();
    if (!IS_PREVIEW) return;
    // Inside the studio's live preview, unsaved edits arrive from the parent window.
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "ps-preview") return;
      receivedPreview.current = true;
      setPortfolio(event.data.portfolio as Portfolio);
      if (event.data.scrollTo) document.getElementById(event.data.scrollTo)?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "ps-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [load]);

  return <PortfolioContext.Provider value={{ portfolio, error, reload: load }}>{children}</PortfolioContext.Provider>;
}

export const usePortfolio = () => useContext(PortfolioContext);

// ---------- theme ----------

export type Theme = "dark" | "light";
type ThemeState = { theme: Theme; toggle: () => void };
const ThemeContext = createContext<ThemeState>({ theme: "dark", toggle: () => {} });

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem("ps-theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch { /* ignore */ }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#070816" : "#f4f3ee");
  }, [theme]);
  const toggle = useCallback(() => setTheme(current => {
    const next = current === "dark" ? "light" : "dark";
    try { localStorage.setItem("ps-theme", next); } catch { /* ignore */ }
    return next;
  }), []);
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// ---------- toasts ----------

type Toast = { id: number; text: string; tone: "ok" | "error" | "info" };
type ToastState = (text: string, tone?: Toast["tone"]) => void;
const ToastContext = createContext<ToastState>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback<ToastState>((text, tone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts(current => [...current.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), tone === "error" ? 6000 : 3200);
  }, []);
  return <ToastContext.Provider value={push}>
    {children}
    <div className="toasts" role="status" aria-live="polite">{toasts.map(toast => <div key={toast.id} className={`toast toast-${toast.tone}`}>{toast.text}</div>)}</div>
  </ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);
