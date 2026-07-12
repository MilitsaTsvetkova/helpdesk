import { Router } from "express";
import { type DashboardStats, type TicketsPerDay } from "core";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const TICKETS_PER_DAY_WINDOW = 30;

type DashboardStatsRow = {
  total_tickets: number;
  open_tickets: number;
  ai_resolved_count: number;
  ai_resolved_percent: number;
  avg_resolution_ms: number | null;
};

router.get("/stats", requireAuth, async (_req, res) => {
  const [row] = await prisma.$queryRaw<DashboardStatsRow[]>`SELECT * FROM get_dashboard_stats()`;

  const stats: DashboardStats = {
    totalTickets: row.total_tickets,
    openTickets: row.open_tickets,
    aiResolvedCount: row.ai_resolved_count,
    aiResolvedPercent: row.ai_resolved_percent,
    avgResolutionMs: row.avg_resolution_ms,
  };

  res.json(stats);
});

router.get("/tickets-per-day", requireAuth, async (_req, res) => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (TICKETS_PER_DAY_WINDOW - 1));

  const tickets = await prisma.ticket.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true },
  });

  const counts = new Map<string, number>();
  for (let i = 0; i < TICKETS_PER_DAY_WINDOW; i++) {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + i);
    counts.set(day.toISOString().slice(0, 10), 0);
  }

  for (const { createdAt } of tickets) {
    const key = createdAt.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const data: TicketsPerDay = Array.from(counts, ([date, count]) => ({ date, count }));

  res.json(data);
});

export default router;
