import crypto from "node:crypto";

export const OWNER_COOKIE_NAME = "owner_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const OWNER_COOKIE_MAX_AGE_MS = SESSION_TTL_MS;

function getSecret(): string {
  const secret = process.env.OWNER_PASSWORD;
  if (!secret) throw new Error("OWNER_PASSWORD environment variable is not set");
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (Number(payload) < Date.now()) return false;
  try {
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyPassword(password: string): boolean {
  const secret = getSecret();
  const a = Buffer.from(password);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
