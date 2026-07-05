import { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TicketsTable, type Ticket } from "@/components/TicketsTable";
import { Pagination } from "@/components/Pagination";
import { TicketStatus } from "core";

const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: "Open",
  [TicketStatus.IN_PROGRESS]: "In Progress",
  [TicketStatus.RESOLVED]: "Resolved",
  [TicketStatus.CLOSED]: "Closed",
};

const PAGE_SIZE = 10;

type TicketsPageData = {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  page: number,
): Promise<TicketsPageData> {
  const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE };
  if (sorting.length > 0) {
    params.sortBy = sorting[0].id;
    params.sortOrder = sorting[0].desc ? "desc" : "asc";
  }
  if (search) params.search = search;
  if (statuses.length > 0) params.status = statuses.join(",");

  const res = await axios.get<TicketsPageData>("/api/tickets", {
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
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sorting]);

  const { data, isPending, error } = useQuery({
    queryKey: ["tickets", sorting, debouncedSearch, statusFilter, page],
    queryFn: () => fetchTickets(sorting, debouncedSearch, statusFilter, page),
  });

  const tickets = data?.tickets ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function toggleStatus(status: TicketStatus) {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }

  let statusLabel = "Status";
  if (statusFilter.length === 1) statusLabel = STATUS_LABELS[statusFilter[0]];
  else if (statusFilter.length > 1) statusLabel = `Status (${statusFilter.length})`;

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`bg-transparent ${statusFilter.length > 0 ? "border-slate-800 text-slate-800" : ""}`}
            >
              {statusLabel}
              <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.values(TicketStatus) as TicketStatus[]).map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={() => toggleStatus(status)}
                onSelect={(e) => e.preventDefault()}
              >
                {STATUS_LABELS[status]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TicketsTable
        tickets={tickets}
        isPending={isPending}
        error={error}
        sorting={sorting}
        onSortingChange={setSorting}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        itemLabel="ticket"
        onPageChange={setPage}
      />
    </div>
  );
}
