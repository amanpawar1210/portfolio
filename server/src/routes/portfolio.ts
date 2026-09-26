import { Router } from "express";
import { cleanPortfolio, getRevision, listRevisions, readPortfolio, writePortfolio } from "../lib/portfolio";
import { requireOwner } from "../lib/owner";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    res.set("cache-control", "no-store");
    res.json(await readPortfolio());
  } catch (error) { next(error); }
});

router.put("/", requireOwner, async (req, res, next) => {
  let portfolio;
  try {
    portfolio = cleanPortfolio(req.body);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Could not save changes" });
  }
  try {
    const updatedAt = await writePortfolio(portfolio);
    res.json({ portfolio, updatedAt });
  } catch (error) { next(error); }
});

router.get("/revisions", requireOwner, async (_req, res, next) => {
  try { res.json({ revisions: await listRevisions() }); } catch (error) { next(error); }
});

router.get("/revisions/:id", requireOwner, async (req, res, next) => {
  try {
    const portfolio = await getRevision(req.params.id);
    if (!portfolio) return res.status(404).json({ error: "Version not found" });
    res.json({ portfolio });
  } catch (error) { next(error); }
});

router.post("/revisions/:id/restore", requireOwner, async (req, res, next) => {
  try {
    const portfolio = await getRevision(req.params.id);
    if (!portfolio) return res.status(404).json({ error: "Version not found" });
    const updatedAt = await writePortfolio(portfolio, "Restored an earlier version");
    res.json({ portfolio, updatedAt });
  } catch (error) { next(error); }
});

export default router;
