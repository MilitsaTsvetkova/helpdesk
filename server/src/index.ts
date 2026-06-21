import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);

// Better Auth handler must come before express.json()
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
