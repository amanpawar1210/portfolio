import type { Portfolio } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include", ...options });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json() : null;
  if (!response.ok) throw new Error((body && body.error) || `Request failed (${response.status})`);
  return body as T;
}

export function fetchPortfolio(): Promise<{ portfolio: Portfolio }> {
  return request("/api/portfolio");
}

export function savePortfolio(portfolio: Portfolio): Promise<{ portfolio: Portfolio }> {
  return request("/api/portfolio", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(portfolio) });
}

export function uploadCv(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("cv", file);
  return request("/api/cv", { method: "POST", body: form });
}

export function uploadProjectImage(projectId: string, file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("image", file);
  return request(`/api/project-image/${encodeURIComponent(projectId)}`, { method: "POST", body: form });
}

export function ownerLogin(password: string): Promise<{ ok: true }> {
  return request("/api/owner-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
}

export function ownerLogout(): Promise<{ ok: true }> {
  return request("/api/owner-logout", { method: "POST" });
}

export function ownerSession(): Promise<{ isOwner: boolean }> {
  return request("/api/owner-session");
}
