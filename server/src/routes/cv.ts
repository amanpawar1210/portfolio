import { Router, type Request } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { OWNER_COOKIE_NAME, verifySessionToken } from "../lib/owner";

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const CV_FILE = path.join(DATA_DIR, "cv.pdf");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5_000_000 } });

const router = Router();

function isOwner(req: Request): boolean {
  return verifySessionToken(req.cookies?.[OWNER_COOKIE_NAME]);
}

router.get("/", (_req, res) => {
  if (!fs.existsSync(CV_FILE)) return res.status(404).send("CV not uploaded yet");
  res.set({
    "content-type": "application/pdf",
    "content-disposition": "inline; filename=aman-pawar-cv.pdf",
    "cache-control": "public, max-age=300",
    "x-content-type-options": "nosniff",
  });
  fs.createReadStream(CV_FILE).pipe(res);
});

router.post("/", (req, res) => {
  if (!isOwner(req)) return res.status(403).json({ error: "Owner access required" });

  upload.single("cv")(req, res, (uploadError) => {
    if (uploadError) return res.status(400).json({ error: "Choose a PDF smaller than 5 MB" });

    const file = req.file;
    if (!file || file.mimetype !== "application/pdf" || file.size < 10) {
      return res.status(400).json({ error: "Choose a PDF smaller than 5 MB" });
    }
    const header = file.buffer.subarray(0, 5).toString("utf-8");
    if (header !== "%PDF-") return res.status(400).json({ error: "The selected file is not a valid PDF" });

    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CV_FILE, file.buffer);
    res.json({ url: "/api/cv" });
  });
});

export default router;
