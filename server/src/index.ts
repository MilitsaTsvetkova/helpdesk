import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { boss } from "./lib/boss";
import { registerClassifyTicketWorker } from "./jobs/classifyTicket";
import { registerAutoResolveTicketWorker } from "./jobs/autoResolveTicket";
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

// Inbound emails can include quoted history; allow a larger body for that endpoint.
app.use("/api/tickets/inbound-email", express.json({ limit: "512kb" }));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", usersRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/dashboard", dashboardRouter);

await boss.start();
await registerClassifyTicketWorker();
await registerAutoResolveTicketWorker();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
