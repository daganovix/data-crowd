import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import sitesRoutes from "./routes/sites";
import submissionsRoutes from "./routes/submissions";
import tokensRoutes from "./routes/tokens";
import referralsRoutes from "./routes/referrals";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const isProd = process.env.NODE_ENV === "production";

// In production the frontend is served by this same Express server,
// so CORS is only needed in development.
if (!isProd) {
  app.use(cors({ origin: process.env.VITE_APP_URL ?? "http://localhost:5173", credentials: true }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/sites", sitesRoutes);
app.use("/api/submissions", submissionsRoutes);
app.use("/api/tokens", tokensRoutes);
app.use("/api/referrals", referralsRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

// Serve the React build in production — must come after all API routes
if (isProd) {
  const clientDist = path.join(__dirname, "../../client/dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
  } else {
    console.warn("Warning: client/dist not found — run `npm run build` first");
  }
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
