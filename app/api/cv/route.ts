import { env } from "cloudflare:workers";
import { isOwner } from "../../../lib/owner";

const KEY = "portfolio/aman-pawar-cv.pdf";

export async function GET() {
  if (!env.BUCKET) return new Response("CV storage unavailable", { status: 503 });
  const object = await env.BUCKET.get(KEY);
  if (!object) return new Response("CV not uploaded yet", { status: 404 });
  return new Response(object.body, { headers: { "content-type": "application/pdf", "content-disposition": "inline; filename=aman-pawar-cv.pdf", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" } });
}

export async function POST(request: Request) {
  if (!(await isOwner())) return Response.json({ error: "Owner access required" }, { status: 403 });
  if (!env.BUCKET) return Response.json({ error: "CV storage unavailable" }, { status: 503 });
  try {
    const form = await request.formData();
    const file = form.get("cv");
    if (!(file instanceof File) || file.type !== "application/pdf" || file.size > 5_000_000 || file.size < 10) return Response.json({ error: "Choose a PDF smaller than 5 MB" }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    if (header !== "%PDF-") return Response.json({ error: "The selected file is not a valid PDF" }, { status: 400 });
    await env.BUCKET.put(KEY, bytes, { httpMetadata: { contentType: "application/pdf" } });
    return Response.json({ url: "/api/cv" });
  } catch {
    return Response.json({ error: "CV upload failed" }, { status: 500 });
  }
}
