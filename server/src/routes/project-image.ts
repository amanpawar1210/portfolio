import { Router, type Request } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { OWNER_COOKIE_NAME, verifySessionToken } from "../lib/owner";

const DATA_DIR = path.join(__dirname, "..", "..", "data", "projects");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4_000_000 } });
const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const router = Router();

function isOwner(req: Request): boolean {
  return verifySessionToken(req.cookies?.[OWNER_COOKIE_NAME]);
}

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "project";
}

function findFile(id: string): string | null {
  const base = safeId(id);
  for (const ext of Object.values(ALLOWED)) {
    const file = path.join(DATA_DIR, `${base}.${ext}`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

router.get("/:id", (req, res) => {
  const file = findFile(req.params.id);
  if (!file) return res.status(404).send("Image not uploaded yet");
  res.set({ "cache-control": "public, max-age=300" });
  fs.createReadStream(file).pipe(res);
});

router.post("/:id", (req, res) => {
  if (!isOwner(req)) return res.status(403).json({ error: "Owner access required" });

  upload.single("image")(req, res, (uploadError) => {
    if (uploadError) return res.status(400).json({ error: "Choose an image smaller than 4 MB" });

    const file = req.file;
    const ext = file && ALLOWED[file.mimetype];
    if (!file || !ext) return res.status(400).json({ error: "Choose a JPG, PNG or WEBP image" });

    const base = safeId(req.params.id);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    for (const otherExt of Object.values(ALLOWED)) {
      const other = path.join(DATA_DIR, `${base}.${otherExt}`);
      if (fs.existsSync(other)) fs.unlinkSync(other);
    }
    fs.writeFileSync(path.join(DATA_DIR, `${base}.${ext}`), file.buffer);
    res.json({ url: `/api/project-image/${base}` });
  });
});

export default router;
