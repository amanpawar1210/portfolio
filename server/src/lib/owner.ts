import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const OWNER_COOKIE_NAME = "owner_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const OWNER_COOKIE_MAX_AGE_MS = SESSION_TTL_MS;

function getPassword(): string {
  const password = process.env.OWNER_PASSWORD;
  if (!password) throw new Error("OWNER_PASSWORD environment variable is not set");
  return password;
}

// Sessions are signed with SESSION_SECRET when set; changing the password also
// invalidates old sessions because it is mixed into the key.
function sign(value: string): string {
  const key = `${process.env.SESSION_SECRET ?? ""}:${getPassword()}`;
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

export function createSessionToken(): string {
  const payload = String(Date.now() + SESSION_TTL_MS);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (Number(payload) < Date.now()) return false;
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(sign(payload));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyPassword(password: string): boolean {
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(getPassword()).digest();
  return crypto.timingSafeEqual(a, b);
}

export function isOwner(req: Request): boolean {
  return verifySessionToken(req.cookies?.[OWNER_COOKIE_NAME]);
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!isOwner(req)) return res.status(403).json({ error: "Owner access required" });
  next();
}

/** Stable, non-reversible id for an IP (or any string) so raw IPs are never stored. */
export function fingerprint(value: string): string {
  return crypto.createHash("sha256").update(`${process.env.SESSION_SECRET ?? "ps"}:${value}`).digest("hex").slice(0, 24);
}

export function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "unknown";
}
