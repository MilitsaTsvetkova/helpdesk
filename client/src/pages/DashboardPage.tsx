import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { DashboardStats, TicketsPerDay } from "core";
import { DashboardStatCard } from "@/components/DashboardStatCard";
import { TicketsPerDayChart } from "@/components/TicketsPerDayChart";

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await axios.get<DashboardStats>("/api/dashboard/stats", {
    withCredentials: true,
  });
  return res.data;
}

async function fetchTicketsPerDay(): Promise<TicketsPerDay> {
  const res = await axios.get<TicketsPerDay>("/api/dashboard/tickets-per-day", {
    withCredentials: true,
  });
  return res.data;
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return `${hours}h ${remainingMinutes}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

export function DashboardPage() {
  const { data: stats, isPending: statsPending, error: statsError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const { data: ticketsPerDay, isPending: ticketsPerDayPending, error: ticketsPerDayError } = useQuery({
    queryKey: ["dashboard-tickets-per-day"],
    queryFn: fetchTicketsPerDay,
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Dashboard</h1>

      {statsError ? (
        <p className="text-sm text-red-600">{statsError.message}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <DashboardStatCard
            label="Total Tickets"
            value={stats ? String(stats.totalTickets) : ""}
            isPending={statsPending}
          />
          <DashboardStatCard
            label="Open Tickets"
            value={stats ? String(stats.openTickets) : ""}
            isPending={statsPending}
          />
          <DashboardStatCard
            label="Resolved by AI"
            value={stats ? String(stats.aiResolvedCount) : ""}
            isPending={statsPending}
          />
          <DashboardStatCard
            label="% Resolved by AI"
            value={stats ? `${stats.aiResolvedPercent.toFixed(1)}%` : ""}
            isPending={statsPending}
          />
          <DashboardStatCard
            label="Avg. Resolution Time"
            value={stats ? (stats.avgResolutionMs !== null ? formatDuration(stats.avgResolutionMs) : "—") : ""}
            isPending={statsPending}
          />
        </div>
      )}

      {ticketsPerDayError ? (
        <p className="text-sm text-red-600 mt-6">{ticketsPerDayError.message}</p>
      ) : (
        <TicketsPerDayChart data={ticketsPerDay} isPending={ticketsPerDayPending} />
      )}
    </div>
  );
}
