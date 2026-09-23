import fs from "node:fs";
import path from "node:path";

export type Experience = { id: string; role: string; company: string; location?: string; period: string; description: string; highlights?: string[] };
export type Project = { id: string; title: string; category: string; summary: string; stack: string[]; url: string; theme: "ember" | "violet" | "mint"; image?: string };
export type Portfolio = { name: string; designation: string; headline: string; introduction: string; location: string; availability: string; email: string; github: string; linkedin: string; cvUrl: string; years: string; skills: string[]; experience: Experience[]; projects: Project[] };

export const starterPortfolio: Portfolio = {
  name: "Aman Pawar", designation: "Software Engineer", headline: "I engineer reliable digital products for real-world complexity.",
  introduction: "Software Engineer at Tata AIG with 3.5+ years of experience shipping enterprise Angular and React products. I translate complex business workflows into fast, predictable and maintainable user experiences.",
  location: "Gurugram, Haryana", availability: "Building enterprise products at Tata AIG", email: "amanrpawar18@gmail.com", github: "", linkedin: "", cvUrl: "", years: "3.5",
  skills: ["Angular 12–20", "React.js", "Next.js", "TypeScript", "RxJS", "NgRx", "Node.js", "Express.js", "MongoDB", "REST APIs", "AWS", "Jenkins", "SCSS / Sass", "Tailwind CSS"], experience: [
    { id: "tata-aig", role: "Software Engineer", company: "Tata AIG General Insurance", location: "Gurugram, Haryana", period: "June 2023 — Present", description: "I develop and deliver enterprise insurance applications across frontend architecture, business workflows, integrations, testing and production releases.", highlights: ["Built Group Student Travel Guard, supporting customer onboarding, quotations, proposal generation and complex overseas student insurance workflows.", "Architected NgRx state management for multi-step application journeys, creating predictable state transitions and more reliable user interfaces.", "Engineered reactive Angular forms and RxJS workflows with conditional validation, dependent fields and optimized API orchestration.", "Developed Open Quote for Travel Guard Plus using React, TypeScript and Formik, including secure quote sharing through WhatsApp and email.", "Supported AWS deployments and production maintenance while collaborating with backend, QA, product and business teams in an Agile environment."] }
  ],
  projects: [
    { id: "scenepass", title: "ScenePass", category: "Experience platform", summary: "An event discovery and booking experience with interactive seat selection, customer journeys and an organizer studio.", stack: ["React", "TypeScript", "Product UI"], url: "", theme: "ember" },
    { id: "online-food", title: "QuickBite", category: "Full-stack ordering platform", summary: "A production-style food ordering platform with restaurant discovery, filtering, persistent cart, checkout, reservations, live order tracking, history, JWT authentication and protected user workflows.", stack: ["Angular", "TypeScript", "Node.js", "Express.js", "MongoDB"], url: "https://online-food-one.vercel.app/login", theme: "violet" },
  ],
};

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const PORTFOLIO_FILE = path.join(DATA_DIR, "portfolio.json");

export function readPortfolio(): Portfolio {
  try {
    if (!fs.existsSync(PORTFOLIO_FILE)) return starterPortfolio;
    const raw = fs.readFileSync(PORTFOLIO_FILE, "utf-8");
    return { ...starterPortfolio, ...JSON.parse(raw) };
  } catch (error) {
    console.error("Portfolio content unavailable", error);
    return starterPortfolio;
  }
}

export function writePortfolio(portfolio: Portfolio): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(portfolio, null, 2), "utf-8");
}

export function cleanPortfolio(input: unknown): Portfolio {
  if (!input || typeof input !== "object") throw new Error("Invalid portfolio data");
  const data = input as Partial<Portfolio>;
  const text = (value: unknown, limit = 1000) => typeof value === "string" ? value.trim().slice(0, limit) : "";
  const list = (value: unknown) => Array.isArray(value) ? value.filter(item => typeof item === "string").slice(0, 30).map(item => text(item, 60)) : [];
  const longList = (value: unknown) => Array.isArray(value) ? value.filter(item => typeof item === "string").slice(0, 20).map(item => text(item, 1200)) : [];
  const experience = Array.isArray(data.experience) ? data.experience.slice(0, 25).map((item, index) => ({ id: text(item?.id, 60) || `experience-${index}`, role: text(item?.role, 120), company: text(item?.company, 120), location: text(item?.location, 120), period: text(item?.period, 80), description: text(item?.description, 1200), highlights: longList(item?.highlights) })) : [];
  const projects = Array.isArray(data.projects) ? data.projects.slice(0, 24).map((item, index) => ({ id: text(item?.id, 60) || `project-${index}`, title: text(item?.title, 120), category: text(item?.category, 100), summary: text(item?.summary, 1200), stack: list(item?.stack), url: safeUrl(item?.url), theme: (["ember", "violet", "mint"].includes(item?.theme as string) ? item.theme : "ember") as Project["theme"], image: typeof item?.image === "string" && item.image.startsWith("/api/project-image/") ? item.image : "" })) : [];
  const result: Portfolio = { name: text(data.name, 120), designation: text(data.designation, 120), headline: text(data.headline, 180), introduction: text(data.introduction, 2400), location: text(data.location, 120), availability: text(data.availability, 160), email: text(data.email, 160), github: safeUrl(data.github), linkedin: safeUrl(data.linkedin), cvUrl: data.cvUrl === "/api/cv" ? data.cvUrl : "", years: text(data.years, 30), skills: list(data.skills), experience, projects };
  if (!result.name || !result.designation || !result.headline) throw new Error("Name, designation and headline are required");
  return result;
}

function safeUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}
