import "dotenv/config";
import cors from "cors";
import cron from "node-cron";
import express from "express";
import helmet from "helmet";
import { runOverdueJob } from "./jobs/overdueJob.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { analyticsRoutes } from "./routes/analyticsRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";
import { publicRoutes } from "./routes/publicRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? true }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({
    service: "safepick-api",
    docs: "This is the JSON API. Use /health for a quick check.",
    health: "/health",
    routes: ["/api/auth", "/api/orders", "/api/analytics"],
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "safepick-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/public", publicRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`SafePick API listening on http://localhost:${port}`);
  
  // Also run the overdue check once on startup for development convenience!
  void runOverdueJob()
    .then((n) => console.log(`[startup overdue] checked and reminded ${n} orders`))
    .catch((err) => console.error("[startup error]", err));
});

// A manual trigger for administrators to force a reminder check
app.get("/api/admin/trigger-reminders", async (req, res) => {
  try {
    const n = await runOverdueJob();
    res.json({ success: true, count: n, message: `Successfully checked and sent ${n} reminders.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cron.schedule("0 0 * * *", () => {
  void runOverdueJob()
    .then((n) => console.log(`[cron overdue] updated ${n} row(s)`))
    .catch((err) => console.error("[cron overdue]", err));
});

// Trigger reload for new .env variables
