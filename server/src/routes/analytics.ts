import { Router } from "express";
import { getDb } from "../lib/db";
import { clientIp, fingerprint, isOwner, requireOwner } from "../lib/owner";
import { hit } from "../lib/rate-limit";

type EventDoc = { type: string; target: string; path: string; referrer: string; device: string; visitor: string; createdAt: Date };

const TYPES = new Set(["view", "project_view", "project_click", "cv", "outbound", "email_copy"]);
const TZ = "Asia/Kolkata";
const router = Router();

const str = (value: unknown, limit: number) => typeof value === "string" ? value.trim().slice(0, limit) : "";

function refHost(value: unknown, ownHost: string): string {
  try {
    const host = new URL(str(value, 500)).hostname.replace(/^www\./, "");
    return host && host !== ownHost ? host : "";
  } catch {
    return "";
  }
}

// Public, cookie-less, privacy-friendly: stores a salted hash of the visitor's
// own random id (or IP), never the IP itself. Owner visits are not counted.
router.post("/track", async (req, res) => {
  try {
    const type = str(req.body?.type, 30);
    if (!TYPES.has(type) || isOwner(req)) return;
    const visitor = fingerprint(str(req.body?.visitor, 64) || clientIp(req));
    const limit = await hit({ key: `track:${visitor}`, max: 120, windowMs: 10 * 60 * 1000 });
    if (!limit.allowed) return;
    const ua = String(req.headers["user-agent"] ?? "");
    if (/bot|crawl|spider|headless|lighthouse/i.test(ua)) return;
    const ownHost = (req.headers.origin ? new URL(String(req.headers.origin)).hostname : "").replace(/^www\./, "");
    const db = await getDb();
    await db.collection<EventDoc>("events").insertOne({
      type,
      target: str(req.body?.target, 80),
      path: str(req.body?.path, 120),
      referrer: refHost(req.body?.referrer, ownHost),
      device: /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop",
      visitor,
      createdAt: new Date(),
    });
  } catch (error) {
    console.warn("track failed", error instanceof Error ? error.message : error);
  } finally {
    // Always 204: tracking must never surface errors to visitors.
    res.status(204).end();
  }
});

router.get("/summary", requireOwner, async (req, res, next) => {
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  const now = Date.now();
  const since = new Date(now - days * 86_400_000);
  const previous = new Date(now - days * 2 * 86_400_000);
  try {
    const db = await getDb();
    const events = db.collection<EventDoc>("events");

    const totals = async (from: Date, to: Date) => {
      const [row] = await events.aggregate<{ counts: { _id: string; n: number }[]; visitors: { n: number }[] }>([
        { $match: { createdAt: { $gte: from, $lt: to } } },
        { $facet: {
          counts: [{ $group: { _id: "$type", n: { $sum: 1 } } }],
          visitors: [{ $match: { type: "view" } }, { $group: { _id: "$visitor" } }, { $count: "n" }],
        } },
      ]).toArray();
      const by = Object.fromEntries((row?.counts ?? []).map(item => [item._id, item.n]));
      return { views: by.view ?? 0, visitors: row?.visitors[0]?.n ?? 0, cv: by.cv ?? 0, projectViews: by.project_view ?? 0, projectClicks: by.project_click ?? 0, messages: by.contact ?? 0, outbound: (by.outbound ?? 0) + (by.email_copy ?? 0) };
    };

    const [current, before, series, projects, referrers, devices, recent, unread] = await Promise.all([
      totals(since, new Date(now + 1)),
      totals(previous, since),
      events.aggregate<{ _id: string; views: number; visitors: string[] }>([
        { $match: { createdAt: { $gte: since }, type: "view" } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, views: { $sum: 1 }, visitors: { $addToSet: "$visitor" } } },
      ]).toArray(),
      events.aggregate<{ _id: string; views: number; clicks: number }>([
        { $match: { createdAt: { $gte: since }, type: { $in: ["project_view", "project_click"] } } },
        { $group: { _id: "$target", views: { $sum: { $cond: [{ $eq: ["$type", "project_view"] }, 1, 0] } }, clicks: { $sum: { $cond: [{ $eq: ["$type", "project_click"] }, 1, 0] } } } },
        { $sort: { views: -1, clicks: -1 } }, { $limit: 8 },
      ]).toArray(),
      events.aggregate<{ _id: string; n: number }>([
        { $match: { createdAt: { $gte: since }, type: "view" } },
        { $group: { _id: { $cond: [{ $eq: ["$referrer", ""] }, "Direct / unknown", "$referrer"] }, n: { $sum: 1 } } },
        { $sort: { n: -1 } }, { $limit: 6 },
      ]).toArray(),
      events.aggregate<{ _id: string; n: number }>([
        { $match: { createdAt: { $gte: since }, type: "view" } },
        { $group: { _id: "$device", n: { $sum: 1 } } },
      ]).toArray(),
      events.find({}, { projection: { type: 1, target: 1, path: 1, referrer: 1, device: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(12).toArray(),
      db.collection("messages").countDocuments({ read: false }),
    ]);

    // Fill every day in the range so the chart has no gaps.
    const byDay = new Map(series.map(item => [item._id, item]));
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
    const daily = Array.from({ length: days }, (_, index) => {
      const date = fmt.format(new Date(now - (days - 1 - index) * 86_400_000));
      const row = byDay.get(date);
      return { date, views: row?.views ?? 0, visitors: row?.visitors.length ?? 0 };
    });

    res.json({
      days, current, previous: before, daily, unread,
      projects: projects.map(item => ({ id: item._id, views: item.views, clicks: item.clicks })),
      referrers: referrers.map(item => ({ label: item._id, value: item.n })),
      devices: devices.map(item => ({ label: item._id || "desktop", value: item.n })),
      recent: recent.map(item => ({ type: item.type, target: item.target, path: item.path, referrer: item.referrer, device: item.device, at: item.createdAt.toISOString() })),
    });
  } catch (error) { next(error); }
});

export default router;
