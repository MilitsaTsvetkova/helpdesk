import { PgBoss } from "pg-boss";
import * as Sentry from "@sentry/node";

export const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL!,
});

boss.on("error", (err) => {
  console.error("pg-boss error:", err);
  Sentry.captureException(err);
});
