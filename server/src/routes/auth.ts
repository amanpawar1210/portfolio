import { Router, type CookieOptions } from "express";
import { OWNER_COOKIE_NAME, OWNER_COOKIE_MAX_AGE_MS, clientIp, createSessionToken, fingerprint, isOwner, verifyPassword } from "../lib/owner";
import { hit, peek, reset } from "../lib/rate-limit";

const router = Router();
const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

function cookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/", maxAge: OWNER_COOKIE_MAX_AGE_MS };
}

router.post("/owner-login", async (req, res, next) => {
  const password = typeof req.body?.password === "string" ? req.body.password.slice(0, 200) : "";
  if (!password) return res.status(400).json({ error: "Password is required" });

  try {
    const key = `login:${fingerprint(clientIp(req))}`;
    const state = await peek(key, MAX_ATTEMPTS);
    if (!state.allowed) {
      return res.status(429).json({ error: `Too many wrong attempts. Try again in ${Math.ceil(state.retryAfterSec / 60)} min.`, retryAfterSec: state.retryAfterSec, remaining: 0 });
    }

    let ok = false;
    try {
      ok = verifyPassword(password);
    } catch {
      return res.status(500).json({ error: "Owner password is not configured on the server" });
    }

    if (!ok) {
      const attempt = await hit({ key, max: MAX_ATTEMPTS, windowMs: LOCK_WINDOW_MS });
      const locked = attempt.remaining === 0;
      return res.status(locked ? 429 : 401).json({
        error: locked ? `Too many wrong attempts. Try again in ${Math.ceil(attempt.retryAfterSec / 60)} min.` : "Incorrect password",
        remaining: attempt.remaining,
        retryAfterSec: locked ? attempt.retryAfterSec : 0,
      });
    }

    await reset(key);
    res.cookie(OWNER_COOKIE_NAME, createSessionToken(), cookieOptions());
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.post("/owner-logout", (_req, res) => {
  const { maxAge: _maxAge, ...options } = cookieOptions();
  res.clearCookie(OWNER_COOKIE_NAME, options);
  res.json({ ok: true });
});

router.get("/owner-session", (req, res) => {
  res.set("cache-control", "no-store");
  res.json({ isOwner: isOwner(req) });
});

export default router;
