const API_URL = import.meta.env.VITE_API_URL ?? "";

/** The studio's live preview renders the site inside an iframe with this name. */
export const IS_PREVIEW = typeof window !== "undefined" && window.name === "ps-preview";
const OWNER_FLAG = "ps-owner";

export type TrackType = "view" | "project_view" | "project_click" | "cv" | "outbound" | "email_copy";

function storage(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}

function visitorId(): string {
  const store = storage();
  let id = store?.getItem("ps-visitor");
  if (!id) {
    id = crypto.randomUUID();
    try { store?.setItem("ps-visitor", id); } catch { /* private mode */ }
  }
  return id;
}

export function markOwner(isOwner: boolean) {
  try {
    if (isOwner) storage()?.setItem(OWNER_FLAG, "1");
    else storage()?.removeItem(OWNER_FLAG);
  } catch { /* ignore */ }
}

const sent = new Set<string>();

/** Fire-and-forget, privacy-friendly event. Owner and preview visits are skipped. */
export function track(type: TrackType, target = "", once = false) {
  if (IS_PREVIEW || storage()?.getItem(OWNER_FLAG)) return;
  const key = `${type}:${target}:${location.pathname}`;
  if (once && sent.has(key)) return;
  sent.add(key);
  fetch(`${API_URL}/api/analytics/track`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type, target, path: location.pathname, referrer: document.referrer, visitor: visitorId() }),
  }).catch(() => {});
}
