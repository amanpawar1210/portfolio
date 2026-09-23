import { Router, type CookieOptions } from "express";
import { OWNER_COOKIE_NAME, OWNER_COOKIE_MAX_AGE_MS, createSessionToken, verifyPassword, verifySessionToken } from "../lib/owner";

const router = Router();

function cookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: OWNER_COOKIE_MAX_AGE_MS,
  };
}

router.post("/owner-login", (req, res) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!password) return res.status(400).json({ error: "Password is required" });

  let ok = false;
  try {
    ok = verifyPassword(password);
  } catch {
    return res.status(500).json({ error: "Owner password is not configured on the server" });
  }
  if (!ok) return res.status(401).json({ error: "Incorrect password" });

  res.cookie(OWNER_COOKIE_NAME, createSessionToken(), cookieOptions());
  res.json({ ok: true });
});

router.post("/owner-logout", (_req, res) => {
  res.clearCookie(OWNER_COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

router.get("/owner-session", (req, res) => {
  res.json({ isOwner: verifySessionToken(req.cookies?.[OWNER_COOKIE_NAME]) });
});

export default router;
