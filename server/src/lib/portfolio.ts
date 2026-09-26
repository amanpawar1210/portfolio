import { getDb } from "./db";

export type Stat = { value: string; label: string };
export type Capability = { title: string; text: string };
export type SkillGroup = { id: string; label: string; skills: string[] };
export type Experience = { id: string; role: string; company: string; location: string; period: string; current: boolean; description: string; highlights: string[]; stack: string[] };
export type Project = {
  id: string; title: string; category: string; year: string; role: string; summary: string; stack: string[];
  url: string; repo: string; theme: "ember" | "violet" | "mint"; image: string; featured: boolean;
  problem: string; approach: string; outcome: string; features: string[]; metrics: Stat[]; gallery: string[];
};
export type Education = { id: string; degree: string; school: string; period: string; detail: string };
export type Certification = { id: string; name: string; issuer: string; year: string; url: string };
export type Achievement = { id: string; title: string; detail: string; year: string };
export type Testimonial = { id: string; quote: string; name: string; role: string };
export type Portfolio = {
  name: string; photo: string; designation: string; headline: string; roles: string[]; introduction: string; location: string; timezone: string;
  availability: string; openToWork: boolean; email: string; phone: string; github: string; linkedin: string; twitter: string; cvUrl: string; years: string;
  skills: string[]; skillGroups: SkillGroup[]; stats: Stat[]; capabilities: Capability[];
  experience: Experience[]; projects: Project[]; education: Education[]; certifications: Certification[]; achievements: Achievement[]; testimonials: Testimonial[];
};

export const starterPortfolio: Portfolio = {
  name: "Aman Pawar",
  photo: "",
  designation: "Software Engineer",
  headline: "I build enterprise web apps that feel *fast, simple* and dependable.",
  roles: ["Angular architect", "React engineer", "Full-stack builder", "State management nerd"],
  introduction: "Software Engineer at Tata AIG with 3.5+ years of experience shipping enterprise Angular and React products. I translate complex business workflows into fast, predictable and maintainable user experiences.",
  location: "Gurugram, Haryana",
  timezone: "Asia/Kolkata",
  availability: "Building enterprise products at Tata AIG",
  openToWork: true,
  email: "amanrpawar18@gmail.com",
  phone: "",
  github: "",
  linkedin: "",
  twitter: "",
  cvUrl: "",
  years: "3.5",
  skills: ["Angular 12–20", "React.js", "Next.js", "TypeScript", "JavaScript", "RxJS", "NgRx", "Redux", "Node.js", "Express.js", "MongoDB", "REST APIs", "AWS", "Jenkins", "SCSS / Sass", "Tailwind CSS", "Bootstrap"],
  skillGroups: [
    { id: "frontend", label: "Frontend", skills: ["Angular 12–20", "React.js", "Next.js", "TypeScript", "JavaScript", "SCSS / Sass", "Tailwind CSS", "Bootstrap"] },
    { id: "state", label: "State & data", skills: ["RxJS", "NgRx", "Redux", "REST APIs"] },
    { id: "backend", label: "Backend", skills: ["Node.js", "Express.js", "MongoDB"] },
    { id: "cloud", label: "Cloud & delivery", skills: ["AWS", "Jenkins"] },
  ],
  stats: [
    { value: "3.5+", label: "Years delivering production software" },
    { value: "2", label: "Modern frontend ecosystems" },
    { value: "17+", label: "Enterprise Angular releases" },
    { value: "E2E", label: "Architecture through production support" },
  ],
  capabilities: [
    { title: "State architecture", text: "Predictable NgRx stores, selectors and effects for multi-step, business-critical journeys." },
    { title: "Reactive systems", text: "RxJS orchestration that prevents redundant requests and keeps asynchronous interfaces resilient." },
    { title: "Design engineering", text: "Responsive, accessible component systems that stay consistent as products and teams grow." },
    { title: "Full-stack delivery", text: "REST integrations, Node services, MongoDB data flows, CI/CD and production ownership." },
  ],
  experience: [
    {
      id: "tata-aig", role: "Software Engineer", company: "Tata AIG General Insurance", location: "Gurugram, Haryana", period: "June 2023 — Present", current: true,
      description: "I develop and deliver enterprise insurance applications across frontend architecture, business workflows, integrations, testing and production releases.",
      highlights: [
        "Built *Group Student Travel Guard*, supporting customer onboarding, quotations, proposal generation and complex overseas student insurance workflows.",
        "Architected *NgRx state management* for multi-step application journeys, creating *predictable state transitions* and more reliable user interfaces.",
        "Engineered *reactive Angular forms and RxJS workflows* with conditional validation, dependent fields and *optimized API calls*.",
        "Developed *Open Quote for Travel Guard Plus* using React, TypeScript and Formik, including *secure quote sharing through WhatsApp and email*.",
        "Supported *AWS deployments* and *production maintenance* while collaborating with backend, QA, product and business teams in an Agile environment.",
      ],
      stack: ["Angular", "React", "Next.js", "TypeScript", "JavaScript", "RxJS", "NgRx", "Redux", "Node.js", "Bootstrap", "Tailwind CSS", "AWS"],
    },
  ],
  projects: [
    {
      id: "scenepass", title: "ScenePass", category: "Event booking platform", year: "2026", role: "Full-stack · design & build",
      summary: "An event discovery and ticketing platform with interactive seat maps, scannable QR tickets, group booking with friends and an organizer studio.",
      stack: ["Angular 20", "TypeScript", "Node.js", "Express.js", "MongoDB", "JWT"], url: "https://scene-pass.vercel.app/", repo: "", theme: "ember", image: "", featured: true,
      problem: "Booking tickets for a group usually means one person pays, seats get split up and nobody knows whether a ticket is still valid at the door.",
      approach: "An Angular 20 client with real routes and role-based guards, backed by an Express + MongoDB API that owns pricing, seat locking and ticket state. Seats are validated on the server so two people can never buy the same seat.",
      outcome: "A complete customer and organizer flow — discover, pick seats, pay (dummy), receive QR tickets and check guests in at the door — tested end-to-end in a real browser.",
      features: ["Interactive seat map with best-available seat picking", "QR tickets that verify on any phone camera", "Group booking with shareable invite links", "Realistic dummy checkout: card, UPI and net banking with OTP", "Organizer studio to create, edit and unpublish events", "Ctrl+K instant search across events, venues and cities"],
      metrics: [{ value: "6", label: "Seats max per booking, enforced server-side" }, { value: "3", label: "Payment methods simulated" }, { value: "2", label: "Roles: customer & organizer" }],
      gallery: [],
    },
    {
      id: "online-food", title: "QuickBite", category: "Full-stack ordering platform", year: "2026", role: "Full-stack · solo",
      summary: "A production-style food ordering platform with restaurant discovery, filtering, persistent cart, checkout, reservations, live order tracking, history, JWT authentication and protected user workflows.",
      stack: ["Angular", "TypeScript", "Node.js", "Express.js", "MongoDB"], url: "https://online-food-one.vercel.app/login", repo: "", theme: "violet", image: "", featured: true,
      problem: "Food ordering apps juggle many connected states — cart, restaurant, address, payment and order status — which easily drift out of sync.",
      approach: "Angular services with RxJS streams hold one source of truth for the cart and session; an Express + MongoDB API persists carts, orders and reservations behind JWT-protected routes.",
      outcome: "A deployed end-to-end ordering experience where carts survive reloads, orders can be tracked live, and every user-specific route is protected.",
      features: ["Restaurant discovery with search and filters", "Persistent cart across sessions", "Checkout and table reservations", "Live order tracking and order history", "JWT authentication with protected routes"],
      metrics: [],
      gallery: [],
    },
    {
      id: "portfolio-studio", title: "Portfolio Studio", category: "Personal CMS", year: "2026", role: "Full-stack · solo",
      summary: "This site. A portfolio with a private owner studio to edit every section, read contact messages, see visitor analytics and restore earlier versions — no code changes needed.",
      stack: ["React", "TypeScript", "Vite", "Express.js", "MongoDB"], url: "", repo: "", theme: "mint", image: "", featured: false,
      problem: "Keeping a portfolio current usually means editing code and redeploying for every new role, project or CV.",
      approach: "A React + Vite front end backed by a small Express API on Vercel. Content, files, messages and analytics live in MongoDB; owner access uses a signed, HTTP-only session cookie with login rate limiting.",
      outcome: "Every section is editable from the browser with a live preview, and changes go live the moment they are saved.",
      features: ["Live side-by-side preview while editing", "Contact inbox with read / unread states", "Privacy-friendly visitor analytics", "Version history with one-click restore", "Command palette and light / dark theme"],
      metrics: [],
      gallery: [],
    },
  ],
  education: [],
  certifications: [],
  achievements: [],
  testimonials: [],
};

type ContentDoc = { _id: string; data: Portfolio; updatedAt: Date };
type RevisionDoc = { data: Portfolio; savedAt: Date; label: string };
const MAX_REVISIONS = 20;

export async function readPortfolio(): Promise<{ portfolio: Portfolio; updatedAt: string | null }> {
  const db = await getDb();
  const doc = await db.collection<ContentDoc>("content").findOne({ _id: "portfolio" });
  if (!doc) return { portfolio: starterPortfolio, updatedAt: null };
  // Re-running the cleaner fills defaults for fields added after the doc was saved.
  return { portfolio: cleanPortfolio({ ...starterPortfolio, ...doc.data }), updatedAt: doc.updatedAt.toISOString() };
}

export async function writePortfolio(portfolio: Portfolio, label = "Saved from studio"): Promise<string> {
  const db = await getDb();
  const updatedAt = new Date();
  await db.collection<ContentDoc>("content").replaceOne({ _id: "portfolio" }, { data: portfolio, updatedAt }, { upsert: true });
  await db.collection<RevisionDoc>("revisions").insertOne({ data: portfolio, savedAt: updatedAt, label });
  const stale = await db.collection<RevisionDoc>("revisions").find({}, { projection: { _id: 1 } }).sort({ savedAt: -1 }).skip(MAX_REVISIONS).toArray();
  if (stale.length) await db.collection("revisions").deleteMany({ _id: { $in: stale.map(item => item._id) } });
  return updatedAt.toISOString();
}

export async function listRevisions() {
  const db = await getDb();
  const docs = await db.collection<RevisionDoc>("revisions").find({}, { projection: { savedAt: 1, label: 1, "data.projects.id": 1, "data.experience.id": 1, "data.headline": 1 } }).sort({ savedAt: -1 }).limit(MAX_REVISIONS).toArray();
  return docs.map(doc => ({ id: doc._id.toString(), savedAt: doc.savedAt.toISOString(), label: doc.label, headline: doc.data?.headline ?? "", projects: doc.data?.projects?.length ?? 0, roles: doc.data?.experience?.length ?? 0 }));
}

export async function getRevision(id: string): Promise<Portfolio | null> {
  const { ObjectId } = await import("mongodb");
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection<RevisionDoc>("revisions").findOne({ _id: new ObjectId(id) });
  return doc ? cleanPortfolio({ ...starterPortfolio, ...doc.data }) : null;
}

// ---------- validation ----------

const text = (value: unknown, limit = 1000) => typeof value === "string" ? value.trim().slice(0, limit) : "";
const bool = (value: unknown) => value === true;
const strings = (value: unknown, max: number, limit: number) => Array.isArray(value) ? value.filter(item => typeof item === "string" && item.trim()).slice(0, max).map(item => text(item, limit)) : [];
const records = <T>(value: unknown, max: number, map: (item: Record<string, unknown>, index: number) => T) =>
  Array.isArray(value) ? value.filter(item => item && typeof item === "object").slice(0, max).map((item, index) => map(item as Record<string, unknown>, index)) : [];
const id = (value: unknown, fallback: string) => text(value, 60).replace(/[^a-zA-Z0-9_-]/g, "") || fallback;
const fileUrl = (value: unknown) => typeof value === "string" && /^\/api\/images\/[a-f0-9]{24}$/.test(value.split("?")[0]) ? value.split("?")[0] : "";
const stats = (value: unknown, max: number) => records(value, max, item => ({ value: text(item.value, 24), label: text(item.label, 120) })).filter(item => item.value || item.label);

export function cleanPortfolio(input: unknown): Portfolio {
  if (!input || typeof input !== "object") throw new Error("Invalid portfolio data");
  const data = input as Record<string, unknown>;

  const result: Portfolio = {
    name: text(data.name, 120),
    photo: fileUrl(data.photo),
    designation: text(data.designation, 120),
    headline: text(data.headline, 180),
    roles: strings(data.roles, 8, 60),
    introduction: text(data.introduction, 2400),
    location: text(data.location, 120),
    timezone: validTimezone(text(data.timezone, 60)),
    availability: text(data.availability, 160),
    openToWork: bool(data.openToWork),
    email: text(data.email, 160),
    phone: text(data.phone, 40),
    github: safeUrl(data.github),
    linkedin: safeUrl(data.linkedin),
    twitter: safeUrl(data.twitter),
    cvUrl: data.cvUrl === "/api/cv" ? "/api/cv" : "",
    years: text(data.years, 30),
    skills: strings(data.skills, 40, 60),
    skillGroups: records(data.skillGroups, 8, (item, index) => ({ id: id(item.id, `group-${index}`), label: text(item.label, 40), skills: strings(item.skills, 24, 60) })).filter(group => group.label || group.skills.length),
    stats: stats(data.stats, 6),
    capabilities: records(data.capabilities, 8, item => ({ title: text(item.title, 80), text: text(item.text, 400) })).filter(item => item.title),
    experience: records(data.experience, 25, (item, index) => ({
      id: id(item.id, `experience-${index}`), role: text(item.role, 120), company: text(item.company, 120), location: text(item.location, 120),
      period: text(item.period, 80), current: bool(item.current), description: text(item.description, 1200),
      highlights: strings(item.highlights, 20, 1200), stack: strings(item.stack, 20, 40),
    })),
    projects: records(data.projects, 24, (item, index) => ({
      id: id(item.id, `project-${index}`), title: text(item.title, 120), category: text(item.category, 100), year: text(item.year, 20), role: text(item.role, 120),
      summary: text(item.summary, 1200), stack: strings(item.stack, 20, 40), url: safeUrl(item.url), repo: safeUrl(item.repo),
      theme: (["ember", "violet", "mint"].includes(item.theme as string) ? item.theme : "ember") as Project["theme"],
      image: fileUrl(item.image), featured: bool(item.featured),
      problem: text(item.problem, 2000), approach: text(item.approach, 2000), outcome: text(item.outcome, 2000),
      features: strings(item.features, 16, 300), metrics: stats(item.metrics, 4),
      gallery: Array.isArray(item.gallery) ? item.gallery.map(fileUrl).filter(Boolean).slice(0, 8) : [],
    })),
    education: records(data.education, 10, (item, index) => ({ id: id(item.id, `education-${index}`), degree: text(item.degree, 160), school: text(item.school, 160), period: text(item.period, 60), detail: text(item.detail, 600) })),
    certifications: records(data.certifications, 20, (item, index) => ({ id: id(item.id, `cert-${index}`), name: text(item.name, 160), issuer: text(item.issuer, 120), year: text(item.year, 20), url: safeUrl(item.url) })),
    achievements: records(data.achievements, 20, (item, index) => ({ id: id(item.id, `achievement-${index}`), title: text(item.title, 160), detail: text(item.detail, 600), year: text(item.year, 20) })),
    testimonials: records(data.testimonials, 12, (item, index) => ({ id: id(item.id, `testimonial-${index}`), quote: text(item.quote, 800), name: text(item.name, 120), role: text(item.role, 160) })),
  };

  // Groups are the source of truth; the flat list (ticker, code card) is derived from them.
  if (result.skillGroups.length) result.skills = [...new Set(result.skillGroups.flatMap(group => group.skills))].slice(0, 40);
  else if (result.skills.length) result.skillGroups = [{ id: "skills", label: "Skills", skills: result.skills }];

  if (!result.name || !result.designation || !result.headline) throw new Error("Name, designation and headline are required");
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new Error("Public email doesn't look like a valid address");
  const ids = new Set<string>();
  for (const project of result.projects) {
    if (!project.title) throw new Error("Every project needs a name");
    if (ids.has(project.id)) project.id = `${project.id}-${ids.size}`;
    ids.add(project.id);
  }
  return result;
}

function validTimezone(zone: string): string {
  if (!zone) return "Asia/Kolkata";
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return zone;
  } catch {
    return "Asia/Kolkata";
  }
}

function safeUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}
