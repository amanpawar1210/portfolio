// Vercel serverless entry: every /api/* request is handled by the Express app.
// The React site is served as static files from client/dist by the same project.
import app from "../server/src/app";

export default app;
