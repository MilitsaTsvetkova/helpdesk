import "dotenv/config";
import "./instrument";
import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { boss } from "./lib/boss";
import { registerClassifyTicketWorker } from "./jobs/classifyTicket";
import { registerAutoResolveTicketWorker } from "./jobs/autoResolveTicket";
import { registerSendReplyEmailWorker } from "./jobs/sendReplyEmail";
import usersRouter from "./routes/users";
import ticketsRouter from "./routes/tickets";
import dashboardRouter from "./routes/dashboard";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") ?? ["http://localhost:5173"],
    credentials: true,
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX ?? 10),
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate-limit only sign-in to prevent brute force; session checks are exempt
app.use("/api/auth/sign-in", authLimiter);
app.all("/api/auth/*", toNodeHandler(auth));

// SendGrid's Inbound Parse webhook posts multipart/form-data; this middleware
// no-ops for other content types (e.g. the normalized-JSON path used by tests
// and other providers), which express.json() below then handles as before.
const inboundEmailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 20 },
});

// Inbound emails can include quoted history; allow a larger body for that endpoint.
app.use(
  "/api/tickets/inbound-email",
  inboundEmailUpload.any(),
  express.json({ limit: "512kb" }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", usersRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/dashboard", dashboardRouter);

// Must be registered after all routes, but before any other error-handling middleware
Sentry.setupExpressErrorHandler(app);

await boss.start();
await registerClassifyTicketWorker();
await registerAutoResolveTicketWorker();
await registerSendReplyEmailWorker();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
