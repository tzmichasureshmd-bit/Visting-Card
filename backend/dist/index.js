"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("./routes/auth");
const cards_1 = require("./routes/cards");
const leads_1 = require("./routes/leads");
const analytics_1 = require("./routes/analytics");
const payments_1 = require("./routes/payments");
const referrals_1 = require("./routes/referrals");
const admin_1 = require("./routes/admin");
const webhooks_1 = require("./routes/webhooks");
const error_1 = require("./middleware/error");
const prisma_1 = require("./lib/prisma");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT ?? 4000);
// ── Security ──────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
}));
// ── Global rate limit ─────────────────────────────────────────────────────────
app.use((0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." },
}));
// ── Body parsing ──────────────────────────────────────────────────────────────
// Webhooks need raw body — mount BEFORE json()
app.use("/api/webhooks", express_1.default.raw({ type: "application/json" }));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, compression_1.default)());
// ── Logging ───────────────────────────────────────────────────────────────────
app.use((0, morgan_1.default)("dev"));
// ── Health / status ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/status", async (_req, res) => {
    const db = await (0, prisma_1.isDbReady)();
    res.json({
        server: "ok",
        database: db ? "connected" : "disconnected — set DATABASE_URL in backend/.env",
        razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        env: process.env.NODE_ENV ?? "development",
    });
});
// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", auth_1.authRouter);
app.use("/api/cards", cards_1.cardsRouter);
app.use("/api/leads", leads_1.leadsRouter);
app.use("/api/analytics", analytics_1.analyticsRouter);
app.use("/api/payments", payments_1.paymentsRouter);
app.use("/api/referrals", referrals_1.referralsRouter);
app.use("/api/admin", admin_1.adminRouter);
app.use("/api/webhooks", webhooks_1.webhooksRouter);
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
app.use(error_1.errorHandler);
// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n[dvcard-backend] ✓ running on http://localhost:${PORT}`);
    console.log(`[dvcard-backend]   health  → http://localhost:${PORT}/health`);
    console.log(`[dvcard-backend]   status  → http://localhost:${PORT}/status`);
    console.log(`[dvcard-backend]   api     → http://localhost:${PORT}/api/*\n`);
    // Check DB in background — don't block startup
    (0, prisma_1.isDbReady)().then((ok) => {
        if (ok) {
            console.log("[dvcard-backend] ✓ database connected");
        }
        else {
            console.warn("[dvcard-backend] ⚠ database not connected — set DATABASE_URL in backend/.env");
            console.warn("[dvcard-backend]   routes will return 503 until DB is configured\n");
        }
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map