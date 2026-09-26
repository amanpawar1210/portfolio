import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../lib/db";
import { clientIp, fingerprint, requireOwner } from "../lib/owner";
import { hit } from "../lib/rate-limit";

type MessageDoc = { name: string; email: string; subject: string; message: string; source: string; createdAt: Date; read: boolean; starred: boolean; visitor: string };

const router = Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (value: unknown, limit: number) => typeof value === "string" ? value.trim().slice(0, limit) : "";

router.post("/", async (req, res, next) => {
  const body = req.body ?? {};
  // Honeypot: real visitors never see or fill this field.
  if (str(body.website, 200)) return res.status(201).json({ ok: true });

  const name = str(body.name, 100);
  const email = str(body.email, 160);
  const subject = str(body.subject, 140);
  const message = str(body.message, 4000);
  const source = str(body.source, 60) || "contact";

  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = "Tell me your name";
  if (!EMAIL.test(email)) fields.email = "Enter a valid email so I can reply";
  if (message.length < 10) fields.message = "Write at least 10 characters";
  if (Object.keys(fields).length) return res.status(400).json({ error: "Please fix the highlighted fields", fields });

  try {
    const visitor = fingerprint(clientIp(req));
    const limit = await hit({ key: `msg:${visitor}`, max: 5, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) return res.status(429).json({ error: "You have sent several messages already. Please try again in an hour, or email me directly." });

    const db = await getDb();
    const createdAt = new Date();
    await db.collection<MessageDoc>("messages").insertOne({ name, email, subject, message, source, createdAt, read: false, starred: false, visitor });
    await db.collection("events").insertOne({ type: "contact", target: source, visitor, createdAt });
    res.status(201).json({ ok: true });
  } catch (error) { next(error); }
});

router.get("/", requireOwner, async (_req, res, next) => {
  try {
    const db = await getDb();
    const docs = await db.collection<MessageDoc>("messages").find({}, { projection: { visitor: 0 } }).sort({ createdAt: -1 }).limit(300).toArray();
    res.json({ messages: docs.map(({ _id, createdAt, ...rest }) => ({ ...rest, id: _id.toString(), createdAt: createdAt.toISOString() })) });
  } catch (error) { next(error); }
});

router.patch("/:id", requireOwner, async (req, res, next) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Message not found" });
  const patch: Partial<MessageDoc> = {};
  if (typeof req.body?.read === "boolean") patch.read = req.body.read;
  if (typeof req.body?.starred === "boolean") patch.starred = req.body.starred;
  try {
    const db = await getDb();
    await db.collection<MessageDoc>("messages").updateOne({ _id: new ObjectId(req.params.id) }, { $set: patch });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.delete("/:id", requireOwner, async (req, res, next) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Message not found" });
  try {
    const db = await getDb();
    await db.collection<MessageDoc>("messages").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

export default router;
