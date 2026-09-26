import { MongoClient, type Db } from "mongodb";

// This app owns exactly one database on the (shared) cluster. The name is fixed
// here rather than taken from the URI so a copied connection string can never
// point writes at another project's database.
const DB_NAME = process.env.MONGODB_DB || "portfolio";
const FORBIDDEN = new Set(["quickbite", "scenepass", "admin", "local", "config"]);

let connecting: Promise<Db> | undefined;

export function getDb(): Promise<Db> {
  connecting ??= open().catch(error => {
    connecting = undefined;
    throw error;
  });
  return connecting;
}

async function open(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not set");
  if (FORBIDDEN.has(DB_NAME)) throw new Error(`Refusing to use database "${DB_NAME}"`);

  const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(DB_NAME);
  await Promise.all([
    db.collection("messages").createIndex({ createdAt: -1 }),
    db.collection("events").createIndex({ createdAt: -1 }),
    db.collection("events").createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400, name: "events_ttl" }),
    db.collection("revisions").createIndex({ savedAt: -1 }),
    db.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).catch(error => console.warn("Index setup skipped:", error.message));
  console.log(`MongoDB connected: ${DB_NAME}`);
  return db;
}
