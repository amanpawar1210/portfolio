import { Router } from "express";
import multer from "multer";
import { Binary, ObjectId } from "mongodb";
import { getDb } from "../lib/db";
import { requireOwner } from "../lib/owner";

type FileDoc = { _id: string | ObjectId; kind: "cv" | "image"; contentType: string; name: string; size: number; data: Binary; createdAt: Date };

const cvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4_000_000 } });
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4_000_000 } });

// Check real file signatures instead of trusting the browser-sent MIME type.
function sniffImage(buffer: Buffer): string | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.length > 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export const cvRouter = Router();

cvRouter.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const file = await db.collection<FileDoc>("files").findOne({ _id: "cv" });
    if (!file) return res.status(404).send("CV not uploaded yet");
    const body = Buffer.from(file.data.buffer);
    res.set({
      "content-type": "application/pdf",
      "content-length": String(body.length),
      "content-disposition": `${req.query.download ? "attachment" : "inline"}; filename="${file.name}"`,
      "cache-control": "no-cache",
    });
    res.end(body);
  } catch (error) { next(error); }
});

cvRouter.get("/meta", async (_req, res, next) => {
  try {
    const db = await getDb();
    const file = await db.collection<FileDoc>("files").findOne({ _id: "cv" }, { projection: { data: 0 } });
    res.json({ cv: file ? { name: file.name, size: file.size, updatedAt: file.createdAt.toISOString() } : null });
  } catch (error) { next(error); }
});

cvRouter.post("/", requireOwner, (req, res, next) => {
  cvUpload.single("cv")(req, res, async uploadError => {
    const file = req.file;
    if (uploadError || !file || file.size < 10) return res.status(400).json({ error: "Choose a PDF smaller than 4 MB" });
    if (file.buffer.subarray(0, 5).toString("utf-8") !== "%PDF-") return res.status(400).json({ error: "The selected file is not a valid PDF" });
    try {
      const db = await getDb();
      const name = file.originalname.replace(/[^\w.\- ]/g, "").slice(0, 80) || "cv.pdf";
      await db.collection<FileDoc>("files").replaceOne(
        { _id: "cv" },
        { kind: "cv", contentType: "application/pdf", name, size: file.size, data: new Binary(file.buffer), createdAt: new Date() },
        { upsert: true },
      );
      res.json({ url: "/api/cv", name, size: file.size });
    } catch (error) { next(error); }
  });
});

export const imagesRouter = Router();

imagesRouter.get("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).send("Image not found");
    const db = await getDb();
    const file = await db.collection<FileDoc>("files").findOne({ _id: new ObjectId(req.params.id), kind: "image" });
    if (!file) return res.status(404).send("Image not found");
    // Image ids are never reused, so the response can be cached forever.
    res.set({ "content-type": file.contentType, "cache-control": "public, max-age=31536000, immutable" });
    res.end(Buffer.from(file.data.buffer));
  } catch (error) { next(error); }
});

imagesRouter.post("/", requireOwner, (req, res, next) => {
  imageUpload.single("image")(req, res, async uploadError => {
    if (uploadError) return res.status(400).json({ error: "Choose an image smaller than 4 MB" });
    const file = req.file;
    const type = file && sniffImage(file.buffer);
    if (!file || !type) return res.status(400).json({ error: "Choose a JPG, PNG or WEBP image" });
    try {
      const db = await getDb();
      const _id = new ObjectId();
      await db.collection<FileDoc>("files").insertOne({ _id, kind: "image", contentType: type, name: file.originalname.slice(0, 80), size: file.size, data: new Binary(file.buffer), createdAt: new Date() });
      res.json({ url: `/api/images/${_id.toString()}` });
    } catch (error) { next(error); }
  });
});
