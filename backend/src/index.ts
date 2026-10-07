import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { authRouter } from "./routes/auth";
import { cardsRouter } from "./routes/cards";
import { leadsRouter } from "./routes/leads";
import { analyticsRouter } from "./routes/analytics";
import { paymentsRouter } from "./routes/payments";
import { referralsRouter } from "./routes/referrals";
import { adminRouter } from "./routes/admin";
import { webhooksRouter } from "./routes/webhooks";
import { errorHandler } from "./middleware/error";
import { isDbReady } from "./lib/prisma";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  credentials: true,
}));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
// Webhooks need raw body — mount BEFORE json()
app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan("dev"));

// ── Health / status ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/status", async (_req, res) => {
  const db = await isDbReady();
  res.json({
    server: "ok",
    database: db ? "connected" : "disconnected — set DATABASE_URL in backend/.env",
    razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    env: process.env.NODE_ENV ?? "development",
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRouter);
app.use("/api/cards",     cardsRouter);
app.use("/api/leads",     leadsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/payments",  paymentsRouter);
app.use("/api/referrals", referralsRouter);
app.use("/api/admin",     adminRouter);
app.use("/api/webhooks",  webhooksRouter);

// ── Root ──────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    name: "dvcard-backend",
    version: "1.0.0",
    docs: "See README — routes at /api/*",
    health: "/health",
    status: "/status",
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[dvcard-backend] ✓ running on http://localhost:${PORT}`);
  console.log(`[dvcard-backend]   health  → http://localhost:${PORT}/health`);
  console.log(`[dvcard-backend]   status  → http://localhost:${PORT}/status`);
  console.log(`[dvcard-backend]   api     → http://localhost:${PORT}/api/*\n`);

  // Check DB in background — don't block startup
  isDbReady().then((ok) => {
    if (ok) {
      console.log("[dvcard-backend] ✓ database connected");
    } else {
      console.warn("[dvcard-backend] ⚠ database not connected — set DATABASE_URL in backend/.env");
      console.warn("[dvcard-backend]   routes will return 503 until DB is configured\n");
    }
  });
});

export default app;
