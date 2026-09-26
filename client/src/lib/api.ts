import type { Analytics, Message, Portfolio, Revision } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(message: string, public status: number, public body: Record<string, unknown> | null) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { credentials: "include", ...options });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0, null);
  }
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json() : null;
  if (!response.ok) throw new ApiError((body && body.error) || `Request failed (${response.status})`, response.status, body);
  return body as T;
}

const json = (method: string, data: unknown): RequestInit => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(data) });

export const fileUrl = (path: string) => path.startsWith("/api/") ? `${API_URL}${path}` : path;

export const fetchPortfolio = () => request<{ portfolio: Portfolio; updatedAt: string | null }>("/api/portfolio");
export const savePortfolio = (portfolio: Portfolio) => request<{ portfolio: Portfolio; updatedAt: string }>("/api/portfolio", json("PUT", portfolio));
export const fetchRevisions = () => request<{ revisions: Revision[] }>("/api/portfolio/revisions");
export const fetchRevision = (id: string) => request<{ portfolio: Portfolio }>(`/api/portfolio/revisions/${id}`);
export const restoreRevision = (id: string) => request<{ portfolio: Portfolio; updatedAt: string }>(`/api/portfolio/revisions/${id}/restore`, { method: "POST" });

export function uploadCv(file: File) {
  const form = new FormData();
  form.append("cv", file);
  return request<{ url: string; name: string; size: number }>("/api/cv", { method: "POST", body: form });
}
export const fetchCvMeta = () => request<{ cv: { name: string; size: number; updatedAt: string } | null }>("/api/cv/meta");

export function uploadImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  return request<{ url: string }>("/api/images", { method: "POST", body: form });
}

export const sendMessage = (data: { name: string; email: string; subject: string; message: string; website: string; source?: string }) => request<{ ok: true }>("/api/messages", json("POST", data));
export const fetchMessages = () => request<{ messages: Message[] }>("/api/messages");
export const updateMessage = (id: string, patch: Partial<Pick<Message, "read" | "starred">>) => request<{ ok: true }>(`/api/messages/${id}`, json("PATCH", patch));
export const deleteMessage = (id: string) => request<{ ok: true }>(`/api/messages/${id}`, { method: "DELETE" });

export const fetchAnalytics = (days: number) => request<Analytics>(`/api/analytics/summary?days=${days}`);

export const ownerLogin = (password: string) => request<{ ok: true }>("/api/owner-login", json("POST", { password }));
export const ownerLogout = () => request<{ ok: true }>("/api/owner-logout", { method: "POST" });
export const ownerSession = () => request<{ isOwner: boolean }>("/api/owner-session");
