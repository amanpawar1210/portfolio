import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import portfolioRouter from "./routes/portfolio";
import { cvRouter, imagesRouter } from "./routes/files";
import messagesRouter from "./routes/messages";
import analyticsRouter from "./routes/analytics";
import authRouter from "./routes/auth";

const isProd = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);


const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
// In production the site and API share one origin, so CORS is only needed if
// CLIENT_ORIGIN lists extra origins (e.g. a separately hosted front end).
app.use(cors({
  origin: isProd ? allowedOrigins : true,
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use((_req, res, next) => {
  res.set({ "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin" });
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/portfolio", portfolioRouter);
app.use("/api/cv", cvRouter);
app.use("/api/images", imagesRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api", authRouter);

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  const message = error instanceof Error && /MONGODB_URI|ECONNREFUSED|querySrv|Server selection/i.test(error.message)
    ? "The database is unavailable right now. Please try again shortly."
    : "Something went wrong on the server";
  if (!res.headersSent) res.status(500).json({ error: message });
});

export default app;
