import { Router, type Request } from "express";
import { put, head } from "@vercel/blob";
import multer from "multer";
import { OWNER_COOKIE_NAME, verifySessionToken } from "../lib/owner";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4_000_000 } });
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const router = Router();

function isOwner(req: Request): boolean {
  return verifySessionToken(req.cookies?.[OWNER_COOKIE_NAME]);
}

function blobPath(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "project";
  return `projects/${safe}`;
}

router.get("/:id", async (req, res) => {
  const blob = await head(blobPath(req.params.id)).catch(() => null);
  if (!blob) return res.status(404).send("Image not uploaded yet");
  res.redirect(blob.url);
});

router.post("/:id", (req, res) => {
  if (!isOwner(req)) return res.status(403).json({ error: "Owner access required" });

  upload.single("image")(req, res, async (uploadError) => {
    if (uploadError) return res.status(400).json({ error: "Choose an image smaller than 4 MB" });

    const file = req.file;
    if (!file || !ALLOWED.has(file.mimetype)) {
      return res.status(400).json({ error: "Choose a JPG, PNG or WEBP image" });
    }

    try {
      await put(blobPath(req.params.id), file.buffer, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: file.mimetype,
      });
      res.json({ url: `/api/project-image/${encodeURIComponent(req.params.id)}` });
    } catch {
      res.status(500).json({ error: "Image upload failed" });
    }
  });
});

export default router;
