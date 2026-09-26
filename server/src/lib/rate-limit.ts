import { getDb } from "./db";

type Limit = { key: string; max: number; windowMs: number };
type Result = { allowed: boolean; remaining: number; retryAfterSec: number };

/**
 * Fixed-window counter stored in MongoDB, so limits hold across serverless
 * instances. Expired windows are removed by a TTL index.
 */
export async function hit({ key, max, windowMs }: Limit): Promise<Result> {
  const db = await getDb();
  const now = new Date();
  const doc = await db.collection<{ _id: string; count: number; expiresAt: Date }>("rate_limits").findOneAndUpdate(
    { _id: key, expiresAt: { $gt: now } },
    { $inc: { count: 1 } },
    { returnDocument: "after" },
  );
  if (doc) {
    return { allowed: doc.count <= max, remaining: Math.max(0, max - doc.count), retryAfterSec: Math.ceil((doc.expiresAt.getTime() - now.getTime()) / 1000) };
  }
  const expiresAt = new Date(now.getTime() + windowMs);
  await db.collection<{ _id: string; count: number; expiresAt: Date }>("rate_limits").replaceOne({ _id: key }, { count: 1, expiresAt }, { upsert: true });
  return { allowed: true, remaining: max - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
}

export async function peek(key: string, max: number): Promise<Result> {
  const db = await getDb();
  const now = new Date();
  const doc = await db.collection<{ _id: string; count: number; expiresAt: Date }>("rate_limits").findOne({ _id: key, expiresAt: { $gt: now } });
  if (!doc) return { allowed: true, remaining: max, retryAfterSec: 0 };
  return { allowed: doc.count < max, remaining: Math.max(0, max - doc.count), retryAfterSec: Math.ceil((doc.expiresAt.getTime() - now.getTime()) / 1000) };
}

export async function reset(key: string): Promise<void> {
  const db = await getDb();
  await db.collection<{ _id: string }>("rate_limits").deleteOne({ _id: key });
}
