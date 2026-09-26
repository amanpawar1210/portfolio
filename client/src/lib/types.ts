export type Stat = { value: string; label: string };
export type Capability = { title: string; text: string };
export type SkillGroup = { id: string; label: string; skills: string[] };
export type Experience = { id: string; role: string; company: string; location: string; period: string; current: boolean; description: string; highlights: string[]; stack: string[] };
export type ProjectTheme = "ember" | "violet" | "mint";
export type Project = {
  id: string; title: string; category: string; year: string; role: string; summary: string; stack: string[];
  url: string; repo: string; theme: ProjectTheme; image: string; featured: boolean;
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

export type Message = { id: string; name: string; email: string; subject: string; message: string; source: string; createdAt: string; read: boolean; starred: boolean };
export type Revision = { id: string; savedAt: string; label: string; headline: string; projects: number; roles: number };
export type Totals = { views: number; visitors: number; cv: number; projectViews: number; projectClicks: number; messages: number; outbound: number };
export type Analytics = {
  days: number; current: Totals; previous: Totals; unread: number;
  daily: { date: string; views: number; visitors: number }[];
  projects: { id: string; views: number; clicks: number }[];
  referrers: { label: string; value: number }[];
  devices: { label: string; value: number }[];
  recent: { type: string; target: string; path: string; referrer: string; device: string; at: string }[];
};

export const newProject = (): Project => ({ id: `project-${Date.now().toString(36)}`, title: "", category: "", year: String(new Date().getFullYear()), role: "", summary: "", stack: [], url: "", repo: "", theme: "mint", image: "", featured: false, problem: "", approach: "", outcome: "", features: [], metrics: [], gallery: [] });
export const newExperience = (): Experience => ({ id: `role-${Date.now().toString(36)}`, role: "", company: "", location: "", period: "", current: false, description: "", highlights: [], stack: [] });
