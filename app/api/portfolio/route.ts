import { env } from "cloudflare:workers";
import { cleanPortfolio } from "../../../lib/portfolio";
import { isOwner } from "../../../lib/owner";

export async function PUT(request: Request) {
  if (!(await isOwner())) return Response.json({ error: "Owner access required" }, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 100_000) return Response.json({ error: "Content is too large" }, { status: 413 });
    const portfolio = cleanPortfolio(JSON.parse(raw));
    if (!env.DB) return Response.json({ error: "Portfolio database is unavailable" }, { status: 503 });
    await env.DB.prepare("INSERT INTO portfolio_content (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP").bind(JSON.stringify(portfolio)).run();
    return Response.json({ portfolio });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not save changes" }, { status: 400 });
  }
}
