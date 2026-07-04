import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { TicketsTable, type Ticket } from "@/components/TicketsTable";

async function fetchTickets(sorting: SortingState): Promise<Ticket[]> {
  const params: Record<string, string> = {};
  if (sorting.length > 0) {
    params.sortBy = sorting[0].id;
    params.sortOrder = sorting[0].desc ? "desc" : "asc";
  }
  const res = await axios.get<Ticket[]>("/api/tickets", {
    params,
    withCredentials: true,
  });
  return res.data;
}

export function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const { data: tickets = [], isPending, error } = useQuery({
    queryKey: ["tickets", sorting],
    queryFn: () => fetchTickets(sorting),
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Tickets</h1>
      </div>
      <TicketsTable
        tickets={tickets}
        isPending={isPending}
        error={error}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    </div>
  );
}
