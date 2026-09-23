import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import portfolioRouter from "./routes/portfolio";
import cvRouter from "./routes/cv";
import authRouter from "./routes/auth";
import projectImageRouter from "./routes/project-image";

const isProd = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

if (isProd && allowedOrigins.length === 0) {
  console.warn("CLIENT_ORIGIN is not set — cross-origin requests with credentials will be rejected in production.");
}

const app = express();

app.use(cors({
  origin: isProd ? allowedOrigins : true,
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/portfolio", portfolioRouter);
app.use("/api/cv", cvRouter);
app.use("/api/project-image", projectImageRouter);
app.use("/api", authRouter);

export default app;
