export type DashboardStats = {
  totalTickets: number;
  openTickets: number;
  aiResolvedCount: number;
  aiResolvedPercent: number;
  avgResolutionMs: number | null;
};

export type TicketsPerDay = {
  date: string;
  count: number;
}[];
