import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import sitesRoutes from "./routes/sites";
import submissionsRoutes from "./routes/submissions";
import tokensRoutes from "./routes/tokens";
import referralsRoutes from "./routes/referrals";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors({ origin: process.env.VITE_APP_URL ?? "http://localhost:5173", credentials: true }));
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
