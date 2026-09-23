import { Router, type Request } from "express";
import { cleanPortfolio, readPortfolio, writePortfolio } from "../lib/portfolio";
import { OWNER_COOKIE_NAME, verifySessionToken } from "../lib/owner";

const router = Router();

function isOwner(req: Request): boolean {
  return verifySessionToken(req.cookies?.[OWNER_COOKIE_NAME]);
}

router.get("/", async (_req, res) => {
  res.json({ portfolio: await readPortfolio() });
});

router.put("/", async (req, res) => {
  if (!isOwner(req)) return res.status(403).json({ error: "Owner access required" });
  try {
    const portfolio = cleanPortfolio(req.body);
    await writePortfolio(portfolio);
    res.json({ portfolio });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Could not save changes" });
  }
});

export default router;
