import { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TicketsTable, type Ticket } from "@/components/TicketsTable";
import { TicketStatus } from "core";

const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: "Open",
  [TicketStatus.IN_PROGRESS]: "In Progress",
  [TicketStatus.RESOLVED]: "Resolved",
  [TicketStatus.CLOSED]: "Closed",
};

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

async function fetchTickets(
  sorting: SortingState,
  search: string,
  statuses: TicketStatus[],
): Promise<Ticket[]> {
  const params: Record<string, string> = {};
  if (sorting.length > 0) {
    params.sortBy = sorting[0].id;
    params.sortOrder = sorting[0].desc ? "desc" : "asc";
  }
  if (search) params.search = search;
  if (statuses.length > 0) params.status = statuses.join(",");

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
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus[]>([]);

  const debouncedSearch = useDebounce(searchInput);

  const { data: tickets = [], isPending, error } = useQuery({
    queryKey: ["tickets", sorting, debouncedSearch, statusFilter],
    queryFn: () => fetchTickets(sorting, debouncedSearch, statusFilter),
  });

  function toggleStatus(status: TicketStatus) {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Tickets</h1>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search subject, sender…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(Object.values(TicketStatus) as TicketStatus[]).map((status) => {
            const active = statusFilter.includes(status);
            return (
              <Button
                key={status}
                variant="outline"
                size="sm"
                onClick={() => toggleStatus(status)}
                className={
                  active
                    ? "border-slate-800 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
                    : "bg-transparent"
                }
              >
                {STATUS_LABELS[status]}
              </Button>
            );
          })}
        </div>
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
