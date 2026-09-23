import { Router, type Request } from "express";
import { put, head } from "@vercel/blob";
import multer from "multer";
import { OWNER_COOKIE_NAME, verifySessionToken } from "../lib/owner";

const CV_BLOB_PATH = "cv/aman-pawar-cv.pdf";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5_000_000 } });

const router = Router();

function isOwner(req: Request): boolean {
  return verifySessionToken(req.cookies?.[OWNER_COOKIE_NAME]);
}

router.get("/", async (_req, res) => {
  const blob = await head(CV_BLOB_PATH).catch(() => null);
  if (!blob) return res.status(404).send("CV not uploaded yet");
  res.redirect(blob.url);
});

router.post("/", (req, res) => {
  if (!isOwner(req)) return res.status(403).json({ error: "Owner access required" });

  upload.single("cv")(req, res, async (uploadError) => {
    if (uploadError) return res.status(400).json({ error: "Choose a PDF smaller than 5 MB" });

    const file = req.file;
    if (!file || file.mimetype !== "application/pdf" || file.size < 10) {
      return res.status(400).json({ error: "Choose a PDF smaller than 5 MB" });
    }
    const header = file.buffer.subarray(0, 5).toString("utf-8");
    if (header !== "%PDF-") return res.status(400).json({ error: "The selected file is not a valid PDF" });

    try {
      await put(CV_BLOB_PATH, file.buffer, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/pdf",
      });
      res.json({ url: "/api/cv" });
    } catch {
      res.status(500).json({ error: "CV upload failed" });
    }
  });
});

export default router;
